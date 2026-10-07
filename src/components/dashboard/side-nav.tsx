"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Flag, FolderTree, Heart, LayoutDashboard, MessageCircle, Package, Search, Settings, User, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = { Bell, Flag, FolderTree, Heart, LayoutDashboard, MessageCircle, Package, Search, Settings, User, Users } satisfies Record<string, LucideIcon>;

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; exact?: boolean; badge?: number };

/** Vertical nav on desktop, horizontal scrollable tabs on mobile. */
export function SideNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label}>
      <ul className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0 lg:pb-0">
        {items.map(({ href, label, icon, exact, badge }) => {
          const Icon = ICONS[icon];
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors lg:rounded-xl lg:py-2.5",
                  active ? "bg-primary text-white lg:bg-primary-50 lg:text-primary-800" : "bg-surface text-stone-600 ring-1 ring-border hover:bg-muted lg:bg-transparent lg:ring-0",
                )}
              >
                <Icon className="size-4 lg:size-[1.15rem]" aria-hidden />
                {label}
                {!!badge && badge > 0 && <span className="ms-auto rounded-full bg-accent px-1.5 text-xs font-bold text-white">{badge}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
