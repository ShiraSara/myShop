/**
 * Seeds the database with categories, demo users, products (with generated
 * images stored through the configured storage driver), conversations,
 * favorites, product requests + matches, reports and notifications.
 *
 * Run: npm run db:seed   (safe to re-run — it wipes demo data first)
 */
import { PrismaClient, type Region } from "@prisma/client";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Baby, Bike, Book, Camera, Dumbbell, Gamepad2, Guitar, Lamp, Laptop, Refrigerator, Shirt, Smartphone, Sofa, Wrench, type LucideIcon } from "lucide-react";
import { localDriver } from "../src/server/storage/local";
import { createS3Driver } from "../src/server/storage/s3";
import { regionForCity } from "../src/lib/locations";
import { extractKeywords } from "../src/lib/keywords";
import { rulesEngine } from "../src/server/matching/rules-engine";
import { CATEGORIES, CONVERSATIONS, PRODUCTS, REQUESTS, USERS } from "./seed-data";

const db = new PrismaClient();
const storage = process.env.STORAGE_DRIVER === "s3" ? createS3Driver() : localDriver;

const ICONS: Record<string, LucideIcon> = {
  electronics: Smartphone, computers: Laptop, furniture: Sofa, bikes: Bike, fashion: Shirt, kids: Baby,
  "home-appliances": Refrigerator, gaming: Gamepad2, sports: Dumbbell, "home-decor": Lamp, books: Book,
  music: Guitar, cameras: Camera, tools: Wrench,
};

// Soft, premium palettes per category: [from, to, ink]
const PALETTES: Record<string, [string, string, string]> = {
  electronics: ["#e0ecff", "#f5f0ff", "#3b4a8a"],
  computers: ["#e6eef2", "#f7f7f2", "#2f4858"],
  furniture: ["#f3e9df", "#fbf7f1", "#6b4f3a"],
  bikes: ["#dff3ea", "#f4fbf6", "#1f6b52"],
  fashion: ["#f8e4e6", "#fdf4f2", "#8a3b4c"],
  kids: ["#fff0d6", "#fff9ee", "#9a5b13"],
  "home-appliances": ["#e3f1f5", "#f6fbfc", "#245b6b"],
  gaming: ["#e9e3fb", "#f7f4ff", "#4b3a8f"],
  sports: ["#e2f4dc", "#f6fbf3", "#3b6b2a"],
  "home-decor": ["#f6ecd9", "#fcf8f0", "#7a5a22"],
  books: ["#efe6dc", "#faf6f1", "#5a4636"],
  music: ["#fbe3d7", "#fff6f1", "#8a4426"],
  cameras: ["#e5e7eb", "#f8f8f6", "#30343b"],
  tools: ["#fdecd3", "#fff8ef", "#8a5310"],
};

async function productImage(category: string, variant: number) {
  const [from, to, ink] = PALETTES[category] ?? ["#eee", "#fafafa", "#333"];
  const Icon = ICONS[category] ?? Smartphone;
  const angle = [135, 160, 110][variant % 3];
  const size = [500, 430, 560][variant % 3];
  const dx = [0, -70, 60][variant % 3];
  const iconSvg = renderToStaticMarkup(createElement(Icon, { size, color: ink, strokeWidth: 0.85 }));
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
    <defs>
      <linearGradient id="bg" gradientTransform="rotate(${angle} .5 .5)">
        <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
      </linearGradient>
      <radialGradient id="glow" cx=".5" cy=".45" r=".5">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="900" fill="url(#bg)"/>
    <circle cx="${980 - variant * 120}" cy="${140 + variant * 60}" r="210" fill="${ink}" opacity=".05"/>
    <circle cx="${180 + variant * 80}" cy="${760 - variant * 40}" r="160" fill="${ink}" opacity=".04"/>
    <ellipse cx="600" cy="420" rx="420" ry="330" fill="url(#glow)"/>
    <ellipse cx="${600 + dx}" cy="${430 + size / 2 + 8}" rx="${size * 0.42}" ry="22" fill="${ink}" opacity=".09"/>
    <g transform="translate(${600 + dx - size / 2} ${430 - size / 2})" opacity=".92">${iconSvg}</g>
  </svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
}

const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 3600 * 1000);

async function main() {
  console.log("🌱 Seeding database…");
  const password = process.env.SEED_USER_PASSWORD || "Password123!";
  const passwordHash = await bcrypt.hash(password, 10);

  // Clean demo data (order matters for FKs) and previously generated seed images
  const oldSeedImages = await db.productImage.findMany({ where: { storageKey: { startsWith: "seed/" } }, select: { storageKey: true } });
  await Promise.all(oldSeedImages.map((i) => storage.delete(i.storageKey).catch(() => undefined)));
  await db.$transaction([
    db.notification.deleteMany(),
    db.requestMatch.deleteMany(),
    db.productRequest.deleteMany(),
    db.report.deleteMany(),
    db.message.deleteMany(),
    db.conversation.deleteMany(),
    db.favorite.deleteMany(),
    db.productImage.deleteMany(),
    db.product.deleteMany(),
    db.category.deleteMany(),
    db.session.deleteMany(),
    db.auditLog.deleteMany(),
    db.user.deleteMany({ where: { email: { in: USERS.map((u) => u.email) } } }),
  ]);

  const categories = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) {
    const created = await db.category.create({ data: { ...c, sortOrder: i } });
    categories.set(c.slug, created.id);
  }
  console.log(`  ✓ ${categories.size} categories`);

  const users: string[] = [];
  for (const [i, u] of USERS.entries()) {
    const created = await db.user.create({
      data: {
        email: u.email,
        name: u.name,
        passwordHash,
        role: u.role ?? "USER",
        city: u.city,
        bio: "bio" in u ? (u.bio as string) : null,
        createdAt: daysAgo(400 - i * 37),
        lastSeenAt: daysAgo(i * 0.3),
      },
    });
    users.push(created.id);
  }
  console.log(`  ✓ ${users.length} users (password: ${password})`);

  const productIds = new Map<string, string>();
  let imageCount = 0;
  for (const p of PRODUCTS) {
    const region = regionForCity(p.city) as Region;
    const at = daysAgo(p.daysAgo);
    const status = p.status ?? "ACTIVE";
    const product = await db.product.create({
      data: {
        slug: `${p.slug}-${Math.random().toString(36).slice(2, 8)}`,
        title: p.title,
        description: p.description,
        price: p.price,
        condition: p.condition,
        status,
        categoryId: categories.get(p.category)!,
        sellerId: users[p.seller],
        city: p.city,
        region,
        shippingAvailable: !!p.shipping,
        shippingPrice: p.shipping?.price ?? null,
        shippingDetails: p.shipping?.details ?? null,
        isFeatured: !!p.featured,
        viewCount: Math.floor(20 + Math.random() * 400),
        createdAt: at,
        publishedAt: status === "DRAFT" ? null : at,
        soldAt: status === "SOLD" ? daysAgo(Math.max(0, p.daysAgo - 1)) : null,
      },
    });
    productIds.set(p.slug, product.id);
    for (let v = 0; v < (p.images ?? 1); v++) {
      const { data, info } = await productImage(p.category, v);
      const key = `seed/${p.slug}-${product.id}-${v}.webp`;
      const { url } = await storage.put(key, data, "image/webp");
      await db.productImage.create({
        data: {
          productId: product.id,
          uploaderId: users[p.seller],
          url,
          storageKey: key,
          width: info.width,
          height: info.height,
          size: info.size,
          mimeType: "image/webp",
          order: v,
          isPrimary: v === 0,
        },
      });
      imageCount++;
    }
  }
  console.log(`  ✓ ${productIds.size} products, ${imageCount} images`);

  // Conversations
  for (const c of CONVERSATIONS) {
    const product = PRODUCTS.find((p) => p.slug === c.product)!;
    const sellerId = users[product.seller];
    const buyerId = users[c.buyer];
    const start = daysAgo(Math.min(product.daysAgo, 0.5) * 0.9);
    const conversation = await db.conversation.create({
      data: { productId: productIds.get(c.product)!, buyerId, sellerId, createdAt: start, lastMessageAt: start },
    });
    let t = start.getTime();
    for (const [i, m] of c.messages.entries()) {
      t += 1000 * 60 * (5 + i * 7);
      const isLast = i === c.messages.length - 1;
      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: m.from === "buyer" ? buyerId : sellerId,
          body: m.text,
          createdAt: new Date(t),
          readAt: isLast ? null : new Date(t + 60000),
        },
      });
    }
    await db.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date(t) } });
    const last = c.messages[c.messages.length - 1];
    await db.notification.create({
      data: {
        userId: last.from === "buyer" ? sellerId : buyerId,
        type: "NEW_MESSAGE",
        title: `הודעה חדשה מ${USERS[last.from === "buyer" ? c.buyer : product.seller].name}`,
        body: product.title,
        link: `/dashboard/messages/${conversation.id}`,
      },
    });
  }
  console.log(`  ✓ ${CONVERSATIONS.length} conversations`);

  // Favorites
  const favPairs: [number, string][] = [
    [3, "iphone-14-pro-128"], [3, "kids-bike-20-inch"], [2, "ps5-disc-edition"], [2, "sony-a7iii"], [4, "macbook-air-m2"],
    [5, "floor-lamp-brass"], [6, "mountain-bike-trek"], [7, "grey-3-seat-sofa"], [7, "stroller-bugaboo-fox"], [1, "dji-mini-3"],
  ];
  for (const [u, slug] of favPairs) {
    await db.favorite.create({ data: { userId: users[u], productId: productIds.get(slug)! } });
  }
  console.log(`  ✓ ${favPairs.length} favorites`);

  // Product requests + matches (rule engine)
  const activeProducts = await db.product.findMany({ where: { status: "ACTIVE" } });
  let matchCount = 0;
  for (const [i, r] of REQUESTS.entries()) {
    const request = await db.productRequest.create({
      data: {
        userId: users[r.user],
        title: r.title,
        description: r.description,
        maxBudget: r.maxBudget,
        region: r.region,
        shippingOk: r.shippingOk,
        categoryId: r.category ? categories.get(r.category)! : null,
        keywords: extractKeywords(`${r.title} ${r.description ?? ""}`),
        createdAt: daysAgo(3 - i * 0.4),
      },
    });
    for (const p of activeProducts) {
      const result = rulesEngine.score(request, p);
      if (result && !(result instanceof Promise)) {
        await db.requestMatch.create({
          data: { requestId: request.id, productId: p.id, score: result.score, reasons: result.reasons, engine: rulesEngine.name },
        });
        matchCount++;
      }
    }
  }
  console.log(`  ✓ ${REQUESTS.length} product requests, ${matchCount} matches`);

  // Reports
  await db.report.create({
    data: { reporterId: users[2], productId: productIds.get("old-iphone-11-repair")!, reason: "WRONG_CATEGORY", details: "נראה כמו מכשיר לחלקים, אולי קטגוריה אחרת" },
  });
  await db.report.create({
    data: { reporterId: users[5], productId: productIds.get("sony-a7iii")!, reason: "FRAUD", details: "המחיר נראה נמוך מדי לדגם הזה" },
  });
  console.log("  ✓ 2 reports");

  await db.notification.create({
    data: { userId: users[3], type: "REQUEST_MATCH", title: 'נמצא מוצר שמתאים לבקשה "מחפשת אופניים לילד בן 10"', body: "אופני ילדים 20 אינץ׳", link: "/dashboard/requests" },
  });

  await db.siteSetting.upsert({
    where: { key: "site" },
    create: { key: "site", value: { announcement: null, maxImagesPerProduct: 10, allowRegistration: true, contactEmail: null } },
    update: {},
  });

  console.log("\n✅ Done. Sign in with:");
  console.log(`   admin@shuk.local / ${password}  (admin)`);
  console.log(`   dana@example.com / ${password}  (seller)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
