"use server";

import { revalidatePath } from "next/cache";
import { messageSchema, startConversationSchema } from "@/lib/validation/misc";
import { zodFail, type ActionResult } from "@/lib/validation/common";
import { requireUser } from "@/server/auth/guards";
import { rateLimit } from "@/server/rate-limit";
import { markConversationRead, sendMessage, startConversation } from "@/server/services/messaging";
import { safeAction } from "./_utils";

export async function startConversationAction(input: { productId: string; body: string }): Promise<ActionResult<{ conversationId: string }>> {
  return safeAction(async () => {
    const user = await requireUser();
    const parsed = startConversationSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);
    await rateLimit(`conversation:start:${user.id}`, 20, 60 * 60);
    await rateLimit(`message:${user.id}`, 30, 60);
    const { conversationId } = await startConversation(user.id, parsed.data.productId, parsed.data.body);
    revalidatePath("/dashboard/messages");
    return { ok: true, data: { conversationId } };
  });
}

export type SentMessage = { id: string; body: string; senderId: string; createdAt: string; readAt: string | null };

export async function sendMessageAction(conversationId: string, input: { body: string }): Promise<ActionResult<SentMessage>> {
  return safeAction(async () => {
    const user = await requireUser();
    const parsed = messageSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);
    await rateLimit(`message:${user.id}`, 30, 60);
    const m = await sendMessage(user.id, String(conversationId), parsed.data.body);
    return {
      ok: true,
      data: { id: m.id, body: m.body, senderId: m.senderId, createdAt: m.createdAt.toISOString(), readAt: null },
    };
  });
}

export async function markConversationReadAction(conversationId: string): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireUser();
    await markConversationRead(user.id, String(conversationId));
    return { ok: true };
  });
}
