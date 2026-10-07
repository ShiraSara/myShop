"use server";

import { revalidatePath } from "next/cache";
import { productSchema, productStatusUpdateSchema, type ProductRawInput } from "@/lib/validation/product";
import { zodFail, type ActionResult } from "@/lib/validation/common";
import { requireUser } from "@/server/auth/guards";
import { rateLimit } from "@/server/rate-limit";
import { createProduct, deleteProduct, setProductStatus, updateProduct } from "@/server/services/products";
import { deleteImage } from "@/server/services/images";
import { safeAction } from "./_utils";

export async function createProductAction(input: ProductRawInput): Promise<ActionResult<{ id: string; slug: string }>> {
  return safeAction(async () => {
    const user = await requireUser();
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);
    await rateLimit(`product:create:${user.id}`, 20, 60 * 60);
    const product = await createProduct(user.id, parsed.data);
    revalidatePath("/");
    return { ok: true, data: { id: product.id, slug: product.slug } };
  });
}

export async function updateProductAction(
  productId: string,
  input: ProductRawInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  return safeAction(async () => {
    const user = await requireUser();
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);
    await rateLimit(`product:update:${user.id}`, 60, 60 * 60);
    const product = await updateProduct(user.id, String(productId), parsed.data);
    revalidatePath(`/products/${product.slug}`);
    revalidatePath("/dashboard/products");
    return { ok: true, data: { id: product.id, slug: product.slug } };
  });
}

export async function setProductStatusAction(productId: string, status: string): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireUser();
    const parsed = productStatusUpdateSchema.safeParse({ productId, status });
    if (!parsed.success) return { ok: false, error: "סטטוס לא תקין" };
    const product = await setProductStatus(user.id, parsed.data.productId, parsed.data.status);
    revalidatePath("/dashboard/products");
    revalidatePath(`/products/${product.slug}`);
    const messages: Record<string, string> = {
      SOLD: "המוצר סומן כנמכר 🎉",
      ACTIVE: "המוצר פורסם מחדש",
      ARCHIVED: "המוצר הועבר לארכיון",
      DRAFT: "המוצר הועבר לטיוטות",
    };
    return { ok: true, message: messages[parsed.data.status] };
  });
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireUser();
    await deleteProduct(user.id, String(productId));
    revalidatePath("/dashboard/products");
    revalidatePath("/");
    return { ok: true, message: "המוצר נמחק" };
  });
}

export async function deleteImageAction(imageId: string): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireUser();
    await deleteImage(user.id, String(imageId));
    return { ok: true };
  });
}
