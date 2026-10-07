import "server-only";
import { db } from "../db";
import { productCardSelect } from "./product-queries";
import { unreadMessageCount } from "./messaging";

export async function getSellerStats(userId: string) {
  const [byStatus, conversations, unread, favoritesReceived, favoritesSaved, views, openRequests, recent] = await Promise.all([
    db.product.groupBy({ by: ["status"], where: { sellerId: userId }, _count: { _all: true } }),
    db.conversation.count({ where: { OR: [{ buyerId: userId }, { sellerId: userId }], messages: { some: {} } } }),
    unreadMessageCount(userId),
    db.favorite.count({ where: { product: { sellerId: userId } } }),
    db.favorite.count({ where: { userId } }),
    db.product.aggregate({ where: { sellerId: userId }, _sum: { viewCount: true } }),
    db.productRequest.count({ where: { userId, status: "OPEN" } }),
    db.product.findMany({ where: { sellerId: userId }, orderBy: { createdAt: "desc" }, take: 4, select: productCardSelect }),
  ]);
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count._all ?? 0;
  return {
    totalProducts: byStatus.reduce((sum, b) => sum + b._count._all, 0),
    activeProducts: count("ACTIVE"),
    soldProducts: count("SOLD"),
    draftProducts: count("DRAFT"),
    conversations,
    unreadMessages: unread,
    favoritesReceived,
    favoritesSaved,
    totalViews: views._sum.viewCount ?? 0,
    openRequests,
    recentProducts: recent,
  };
}
