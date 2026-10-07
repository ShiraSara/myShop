import "server-only";
import type { ReportReason } from "@prisma/client";
import { db } from "../db";
import { ConflictError, NotFoundError, ValidationError } from "../errors";

export async function createReport(userId: string, input: { productId: string; reason: ReportReason; details: string | null }) {
  const product = await db.product.findUnique({ where: { id: input.productId }, select: { sellerId: true, status: true } });
  if (!product || product.status === "REMOVED") throw new NotFoundError("המוצר לא נמצא");
  if (product.sellerId === userId) throw new ValidationError("לא ניתן לדווח על מוצר שלכם");
  const existing = await db.report.findUnique({ where: { reporterId_productId: { reporterId: userId, productId: input.productId } } });
  if (existing) throw new ConflictError("כבר דיווחתם על המוצר הזה. הדיווח בבדיקה.");
  return db.report.create({ data: { reporterId: userId, productId: input.productId, reason: input.reason, details: input.details } });
}
