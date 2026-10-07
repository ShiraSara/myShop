"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { startConversationAction } from "@/actions/messages";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const QUICK_MESSAGES = ["היי, המוצר עדיין זמין?", "האם המחיר גמיש?", "אפשר לתאם איסוף?", "יש אפשרות למשלוח?"];

export function ContactSellerButton({
  productId,
  productTitle,
  isLoggedIn,
  existingConversationId,
  className,
  size = "lg",
}: {
  productId: string;
  productTitle: string;
  isLoggedIn: boolean;
  existingConversationId?: string | null;
  className?: string;
  size?: "md" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(QUICK_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  if (existingConversationId) {
    return (
      <ButtonLink href={`/dashboard/messages/${existingConversationId}`} size={size} className={cn("w-full", className)}>
        <MessageCircle />
        המשך שיחה עם המוכר
      </ButtonLink>
    );
  }

  function onOpen() {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setOpen(true);
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim()) {
      setError("יש לכתוב הודעה");
      return;
    }
    startTransition(async () => {
      const result = await startConversationAction({ productId, body });
      if (!result.ok) {
        setError(result.fieldErrors?.body?.[0] ?? result.error);
        return;
      }
      toast.success("ההודעה נשלחה למוכר");
      router.push(`/dashboard/messages/${result.data!.conversationId}`);
    });
  }

  return (
    <>
      <Button size={size} className={cn("w-full", className)} onClick={onOpen}>
        <MessageCircle />
        שליחת הודעה למוכר
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="שליחת הודעה למוכר" description={productTitle}>
          <form onSubmit={send} className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {QUICK_MESSAGES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setBody(m)}
                  className={cn("rounded-full border px-3 py-1.5 text-sm transition", body === m ? "border-primary bg-primary-50 text-primary-700" : "border-border hover:bg-muted")}
                >
                  {m}
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="contact-body" className="sr-only">ההודעה</label>
              <Textarea
                id="contact-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
                rows={4}
                aria-invalid={!!error || undefined}
                aria-describedby={error ? "contact-error" : undefined}
                autoFocus
              />
              {error && <p id="contact-error" role="alert" className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
            </div>
            <Button type="submit" size="lg" className="w-full" loading={pending}>שליחה</Button>
            <p className="text-center text-xs text-muted-foreground">לעולם אל תעבירו תשלום מראש לפני שראיתם את המוצר.</p>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
