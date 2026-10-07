"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { productRequestSchema } from "@/lib/validation/misc";
import { formDataToObject, zodFail, type ActionResult } from "@/lib/validation/common";
import { requireUser } from "@/server/auth/guards";
import { rateLimit } from "@/server/rate-limit";
import { createProductRequest, deleteProductRequest, dismissMatch, setRequestStatus } from "@/server/services/requests";
import { safeAction } from "./_utils";

export async function createRequestAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const result = await safeAction(async () => {
    const user = await requireUser();
    const parsed = productRequestSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return zodFail(parsed.error);
    await rateLimit(`request:create:${user.id}`, 10, 60 * 60);
    await createProductRequest(user.id, parsed.data);
    return { ok: true };
  });
  if (result.ok) {
    revalidatePath("/dashboard/requests");
    redirect("/dashboard/requests?created=1");
  }
  return result;
}

export async function setRequestStatusAction(requestId: string, status: "OPEN" | "FULFILLED" | "CLOSED"): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireUser();
    if (!["OPEN", "FULFILLED", "CLOSED"].includes(status)) return { ok: false, error: "סטטוס לא תקין" };
    await setRequestStatus(user.id, String(requestId), status);
    revalidatePath("/dashboard/requests");
    return { ok: true, message: "הבקשה עודכנה" };
  });
}

export async function deleteRequestAction(requestId: string): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireUser();
    await deleteProductRequest(user.id, String(requestId));
    revalidatePath("/dashboard/requests");
    return { ok: true, message: "הבקשה נמחקה" };
  });
}

export async function dismissMatchAction(matchId: string): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireUser();
    await dismissMatch(user.id, String(matchId));
    revalidatePath("/dashboard/requests");
    return { ok: true };
  });
}
