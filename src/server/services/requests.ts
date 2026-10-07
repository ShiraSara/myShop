import "server-only";
import type { Region, RequestStatus } from "@prisma/client";
import { extractBudget, extractKeywords } from "@/lib/keywords";
import { regionForCity } from "@/lib/locations";
import type { ProductRequestInput } from "@/lib/validation/misc";
import { db } from "../db";
import { NotFoundError, ValidationError } from "../errors";
import { matchRequestToProducts } from "../matching";
import { productCardSelect } from "./product-queries";

const MAX_OPEN_REQUESTS = 20;

export async function createProductRequest(userId: string, input: ProductRequestInput) {
  const open = await db.productRequest.count({ where: { userId, status: "OPEN" } });
  if (open >= MAX_OPEN_REQUESTS) throw new ValidationError("הגעתם למספר המקסימלי של בקשות פתוחות");
  if (input.categoryId) {
    const category = await db.category.findUnique({ where: { id: input.categoryId } });
    if (!category?.isActive) throw new ValidationError("הקטגוריה שנבחרה אינה קיימת");
  }
  const fullText = `${input.title} ${input.description ?? ""}`;
  const request = await db.productRequest.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      details: input.details,
      categoryId: input.categoryId,
      maxBudget: input.maxBudget ?? extractBudget(fullText),
      city: input.city,
      region: (input.region as Region | null) ?? (input.city ? regionForCity(input.city) : null),
      shippingOk: input.shippingOk,
      keywords: extractKeywords(fullText),
    },
  });
  try {
    await matchRequestToProducts(request.id);
  } catch (e) {
    console.error("[matching] failed for request", request.id, e);
  }
  return request;
}

export async function listUserRequests(userId: string) {
  return db.productRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      matches: {
        where: { dismissed: false, product: { status: "ACTIVE" } },
        orderBy: { score: "desc" },
        take: 8,
        include: { product: { select: productCardSelect } },
      },
      _count: { select: { matches: { where: { dismissed: false, product: { status: "ACTIVE" } } } } },
    },
  });
}

async function ownedRequest(userId: string, requestId: string) {
  const request = await db.productRequest.findUnique({ where: { id: requestId } });
  if (!request || request.userId !== userId) throw new NotFoundError("הבקשה לא נמצאה");
  return request;
}

export async function setRequestStatus(userId: string, requestId: string, status: RequestStatus) {
  await ownedRequest(userId, requestId);
  const updated = await db.productRequest.update({ where: { id: requestId }, data: { status } });
  if (status === "OPEN") await matchRequestToProducts(requestId).catch(() => undefined);
  return updated;
}

export async function deleteProductRequest(userId: string, requestId: string) {
  await ownedRequest(userId, requestId);
  await db.productRequest.delete({ where: { id: requestId } });
}

export async function dismissMatch(userId: string, matchId: string) {
  const match = await db.requestMatch.findUnique({ where: { id: matchId }, include: { request: true } });
  if (!match || match.request.userId !== userId) throw new NotFoundError();
  await db.requestMatch.update({ where: { id: matchId }, data: { dismissed: true } });
}

/** Recent open requests (public teaser on the request page). */
export async function listRecentOpenRequests(take = 6) {
  return db.productRequest.findMany({
    where: { status: "OPEN", user: { status: "ACTIVE" } },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, title: true, maxBudget: true, city: true, region: true, createdAt: true, category: { select: { name: true } } },
  });
}
