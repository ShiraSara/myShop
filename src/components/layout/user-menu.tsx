"use client";

import Link from "next/link";
import { Heart, LayoutDashboard, LogOut, MessageCircle, Package, Search as SearchIcon, ShieldCheck, User } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import type { SessionUser } from "@/server/auth/session";

export function UserMenu({ user }: { user: SessionUser }) {
  return (
    <DropdownMenu>
      <DropdownTrigger className="flex items-center gap-2 rounded-full p-0.5 transition hover:ring-4 hover:ring-muted" aria-label="תפריט משתמש">
        <Avatar name={user.name} src={user.avatarUrl} size={36} />
      </DropdownTrigger>
      <DropdownContent>
        <DropdownLabel>
          <span className="block text-sm font-semibold text-foreground">{user.name}</span>
          <span className="block truncate">{user.email}</span>
        </DropdownLabel>
        <DropdownSeparator />
        <DropdownItem asChild><Link href="/dashboard"><LayoutDashboard />האזור האישי</Link></DropdownItem>
        <DropdownItem asChild><Link href="/dashboard/products"><Package />המוצרים שלי</Link></DropdownItem>
        <DropdownItem asChild><Link href="/dashboard/messages"><MessageCircle />הודעות</Link></DropdownItem>
        <DropdownItem asChild><Link href="/dashboard/favorites"><Heart />מועדפים</Link></DropdownItem>
        <DropdownItem asChild><Link href="/dashboard/requests"><SearchIcon />הבקשות שלי</Link></DropdownItem>
        <DropdownItem asChild><Link href="/dashboard/profile"><User />פרופיל</Link></DropdownItem>
        {user.role === "ADMIN" && (
          <>
            <DropdownSeparator />
            <DropdownItem asChild><Link href="/admin"><ShieldCheck />ניהול האתר</Link></DropdownItem>
          </>
        )}
        <DropdownSeparator />
        <form action={logoutAction}>
          <DropdownItem asChild>
            <button type="submit" className="w-full text-danger"><LogOut />התנתקות</button>
          </DropdownItem>
        </form>
      </DropdownContent>
    </DropdownMenu>
  );
}
