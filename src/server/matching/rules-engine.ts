import { extractKeywords, tokensMatch } from "@/lib/keywords";
import type { MatchingEngine, MatchResult } from "./types";

export const MIN_MATCH_SCORE = 0.45;
const BUDGET_TOLERANCE = 1.1; // allow up to 10% above budget, with a penalty

/** Rule-based engine: Category + Keywords + Price + Location + Shipping. */
export const rulesEngine: MatchingEngine = {
  name: "rules-v1",
  score(request, product): MatchResult | null {
    if (request.userId === product.sellerId) return null;
    const rules: string[] = [];

    // Category — hard filter when the request specifies one
    if (request.categoryId) {
      if (request.categoryId !== product.categoryId) return null;
      rules.push("category");
    }

    // Price
    let priceScore = 1;
    if (request.maxBudget !== null) {
      if (product.price > request.maxBudget * BUDGET_TOLERANCE) return null;
      if (product.price > request.maxBudget) {
        priceScore = 0.4;
        rules.push("price-slightly-above");
      } else rules.push("price");
    }

    // Location / shipping
    let locationScore = 1;
    const wantsLocation = request.city || request.region;
    if (wantsLocation) {
      const sameCity = request.city !== null && request.city === product.city;
      const sameRegion = request.region !== null ? request.region === product.region : sameCity;
      const shippingWorks = request.shippingOk && product.shippingAvailable;
      if (sameCity) rules.push("city");
      else if (sameRegion) {
        rules.push("region");
        locationScore = 0.8;
      } else if (shippingWorks) {
        rules.push("shipping");
        locationScore = 0.6;
      } else return null;
    } else if (request.shippingOk && product.shippingAvailable) rules.push("shipping");

    // Keywords
    const requestKeywords = request.keywords.length
      ? request.keywords
      : extractKeywords(`${request.title} ${request.description ?? ""}`);
    const productTokens = extractKeywords(`${product.title} ${product.description}`, 80);
    const titleTokens = extractKeywords(product.title, 20);
    const matched = requestKeywords.filter((k) => productTokens.some((p) => tokensMatch(k, p)));
    const inTitle = requestKeywords.filter((k) => titleTokens.some((p) => tokensMatch(k, p)));
    if (requestKeywords.length > 0 && matched.length === 0) return null;
    const keywordScore = requestKeywords.length
      ? (matched.length / requestKeywords.length) * 0.7 + (inTitle.length / requestKeywords.length) * 0.3
      : 0.5;

    const score =
      keywordScore * 0.55 + (request.categoryId ? 0.15 : 0.1) + priceScore * 0.15 + locationScore * 0.15;
    const rounded = Math.round(Math.min(1, score) * 100) / 100;
    if (rounded < MIN_MATCH_SCORE) return null;
    return { score: rounded, reasons: { matchedKeywords: matched, rules } };
  },
};
