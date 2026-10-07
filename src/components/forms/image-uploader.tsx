"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2, TriangleAlert } from "lucide-react";
import { deleteImageAction } from "@/actions/products";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type UploadItem = {
  key: string;
  id?: string; // server image id once uploaded
  url: string; // server url or local object URL preview
  progress: number;
  error?: string;
  existing?: boolean; // already attached to the product (edit mode)
};

function uploadFile(file: File, onProgress: (p: number) => void): Promise<{ id: string; url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let body: { id?: string; url?: string; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.id && body.url) resolve({ id: body.id, url: body.url });
      else reject(new Error(body.error || "ההעלאה נכשלה. נסו שוב."));
    };
    xhr.onerror = () => reject(new Error("בעיית תקשורת. בדקו את החיבור ונסו שוב."));
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export function ImageUploader({
  items,
  setItems,
  primaryKey,
  setPrimaryKey,
  max,
  error,
}: {
  items: UploadItem[];
  setItems: React.Dispatch<React.SetStateAction<UploadItem[]>>;
  primaryKey: string | null;
  setPrimaryKey: (key: string | null) => void;
  max: number;
  error?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const update = (key: string, patch: Partial<UploadItem>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  function addFiles(files: FileList | File[]) {
    setNotice(null);
    const room = max - items.length;
    const list = Array.from(files);
    if (list.length > room) setNotice(`ניתן להעלות עד ${max} תמונות`);
    for (const file of list.slice(0, Math.max(0, room))) {
      const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setNotice(`"${file.name}" — סוג קובץ לא נתמך. ניתן להעלות JPG, PNG, WEBP`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setNotice(`"${file.name}" — הקובץ גדול מדי (עד 8MB)`);
        continue;
      }
      const preview = URL.createObjectURL(file);
      setItems((l) => [...l, { key, url: preview, progress: 0 }]);
      if (!primaryKey && items.length === 0) setPrimaryKey(key);
      uploadFile(file, (p) => update(key, { progress: p }))
        .then(({ id, url }) => {
          update(key, { id, url, progress: 100 });
          URL.revokeObjectURL(preview);
        })
        .catch((e: Error) => update(key, { error: e.message }));
    }
  }

  async function remove(item: UploadItem) {
    setItems((l) => l.filter((i) => i.key !== item.key));
    if (primaryKey === item.key) {
      const next = items.find((i) => i.key !== item.key);
      setPrimaryKey(next?.key ?? null);
    }
    if (item.id && !item.existing) await deleteImageAction(item.id);
  }

  function move(key: string, delta: number) {
    setItems((list) => {
      const idx = list.findIndex((i) => i.key === key);
      const to = idx + delta;
      if (idx < 0 || to < 0 || to >= list.length) return list;
      const copy = [...list];
      const [it] = copy.splice(idx, 1);
      copy.splice(to, 0, it);
      return copy;
    });
  }

  function onDropOnItem(targetKey: string) {
    if (!dragKey || dragKey === targetKey) return;
    setItems((list) => {
      const from = list.findIndex((i) => i.key === dragKey);
      const to = list.findIndex((i) => i.key === targetKey);
      const copy = [...list];
      const [it] = copy.splice(from, 1);
      copy.splice(to, 0, it);
      return copy;
    });
    setDragKey(null);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          if (dragKey) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (dragKey) return;
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-primary bg-primary-50" : "border-stone-300 bg-muted/40",
          error && "border-danger/60",
        )}
      >
        <span className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-surface text-primary shadow-sm">
          <ImagePlus className="size-7" aria-hidden />
        </span>
        <p className="font-medium">גררו תמונות לכאן</p>
        <p className="mt-1 text-sm text-muted-foreground">או</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={items.length >= max}
          className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
        >
          בחירת תמונות
        </button>
        <p className="mt-3 text-xs text-muted-foreground">JPG, PNG, WEBP · עד 8MB לתמונה · עד {max} תמונות</p>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          multiple
          className="sr-only"
          aria-label="בחירת תמונות להעלאה"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {(notice || error) && (
        <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-danger">
          <TriangleAlert className="size-4" aria-hidden />
          {notice || error}
        </p>
      )}

      {items.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">גררו כדי לשנות סדר. לחצו על ⭐ כדי לבחור תמונה ראשית.</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item, index) => {
              const isPrimary = primaryKey === item.key;
              const uploading = !item.id && !item.error;
              return (
                <li
                  key={item.key}
                  draggable={!uploading}
                  onDragStart={() => setDragKey(item.key)}
                  onDragEnd={() => setDragKey(null)}
                  onDragOver={(e) => dragKey && e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    onDropOnItem(item.key);
                  }}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-2xl bg-muted ring-2 transition",
                    isPrimary ? "ring-primary" : "ring-transparent",
                    dragKey === item.key && "opacity-40",
                    !uploading && "cursor-grab active:cursor-grabbing",
                  )}
                >
                  <Image src={item.url} alt={`תמונה ${index + 1}`} fill sizes="200px" className={cn("object-cover", (uploading || item.error) && "opacity-50")} unoptimized={item.url.startsWith("blob:")} />
                  {isPrimary && <span className="absolute start-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">ראשית</span>}
                  {uploading && (
                    <div className="absolute inset-x-3 bottom-3">
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/70" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100} aria-label="התקדמות העלאה">
                        <div className="h-full bg-primary transition-all" style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                  )}
                  {item.error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 p-2 text-center text-xs font-medium text-red-700">{item.error}</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => move(item.key, -1)} disabled={index === 0} className="flex size-7 items-center justify-center rounded-full bg-white/90 disabled:opacity-40" aria-label="הזזה קדימה">
                        <ArrowRight className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => move(item.key, 1)} disabled={index === items.length - 1} className="flex size-7 items-center justify-center rounded-full bg-white/90 disabled:opacity-40" aria-label="הזזה אחורה">
                        <ArrowLeft className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-1">
                      {item.id && (
                        <button type="button" onClick={() => setPrimaryKey(item.key)} className="flex size-7 items-center justify-center rounded-full bg-white/90" aria-label="קביעה כתמונה ראשית" aria-pressed={isPrimary}>
                          <Star className={cn("size-3.5", isPrimary && "fill-accent text-accent")} />
                        </button>
                      )}
                      <button type="button" onClick={() => remove(item)} className="flex size-7 items-center justify-center rounded-full bg-white/90 text-danger" aria-label="מחיקת תמונה">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
