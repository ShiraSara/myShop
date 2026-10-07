export interface StorageDriver {
  /** Stores a file and returns its public URL. */
  put(key: string, body: Buffer, contentType: string): Promise<{ url: string }>;
  delete(key: string): Promise<void>;
}
