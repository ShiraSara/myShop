import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { ConversationListItem } from "@/server/services/messaging";
import { cn, timeAgo, truncate } from "@/lib/utils";

export function ConversationList({ conversations, activeId, currentUserId }: { conversations: ConversationListItem[]; activeId?: string; currentUserId: string }) {
  return (
    <ul className="divide-y divide-border" aria-label="שיחות">
      {conversations.map((c) => {
        const active = c.id === activeId;
        const unread = c.unreadCount > 0;
        return (
          <li key={c.id}>
            <Link
              href={`/dashboard/messages/${c.id}`}
              aria-current={active ? "page" : undefined}
              className={cn("flex gap-3 px-4 py-3.5 transition-colors", active ? "bg-primary-50" : "hover:bg-muted/60")}
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                {c.product.images[0] ? <Image src={c.product.images[0].url} alt="" fill sizes="56px" className="object-cover" /> : <ImageOff className="m-auto mt-4 size-5 text-stone-400" aria-hidden />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={cn("truncate text-sm", unread ? "font-bold" : "font-semibold")}>{c.otherUser.name}</p>
                  {c.lastMessage && <time className="shrink-0 text-xs text-muted-foreground" dateTime={c.lastMessage.createdAt.toISOString()}>{timeAgo(c.lastMessage.createdAt)}</time>}
                </div>
                <p className="truncate text-xs text-muted-foreground">{c.role === "seller" ? "קונה · " : ""}{c.product.title}</p>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className={cn("truncate text-sm", unread ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {c.lastMessage ? `${c.lastMessage.senderId === currentUserId ? "את/ה: " : ""}${truncate(c.lastMessage.body, 60)}` : ""}
                  </p>
                  {unread && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[0.7rem] font-bold text-white" aria-label={`${c.unreadCount} הודעות חדשות`}>
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
