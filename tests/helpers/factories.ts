import type { ProductCondition } from "@prisma/client";
import { db } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { productSchema, type ProductRawInput } from "@/lib/validation/product";

let counter = 0;
const next = () => ++counter;

export async function createUser(overrides: { email?: string; name?: string; role?: "USER" | "ADMIN"; status?: "ACTIVE" | "BLOCKED"; password?: string } = {}) {
  const n = next();
  return db.user.create({
    data: {
      email: overrides.email ?? `user${n}@test.local`,
      name: overrides.name ?? `משתמש ${n}`,
      passwordHash: await hashPassword(overrides.password ?? "Password123"),
      role: overrides.role ?? "USER",
      status: overrides.status ?? "ACTIVE",
    },
  });
}

export async function createCategory(slug = `cat-${next()}`, name = "קטגוריה") {
  return db.category.create({ data: { slug, name } });
}

/** A pending (unattached) uploaded image owned by the user. */
export async function createPendingImage(uploaderId: string) {
  const n = next();
  return db.productImage.create({
    data: { uploaderId, url: `/uploads/test/${n}.webp`, storageKey: `test/${n}-${Date.now()}.webp` },
  });
}

export async function productInput(userId: string, categoryId: string, overrides: Partial<ProductRawInput> = {}) {
  const img = await createPendingImage(userId);
  const raw: ProductRawInput = {
    title: "אופני ילדים 20 אינץ׳",
    categoryId,
    price: "450",
    condition: "GOOD" as ProductCondition,
    imageIds: [img.id],
    primaryImageId: img.id,
    city: "רעננה",
    shippingAvailable: true,
    shippingPrice: "50",
    shippingDetails: "",
    description: "אופניים במצב טוב מאוד, מתאימים לילד בגיל 8 עד 11.",
    status: "ACTIVE",
    ...overrides,
  };
  return productSchema.parse(raw);
}
