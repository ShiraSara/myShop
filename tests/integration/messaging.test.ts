import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createProduct } from "@/server/services/products";
import {
  getConversation,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
  startConversation,
  unreadMessageCount,
} from "@/server/services/messaging";
import { NotFoundError } from "@/server/errors";
import { createCategory, createUser, productInput } from "../helpers/factories";

async function setup() {
  const seller = await createUser({ name: "מוכר" });
  const buyer = await createUser({ name: "קונה" });
  const stranger = await createUser({ name: "זר" });
  const cat = await createCategory();
  const product = await createProduct(seller.id, await productInput(seller.id, cat.id));
  return { seller, buyer, stranger, product };
}

describe("Messaging", () => {
  it("opens a buyer → product → seller conversation and exchanges messages", async () => {
    const { seller, buyer, product } = await setup();
    const { conversationId } = await startConversation(buyer.id, product.id, "היי, עדיין זמין?");
    const again = await startConversation(buyer.id, product.id, "שאלה נוספת");
    expect(again.conversationId).toBe(conversationId); // one conversation per buyer+product

    await sendMessage(seller.id, conversationId, "כן, זמין!");
    const messages = await listMessages(buyer.id, conversationId);
    expect(messages.map((m) => m.body)).toEqual(["היי, עדיין זמין?", "שאלה נוספת", "כן, זמין!"]);

    const conv = await getConversation(seller.id, conversationId);
    expect(conv.role).toBe("seller");
    expect(conv.otherUser.id).toBe(buyer.id);
    const notification = await db.notification.findFirst({ where: { userId: seller.id, type: "NEW_MESSAGE" } });
    expect(notification?.link).toBe(`/dashboard/messages/${conversationId}`);
  });

  it("never lets a third user read, write or list someone else's conversation", async () => {
    const { buyer, stranger, product } = await setup();
    const { conversationId } = await startConversation(buyer.id, product.id, "הודעה פרטית");

    await expect(getConversation(stranger.id, conversationId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(listMessages(stranger.id, conversationId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(sendMessage(stranger.id, conversationId, "פריצה")).rejects.toBeInstanceOf(NotFoundError);
    await expect(markConversationRead(stranger.id, conversationId)).rejects.toBeInstanceOf(NotFoundError);
    expect(await listConversations(stranger.id)).toHaveLength(0);
    expect(await db.message.count({ where: { conversationId, body: "פריצה" } })).toBe(0);
  });

  it("does not allow messaging about your own product or unavailable products", async () => {
    const { seller, buyer, product } = await setup();
    await expect(startConversation(seller.id, product.id, "שלום")).rejects.toThrow();
    await db.product.update({ where: { id: product.id }, data: { status: "SOLD" } });
    await expect(startConversation(buyer.id, product.id, "שלום")).rejects.toThrow(/אינו זמין/);
  });

  it("tracks unread counts and read state", async () => {
    const { seller, buyer, product } = await setup();
    const { conversationId } = await startConversation(buyer.id, product.id, "הודעה 1");
    await startConversation(buyer.id, product.id, "הודעה 2");
    expect(await unreadMessageCount(seller.id)).toBe(2);
    expect(await unreadMessageCount(buyer.id)).toBe(0);
    const [item] = await listConversations(seller.id);
    expect(item.unreadCount).toBe(2);
    expect(item.lastMessage?.body).toBe("הודעה 2");

    expect(await markConversationRead(seller.id, conversationId)).toBe(2);
    expect(await unreadMessageCount(seller.id)).toBe(0);
    const msgs = await listMessages(buyer.id, conversationId);
    expect(msgs.every((m) => m.readAt !== null)).toBe(true);
  });

  it("returns only messages after a timestamp (polling)", async () => {
    const { seller, buyer, product } = await setup();
    const { conversationId, message } = await startConversation(buyer.id, product.id, "ראשונה");
    await new Promise((r) => setTimeout(r, 5));
    await sendMessage(seller.id, conversationId, "שנייה");
    const newer = await listMessages(buyer.id, conversationId, { after: message.createdAt });
    expect(newer.map((m) => m.body)).toEqual(["שנייה"]);
  });
});
