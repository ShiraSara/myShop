import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { requireUserPage } from "@/server/auth/guards";
import { listNotifications } from "@/server/services/notifications";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { MarkAllReadButton } from "@/components/dashboard/mark-all-read";
import { cn, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "התראות" };

export default async function NotificationsPage() {
  const user = await requireUserPage("/dashboard/notifications");
  const notifications = await listNotifications(user.id, 50);
  const hasUnread = notifications.some((n) => !n.readAt);
  return (
    <div>
      <PageHeader title="התראות" action={hasUnread ? <MarkAllReadButton /> : undefined} />
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="אין התראות" description="כאן יופיעו עדכונים על הודעות, התאמות לבקשות ושינויים במודעות שלכם." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-card">
          {notifications.map((n) => {
            const content = (
              <>
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-accent")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", !n.readAt && "font-semibold")}>{n.title}</p>
                  {n.body && <p className="mt-0.5 truncate text-sm text-muted-foreground">{n.body}</p>}
                </div>
                <time className="shrink-0 text-xs text-muted-foreground" dateTime={n.createdAt.toISOString()}>{timeAgo(n.createdAt)}</time>
              </>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-muted/60">{content}</Link>
                ) : (
                  <div className="flex items-start gap-3 px-4 py-3.5">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
