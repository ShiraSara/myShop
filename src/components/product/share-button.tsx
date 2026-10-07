"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({ title, url, className }: { title: string; url: string; className?: string }) {
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("הקישור הועתק");
    } catch {
      toast.error("לא ניתן להעתיק את הקישור");
    }
  }
  return (
    <Button variant="outline" onClick={share} className={className}>
      <Share2 />
      שיתוף
    </Button>
  );
}
