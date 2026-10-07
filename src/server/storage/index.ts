import "server-only";
import { localDriver } from "./local";
import { createS3Driver } from "./s3";
import type { StorageDriver } from "./types";

let driver: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (driver) return driver;
  driver = process.env.STORAGE_DRIVER === "s3" ? createS3Driver() : localDriver;
  return driver;
}

/** Test helper */
export function setStorage(custom: StorageDriver | null) {
  driver = custom;
}
