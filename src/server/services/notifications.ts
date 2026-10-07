import "server-only";
import type { NotificationType, Prisma } from "@prisma/client";
import { db } from "../db";

export async function notify(
  data: { userId: string; type: NotificationType; title: string; body?: string | null; link?: string | null },
  tx: Prisma.TransactionClient = db,
) {
  return tx.notification.create({ data });
}

export async function listNotifications(userId: string, take = 20) {
  return db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take });
}

export async function unreadNotificationCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationsRead(userId: string) {
  await db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}
