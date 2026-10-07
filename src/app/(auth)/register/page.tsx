import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getSettings } from "@/server/services/settings";
import { RegisterForm } from "@/components/forms/register-form";
import { Alert } from "@/components/ui/alert";
import { safeRedirectPath } from "@/actions/_utils";

export const metadata: Metadata = { title: "הרשמה", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next ? safeRedirectPath(next) : undefined;
  if (await getCurrentUser()) redirect(safeNext ?? "/dashboard");
  const settings = await getSettings();
  return (
    <>
      <h1 className="text-center text-2xl font-bold">יצירת חשבון</h1>
      <p className="mb-6 mt-1.5 text-center text-muted-foreground">הרשמה חינמית — ומתחילים לקנות ולמכור</p>
      {settings.allowRegistration ? <RegisterForm next={safeNext} /> : <Alert tone="info">ההרשמה לאתר סגורה כרגע. נסו שוב מאוחר יותר.</Alert>}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        כבר יש לכם חשבון?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">התחברות</Link>
      </p>
    </>
  );
}
