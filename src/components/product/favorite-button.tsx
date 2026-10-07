"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleFavoriteAction } from "@/actions/favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  productId,
  initialFavorited,
  isLoggedIn,
  variant = "overlay",
  className,
}: {
  productId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  variant?: "overlay" | "button";
  className?: string;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [animate, setAnimate] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    const next = !favorited;
    setFavorited(next); // optimistic
    if (next) setAnimate(true);
    startTransition(async () => {
      const result = await toggleFavoriteAction(productId);
      if (!result.ok) {
        setFavorited(!next);
        toast.error(result.error);
      } else {
        setFavorited(result.data!.favorited);
        toast.success(result.data!.favorited ? "נשמר למועדפים" : "הוסר מהמועדפים", { duration: 1800 });
      }
    });
  }

  const label = favorited ? "הסרה מהמועדפים" : "שמירה למועדפים";

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={favorited}
        disabled={pending}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-[0.95rem] font-medium transition-all active:scale-[0.98]",
          favorited ? "border-rose-200 bg-rose-50 text-rose-600" : "border-border bg-surface hover:bg-muted",
          className,
        )}
      >
        <Heart
          className={cn("size-[1.15rem] transition-transform", favorited && "fill-rose-500 text-rose-500", animate && "animate-heart-pop")}
          onAnimationEnd={() => setAnimate(false)}
          aria-hidden
        />
        {favorited ? "נשמר במועדפים" : "שמירה למועדפים"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={favorited}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-all hover:scale-105 hover:bg-white active:scale-95",
        className,
      )}
    >
      <Heart
        className={cn("size-[1.1rem] transition-colors", favorited ? "fill-rose-500 text-rose-500" : "text-stone-700", animate && "animate-heart-pop")}
        onAnimationEnd={() => setAnimate(false)}
        aria-hidden
      />
    </button>
  );
}
