import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createProduct } from "@/server/services/products";
import { searchProducts } from "@/server/services/search";
import { parseSearchParams } from "@/lib/validation/search";
import { createCategory, createUser, productInput } from "../helpers/factories";

describe("Search", () => {
  let sellerId: string;
  beforeEach(async () => {
    const seller = await createUser();
    sellerId = seller.id;
    const bikes = await createCategory("bikes", "אופניים");
    const furniture = await createCategory("furniture", "ריהוט");
    const add = async (o: Record<string, unknown>) => createProduct(seller.id, await productInput(seller.id, (o.cat as string) ?? bikes.id, o));
    await add({ title: "אופני ילדים 20 אינץ׳", price: 450, city: "רעננה", condition: "GOOD", shippingAvailable: true });
    await add({ title: "אופני הרים Trek", price: 2600, city: "חיפה", condition: "LIKE_NEW", shippingAvailable: false, description: "אופני שטח למבוגרים עם בולמים" });
    await add({ cat: furniture.id, title: "ספה תלת מושבית", price: 1200, city: "ירושלים", condition: "USED", shippingAvailable: false, description: "ספה אפורה נוחה במיוחד לסלון" });
    await add({ cat: furniture.id, title: "כיסא משרדי", price: 300, city: "רעננה", condition: "NEW", shippingAvailable: true, status: "DRAFT" });
  });

  it("finds products by Hebrew text with light normalisation", async () => {
    expect((await searchProducts({ q: "אופניים" })).items.map((p) => p.title).sort()).toEqual(["אופני הרים Trek", "אופני ילדים 20 אינץ׳"]);
    expect((await searchProducts({ q: "הספה" })).total).toBe(1);
    expect((await searchProducts({ q: "trek" })).total).toBe(1);
    expect((await searchProducts({ q: "אופני ילדים" })).total).toBe(1);
    expect((await searchProducts({ q: "מקרר" })).total).toBe(0);
  });

  it("filters by category, city, region, price, condition and shipping", async () => {
    expect((await searchProducts({ category: "furniture" })).total).toBe(1); // draft excluded
    expect((await searchProducts({ city: "רעננה" })).total).toBe(1);
    expect((await searchProducts({ region: "HAIFA" })).total).toBe(1);
    expect((await searchProducts({ minPrice: 400, maxPrice: 1500 })).total).toBe(2);
    expect((await searchProducts({ minPrice: 1500, maxPrice: 400 })).total).toBe(2); // swapped range tolerated
    expect((await searchProducts({ condition: ["LIKE_NEW", "USED"] })).total).toBe(2);
    expect((await searchProducts({ shipping: true })).total).toBe(1);
  });

  it("sorts and paginates", async () => {
    const asc = await searchProducts({ sort: "price_asc" });
    expect(asc.items.map((p) => p.price)).toEqual([450, 1200, 2600]);
    const desc = await searchProducts({ sort: "price_desc" });
    expect(desc.items.map((p) => p.price)).toEqual([2600, 1200, 450]);
    const page2 = await searchProducts({ sort: "price_asc", page: 2 }, 2);
    expect(page2.items.map((p) => p.price)).toEqual([2600]);
    expect(page2.pageCount).toBe(2);
  });

  it("hides products of blocked sellers", async () => {
    await db.user.update({ where: { id: sellerId }, data: { status: "BLOCKED" } });
    expect((await searchProducts({})).total).toBe(0);
  });

  it("parses untrusted URL params safely", () => {
    const f = parseSearchParams({ q: "  אופניים  ", minPrice: "abc", maxPrice: "500", condition: "NEW,HACK", sort: "drop table", page: "-4", category: "../etc", shipping: "1" });
    expect(f).toMatchObject({ q: "אופניים", minPrice: undefined, maxPrice: 500, condition: ["NEW"], sort: "newest", page: 1, category: undefined, shipping: true });
  });
});
