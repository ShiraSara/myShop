"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, MessageCircle, Plus, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

/** Mobile tab bar — keeps "פרסום מוצר" always one tap away. Hidden on pages with their own sticky CTA. */
export function BottomNav({ unreadMessages, isLoggedIn }: { unreadMessages: number; isLoggedIn: boolean }) {
  const pathname = usePathname();
  if (pathname.startsWith("/products/") || /^\/dashboard\/messages\/.+/.test(pathname) || pathname.startsWith("/admin")) return null;

  const items = [
    { href: "/", label: "בית", icon: House, match: (p: string) => p === "/" },
    { href: "/search", label: "חיפוש", icon: Search, match: (p: string) => p.startsWith("/search") || p.startsWith("/categories") },
    { href: "/dashboard/products/new", label: "פרסום", icon: Plus, primary: true, match: () => false },
    { href: "/dashboard/messages", label: "הודעות", icon: MessageCircle, match: (p: string) => p.startsWith("/dashboard/messages"), badge: unreadMessages },
    { href: isLoggedIn ? "/dashboard" : "/login", label: isLoggedIn ? "אישי" : "כניסה", icon: User, match: (p: string) => p === "/dashboard" || p.startsWith("/dashboard/profile") },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="ניווט תחתון">
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon, primary, match, badge }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium", active ? "text-primary" : "text-stone-500")}
              >
                {primary ? (
                  <span className="-mt-5 flex size-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 ring-4 ring-surface">
                    <Icon className="size-6" aria-hidden />
                  </span>
                ) : (
                  <span className="relative">
                    <Icon className="size-[1.4rem]" aria-hidden strokeWidth={active ? 2.3 : 1.8} />
                    {!!badge && badge > 0 && (
                      <span className="absolute -end-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-bold text-white">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </span>
                )}
                <span className={primary ? "-mt-0.5" : undefined}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
