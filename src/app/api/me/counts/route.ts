import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { getHeaderCounts } from "@/server/services/users";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ unreadMessages: 0, unreadNotifications: 0 }, { status: 401 });
  return NextResponse.json(await getHeaderCounts(user.id), { headers: { "Cache-Control": "no-store" } });
}
