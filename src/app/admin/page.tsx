import type { Metadata } from "next";
import { requireAdminPage } from "@/server/auth/guards";
import Link from "next/link";
import { Flag, MessageCircle, Package, Search, UserPlus, Users, UserX, Sparkles } from "lucide-react";
import { getAdminStats } from "@/server/services/admin";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "סקירה" };

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const s = await getAdminStats();
  return (
    <div className="space-y-6">
      <PageHeader title="ניהול האתר" description="תמונת מצב של הפעילות באתר" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="משתמשים" value={s.users} icon={Users} href="/admin/users" />
        <StatCard label="משתמשים חדשים (7 ימים)" value={s.newUsers} icon={UserPlus} />
        <StatCard label="מוצרים פעילים" value={s.activeProducts} icon={Package} href="/admin/products?status=ACTIVE" hint={`${s.totalProducts} סה״כ`} />
        <StatCard label="מוצרים חדשים (7 ימים)" value={s.newProducts} icon={Sparkles} />
        <StatCard label="דיווחים פתוחים" value={s.openReports} icon={Flag} href="/admin/reports?status=OPEN" />
        <StatCard label="בקשות פתוחות" value={s.openRequests} icon={Search} href="/admin/requests?status=OPEN" />
        <StatCard label="הודעות (7 ימים)" value={s.messages} icon={MessageCircle} />
        <StatCard label="משתמשים חסומים" value={s.blocked} icon={UserX} href="/admin/users?status=BLOCKED" />
      </div>
      <Card>
        <CardHeader title="פעולות ניהול אחרונות" />
        {s.recentLogs.length ? (
          <ul className="divide-y divide-border">
            {s.recentLogs.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span><span className="font-medium">{l.actor?.name ?? "מערכת"}</span> · <code className="rounded bg-muted px-1.5 py-0.5 text-xs" dir="ltr">{l.action}</code> · {l.targetType}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(l.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-6 text-sm text-muted-foreground">אין פעולות עדיין. <Link href="/admin/reports" className="text-primary">לדיווחים</Link></p>
        )}
      </Card>
    </div>
  );
}
