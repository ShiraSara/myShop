import type { Region } from "@prisma/client";

export type MatchableRequest = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  keywords: string[];
  categoryId: string | null;
  maxBudget: number | null;
  city: string | null;
  region: Region | null;
  shippingOk: boolean;
};

export type MatchableProduct = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  categoryId: string;
  price: number;
  city: string;
  region: Region;
  shippingAvailable: boolean;
};

export type MatchResult = {
  score: number; // 0..1
  reasons: { matchedKeywords: string[]; rules: string[] };
};

/**
 * A matching engine scores how well a product satisfies a request.
 * Return null when the product is not a match at all.
 * Implementations: rules-v1 (keywords + filters). Future: embeddings / LLM.
 */
export interface MatchingEngine {
  readonly name: string;
  score(request: MatchableRequest, product: MatchableProduct): MatchResult | null | Promise<MatchResult | null>;
}
