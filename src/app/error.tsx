"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <span className="mb-5 flex size-20 items-center justify-center rounded-3xl bg-red-50 text-danger">
        <TriangleAlert className="size-10" aria-hidden />
      </span>
      <h1 className="text-3xl font-bold">משהו השתבש. נסו שוב.</h1>
      <p className="mt-2 max-w-md text-muted-foreground">אירעה שגיאה בלתי צפויה. אם הבעיה חוזרת, נסו שוב בעוד מספר דקות.</p>
      {error.digest && <p className="mt-2 text-xs text-muted-foreground" dir="ltr">ref: {error.digest}</p>}
      <div className="mt-8 flex gap-2">
        <Button onClick={reset}>ניסיון נוסף</Button>
        <ButtonLink href="/" variant="outline">לדף הבית</ButtonLink>
      </div>
    </div>
  );
}
