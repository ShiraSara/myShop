import Link from "next/link";
import { Bell } from "lucide-react";
import { CountBadge } from "./count-badge";

export function NotificationsBell({ count }: { count: number }) {
  return (
    <Link
      href="/dashboard/notifications"
      className="relative flex size-10 items-center justify-center rounded-xl text-stone-700 transition-colors hover:bg-muted hover:text-foreground"
      aria-label="התראות"
      title="התראות"
    >
      <Bell className="size-[1.35rem]" />
      <CountBadge count={count} label="התראות חדשות" />
    </Link>
  );
}
