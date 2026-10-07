import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--color-primary)" />
      <path d="M9 12.5h14l-1.3 9.2a2.5 2.5 0 0 1-2.5 2.1h-6.4a2.5 2.5 0 0 1-2.5-2.1L9 12.5Z" fill="#fff" />
      <path d="M12.5 12.5V11a3.5 3.5 0 0 1 7 0v1.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="18" r="1.8" fill="var(--color-accent)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 rounded-lg", className)} aria-label={`${SITE_NAME} — דף הבית`}>
      <LogoMark />
      <span className="text-xl font-extrabold tracking-tight">{SITE_NAME}</span>
    </Link>
  );
}
