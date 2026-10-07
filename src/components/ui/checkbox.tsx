import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode; description?: React.ReactNode }>(
  function Checkbox({ className, label, description, id, ...props }, ref) {
    return (
      <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-3", className)}>
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 cursor-pointer rounded-md border-border accent-primary-600"
          {...props}
        />
        <span className="text-sm leading-relaxed">
          <span className="font-medium">{label}</span>
          {description && <span className="block text-muted-foreground">{description}</span>}
        </span>
      </label>
    );
  },
);
