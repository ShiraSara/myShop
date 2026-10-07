import "server-only";
import { db } from "../db";

export async function getProfile(userId: string) {
  return db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, city: true, bio: true, avatarUrl: true, createdAt: true, role: true },
  });
}

export async function updateProfile(userId: string, data: { name: string; phone: string | null; city: string | null; bio: string | null }) {
  return db.user.update({ where: { id: userId }, data });
}

export async function getHeaderCounts(userId: string) {
  const [unreadMessages, unreadNotifications] = await Promise.all([
    db.message.count({
      where: { readAt: null, senderId: { not: userId }, conversation: { OR: [{ buyerId: userId }, { sellerId: userId }] } },
    }),
    db.notification.count({ where: { userId, readAt: null, type: { not: "NEW_MESSAGE" } } }),
  ]);
  return { unreadMessages, unreadNotifications };
}
