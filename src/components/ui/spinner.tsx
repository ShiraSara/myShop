import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className, label = "טוען" }: { className?: string; label?: string }) {
  return <LoaderCircle className={cn("size-5 animate-spin", className)} aria-label={label} role="status" />;
}
