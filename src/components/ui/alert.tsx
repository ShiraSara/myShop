import { CircleCheck, TriangleAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  error: { cls: "border-red-200 bg-red-50 text-red-800", Icon: TriangleAlert },
  success: { cls: "border-green-200 bg-green-50 text-green-800", Icon: CircleCheck },
  info: { cls: "border-primary-200 bg-primary-50 text-primary-800", Icon: Info },
} as const;

export function Alert({ tone = "info", children, className }: { tone?: keyof typeof tones; children: React.ReactNode; className?: string }) {
  const { cls, Icon } = tones[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm", cls, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
