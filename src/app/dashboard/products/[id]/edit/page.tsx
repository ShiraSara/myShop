import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUserPage } from "@/server/auth/guards";
import { listActiveCategories } from "@/server/services/categories";
import { getProductForEdit } from "@/server/services/products";
import { getSettings } from "@/server/services/settings";
import { AppError } from "@/server/errors";
import { ProductWizard } from "@/components/forms/product-wizard";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "עריכת מוצר" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserPage(`/dashboard/products/${id}/edit`);
  let product;
  try {
    product = await getProductForEdit(user.id, id);
  } catch (e) {
    if (e instanceof AppError) notFound();
    throw e;
  }
  if (product.status === "REMOVED") {
    return <Alert tone="error">המוצר הוסר על ידי הנהלת האתר ולא ניתן לערוך אותו.</Alert>;
  }
  const [categories, settings] = await Promise.all([listActiveCategories(), getSettings()]);
  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">עריכת מוצר</h1>
        <p className="mt-1.5 truncate text-muted-foreground">{product.title}</p>
      </div>
      <ProductWizard
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        maxImages={settings.maxImagesPerProduct}
        initial={{
          id: product.id,
          status: product.status,
          title: product.title,
          categoryId: product.categoryId,
          price: String(product.price),
          condition: product.condition,
          images: product.images.map((i) => ({ id: i.id, url: i.url, isPrimary: i.isPrimary })),
          city: product.city,
          shippingAvailable: product.shippingAvailable,
          shippingPrice: product.shippingPrice?.toString() ?? "",
          shippingDetails: product.shippingDetails ?? "",
          description: product.description,
        }}
      />
    </div>
  );
}
