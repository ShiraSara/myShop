"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, CircleCheck, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ProductStatus } from "@prisma/client";
import { deleteProductAction, setProductStatusAction } from "@/actions/products";
import { Button, ButtonLink } from "@/components/ui/button";

/** Seller controls: edit, mark sold, archive / republish, delete. */
export function OwnerActions({ productId, status, compact, afterDelete = "/dashboard/products" }: { productId: string; status: ProductStatus; compact?: boolean; afterDelete?: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        if (result.message) toast.success(result.message);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  function onDelete() {
    if (!window.confirm("למחוק את המוצר לצמיתות? לא ניתן לבטל פעולה זו.")) return;
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (result.ok) {
        toast.success(result.message);
        router.push(afterDelete);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  if (status === "REMOVED") {
    return <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">המודעה הוסרה על ידי הנהלת האתר.</p>;
  }

  const size = compact ? "sm" : "md";
  return (
    <div className={compact ? "flex flex-wrap gap-1.5" : "grid grid-cols-2 gap-2"}>
      <ButtonLink href={`/dashboard/products/${productId}/edit`} variant="outline" size={size}>
        <Pencil />עריכה
      </ButtonLink>
      {status === "ACTIVE" && (
        <Button variant="outline" size={size} disabled={pending} onClick={() => run(() => setProductStatusAction(productId, "SOLD"))}>
          <CircleCheck />סימון כנמכר
        </Button>
      )}
      {(status === "SOLD" || status === "ARCHIVED" || status === "DRAFT") && (
        <Button variant="outline" size={size} disabled={pending} onClick={() => run(() => setProductStatusAction(productId, "ACTIVE"))}>
          <RotateCcw />{status === "DRAFT" ? "פרסום" : "פרסום מחדש"}
        </Button>
      )}
      {status === "ACTIVE" && (
        <Button variant="ghost" size={size} disabled={pending} onClick={() => run(() => setProductStatusAction(productId, "ARCHIVED"))}>
          <Archive />העברה לארכיון
        </Button>
      )}
      <Button variant="danger-outline" size={size} disabled={pending} onClick={onDelete}>
        <Trash2 />מחיקה
      </Button>
    </div>
  );
}
