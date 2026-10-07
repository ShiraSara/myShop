"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { markNotificationsReadAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button variant="outline" size="sm" loading={pending} onClick={() => startTransition(async () => { await markNotificationsReadAction(); router.refresh(); })}>
      <CheckCheck />סימון הכל כנקרא
    </Button>
  );
}
