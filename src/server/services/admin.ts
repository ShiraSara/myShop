import "server-only";
import type { Prisma, ProductStatus, ReportStatus, RequestStatus, UserStatus } from "@prisma/client";
import { db } from "../db";
import { ConflictError, NotFoundError, ValidationError } from "../errors";
import { invalidateAllUserSessions } from "../auth/session";
import { notify } from "./notifications";
import { hardDeleteProduct } from "./products";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";

const ADMIN_PAGE_SIZE = 25;

async function audit(actorId: string, action: string, targetType: string, targetId: string, meta?: Prisma.InputJsonValue) {
  await db.auditLog.create({ data: { actorId, action, targetType, targetId, meta } });
}

export async function getAdminStats() {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [users, newUsers, blocked, activeProducts, totalProducts, newProducts, openReports, openRequests, messages, recentLogs] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { createdAt: { gte: since } } }),
      db.user.count({ where: { status: "BLOCKED" } }),
      db.product.count({ where: { status: "ACTIVE" } }),
      db.product.count(),
      db.product.count({ where: { createdAt: { gte: since } } }),
      db.report.count({ where: { status: "OPEN" } }),
      db.productRequest.count({ where: { status: "OPEN" } }),
      db.message.count({ where: { createdAt: { gte: since } } }),
      db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: { select: { name: true } } } }),
    ]);
  return { users, newUsers, blocked, activeProducts, totalProducts, newProducts, openReports, openRequests, messages, recentLogs };
}

// ── Users ────────────────────────────────────────────────────────────

export async function adminListUsers(params: { q?: string; status?: UserStatus; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const where: Prisma.UserWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.q
      ? { OR: [{ name: { contains: params.q, mode: "insensitive" } }, { email: { contains: params.q, mode: "insensitive" } }] }
      : {}),
  };
  const [total, items] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true, name: true, email: true, role: true, status: true, city: true, createdAt: true, lastSeenAt: true,
        _count: { select: { products: true, reports: true } },
      },
    }),
  ]);
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function adminSetUserStatus(adminId: string, userId: string, status: UserStatus, reason?: string | null) {
  if (adminId === userId) throw new ValidationError("לא ניתן לחסום את עצמך");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("המשתמש לא נמצא");
  if (user.role === "ADMIN" && status === "BLOCKED") throw new ValidationError("לא ניתן לחסום מנהל מערכת");
  await db.user.update({
    where: { id: userId },
    data: { status, blockedAt: status === "BLOCKED" ? new Date() : null, blockReason: status === "BLOCKED" ? reason ?? null : null },
  });
  if (status === "BLOCKED") await invalidateAllUserSessions(userId);
  await audit(adminId, status === "BLOCKED" ? "user.block" : "user.unblock", "User", userId, reason ? { reason } : undefined);
}

// ── Products ─────────────────────────────────────────────────────────

export async function adminListProducts(params: { q?: string; status?: ProductStatus; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const where: Prisma.ProductWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.q
      ? { OR: [{ title: { contains: params.q, mode: "insensitive" } }, { seller: { email: { contains: params.q, mode: "insensitive" } } }] }
      : {}),
  };
  const [total, items] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true, slug: true, title: true, price: true, status: true, isFeatured: true, createdAt: true, city: true,
        seller: { select: { id: true, name: true, email: true } },
        category: { select: { name: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1, select: { url: true } },
        _count: { select: { reports: true } },
      },
    }),
  ]);
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function adminSetProductStatus(adminId: string, productId: string, status: ProductStatus, reason?: string | null) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError("המוצר לא נמצא");
  await db.product.update({
    where: { id: productId },
    data: {
      status,
      removedReason: status === "REMOVED" ? reason ?? null : null,
      soldAt: status === "SOLD" ? product.soldAt ?? new Date() : null,
      publishedAt: status === "ACTIVE" && !product.publishedAt ? new Date() : product.publishedAt,
    },
  });
  await notify({
    userId: product.sellerId,
    type: "PRODUCT_STATUS",
    title: status === "REMOVED" ? `המודעה "${product.title}" הוסרה על ידי הנהלת האתר` : `סטטוס המודעה "${product.title}" עודכן ל${PRODUCT_STATUS_LABELS[status]}`,
    body: reason ?? null,
    link: "/dashboard/products",
  });
  await audit(adminId, "product.status", "Product", productId, { status, reason: reason ?? null });
}

export async function adminToggleFeatured(adminId: string, productId: string) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError("המוצר לא נמצא");
  await db.product.update({ where: { id: productId }, data: { isFeatured: !product.isFeatured } });
  await audit(adminId, product.isFeatured ? "product.unfeature" : "product.feature", "Product", productId);
}

export async function adminDeleteProduct(adminId: string, productId: string) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError("המוצר לא נמצא");
  await hardDeleteProduct(productId);
  await notify({ userId: product.sellerId, type: "PRODUCT_STATUS", title: `המודעה "${product.title}" נמחקה על ידי הנהלת האתר` });
  await audit(adminId, "product.delete", "Product", productId, { title: product.title });
}

// ── Categories ───────────────────────────────────────────────────────

export async function adminListCategories() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
}

type CategoryInput = { name: string; slug: string; description: string | null; icon: string; sortOrder: number; isActive: boolean };

export async function adminCreateCategory(adminId: string, data: CategoryInput) {
  const exists = await db.category.findUnique({ where: { slug: data.slug } });
  if (exists) throw new ConflictError("מזהה ה-URL כבר בשימוש");
  const category = await db.category.create({ data });
  await audit(adminId, "category.create", "Category", category.id, { name: data.name });
  return category;
}

export async function adminUpdateCategory(adminId: string, id: string, data: CategoryInput) {
  const exists = await db.category.findFirst({ where: { slug: data.slug, id: { not: id } } });
  if (exists) throw new ConflictError("מזהה ה-URL כבר בשימוש");
  const category = await db.category.update({ where: { id }, data });
  await audit(adminId, "category.update", "Category", id, { name: data.name });
  return category;
}

export async function adminDeleteCategory(adminId: string, id: string) {
  const count = await db.product.count({ where: { categoryId: id } });
  if (count > 0) throw new ValidationError("לא ניתן למחוק קטגוריה עם מוצרים. ניתן להשבית אותה במקום.");
  await db.category.delete({ where: { id } });
  await audit(adminId, "category.delete", "Category", id);
}

// ── Reports ──────────────────────────────────────────────────────────

export async function adminListReports(params: { status?: ReportStatus; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const where: Prisma.ReportWhereInput = params.status ? { status: params.status } : {};
  const [total, items] = await Promise.all([
    db.report.count({ where }),
    db.report.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: {
        reporter: { select: { name: true, email: true } },
        product: { select: { id: true, slug: true, title: true, status: true, seller: { select: { id: true, name: true } } } },
        resolvedBy: { select: { name: true } },
      },
    }),
  ]);
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function adminResolveReport(adminId: string, reportId: string, status: Exclude<ReportStatus, "OPEN">, removeProduct = false) {
  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report) throw new NotFoundError("הדיווח לא נמצא");
  await db.report.update({ where: { id: reportId }, data: { status, resolvedById: adminId, resolvedAt: new Date() } });
  if (removeProduct) await adminSetProductStatus(adminId, report.productId, "REMOVED", "הוסר בעקבות דיווח משתמשים");
  await notify({
    userId: report.reporterId,
    type: "REPORT_UPDATE",
    title: status === "ACTIONED" ? "תודה! הדיווח שלכם טופל" : "הדיווח שלכם נבדק",
  });
  await audit(adminId, "report.resolve", "Report", reportId, { status, removeProduct });
}

// ── Product requests ─────────────────────────────────────────────────

export async function adminListRequests(params: { status?: RequestStatus; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const where: Prisma.ProductRequestWhereInput = params.status ? { status: params.status } : {};
  const [total, items] = await Promise.all([
    db.productRequest.count({ where }),
    db.productRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: {
        user: { select: { name: true, email: true } },
        category: { select: { name: true } },
        _count: { select: { matches: true } },
      },
    }),
  ]);
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function adminSetRequestStatus(adminId: string, requestId: string, status: RequestStatus) {
  await db.productRequest.update({ where: { id: requestId }, data: { status } });
  await audit(adminId, "request.status", "ProductRequest", requestId, { status });
}
