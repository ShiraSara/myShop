import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { jsonError } from "@/server/http";
import { listMessages, markConversationRead } from "@/server/services/messaging";

export const dynamic = "force-dynamic";

/**
 * Polling endpoint for the chat UI: returns messages newer than `after`.
 * Designed to be swapped for SSE / WebSockets (e.g. Pusher, Ably, Supabase Realtime) later.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
    const { id } = await params;
    const afterParam = new URL(request.url).searchParams.get("after");
    const after = afterParam ? new Date(afterParam) : undefined;
    const messages = await listMessages(user.id, id, { after: after && !isNaN(after.getTime()) ? after : undefined });
    if (messages.some((m) => m.senderId !== user.id && !m.readAt)) await markConversationRead(user.id, id);
    // Read receipts for my own messages
    const readUpTo = await db.message.findFirst({
      where: { conversationId: id, senderId: user.id, readAt: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    return NextResponse.json(
      { messages, readUpTo: readUpTo?.createdAt ?? null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
