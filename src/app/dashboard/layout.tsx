import type { Metadata } from "next";
import { requireUserPage } from "@/server/auth/guards";
import { getHeaderCounts } from "@/server/services/users";
import { SideNav } from "@/components/dashboard/side-nav";

export const metadata: Metadata = { robots: { index: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage("/dashboard");
  const counts = await getHeaderCounts(user.id);
  return (
    <div className="container-page py-6 lg:py-10">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <SideNav
            label="האזור האישי"
            items={[
              { href: "/dashboard", label: "סקירה", icon: "LayoutDashboard", exact: true },
              { href: "/dashboard/products", label: "המוצרים שלי", icon: "Package" },
              { href: "/dashboard/messages", label: "הודעות", icon: "MessageCircle", badge: counts.unreadMessages },
              { href: "/dashboard/favorites", label: "מועדפים", icon: "Heart" },
              { href: "/dashboard/requests", label: "בקשות מוצרים", icon: "Search" },
              { href: "/dashboard/notifications", label: "התראות", icon: "Bell", badge: counts.unreadNotifications },
              { href: "/dashboard/profile", label: "פרופיל", icon: "User" },
            ]}
          />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
