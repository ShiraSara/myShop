"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Grid2x2, Heart, LayoutDashboard, LogIn, LogOut, Menu, MessageCircle, Package, Plus, Search, ShieldCheck, User, UserPlus, HandHelping } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { SheetContent } from "@/components/ui/dialog";
import type { SessionUser } from "@/server/auth/session";
import { cn } from "@/lib/utils";

export function MobileMenu({ user, unreadMessages }: { user: SessionUser | null; unreadMessages: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  const item = "flex items-center gap-3 rounded-xl px-3 py-3 text-[0.95rem] font-medium transition-colors hover:bg-muted [&_svg]:size-5 [&_svg]:text-muted-foreground";
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger className="flex size-10 items-center justify-center rounded-xl hover:bg-muted md:hidden" aria-label="פתיחת תפריט">
        <Menu className="size-6" />
      </DialogPrimitive.Trigger>
      <SheetContent title="תפריט">
        <nav className="flex flex-col gap-0.5 p-3" aria-label="תפריט ראשי">
          {user && (
            <div className="mb-2 rounded-2xl bg-muted px-4 py-3">
              <p className="font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          )}
          <Link href="/dashboard/products/new" className={cn(item, "bg-primary text-white hover:bg-primary-700 [&_svg]:text-white")}>
            <Plus />פרסום מוצר
          </Link>
          <Link href="/search" className={item}><Search />חיפוש</Link>
          <Link href="/categories" className={item}><Grid2x2 />קטגוריות</Link>
          <Link href="/request-product" className={item}><HandHelping />בקשת מוצר</Link>
          {user ? (
            <>
              <div className="my-2 h-px bg-border" />
              <Link href="/dashboard" className={item}><LayoutDashboard />האזור האישי</Link>
              <Link href="/dashboard/messages" className={item}>
                <MessageCircle />הודעות
                {unreadMessages > 0 && <span className="ms-auto rounded-full bg-accent px-2 text-xs font-bold text-white">{unreadMessages}</span>}
              </Link>
              <Link href="/dashboard/favorites" className={item}><Heart />מועדפים</Link>
              <Link href="/dashboard/products" className={item}><Package />המוצרים שלי</Link>
              <Link href="/dashboard/profile" className={item}><User />פרופיל</Link>
              {user.role === "ADMIN" && <Link href="/admin" className={item}><ShieldCheck />ניהול האתר</Link>}
              <form action={logoutAction}>
                <button type="submit" className={cn(item, "w-full text-danger")}><LogOut />התנתקות</button>
              </form>
            </>
          ) : (
            <>
              <div className="my-2 h-px bg-border" />
              <Link href="/login" className={item}><LogIn />התחברות</Link>
              <Link href="/register" className={item}><UserPlus />הרשמה</Link>
            </>
          )}
        </nav>
      </SheetContent>
    </DialogPrimitive.Root>
  );
}
