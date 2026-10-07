import "server-only";
import { unstable_rethrow } from "next/navigation";
import { toSafeMessage } from "@/server/errors";
import type { ActionResult } from "@/lib/validation/common";

/** Runs an action body and converts thrown errors into a safe ActionResult. */
export async function safeAction<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    unstable_rethrow(error); // let redirect() / notFound() through
    return { ok: false, error: toSafeMessage(error) };
  }
}

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeRedirectPath(path: unknown, fallback = "/dashboard") {
  if (typeof path !== "string") return fallback;
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  return path;
}
