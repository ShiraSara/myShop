import type { Metadata } from "next";
import { ShieldX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "אין הרשאה", robots: { index: false } };

export default function ForbiddenPage() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <span className="mb-5 flex size-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-600">
        <ShieldX className="size-10" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-amber-700">403</p>
      <h1 className="mt-1 text-3xl font-bold">אין לך הרשאה לדף הזה</h1>
      <p className="mt-2 max-w-md text-muted-foreground">הדף זמין רק למשתמשים עם הרשאות מתאימות.</p>
      <ButtonLink href="/" className="mt-8">לדף הבית</ButtonLink>
    </div>
  );
}
