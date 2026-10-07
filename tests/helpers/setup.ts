import { afterAll, beforeEach, vi } from "vitest";
import { db } from "@/server/db";

// Keep test output clean
vi.spyOn(console, "info").mockImplementation(() => undefined);

const TABLES = [
  "Notification", "RequestMatch", "ProductRequest", "Report", "Message", "Conversation", "Favorite",
  "ProductImage", "Product", "Category", "Session", "PasswordResetToken", "AuditLog", "SiteSetting", "RateLimit", "User",
];

beforeEach(async () => {
  await db.$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(", ")} CASCADE`);
});

afterAll(async () => {
  await db.$disconnect();
});
