import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <span className="mb-5 flex size-20 items-center justify-center rounded-3xl bg-primary-50 text-primary-600">
        <SearchX className="size-10" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-1 text-3xl font-bold">הדף לא נמצא</h1>
      <p className="mt-2 max-w-md text-muted-foreground">ייתכן שהמודעה נמחקה, נמכרה או שהקישור שגוי.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <ButtonLink href="/">לדף הבית</ButtonLink>
        <ButtonLink href="/search" variant="outline">חיפוש מוצרים</ButtonLink>
      </div>
    </div>
  );
}
