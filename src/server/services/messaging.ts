import "server-only";
import { db } from "../db";
import { NotFoundError, ValidationError } from "../errors";
import { notify } from "./notifications";

/**
 * Messaging authorization model: a conversation belongs to exactly one buyer and
 * one seller. Every read/write goes through `getParticipantConversation`, which
 * returns 404 for anyone else (so existence is not leaked either).
 */
async function getParticipantConversation(userId: string, conversationId: string) {
  const conversation = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || (conversation.buyerId !== userId && conversation.sellerId !== userId)) {
    throw new NotFoundError("השיחה לא נמצאה");
  }
  return conversation;
}

/** Buyer opens (or reuses) a conversation about a product and sends the first message. */
export async function startConversation(buyerId: string, productId: string, body: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, title: true, status: true, sellerId: true, seller: { select: { status: true } } },
  });
  if (!product || product.status !== "ACTIVE" || product.seller.status !== "ACTIVE") {
    throw new NotFoundError("המוצר אינו זמין");
  }
  if (product.sellerId === buyerId) throw new ValidationError("לא ניתן לשלוח הודעה על מוצר שלכם");

  const conversation = await db.conversation.upsert({
    where: { productId_buyerId: { productId, buyerId } },
    create: { productId, buyerId, sellerId: product.sellerId },
    update: {},
  });
  const message = await createMessage(conversation.id, buyerId, product.sellerId, body, product.title);
  return { conversationId: conversation.id, message };
}

export async function sendMessage(userId: string, conversationId: string, body: string) {
  const conversation = await getParticipantConversation(userId, conversationId);
  const recipientId = conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
  const recipient = await db.user.findUnique({ where: { id: recipientId }, select: { status: true } });
  if (recipient?.status !== "ACTIVE") throw new ValidationError("לא ניתן לשלוח הודעות למשתמש זה");
  const product = await db.product.findUnique({ where: { id: conversation.productId }, select: { title: true } });
  return createMessage(conversationId, userId, recipientId, body, product?.title ?? "");
}

async function createMessage(conversationId: string, senderId: string, recipientId: string, body: string, productTitle: string) {
  const now = new Date();
  const [message] = await db.$transaction([
    db.message.create({ data: { conversationId, senderId, body } }),
    db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: now } }),
  ]);
  // One unread notification per conversation is enough — avoid spamming the bell.
  const link = `/dashboard/messages/${conversationId}`;
  const pending = await db.notification.findFirst({ where: { userId: recipientId, link, readAt: null } });
  if (!pending) {
    const sender = await db.user.findUnique({ where: { id: senderId }, select: { name: true } });
    await notify({
      userId: recipientId,
      type: "NEW_MESSAGE",
      title: `הודעה חדשה מ${sender?.name ?? "משתמש"}`,
      body: productTitle,
      link,
    });
  }
  return message;
}

export async function getConversation(userId: string, conversationId: string) {
  await getParticipantConversation(userId, conversationId);
  const conversation = await db.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          title: true,
          price: true,
          status: true,
          images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1, select: { url: true } },
        },
      },
      buyer: { select: { id: true, name: true, avatarUrl: true } },
      seller: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
  const otherUser = conversation.buyerId === userId ? conversation.seller : conversation.buyer;
  return { ...conversation, otherUser, role: conversation.buyerId === userId ? ("buyer" as const) : ("seller" as const) };
}

export async function listMessages(userId: string, conversationId: string, opts: { after?: Date; take?: number } = {}) {
  await getParticipantConversation(userId, conversationId);
  return db.message.findMany({
    where: { conversationId, ...(opts.after ? { createdAt: { gt: opts.after } } : {}) },
    orderBy: { createdAt: "asc" },
    take: opts.take ?? 200,
    select: { id: true, body: true, senderId: true, createdAt: true, readAt: true },
  });
}

/** Marks messages sent *to* the user as read. */
export async function markConversationRead(userId: string, conversationId: string) {
  await getParticipantConversation(userId, conversationId);
  const now = new Date();
  const { count } = await db.message.updateMany({
    where: { conversationId, senderId: { not: userId }, readAt: null },
    data: { readAt: now },
  });
  await db.notification.updateMany({
    where: { userId, link: `/dashboard/messages/${conversationId}`, readAt: null },
    data: { readAt: now },
  });
  return count;
}

export async function listConversations(userId: string) {
  const conversations = await db.conversation.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }], messages: { some: {} } },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      product: {
        select: {
          slug: true,
          title: true,
          price: true,
          status: true,
          images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1, select: { url: true } },
        },
      },
      buyer: { select: { id: true, name: true, avatarUrl: true } },
      seller: { select: { id: true, name: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, senderId: true, createdAt: true } },
    },
  });
  const unread = await db.message.groupBy({
    by: ["conversationId"],
    where: { conversationId: { in: conversations.map((c) => c.id) }, senderId: { not: userId }, readAt: null },
    _count: { _all: true },
  });
  const unreadMap = new Map(unread.map((u) => [u.conversationId, u._count._all]));
  return conversations.map((c) => ({
    id: c.id,
    product: c.product,
    otherUser: c.buyerId === userId ? c.seller : c.buyer,
    role: c.buyerId === userId ? ("buyer" as const) : ("seller" as const),
    lastMessage: c.messages[0] ?? null,
    lastMessageAt: c.lastMessageAt,
    unreadCount: unreadMap.get(c.id) ?? 0,
  }));
}

export type ConversationListItem = Awaited<ReturnType<typeof listConversations>>[number];

export async function unreadMessageCount(userId: string) {
  return db.message.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      conversation: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    },
  });
}

/** Existing conversation of a buyer for a product (to show "continue chat" instead of a new one). */
export async function findBuyerConversation(buyerId: string, productId: string) {
  return db.conversation.findUnique({ where: { productId_buyerId: { productId, buyerId } }, select: { id: true } });
}
