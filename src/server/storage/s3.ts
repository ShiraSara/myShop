import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { StorageDriver } from "./types";

/**
 * S3-compatible driver: AWS S3, Cloudflare R2, Supabase Storage (S3 endpoint),
 * MinIO, DigitalOcean Spaces, Backblaze B2...
 */
export function createS3Driver(): StorageDriver {
  const bucket = required("STORAGE_BUCKET");
  const publicUrl = required("STORAGE_PUBLIC_URL").replace(/\/$/, "");
  const client = new S3Client({
    region: process.env.STORAGE_REGION || "auto",
    endpoint: process.env.STORAGE_ENDPOINT || undefined,
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: required("STORAGE_ACCESS_KEY_ID"),
      secretAccessKey: required("STORAGE_SECRET_ACCESS_KEY"),
    },
  });

  return {
    async put(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      return { url: `${publicUrl}/${key}` };
    },
    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name} (required for STORAGE_DRIVER=s3)`);
  return value;
}
