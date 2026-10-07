import type { Metadata } from "next";
import { isResetTokenValid } from "@/server/services/auth";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "איפוס סיסמה", robots: { index: false } };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = token.length >= 20 && token.length <= 200 && (await isResetTokenValid(token));
  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-bold">בחירת סיסמה חדשה</h1>
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-4">
          <Alert tone="error">הקישור לאיפוס הסיסמה אינו תקף או שפג תוקפו.</Alert>
          <ButtonLink href="/forgot-password" className="w-full">שליחת קישור חדש</ButtonLink>
        </div>
      )}
    </>
  );
}
