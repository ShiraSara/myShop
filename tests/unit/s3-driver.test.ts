import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the AWS SDK: capture the client config and every command sent. No network, no credentials.
const sent: { name: string; input: Record<string, unknown> }[] = [];
const clientConfigs: Record<string, unknown>[] = [];
let sendImpl: () => Promise<unknown> = async () => ({});

vi.mock("@aws-sdk/client-s3", () => {
  class PutObjectCommand {
    constructor(public input: Record<string, unknown>) {}
  }
  class DeleteObjectCommand {
    constructor(public input: Record<string, unknown>) {}
  }
  class S3Client {
    constructor(config: Record<string, unknown>) {
      clientConfigs.push(config);
    }
    async send(command: { input: Record<string, unknown> }) {
      sent.push({ name: command.constructor.name, input: command.input });
      return sendImpl();
    }
  }
  return { S3Client, PutObjectCommand, DeleteObjectCommand };
});

const { createS3Driver } = await import("@/server/storage/s3");

// Fake, non-secret values for an R2-style configuration
const R2_ENV = {
  STORAGE_BUCKET: "shuk-images",
  STORAGE_REGION: "auto",
  STORAGE_ENDPOINT: "https://example-account.r2.cloudflarestorage.com",
  STORAGE_ACCESS_KEY_ID: "test-access-key",
  STORAGE_SECRET_ACCESS_KEY: "test-secret-key",
  STORAGE_PUBLIC_URL: "https://pub-example.r2.dev/",
  STORAGE_FORCE_PATH_STYLE: "false",
};

describe("S3-compatible storage driver (mocked)", () => {
  beforeEach(() => {
    sent.length = 0;
    clientConfigs.length = 0;
    sendImpl = async () => ({});
    for (const [k, v] of Object.entries(R2_ENV)) vi.stubEnv(k, v);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("configures the client for Cloudflare R2", () => {
    createS3Driver();
    expect(clientConfigs[0]).toMatchObject({
      region: "auto",
      endpoint: "https://example-account.r2.cloudflarestorage.com",
      forcePathStyle: false,
      credentials: { accessKeyId: "test-access-key", secretAccessKey: "test-secret-key" },
    });
  });

  it("sends a PUT request with bucket, key, body and Content-Type, and returns the public URL", async () => {
    const driver = createS3Driver();
    const body = Buffer.from("fake-webp-bytes");
    const result = await driver.put("products/2026/10/user-123.webp", body, "image/webp");

    expect(sent).toHaveLength(1);
    expect(sent[0].name).toBe("PutObjectCommand");
    expect(sent[0].input).toEqual({
      Bucket: "shuk-images",
      Key: "products/2026/10/user-123.webp",
      Body: body,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    });
    // Trailing slash on STORAGE_PUBLIC_URL is normalised
    expect(result.url).toBe("https://pub-example.r2.dev/products/2026/10/user-123.webp");
  });

  it("deletes by bucket + key", async () => {
    await createS3Driver().delete("products/x.webp");
    expect(sent).toEqual([{ name: "DeleteObjectCommand", input: { Bucket: "shuk-images", Key: "products/x.webp" } }]);
  });

  it("propagates provider errors (e.g. access denied) to the caller", async () => {
    sendImpl = async () => {
      throw new Error("AccessDenied");
    };
    await expect(createS3Driver().put("k.webp", Buffer.from("x"), "image/webp")).rejects.toThrow("AccessDenied");
  });

  it("fails fast with the name of a missing variable (never its value)", () => {
    vi.stubEnv("STORAGE_BUCKET", "");
    expect(() => createS3Driver()).toThrow(/STORAGE_BUCKET/);
    vi.stubEnv("STORAGE_BUCKET", "shuk-images");
    vi.stubEnv("STORAGE_SECRET_ACCESS_KEY", "");
    expect(() => createS3Driver()).toThrow(/STORAGE_SECRET_ACCESS_KEY/);
    expect(() => createS3Driver()).not.toThrow(/test-access-key/);
  });

  it("supports path-style endpoints (Supabase Storage / MinIO)", () => {
    vi.stubEnv("STORAGE_FORCE_PATH_STYLE", "true");
    createS3Driver();
    expect(clientConfigs[0]).toMatchObject({ forcePathStyle: true });
  });
});
