import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { db } from "@/server/db";
import { getStorage, setStorage } from "@/server/storage";
import { localDriver } from "@/server/storage/local";
import { createUser } from "../helpers/factories";

// The route reads the signed-in user from cookies; stub only that lookup.
let currentUser: { id: string } | null = null;
vi.mock("@/server/auth/session", () => ({ getCurrentUser: async () => currentUser }));

const { POST } = await import("@/app/api/uploads/route");

async function pngRequest(origin = "http://localhost:3000") {
  const png = await sharp({ create: { width: 40, height: 30, channels: 3, background: "#0e7c66" } }).png().toBuffer();
  const form = new FormData();
  form.append("file", new File([new Uint8Array(png)], "photo.png", { type: "image/png" }));
  return new Request("http://localhost:3000/api/uploads", { method: "POST", headers: { origin, host: "localhost:3000" }, body: form });
}

describe("POST /api/uploads", () => {
  beforeEach(async () => {
    setStorage(null);
    currentUser = await createUser();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    setStorage(null);
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("stores the image and returns 201 with id + url (local driver in development)", async () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("STORAGE_DRIVER", "local");
    const res = await POST(await pngRequest());
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.url).toMatch(/^\/uploads\/products\/.+\.webp$/);
    expect(await db.productImage.count()).toBe(1);
    expect(getStorage()).toBe(localDriver);
  });

  it("on Vercel without STORAGE_DRIVER=s3: returns 503 STORAGE_NOT_CONFIGURED and never touches the local disk", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("STORAGE_DRIVER", "");
    const putSpy = vi.spyOn(localDriver, "put");
    const res = await POST(await pngRequest());
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe("STORAGE_NOT_CONFIGURED");
    expect(body.error).toMatch(/אחסון התמונות לא הוגדר/);
    expect(putSpy).not.toHaveBeenCalled();
    expect(await db.productImage.count()).toBe(0);
  });

  it("with STORAGE_DRIVER=s3 but missing variables: returns 503 STORAGE_NOT_CONFIGURED", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("STORAGE_DRIVER", "s3");
    vi.stubEnv("STORAGE_BUCKET", "");
    const res = await POST(await pngRequest());
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("STORAGE_NOT_CONFIGURED");
  });

  it("when the storage provider fails: returns 502 STORAGE_FAILED with a clear message and saves nothing", async () => {
    setStorage({
      put: async () => {
        throw new Error("connect ETIMEDOUT");
      },
      delete: async () => undefined,
    });
    const res = await POST(await pngRequest());
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body).toEqual({ error: "שמירת התמונה נכשלה. נסו שוב בעוד מספר רגעים.", code: "STORAGE_FAILED" });
    expect(await db.productImage.count()).toBe(0);
  });

  it("still rejects unauthenticated and cross-origin requests", async () => {
    currentUser = null;
    expect((await POST(await pngRequest())).status).toBe(401);
    expect((await POST(await pngRequest("https://evil.example"))).status).toBe(403);
  });
});
