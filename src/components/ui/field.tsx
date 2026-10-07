import { cn } from "@/lib/utils";

/** Label + control + hint + error, wired up with ids for accessibility. */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | string[] | null;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const message = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ms-0.5 text-danger" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !message && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {message && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">
          {message}
        </p>
      )}
    </div>
  );
}

/** Props to spread on an input inside <Field> */
export function fieldProps(id: string, error?: string | string[] | null, hint?: boolean) {
  const hasError = Array.isArray(error) ? error.length > 0 : !!error;
  return {
    id,
    name: id,
    "aria-invalid": hasError || undefined,
    "aria-describedby": hasError ? `${id}-error` : hint ? `${id}-hint` : undefined,
  };
}
