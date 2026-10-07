import { describe, expect, it } from "vitest";
import { createProduct } from "@/server/services/products";
import { favoriteIdsFor, listFavorites, toggleFavorite } from "@/server/services/favorites";
import { createCategory, createUser, productInput } from "../helpers/factories";

describe("Favorites", () => {
  it("toggles a favorite on and off", async () => {
    const seller = await createUser();
    const buyer = await createUser();
    const cat = await createCategory();
    const product = await createProduct(seller.id, await productInput(seller.id, cat.id));

    expect(await toggleFavorite(buyer.id, product.id)).toEqual({ favorited: true });
    expect((await listFavorites(buyer.id)).map((p) => p.id)).toEqual([product.id]);
    expect((await favoriteIdsFor(buyer.id, [product.id])).has(product.id)).toBe(true);

    expect(await toggleFavorite(buyer.id, product.id)).toEqual({ favorited: false });
    expect(await listFavorites(buyer.id)).toHaveLength(0);
  });

  it("does not allow favoriting your own product or unavailable products", async () => {
    const seller = await createUser();
    const buyer = await createUser();
    const cat = await createCategory();
    const product = await createProduct(seller.id, await productInput(seller.id, cat.id));
    await expect(toggleFavorite(seller.id, product.id)).rejects.toThrow();
    const draft = await createProduct(seller.id, await productInput(seller.id, cat.id, { status: "DRAFT" }));
    await expect(toggleFavorite(buyer.id, draft.id)).rejects.toThrow(/לא נמצא/);
    await expect(toggleFavorite(buyer.id, "does-not-exist")).rejects.toThrow(/לא נמצא/);
  });

  it("returns an empty set for anonymous users", async () => {
    expect((await favoriteIdsFor(null, ["x"])).size).toBe(0);
  });
});
