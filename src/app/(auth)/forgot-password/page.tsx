import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export const metadata: Metadata = { title: "שחזור סיסמה", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-center text-2xl font-bold">שכחתם סיסמה?</h1>
      <p className="mb-6 mt-1.5 text-center text-muted-foreground">הזינו את כתובת האימייל ונשלח קישור לאיפוס</p>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        נזכרתם? <Link href="/login" className="font-medium text-primary hover:underline">חזרה להתחברות</Link>
      </p>
    </>
  );
}
