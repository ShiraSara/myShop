"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleCheck, RotateCcw, Trash2, X } from "lucide-react";
import { deleteRequestAction, dismissMatchAction, setRequestStatusAction } from "@/actions/requests";
import { Button } from "@/components/ui/button";

export function RequestActions({ requestId, status }: { requestId: string; status: "OPEN" | "FULFILLED" | "CLOSED" }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        if (r.message) toast.success(r.message);
        router.refresh();
      } else toast.error(r.error);
    });
  return (
    <div className="flex flex-wrap gap-1.5">
      {status === "OPEN" ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setRequestStatusAction(requestId, "FULFILLED"))}>
          <CircleCheck />מצאתי
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setRequestStatusAction(requestId, "OPEN"))}>
          <RotateCcw />פתיחה מחדש
        </Button>
      )}
      <Button
        size="sm"
        variant="danger-outline"
        disabled={pending}
        onClick={() => window.confirm("למחוק את הבקשה?") && run(() => deleteRequestAction(requestId))}
      >
        <Trash2 />מחיקה
      </Button>
    </div>
  );
}

export function DismissMatchButton({ matchId }: { matchId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await dismissMatchAction(matchId); router.refresh(); })}
      className="absolute end-2 top-2 z-20 flex size-7 items-center justify-center rounded-full bg-white/90 text-stone-600 shadow-sm hover:bg-white"
      aria-label="הסתרת ההתאמה"
      title="לא רלוונטי"
    >
      <X className="size-4" />
    </button>
  );
}
