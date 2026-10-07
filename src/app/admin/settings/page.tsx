import type { Metadata } from "next";
import { requireAdminPage } from "@/server/auth/guards";
import { getSettings } from "@/server/services/settings";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "הגדרות" };

export default async function AdminSettingsPage() {
  await requireAdminPage();
  const settings = await getSettings();
  return (
    <div>
      <PageHeader title="הגדרות האתר" />
      <Card className="p-5 sm:p-6"><SettingsForm settings={settings} /></Card>
    </div>
  );
}
