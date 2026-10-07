import Link from "next/link";
import { Heart, MessageCircle, Plus } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { getHeaderCounts } from "@/server/services/users";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "./logo";
import { HeaderSearch } from "./header-search";
import { UserMenu } from "./user-menu";
import { MobileMenu } from "./mobile-menu";
import { CountBadge } from "./count-badge";
import { NotificationsBell } from "./notifications-bell";

export async function Header() {
  const user = await getCurrentUser();
  const counts = user ? await getHeaderCounts(user.id) : { unreadMessages: 0, unreadNotifications: 0 };
  const iconLink = "relative flex size-10 items-center justify-center rounded-xl text-stone-700 transition-colors hover:bg-muted hover:text-foreground";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/90 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
      <div className="container-page flex h-16 items-center gap-3 md:gap-6">
        <MobileMenu user={user} unreadMessages={counts.unreadMessages} />
        <Logo className="shrink-0" />

        <HeaderSearch className="mx-auto hidden max-w-xl flex-1 md:block" />

        <nav className="ms-auto flex items-center gap-1 md:ms-0" aria-label="פעולות משתמש">
          <ButtonLink href="/dashboard/products/new" size="md" className="me-1 hidden rounded-full sm:inline-flex">
            <Plus />פרסום מוצר
          </ButtonLink>
          {user ? (
            <>
              <Link href="/dashboard/messages" className={`${iconLink} hidden md:flex`} aria-label="הודעות" title="הודעות">
                <MessageCircle className="size-[1.35rem]" />
                <CountBadge count={counts.unreadMessages} label="הודעות שלא נקראו" />
              </Link>
              <Link href="/dashboard/favorites" className={`${iconLink} hidden md:flex`} aria-label="מועדפים" title="מועדפים">
                <Heart className="size-[1.35rem]" />
              </Link>
              <NotificationsBell count={counts.unreadNotifications} />
              <div className="ms-1">
                <UserMenu user={user} />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <ButtonLink href="/login" variant="ghost" size="sm" className="h-10">התחברות</ButtonLink>
              <ButtonLink href="/register" variant="outline" size="sm" className="hidden h-10 rounded-full sm:inline-flex">הרשמה</ButtonLink>
            </div>
          )}
        </nav>
      </div>
      <div className="container-page pb-3 md:hidden">
        <HeaderSearch />
      </div>
    </header>
  );
}
