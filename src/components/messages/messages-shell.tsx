import { MessageCircle } from "lucide-react";
import type { ConversationListItem } from "@/server/services/messaging";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ConversationList } from "./conversation-list";

/** Two-pane layout on desktop; on mobile shows either the list or the open conversation. */
export function MessagesShell({
  conversations,
  activeId,
  currentUserId,
  children,
}: {
  conversations: ConversationListItem[];
  activeId?: string;
  currentUserId: string;
  children?: React.ReactNode;
}) {
  if (conversations.length === 0 && !activeId) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="אין הודעות עדיין"
        description="כשתפנו למוכר או שקונה יפנה אליכם — השיחות יופיעו כאן."
        action={<ButtonLink href="/products">גלישה במוצרים</ButtonLink>}
      />
    );
  }
  return (
    <div className="grid grid-cols-1 h-[calc(100dvh-13rem)] min-h-[28rem] overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-card md:grid-cols-[20rem_minmax(0,1fr)] lg:h-[calc(100dvh-10rem)]">
      <div className={cn("min-h-0 overflow-y-auto border-border md:border-e", activeId && "hidden md:block")}>
        <h2 className="sticky top-0 z-10 border-b border-border bg-surface px-4 py-3 font-semibold">שיחות</h2>
        <ConversationList conversations={conversations} activeId={activeId} currentUserId={currentUserId} />
      </div>
      <div className={cn("flex min-h-0 flex-col", !activeId && "hidden md:flex")}>
        {children ?? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <MessageCircle className="mb-3 size-10 text-stone-300" aria-hidden />
            בחרו שיחה מהרשימה
          </div>
        )}
      </div>
    </div>
  );
}
