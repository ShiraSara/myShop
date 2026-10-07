"use server";

import { revalidatePath } from "next/cache";
import { profileSchema } from "@/lib/validation/misc";
import { formDataToObject, zodFail, type ActionResult } from "@/lib/validation/common";
import { requireUser } from "@/server/auth/guards";
import { updateProfile } from "@/server/services/users";
import { markNotificationsRead } from "@/server/services/notifications";
import { safeAction } from "./_utils";

export async function updateProfileAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireUser();
    const parsed = profileSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return zodFail(parsed.error);
    await updateProfile(user.id, parsed.data);
    revalidatePath("/", "layout");
    return { ok: true, message: "הפרופיל עודכן" };
  });
}

export async function markNotificationsReadAction(): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireUser();
    await markNotificationsRead(user.id);
    revalidatePath("/", "layout");
    return { ok: true };
  });
}
