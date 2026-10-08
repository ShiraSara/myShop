import "server-only";
import { StorageNotConfiguredError } from "../errors";
import { localDriver } from "./local";
import { createS3Driver } from "./s3";
import type { StorageDriver } from "./types";

let driver: StorageDriver | null = null;

/**
 * Serverless platforms (Vercel) have a read-only, ephemeral filesystem, so the
 * local driver can never work there. `VERCEL` is set by Vercel at build and runtime
 * for every environment (production, preview, development deployments).
 */
function isServerlessRuntime() {
  return !!process.env.VERCEL;
}

export function getStorage(): StorageDriver {
  if (driver) return driver;
  if (process.env.STORAGE_DRIVER === "s3") {
    try {
      driver = createS3Driver();
    } catch (error) {
      // Missing STORAGE_* variables — log which one (no values), show a clear message to users.
      console.error("[storage] S3 storage is misconfigured:", (error as Error).message);
      throw new StorageNotConfiguredError();
    }
    return driver;
  }
  if (isServerlessRuntime()) {
    console.error(
      "[storage] Image storage is not configured for this deployment: set STORAGE_DRIVER=s3 and the STORAGE_* variables " +
        "(the local filesystem is read-only on Vercel).",
    );
    throw new StorageNotConfiguredError();
  }
  driver = localDriver; // localhost / self-hosted server with a persistent disk
  return driver;
}

/** Test helper */
export function setStorage(custom: StorageDriver | null) {
  driver = custom;
}
