import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createProduct } from "@/server/services/products";
import { createProductRequest, deleteProductRequest, listUserRequests, setRequestStatus } from "@/server/services/requests";
import { productRequestSchema } from "@/lib/validation/misc";
import { createCategory, createUser, productInput } from "../helpers/factories";

const requestInput = (overrides: Record<string, unknown> = {}) =>
  productRequestSchema.parse({ title: "מחפש אופניים לילד בן 10 עד 500 ש״ח", region: "SHARON", shippingOk: "on", ...overrides });

describe("Product requests & matching", () => {
  it("creates a request with keywords and a budget parsed from the text", async () => {
    const user = await createUser();
    const request = await createProductRequest(user.id, requestInput());
    expect(request.maxBudget).toBe(500);
    expect(request.keywords).toEqual(expect.arrayContaining(["אופניים", "לילד"]));
    expect(request.keywords).not.toContain("מחפש");
    expect(request.status).toBe("OPEN");
  });

  it("matches an existing product when the request is created", async () => {
    const seller = await createUser();
    const buyer = await createUser();
    const bikes = await createCategory("bikes");
    await createProduct(seller.id, await productInput(seller.id, bikes.id, { title: "אופני ילדים 20 אינץ׳", price: 450, city: "רעננה" }));
    await createProduct(seller.id, await productInput(seller.id, bikes.id, { title: "אופני הרים למבוגרים", price: 2600, city: "רעננה" }));
    await createProduct(seller.id, await productInput(seller.id, bikes.id, { title: "שולחן כתיבה לבן", price: 200, description: "שולחן עבודה לבן במצב מצוין" }));

    await createProductRequest(buyer.id, requestInput());
    const [req] = await listUserRequests(buyer.id);
    expect(req.matches.map((m) => m.product.title)).toEqual(["אופני ילדים 20 אינץ׳"]);
    expect(req.matches[0].score).toBeGreaterThan(0.5);
  });

  it("matches new products against open requests and notifies the requester", async () => {
    const seller = await createUser();
    const buyer = await createUser();
    const bikes = await createCategory("bikes");
    await createProductRequest(buyer.id, requestInput({ categoryId: bikes.id }));
    await createProduct(seller.id, await productInput(seller.id, bikes.id, { title: "אופני ילדים כחולים", price: 450, city: "כפר סבא" }));

    expect(await db.requestMatch.count()).toBe(1);
    const n = await db.notification.findFirst({ where: { userId: buyer.id, type: "REQUEST_MATCH" } });
    expect(n?.link).toBe("/dashboard/requests");
  });

  it("does not match over budget, wrong category, far away without shipping, or own products", async () => {
    const seller = await createUser();
    const buyer = await createUser();
    const bikes = await createCategory("bikes");
    const toys = await createCategory("toys");
    await createProductRequest(buyer.id, requestInput({ categoryId: bikes.id, shippingOk: undefined }));
    await createProduct(seller.id, await productInput(seller.id, bikes.id, { title: "אופני ילדים יקרים", price: 900 }));
    await createProduct(seller.id, await productInput(seller.id, toys.id, { title: "אופני ילדים צעצוע", price: 100 }));
    await createProduct(seller.id, await productInput(seller.id, bikes.id, { title: "אופני ילדים באילת", price: 300, city: "אילת" }));
    await createProduct(buyer.id, await productInput(buyer.id, bikes.id, { title: "אופני ילדים שלי", price: 300 }));
    expect(await db.requestMatch.count()).toBe(0);
  });

  it("lets owners close, reopen and delete their requests only", async () => {
    const owner = await createUser();
    const other = await createUser();
    const request = await createProductRequest(owner.id, requestInput());
    await expect(setRequestStatus(other.id, request.id, "CLOSED")).rejects.toThrow();
    await setRequestStatus(owner.id, request.id, "FULFILLED");
    expect((await db.productRequest.findUniqueOrThrow({ where: { id: request.id } })).status).toBe("FULFILLED");
    await expect(deleteProductRequest(other.id, request.id)).rejects.toThrow();
    await deleteProductRequest(owner.id, request.id);
    expect(await db.productRequest.count()).toBe(0);
  });

  it("validates request input", () => {
    const bad = productRequestSchema.safeParse({ title: "a", maxBudget: "-3", city: "לונדון", region: "MARS" });
    expect(bad.success).toBe(false);
    expect(Object.keys(bad.error!.flatten().fieldErrors)).toEqual(expect.arrayContaining(["title", "maxBudget", "city", "region"]));
  });
});
