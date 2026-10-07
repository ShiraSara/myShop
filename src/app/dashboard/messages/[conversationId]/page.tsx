import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ImageOff } from "lucide-react";
import { requireUserPage } from "@/server/auth/guards";
import { db } from "@/server/db";
import { NotFoundError } from "@/server/errors";
import { getConversation, listConversations, listMessages, markConversationRead } from "@/server/services/messaging";
import { MessagesShell } from "@/components/messages/messages-shell";
import { ChatThread } from "@/components/messages/chat-thread";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "שיחה" };

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const user = await requireUserPage(`/dashboard/messages/${conversationId}`);

  let conversation;
  try {
    conversation = await getConversation(user.id, conversationId);
  } catch (e) {
    if (e instanceof NotFoundError) notFound(); // also covers "not a participant"
    throw e;
  }
  await markConversationRead(user.id, conversationId);
  const [messages, conversations, readUpTo, other] = await Promise.all([
    listMessages(user.id, conversationId),
    listConversations(user.id),
    db.message.findFirst({
      where: { conversationId, senderId: user.id, readAt: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    db.user.findUnique({ where: { id: conversation.otherUser.id }, select: { status: true } }),
  ]);
  const product = conversation.product;

  return (
    <div>
      <h1 className="mb-5 hidden text-2xl font-bold sm:text-3xl md:block">הודעות</h1>
      <MessagesShell conversations={conversations} activeId={conversationId} currentUserId={user.id}>
        <div className="flex items-center gap-3 border-b border-border px-3 py-2.5 sm:px-4">
          <Link href="/dashboard/messages" className="flex size-9 items-center justify-center rounded-full hover:bg-muted md:hidden" aria-label="חזרה לרשימת השיחות">
            <ChevronRight className="size-5" />
          </Link>
          <Avatar name={conversation.otherUser.name} src={conversation.otherUser.avatarUrl} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{conversation.otherUser.name}</p>
            <p className="text-xs text-muted-foreground">{conversation.role === "buyer" ? "מוכר/ת" : "מתעניין/ת במוצר שלך"}</p>
          </div>
          <Link href={`/products/${product.slug}`} className="flex max-w-[45%] items-center gap-2 rounded-xl p-1.5 transition hover:bg-muted">
            <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
              {product.images[0] ? <Image src={product.images[0].url} alt="" fill sizes="40px" className="object-cover" /> : <ImageOff className="m-auto mt-2.5 size-4 text-stone-400" />}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-sm font-medium">{product.title}</span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="ltr-nums">{formatPrice(product.price)}</span>
                {product.status !== "ACTIVE" && <Badge tone="neutral" className="py-0 text-[0.65rem]">{PRODUCT_STATUS_LABELS[product.status]}</Badge>}
              </span>
            </span>
          </Link>
        </div>
        <ChatThread
          conversationId={conversationId}
          currentUserId={user.id}
          initialMessages={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString(), readAt: m.readAt?.toISOString() ?? null }))}
          initialReadUpTo={readUpTo?.createdAt.toISOString() ?? null}
          disabled={other?.status !== "ACTIVE" ? "לא ניתן לשלוח הודעות למשתמש זה" : null}
        />
      </MessagesShell>
    </div>
  );
}
