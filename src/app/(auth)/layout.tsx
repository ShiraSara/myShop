import { LogoMark } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] items-start justify-center overflow-hidden px-4 py-10 sm:items-center sm:py-16">
      <div aria-hidden className="pointer-events-none absolute -top-32 start-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-primary-100/50 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <LogoMark className="size-12" />
        </div>
        <div className="rounded-3xl border border-border/70 bg-surface p-6 shadow-pop sm:p-8">{children}</div>
      </div>
    </div>
  );
}
