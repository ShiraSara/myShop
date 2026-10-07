"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { reportProductAction } from "@/actions/reports";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { REPORT_REASONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ReportButton({ productId, isLoggedIn, className }: { productId: string; isLoggedIn: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  function onOpen() {
    if (!isLoggedIn) return router.push(`/login?next=${encodeURIComponent(pathname)}`);
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return setError("יש לבחור סיבה");
    startTransition(async () => {
      const result = await reportProductAction({ productId, reason, details });
      if (!result.ok) return setError(result.error);
      toast.success(result.message);
      setOpen(false);
      setReason("");
      setDetails("");
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={onOpen} className={cn("text-muted-foreground", className)}>
        <Flag />
        דיווח על המודעה
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="דיווח על מודעה" description="הדיווח אנונימי ויבדק על ידי צוות האתר.">
          <form onSubmit={submit} className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">מה הבעיה?</legend>
              <div className="grid gap-2">
                {REPORT_REASONS.map((r) => (
                  <label key={r.value} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition", reason === r.value ? "border-primary bg-primary-50" : "border-border hover:bg-muted")}>
                    <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => { setReason(r.value); setError(null); }} className="accent-primary-600" />
                    {r.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="report-details" className="mb-1.5 block text-sm font-medium">פרטים נוספים (לא חובה)</label>
              <Textarea id="report-details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} rows={3} />
            </div>
            {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" variant="danger" className="w-full" loading={pending}>שליחת דיווח</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
