"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { REGIONS } from "@/lib/locations";

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (region) params.set("region", region);
    router.push(`/search${params.size ? `?${params}` : ""}`);
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="flex flex-col gap-2 rounded-3xl bg-surface p-2 shadow-pop ring-1 ring-black/5 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full"
    >
      <div className="relative flex-1">
        <label htmlFor="hero-q" className="sr-only">מה אתם מחפשים?</label>
        <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          id="hero-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="מה אתם מחפשים?"
          maxLength={100}
          className="h-13 w-full rounded-full bg-transparent ps-12 pe-4 text-base placeholder:text-stone-400 focus:outline-none"
        />
      </div>
      <div className="relative sm:w-52 sm:border-s sm:border-border">
        <label htmlFor="hero-region" className="sr-only">אזור</label>
        <MapPin className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <select
          id="hero-region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="h-13 w-full cursor-pointer appearance-none rounded-full bg-muted/70 ps-12 pe-4 text-base focus:outline-none sm:bg-transparent"
        >
          <option value="">כל הארץ</option>
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="h-13 rounded-full bg-primary px-8 text-base font-semibold text-white transition hover:bg-primary-700 active:scale-[0.98]">
        חיפוש
      </button>
    </form>
  );
}
