import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { LoginForm } from "@/components/forms/login-form";
import { safeRedirectPath } from "@/actions/_utils";

export const metadata: Metadata = { title: "התחברות", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next ? safeRedirectPath(next) : undefined;
  if (await getCurrentUser()) redirect(safeNext ?? "/dashboard");
  return (
    <>
      <h1 className="text-center text-2xl font-bold">ברוכים השבים</h1>
      <p className="mb-6 mt-1.5 text-center text-muted-foreground">התחברו כדי לפרסם, לשמור ולשלוח הודעות</p>
      <LoginForm next={safeNext} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        אין לכם חשבון?{" "}
        <Link href={safeNext ? `/register?next=${encodeURIComponent(safeNext)}` : "/register"} className="font-medium text-primary hover:underline">הרשמה</Link>
      </p>
    </>
  );
}
