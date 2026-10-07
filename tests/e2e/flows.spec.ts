import { expect, test } from "@playwright/test";
import { login, PNG_1PX, register } from "./helpers";

const stamp = Date.now();

test.describe.serial("seller → buyer flow", () => {
  let productUrl = "";
  let conversationUrl = "";

  test("a new user registers and publishes a product with the wizard", async ({ page }) => {
    await register(page, "מוכר בדיקה", `seller-${stamp}@e2e.local`);
    await page.goto("/dashboard/products/new");

    // Step 1 — validation errors, then details
    await page.getByRole("button", { name: "המשך" }).click();
    await expect(page.getByText("שם המוצר חייב להכיל לפחות 3 תווים")).toBeVisible();
    await page.fill("#title", `E2E Test Lamp ${stamp}`);
    await page.selectOption("#categoryId", { label: "עיצוב הבית" });
    await page.fill("#price", "199");
    await page.getByText("כמו חדש", { exact: true }).click();
    await page.getByRole("button", { name: "המשך" }).click();

    // Step 2 — image upload
    await page.setInputFiles('input[type="file"]', { name: "lamp.png", mimeType: "image/png", buffer: PNG_1PX });
    await expect(page.getByText("ראשית", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "קביעה כתמונה ראשית" })).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "המשך" }).click();

    // Step 3 — location
    await page.selectOption("#city", "חיפה");
    await page.getByText("אפשרות למשלוח").click();
    await page.fill("#shippingPrice", "25");
    await page.getByRole("button", { name: "המשך" }).click();

    // Step 4 — description
    await page.fill("#description", "מנורה יפה במצב כמו חדש, נמכרת עקב מעבר דירה.");
    await page.getByRole("button", { name: "המשך" }).click();

    // Step 5 — preview & publish
    await expect(page.getByText("כך המוצר ייראה באתר")).toBeVisible();
    await page.getByRole("button", { name: "פרסם מוצר" }).click();
    await expect(page).toHaveURL(/\/products\/e2e-test-lamp-/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`E2E Test Lamp ${stamp}`);
    await expect(page.getByRole("button", { name: "סימון כנמכר" })).toBeVisible();
    productUrl = page.url();
  });

  test("a buyer favorites the product and messages the seller", async ({ page }) => {
    await register(page, "קונה בדיקה", `buyer-${stamp}@e2e.local`);
    await page.goto(productUrl);
    await page.locator("button", { hasText: "שמירה למועדפים" }).click();
    await expect(page.locator("button", { hasText: "נשמר במועדפים" })).toBeVisible();
    await page.goto("/dashboard/favorites");
    await expect(page.getByText(`E2E Test Lamp ${stamp}`)).toBeVisible();

    await page.goto(productUrl);
    await page.getByRole("button", { name: "שליחת הודעה למוכר" }).click();
    await page.fill("#contact-body", "היי, המנורה עדיין זמינה?");
    await page.getByRole("button", { name: "שליחה", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\/messages\/.+/);
    await expect(page.getByLabel("הודעות", { exact: true }).getByText("היי, המנורה עדיין זמינה?")).toBeVisible();
    conversationUrl = page.url();
  });

  test("the seller sees the message and replies", async ({ page }) => {
    await login(page, `seller-${stamp}@e2e.local`);
    await page.goto("/dashboard/messages");
    await page.getByText("קונה בדיקה").first().click();
    await expect(page.getByLabel("הודעות", { exact: true }).getByText("היי, המנורה עדיין זמינה?")).toBeVisible();
    await page.fill("#chat-input", "כן! זמינה 🙂");
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("הודעות", { exact: true }).getByText("כן! זמינה 🙂")).toBeVisible();
  });

  test("a third user cannot open the conversation", async ({ page, request }) => {
    await login(page, "noa@example.com");
    const res = await page.goto(conversationUrl);
    expect(res?.status()).toBe(404);
    const api = await page.request.get(conversationUrl.replace("/dashboard/messages/", "/api/conversations/") + "/messages");
    expect(api.status()).toBe(404);
    const anon = await request.get(conversationUrl.replace("/dashboard/messages/", "/api/conversations/") + "/messages");
    expect(anon.status()).toBe(401);
  });

  test("the seller marks the product as sold and it leaves search results", async ({ page }) => {
    await login(page, `seller-${stamp}@e2e.local`);
    await page.goto(productUrl);
    await page.getByRole("button", { name: "סימון כנמכר" }).click();
    await expect(page.getByText("המוצר הזה כבר נמכר.")).toBeVisible();
    await page.goto(`/search?q=${encodeURIComponent(`Lamp ${stamp}`)}`);
    await expect(page.getByText("לא מצאנו מוצרים מתאימים")).toBeVisible();
  });

  test("uploads from another origin are rejected (CSRF)", async ({ request }) => {
    const res = await request.post("/api/uploads", { headers: { Origin: "https://evil.example" }, multipart: { file: { name: "x.png", mimeType: "image/png", buffer: PNG_1PX } } });
    expect(res.status()).toBe(403);
  });
});

test("a regular user is forbidden from the admin area; admin can access it", async ({ page }) => {
  await login(page, "dana@example.com");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/forbidden/);
  await page.context().clearCookies();
  await login(page, "admin@shuk.local");
  await page.goto("/admin/reports");
  await expect(page.getByRole("heading", { name: "דיווחים" })).toBeVisible();
});

test("a logged-in user publishes a product request", async ({ page }) => {
  await login(page, "omer@example.com");
  await page.goto("/request-product");
  const title = `מחפש מנורת עמידה לסלון ${Date.now()}`;
  await page.fill("#title", title);
  await page.fill("#maxBudget", "400");
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(/\/dashboard\/requests\?created=1/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText(/מוצרים מתאימים/).first()).toBeVisible();
});
