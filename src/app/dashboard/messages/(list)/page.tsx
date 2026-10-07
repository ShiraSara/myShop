import type { Metadata } from "next";
import { requireUserPage } from "@/server/auth/guards";
import { listConversations } from "@/server/services/messaging";
import { MessagesShell } from "@/components/messages/messages-shell";

export const metadata: Metadata = { title: "הודעות" };

export default async function MessagesPage() {
  const user = await requireUserPage("/dashboard/messages");
  const conversations = await listConversations(user.id);
  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold sm:text-3xl">הודעות</h1>
      <MessagesShell conversations={conversations} currentUserId={user.id} />
    </div>
  );
}
