import type { Metadata } from "next";
import { requireAdminPage } from "@/server/auth/guards";
import { adminListCategories } from "@/server/services/admin";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/ui/dynamic-icon";
import { CategoryForm } from "@/components/admin/category-form";
import { DeleteCategoryButton } from "@/components/admin/action-buttons";

export const metadata: Metadata = { title: "קטגוריות" };

export default async function AdminCategoriesPage() {
  await requireAdminPage();
  const categories = await adminListCategories();
  return (
    <div className="space-y-6">
      <PageHeader title="קטגוריות" description="הוספה, עריכה, סידור והשבתה של קטגוריות" />
      <Card>
        <CardHeader title="קטגוריה חדשה" />
        <div className="p-5"><CategoryForm /></div>
      </Card>
      <ul className="space-y-3">
        {categories.map((c) => (
          <li key={c.id}>
            <details className="group rounded-2xl border border-border/70 bg-surface shadow-card">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><CategoryIcon name={c.icon} className="size-5" /></span>
                <span className="flex-1">
                  <span className="font-medium">{c.name}</span>{" "}
                  <span className="text-xs text-muted-foreground" dir="ltr">/{c.slug}</span>
                </span>
                {!c.isActive && <Badge tone="warning">מושבתת</Badge>}
                <Badge>{c._count.products} מוצרים</Badge>
                <span className="text-sm text-primary group-open:hidden">עריכה</span>
              </summary>
              <div className="space-y-3 border-t border-border p-4">
                <CategoryForm category={c} />
                {c._count.products === 0 && <div className="flex justify-end"><DeleteCategoryButton categoryId={c.id} /></div>}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
