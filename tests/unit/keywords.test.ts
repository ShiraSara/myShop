import { describe, expect, it } from "vitest";
import { extractBudget, extractKeywords, tokensMatch } from "@/lib/keywords";
import { rulesEngine } from "@/server/matching/rules-engine";
import type { MatchableProduct, MatchableRequest } from "@/server/matching/types";

describe("keywords", () => {
  it("extracts meaningful Hebrew keywords", () => {
    expect(extractKeywords("מחפש אופניים לילד בן 10 עד 500 ש״ח באזור המרכז")).toEqual(["אופניים", "לילד"]);
  });
  it("matches prefixes and plurals", () => {
    expect(tokensMatch("אופניים", "אופני")).toBe(true);
    expect(tokensMatch("לילד", "ילדים")).toBe(true);
    expect(tokensMatch("ספה", "הספה")).toBe(true);
    expect(tokensMatch("ספה", "מחשב")).toBe(false);
  });
  it("parses budgets", () => {
    expect(extractBudget("עד 1,500 ש״ח")).toBe(1500);
    expect(extractBudget("בלי תקציב")).toBeNull();
  });
});

describe("rules matching engine", () => {
  const request: MatchableRequest = {
    id: "r", userId: "buyer", title: "אופניים לילדים עד 500 ₪", description: null, keywords: [], categoryId: null,
    maxBudget: 500, city: null, region: null, shippingOk: false,
  };
  const product: MatchableProduct = {
    id: "p", sellerId: "seller", title: "אופני ילדים", description: "במצב טוב", categoryId: "bikes", price: 450,
    city: "רעננה", region: "SHARON", shippingAvailable: false,
  };
  it("matches the spec example", () => {
    const r = rulesEngine.score(request, product);
    expect(r).not.toBeNull();
    expect((r as { score: number }).score).toBeGreaterThan(0.6);
  });
  it("rejects over budget and unrelated products", () => {
    expect(rulesEngine.score(request, { ...product, price: 800 })).toBeNull();
    expect(rulesEngine.score(request, { ...product, title: "מקרר", description: "מקרר גדול" })).toBeNull();
  });
  it("uses shipping to bridge regions", () => {
    const far = { ...request, region: "SOUTH" as const };
    expect(rulesEngine.score(far, product)).toBeNull();
    expect(rulesEngine.score({ ...far, shippingOk: true }, { ...product, shippingAvailable: true })).not.toBeNull();
  });
});
