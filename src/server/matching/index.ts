import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "../db";
import { notify } from "../services/notifications";
import { rulesEngine } from "./rules-engine";
import type { MatchableProduct, MatchableRequest, MatchingEngine } from "./types";

/** Active engine. Replace with an AI-backed engine implementing the same interface. */
let engine: MatchingEngine = rulesEngine;
export function setMatchingEngine(e: MatchingEngine) {
  engine = e;
}

const productSelect = {
  id: true,
  sellerId: true,
  title: true,
  description: true,
  categoryId: true,
  price: true,
  city: true,
  region: true,
  shippingAvailable: true,
} satisfies Prisma.ProductSelect;

const requestSelect = {
  id: true,
  userId: true,
  title: true,
  description: true,
  keywords: true,
  categoryId: true,
  maxBudget: true,
  city: true,
  region: true,
  shippingOk: true,
} satisfies Prisma.ProductRequestSelect;

async function saveMatch(request: MatchableRequest, product: MatchableProduct, notifyUser: boolean) {
  const result = await engine.score(request, product);
  if (!result) return null;
  const existing = await db.requestMatch.findUnique({
    where: { requestId_productId: { requestId: request.id, productId: product.id } },
  });
  const match = await db.requestMatch.upsert({
    where: { requestId_productId: { requestId: request.id, productId: product.id } },
    create: { requestId: request.id, productId: product.id, score: result.score, reasons: result.reasons, engine: engine.name },
    update: { score: result.score, reasons: result.reasons, engine: engine.name },
  });
  if (!existing && notifyUser) {
    await notify({
      userId: request.userId,
      type: "REQUEST_MATCH",
      title: `נמצא מוצר שמתאים לבקשה "${request.title}"`,
      body: product.title,
      link: `/dashboard/requests`,
    });
  }
  return match;
}

/** Called after a product is published / updated: matches it against open requests. */
export async function matchProductToRequests(productId: string) {
  const product = await db.product.findUnique({ where: { id: productId }, select: { ...productSelect, status: true } });
  if (!product || product.status !== "ACTIVE") return [];
  const candidates = await db.productRequest.findMany({
    where: {
      status: "OPEN",
      userId: { not: product.sellerId },
      OR: [{ categoryId: null }, { categoryId: product.categoryId }],
      AND: [{ OR: [{ maxBudget: null }, { maxBudget: { gte: Math.floor(product.price / 1.1) } }] }],
    },
    select: requestSelect,
    take: 500,
    orderBy: { createdAt: "desc" },
  });
  const matches = [];
  for (const req of candidates) {
    const m = await saveMatch(req, product, true);
    if (m) matches.push(m);
  }
  return matches;
}

/** Called after a request is created: finds existing products that satisfy it. */
export async function matchRequestToProducts(requestId: string, { notifyUser = false } = {}) {
  const request = await db.productRequest.findUnique({ where: { id: requestId }, select: requestSelect });
  if (!request) return [];
  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    sellerId: { not: request.userId },
    ...(request.categoryId ? { categoryId: request.categoryId } : {}),
    ...(request.maxBudget !== null ? { price: { lte: Math.ceil(request.maxBudget * 1.1) } } : {}),
  };
  const candidates = await db.product.findMany({ where, select: productSelect, take: 500, orderBy: { publishedAt: "desc" } });
  const matches = [];
  for (const product of candidates) {
    const m = await saveMatch(request, product, notifyUser);
    if (m) matches.push(m);
  }
  return matches;
}
