"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, ImageOff, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; url: string; width: number | null; height: number | null };

export function ProductGallery({ images, title, sold }: { images: GalleryImage[]; title: string; sold?: boolean }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const count = images.length;
  // RTL: "next" moves left visually
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") next();
      if (e.key === "ArrowRight") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, prev]);

  // Touch swipe
  const [touchX, setTouchX] = useState<number | null>(null);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) (dx < 0 ? prev : next)();
    setTouchX(null);
  };

  if (count === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-3xl bg-muted text-stone-400">
        <ImageOff className="size-12" aria-hidden />
      </div>
    );
  }

  const current = images[index];
  const navBtn = "absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:bg-white";

  return (
    <div className="space-y-3">
      <div
        className="group relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted sm:aspect-[5/4]"
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={onTouchEnd}
      >
        <button type="button" onClick={() => setOpen(true)} className="absolute inset-0 cursor-zoom-in" aria-label="הגדלת התמונה למסך מלא">
          <Image
            key={current.id}
            src={current.url}
            alt={`${title} — תמונה ${index + 1} מתוך ${count}`}
            fill
            priority={index === 0}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className={cn("animate-fade-in object-contain", sold && "grayscale-[50%]")}
          />
        </button>
        {count > 1 && (
          <>
            <button type="button" onClick={prev} className={cn(navBtn, "start-3 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:hidden")} aria-label="התמונה הקודמת">
              <ChevronRight className="size-5" />
            </button>
            <button type="button" onClick={next} className={cn(navBtn, "end-3 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:hidden")} aria-label="התמונה הבאה">
              <ChevronLeft className="size-5" />
            </button>
            <span className="pointer-events-none absolute bottom-3 start-3 rounded-full bg-stone-900/70 px-2.5 py-1 text-xs font-medium text-white">
              <span className="ltr-nums">{index + 1} / {count}</span>
            </span>
          </>
        )}
        <span className="pointer-events-none absolute bottom-3 end-3 flex size-9 items-center justify-center rounded-full bg-white/90 shadow-sm">
          <Maximize2 className="size-4" aria-hidden />
        </span>
      </div>

      {count > 1 && (
        <ul className="scrollbar-none flex gap-2 overflow-x-auto" aria-label="תמונות המוצר">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`תמונה ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "relative block size-18 overflow-hidden rounded-xl bg-muted ring-2 ring-offset-2 transition sm:size-20",
                  i === index ? "ring-primary" : "ring-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95 data-[state=open]:animate-fade-in" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 flex items-center justify-center outline-none"
            onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
            onTouchEnd={onTouchEnd}
          >
            <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">תצוגת תמונות במסך מלא. השתמשו בחיצים כדי לעבור בין התמונות.</DialogPrimitive.Description>
            <div className="relative h-full w-full">
              <Image src={current.url} alt={`${title} — תמונה ${index + 1}`} fill sizes="100vw" className="object-contain p-4 sm:p-12" />
            </div>
            <DialogPrimitive.Close className="absolute end-4 top-4 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="סגירה">
              <X className="size-6" />
            </DialogPrimitive.Close>
            {count > 1 && (
              <>
                <button type="button" onClick={prev} className="absolute start-4 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="התמונה הקודמת">
                  <ChevronRight className="size-6" />
                </button>
                <button type="button" onClick={next} className="absolute end-4 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="התמונה הבאה">
                  <ChevronLeft className="size-6" />
                </button>
                <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                  <span className="ltr-nums">{index + 1} / {count}</span>
                </span>
              </>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
