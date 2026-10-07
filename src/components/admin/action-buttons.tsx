"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/validation/common";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import {
  adminDeleteCategoryAction,
  adminDeleteProductAction,
  adminResolveReportAction,
  adminSetProductStatusAction,
  adminSetRequestStatusAction,
  adminSetUserStatusAction,
  adminToggleFeaturedAction,
} from "@/actions/admin";
import { PRODUCT_STATUS_LABELS, REQUEST_STATUS_LABELS } from "@/lib/constants";

function useRun() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<ActionResult>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        if (r.message) toast.success(r.message);
        router.refresh();
      } else toast.error(r.error);
    });
  };
  return { pending, run };
}

function ActionButton({ label, variant = "outline", onClick, pending }: { label: string; variant?: ButtonVariant; onClick: () => void; pending: boolean }) {
  return (
    <Button size="sm" variant={variant} disabled={pending} onClick={onClick}>
      {label}
    </Button>
  );
}

export function UserStatusButton({ userId, status }: { userId: string; status: "ACTIVE" | "BLOCKED" }) {
  const { pending, run } = useRun();
  return status === "ACTIVE" ? (
    <ActionButton
      label="חסימה"
      variant="danger-outline"
      pending={pending}
      onClick={() => {
        const reason = window.prompt("סיבת החסימה (לא חובה):") ?? undefined;
        if (reason === undefined) return;
        run(() => adminSetUserStatusAction(userId, "BLOCKED", reason));
      }}
    />
  ) : (
    <ActionButton label="ביטול חסימה" pending={pending} onClick={() => run(() => adminSetUserStatusAction(userId, "ACTIVE"))} />
  );
}

export function ProductAdminControls({ productId, status, isFeatured }: { productId: string; status: string; isFeatured: boolean }) {
  const { pending, run } = useRun();
  return (
    <div className="flex items-center gap-1.5">
      <label className="sr-only" htmlFor={`status-${productId}`}>סטטוס</label>
      <Select
        id={`status-${productId}`}
        value={status}
        disabled={pending}
        className="h-9 min-w-28 text-xs"
        onChange={(e) => {
          const next = e.target.value;
          const reason = next === "REMOVED" ? window.prompt("סיבת ההסרה (תוצג למוכר):") ?? undefined : undefined;
          if (next === "REMOVED" && reason === undefined) return;
          run(() => adminSetProductStatusAction(productId, next, reason));
        }}
      >
        {Object.entries(PRODUCT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </Select>
      <ActionButton label={isFeatured ? "★ מומלץ" : "☆ קידום"} variant={isFeatured ? "accent" : "ghost"} pending={pending} onClick={() => run(() => adminToggleFeaturedAction(productId))} />
      <ActionButton label="מחיקה" variant="danger-outline" pending={pending} onClick={() => run(() => adminDeleteProductAction(productId), "למחוק את המוצר לצמיתות?")} />
    </div>
  );
}

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const { pending, run } = useRun();
  return <ActionButton label="מחיקה" variant="danger-outline" pending={pending} onClick={() => run(() => adminDeleteCategoryAction(categoryId), "למחוק את הקטגוריה?")} />;
}

export function ReportControls({ reportId }: { reportId: string }) {
  const { pending, run } = useRun();
  return (
    <div className="flex flex-wrap gap-1.5">
      <ActionButton label="הסרת המודעה" variant="danger" pending={pending} onClick={() => run(() => adminResolveReportAction(reportId, "ACTIONED", true), "להסיר את המודעה ולסגור את הדיווח?")} />
      <ActionButton label="נבדק — תקין" pending={pending} onClick={() => run(() => adminResolveReportAction(reportId, "REVIEWED"))} />
      <ActionButton label="דחייה" variant="ghost" pending={pending} onClick={() => run(() => adminResolveReportAction(reportId, "DISMISSED"))} />
    </div>
  );
}

export function RequestStatusSelect({ requestId, status }: { requestId: string; status: "OPEN" | "FULFILLED" | "CLOSED" }) {
  const { pending, run } = useRun();
  return (
    <Select value={status} disabled={pending} className="h-9 min-w-28 text-xs" aria-label="סטטוס הבקשה" onChange={(e) => run(() => adminSetRequestStatusAction(requestId, e.target.value as typeof status))}>
      {Object.entries(REQUEST_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </Select>
  );
}
