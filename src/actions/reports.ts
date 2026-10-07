"use server";

import { reportSchema } from "@/lib/validation/misc";
import { zodFail, type ActionResult } from "@/lib/validation/common";
import { requireUser } from "@/server/auth/guards";
import { rateLimit } from "@/server/rate-limit";
import { createReport } from "@/server/services/reports";
import { safeAction } from "./_utils";

export async function reportProductAction(input: { productId: string; reason: string; details?: string }): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireUser();
    const parsed = reportSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);
    await rateLimit(`report:${user.id}`, 10, 60 * 60);
    await createReport(user.id, parsed.data);
    return { ok: true, message: "תודה! הדיווח התקבל ויבדק על ידי הצוות." };
  });
}
