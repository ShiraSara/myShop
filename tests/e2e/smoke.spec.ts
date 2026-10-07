import { expect, test } from "@playwright/test";

test("home page renders hero, categories and products in RTL", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("מצאו את מה שחיפשתם.");
  await expect(page.getByRole("heading", { name: "מוצרים חדשים" })).toBeVisible();
  expect(await page.locator("article").count()).toBeGreaterThan(3);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("search with filters and open a product", async ({ page }) => {
  await page.goto("/search?q=אופניים");
  await expect(page.getByRole("heading", { name: /תוצאות עבור/ })).toBeVisible();
  const first = page.locator("article h3 a").first();
  const title = await first.textContent();
  await first.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title!.trim());
});

test("private areas require login; admin requires admin role", async ({ page }) => {
  await page.goto("/dashboard/messages");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fmessages/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

test("unknown pages show a friendly 404", async ({ page }) => {
  const res = await page.goto("/products/does-not-exist-123");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "הדף לא נמצא" })).toBeVisible();
});

test("SEO endpoints", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Sitemap:");
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain("/products/");
});
