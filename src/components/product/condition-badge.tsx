import type { ProductCondition } from "@prisma/client";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { CONDITION_LABELS } from "@/lib/constants";

const tone: Record<ProductCondition, BadgeTone> = {
  NEW: "primary",
  LIKE_NEW: "primary",
  GOOD: "neutral",
  USED: "neutral",
  NEEDS_REPAIR: "warning",
};

export function ConditionBadge({ condition, overlay, className }: { condition: ProductCondition; overlay?: boolean; className?: string }) {
  return (
    <Badge tone={overlay ? "light" : tone[condition]} className={className}>
      {CONDITION_LABELS[condition]}
    </Badge>
  );
}
