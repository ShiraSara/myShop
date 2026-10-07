import type { Metadata } from "next";
import { requireAdminPage } from "@/server/auth/guards";
import { SideNav } from "@/components/dashboard/side-nav";
import { db } from "@/server/db";

export const metadata: Metadata = { title: { default: "ניהול", template: "%s · ניהול" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  const openReports = await db.report.count({ where: { status: "OPEN" } });
  return (
    <div className="container-page py-6 lg:py-10">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 hidden px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:block">ניהול האתר</p>
          <SideNav
            label="ניהול"
            items={[
              { href: "/admin", label: "סקירה", icon: "LayoutDashboard", exact: true },
              { href: "/admin/users", label: "משתמשים", icon: "Users" },
              { href: "/admin/products", label: "מוצרים", icon: "Package" },
              { href: "/admin/categories", label: "קטגוריות", icon: "FolderTree" },
              { href: "/admin/requests", label: "בקשות מוצרים", icon: "Search" },
              { href: "/admin/reports", label: "דיווחים", icon: "Flag", badge: openReports },
              { href: "/admin/settings", label: "הגדרות", icon: "Settings" },
            ]}
          />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
