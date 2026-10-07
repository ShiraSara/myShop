"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DirectionProvider dir="rtl">
      {children}
      <Toaster dir="rtl" position="top-center" richColors closeButton toastOptions={{ className: "font-sans" }} />
    </DirectionProvider>
  );
}
