import "server-only";
import { db } from "../db";
import type { SiteSettings } from "@/lib/validation/misc";

export const DEFAULT_SETTINGS: SiteSettings = {
  announcement: null,
  maxImagesPerProduct: 10,
  allowRegistration: true,
  contactEmail: null,
};

const KEY = "site";

export async function getSettings(): Promise<SiteSettings> {
  const row = await db.siteSetting.findUnique({ where: { key: KEY } });
  return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<SiteSettings>) ?? {}) };
}

export async function updateSettings(value: SiteSettings) {
  await db.siteSetting.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
}
