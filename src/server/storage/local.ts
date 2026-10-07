import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import type { StorageDriver } from "./types";

export function localRoot() {
  return path.resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR || "storage/uploads");
}

/** Resolves a key inside the storage root, refusing path traversal. */
export function resolveLocalPath(key: string) {
  const root = localRoot();
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new Error("Invalid storage key");
  return full;
}

export const localDriver: StorageDriver = {
  async put(key, body) {
    const full = resolveLocalPath(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
    return { url: `/uploads/${key}` };
  },
  async delete(key) {
    await rm(resolveLocalPath(key), { force: true });
  },
};

export async function readLocalFile(key: string) {
  return readFile(resolveLocalPath(key));
}
