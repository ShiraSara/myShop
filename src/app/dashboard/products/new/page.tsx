import type { Metadata } from "next";
import { requireUserPage } from "@/server/auth/guards";
import { listActiveCategories } from "@/server/services/categories";
import { getSettings } from "@/server/services/settings";
import { ProductWizard } from "@/components/forms/product-wizard";

export const metadata: Metadata = { title: "פרסום מוצר" };

export default async function NewProductPage() {
  const user = await requireUserPage("/dashboard/products/new");
  const [categories, settings] = await Promise.all([listActiveCategories(), getSettings()]);
  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">פרסום מוצר חדש</h1>
        <p className="mt-1.5 text-muted-foreground">5 צעדים קצרים — והמוצר שלכם באוויר</p>
      </div>
      <ProductWizard
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        maxImages={settings.maxImagesPerProduct}
        initial={{
          title: "",
          categoryId: "",
          price: "",
          condition: "",
          images: [],
          city: user.city ?? "",
          shippingAvailable: false,
          shippingPrice: "",
          shippingDetails: "",
          description: "",
        }}
      />
    </div>
  );
}
