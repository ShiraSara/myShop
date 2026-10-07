import type { Metadata } from "next";
import { requireUserPage } from "@/server/auth/guards";
import { getProfile } from "@/server/services/users";
import { ChangePasswordForm, ProfileForm } from "@/components/forms/profile-form";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "פרופיל" };

export default async function ProfilePage() {
  const user = await requireUserPage("/dashboard/profile");
  const profile = await getProfile(user.id);
  return (
    <div className="space-y-6">
      <PageHeader title="פרופיל" />
      <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-surface p-5 shadow-card">
        <Avatar name={profile.name} src={profile.avatarUrl} size={64} />
        <div>
          <p className="text-lg font-semibold">{profile.name}</p>
          <p className="text-sm text-muted-foreground">חבר/ה מאז {formatDate(profile.createdAt)}</p>
        </div>
      </div>
      <Card>
        <CardHeader title="פרטים אישיים" description="השם והעיר מוצגים לקונים במודעות שלכם" />
        <div className="p-5"><ProfileForm profile={profile} /></div>
      </Card>
      <Card>
        <CardHeader title="שינוי סיסמה" />
        <div className="p-5"><ChangePasswordForm /></div>
      </Card>
    </div>
  );
}
