import { NextResponse } from "next/server";
import { MAX_IMAGE_BYTES } from "@/lib/constants";
import { getCurrentUser } from "@/server/auth/session";
import { assertSameOrigin, jsonError } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { processAndStoreImage } from "@/server/services/images";

export const runtime = "nodejs";

/** Upload a single product image (multipart/form-data, field "file"). */
export async function POST(request: Request) {
  try {
    if (!assertSameOrigin(request)) return NextResponse.json({ error: "בקשה לא מורשית" }, { status: 403 });
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "יש להתחבר כדי להעלות תמונות" }, { status: 401 });

    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > MAX_IMAGE_BYTES + 64 * 1024) return NextResponse.json({ error: "הקובץ גדול מדי (עד 8MB)" }, { status: 413 });

    await rateLimit(`upload:${user.id}`, 80, 60 * 60);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "לא נבחר קובץ" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const image = await processAndStoreImage(user.id, { buffer, type: file.type, size: file.size });
    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
