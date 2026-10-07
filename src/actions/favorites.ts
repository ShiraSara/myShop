"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/validation/common";
import { requireUser } from "@/server/auth/guards";
import { rateLimit } from "@/server/rate-limit";
import { toggleFavorite } from "@/server/services/favorites";
import { safeAction } from "./_utils";

export async function toggleFavoriteAction(productId: string): Promise<ActionResult<{ favorited: boolean }>> {
  return safeAction(async () => {
    const user = await requireUser();
    if (typeof productId !== "string" || productId.length > 40) return { ok: false, error: "מוצר לא תקין" };
    await rateLimit(`favorite:${user.id}`, 120, 60);
    const result = await toggleFavorite(user.id, productId);
    revalidatePath("/dashboard/favorites");
    return { ok: true, data: result };
  });
}
