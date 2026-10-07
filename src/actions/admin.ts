"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { categorySchema, settingsSchema } from "@/lib/validation/misc";
import { formDataToObject, zodFail, type ActionResult } from "@/lib/validation/common";
import { requireAdmin } from "@/server/auth/guards";
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminDeleteProduct,
  adminResolveReport,
  adminSetProductStatus,
  adminSetRequestStatus,
  adminSetUserStatus,
  adminToggleFeatured,
  adminUpdateCategory,
} from "@/server/services/admin";
import { updateSettings } from "@/server/services/settings";
import { safeAction } from "./_utils";

const id = z.string().min(1).max(40);

export async function adminSetUserStatusAction(userId: string, status: "ACTIVE" | "BLOCKED", reason?: string): Promise<ActionResult> {
  return safeAction(async () => {
    const admin = await requireAdmin();
    const parsed = z.object({ userId: id, status: z.enum(["ACTIVE", "BLOCKED"]), reason: z.string().max(300).optional() }).safeParse({ userId, status, reason });
    if (!parsed.success) return { ok: false, error: "נתונים לא תקינים" };
    await adminSetUserStatus(admin.id, parsed.data.userId, parsed.data.status, parsed.data.reason);
    revalidatePath("/admin/users");
    return { ok: true, message: status === "BLOCKED" ? "המשתמש נחסם" : "החסימה הוסרה" };
  });
}

export async function adminSetProductStatusAction(productId: string, status: string, reason?: string): Promise<ActionResult> {
  return safeAction(async () => {
    const admin = await requireAdmin();
    const parsed = z
      .object({ productId: id, status: z.enum(["ACTIVE", "SOLD", "DRAFT", "ARCHIVED", "REMOVED"]), reason: z.string().max(300).optional() })
      .safeParse({ productId, status, reason });
    if (!parsed.success) return { ok: false, error: "נתונים לא תקינים" };
    await adminSetProductStatus(admin.id, parsed.data.productId, parsed.data.status, parsed.data.reason);
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true, message: "סטטוס המוצר עודכן" };
  });
}

export async function adminToggleFeaturedAction(productId: string): Promise<ActionResult> {
  return safeAction(async () => {
    const admin = await requireAdmin();
    await adminToggleFeatured(admin.id, id.parse(productId));
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true, message: "עודכן" };
  });
}

export async function adminDeleteProductAction(productId: string): Promise<ActionResult> {
  return safeAction(async () => {
    const admin = await requireAdmin();
    await adminDeleteProduct(admin.id, id.parse(productId));
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true, message: "המוצר נמחק" };
  });
}

export async function adminSaveCategoryAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safeAction(async () => {
    const admin = await requireAdmin();
    const parsed = categorySchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return zodFail(parsed.error);
    const categoryId = formData.get("id");
    if (typeof categoryId === "string" && categoryId) await adminUpdateCategory(admin.id, categoryId, parsed.data);
    else await adminCreateCategory(admin.id, parsed.data);
    revalidateTag("categories");
    revalidatePath("/admin/categories");
    revalidatePath("/categories");
    return { ok: true, message: "הקטגוריה נשמרה" };
  });
}

export async function adminDeleteCategoryAction(categoryId: string): Promise<ActionResult> {
  return safeAction(async () => {
    const admin = await requireAdmin();
    await adminDeleteCategory(admin.id, id.parse(categoryId));
    revalidateTag("categories");
    revalidatePath("/admin/categories");
    return { ok: true, message: "הקטגוריה נמחקה" };
  });
}

export async function adminResolveReportAction(reportId: string, status: "REVIEWED" | "ACTIONED" | "DISMISSED", removeProduct = false): Promise<ActionResult> {
  return safeAction(async () => {
    const admin = await requireAdmin();
    const parsed = z.object({ reportId: id, status: z.enum(["REVIEWED", "ACTIONED", "DISMISSED"]), removeProduct: z.boolean() }).safeParse({ reportId, status, removeProduct });
    if (!parsed.success) return { ok: false, error: "נתונים לא תקינים" };
    await adminResolveReport(admin.id, parsed.data.reportId, parsed.data.status, parsed.data.removeProduct);
    revalidatePath("/admin/reports");
    return { ok: true, message: "הדיווח עודכן" };
  });
}

export async function adminSetRequestStatusAction(requestId: string, status: "OPEN" | "FULFILLED" | "CLOSED"): Promise<ActionResult> {
  return safeAction(async () => {
    const admin = await requireAdmin();
    const parsed = z.object({ requestId: id, status: z.enum(["OPEN", "FULFILLED", "CLOSED"]) }).safeParse({ requestId, status });
    if (!parsed.success) return { ok: false, error: "נתונים לא תקינים" };
    await adminSetRequestStatus(admin.id, parsed.data.requestId, parsed.data.status);
    revalidatePath("/admin/requests");
    return { ok: true, message: "הבקשה עודכנה" };
  });
}

export async function adminSaveSettingsAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    const parsed = settingsSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return zodFail(parsed.error);
    await updateSettings(parsed.data);
    revalidatePath("/", "layout");
    return { ok: true, message: "ההגדרות נשמרו" };
  });
}
