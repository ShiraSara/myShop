import { readLocalFile } from "@/server/storage/local";

export const runtime = "nodejs";

/** Serves files for STORAGE_DRIVER=local. In production with S3 this route is unused. */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const path = key.join("/");
  if (!/^[a-zA-Z0-9/_.-]+\.webp$/.test(path) || path.includes("..")) return new Response("Not found", { status: 404 });
  try {
    const file = await readLocalFile(path);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
