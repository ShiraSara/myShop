"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, MapPin, Truck } from "lucide-react";
import { toast } from "sonner";
import type { ProductCondition } from "@prisma/client";
import { createProductAction, updateProductAction } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Field, fieldProps } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { ProductCard } from "@/components/product/product-card";
import { ConditionBadge } from "@/components/product/condition-badge";
import { CONDITIONS } from "@/lib/constants";
import { CITIES, REGIONS } from "@/lib/locations";
import { cn, formatPrice } from "@/lib/utils";
import {
  productDescriptionSchema,
  productDetailsSchema,
  productImagesSchema,
  productLocationSchema,
} from "@/lib/validation/product";
import type { FieldErrors } from "@/lib/validation/common";
import { ImageUploader, type UploadItem } from "./image-uploader";

const STEPS = [
  { title: "פרטי מוצר", short: "פרטים" },
  { title: "תמונות", short: "תמונות" },
  { title: "מיקום ומשלוח", short: "מיקום" },
  { title: "תיאור", short: "תיאור" },
  { title: "תצוגה מקדימה", short: "סיכום" },
];

export type WizardInitial = {
  id?: string;
  title: string;
  categoryId: string;
  price: string;
  condition: ProductCondition | "";
  images: { id: string; url: string; isPrimary: boolean }[];
  city: string;
  shippingAvailable: boolean;
  shippingPrice: string;
  shippingDetails: string;
  description: string;
  status?: string;
};

export function ProductWizard({
  categories,
  initial,
  maxImages,
}: {
  categories: { id: string; name: string }[];
  initial: WizardInitial;
  maxImages: number;
}) {
  const router = useRouter();
  const isEdit = !!initial.id;
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [details, setDetails] = useState({ title: initial.title, categoryId: initial.categoryId, price: initial.price, condition: initial.condition });
  const [items, setItems] = useState<UploadItem[]>(() => initial.images.map((img) => ({ key: img.id, id: img.id, url: img.url, progress: 100, existing: true })));
  const [primaryKey, setPrimaryKey] = useState<string | null>(() => initial.images.find((i) => i.isPrimary)?.id ?? initial.images[0]?.id ?? null);
  const [location, setLocation] = useState({
    city: initial.city,
    shippingAvailable: initial.shippingAvailable,
    shippingPrice: initial.shippingPrice,
    shippingDetails: initial.shippingDetails,
  });
  const [description, setDescription] = useState(initial.description);

  const uploadedIds = items.filter((i) => i.id && !i.error).map((i) => i.id!);
  const stillUploading = items.some((i) => !i.id && !i.error);
  const primaryImageId = items.find((i) => i.key === primaryKey)?.id ?? uploadedIds[0] ?? null;

  function validateStep(s: number): boolean {
    let result: { success: boolean; error?: { flatten(): { fieldErrors: FieldErrors } } } = { success: true };
    if (s === 0) result = productDetailsSchema.safeParse(details);
    if (s === 1) {
      if (stillUploading) {
        setErrors({ imageIds: ["יש להמתין לסיום העלאת התמונות"] });
        return false;
      }
      result = productImagesSchema.safeParse({ imageIds: uploadedIds, primaryImageId });
    }
    if (s === 2) result = productLocationSchema.safeParse(location);
    if (s === 3) result = productDescriptionSchema.safeParse({ description });
    if (!result.success) {
      setErrors(result.error!.flatten().fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goTo(target: number) {
    if (target < step) {
      setErrors({});
      setStep(target);
      return;
    }
    for (let s = step; s < target; s++) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }
    setStep(target);
  }

  function submit(status: "ACTIVE" | "DRAFT") {
    for (let s = 0; s < 4; s++) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }
    setFormError(null);
    const payload = {
      ...details,
      condition: details.condition as ProductCondition,
      imageIds: uploadedIds,
      primaryImageId,
      ...location,
      description,
      status,
    };
    startTransition(async () => {
      const result = isEdit ? await updateProductAction(initial.id!, payload) : await createProductAction(payload);
      if (!result.ok) {
        setFormError(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
        return;
      }
      toast.success(isEdit ? "השינויים נשמרו" : status === "DRAFT" ? "הטיוטה נשמרה" : "המוצר פורסם בהצלחה! 🎉");
      router.push(status === "DRAFT" ? "/dashboard/products" : `/products/${result.data!.slug}`);
      router.refresh();
    });
  }

  const category = categories.find((c) => c.id === details.categoryId);
  const priceNumber = Number(details.price) || 0;
  const previewImage = items.find((i) => i.key === primaryKey) ?? items[0];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Stepper */}
      <nav aria-label="שלבי פרסום" className="mb-8">
        <ol className="flex items-center gap-1.5 sm:gap-2">
          {STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={s.title} className="flex flex-1 items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={current ? "step" : undefined}
                  className="group flex flex-1 flex-col items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full text-sm font-semibold transition",
                      current && "bg-primary text-white ring-4 ring-primary-100",
                      done && "bg-primary-100 text-primary-700",
                      !current && !done && "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-4" aria-hidden /> : i + 1}
                  </span>
                  <span className={cn("text-xs", current ? "font-semibold text-foreground" : "text-muted-foreground")}>{s.short}</span>
                </button>
                {i < STEPS.length - 1 && <span className={cn("mb-5 h-0.5 flex-1 rounded", i < step ? "bg-primary-300" : "bg-border")} aria-hidden />}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="rounded-3xl border border-border/70 bg-surface p-5 shadow-card sm:p-8">
        <h2 className="mb-6 text-xl font-bold">
          <span className="text-muted-foreground">שלב {step + 1} מתוך {STEPS.length}: </span>
          {STEPS[step].title}
        </h2>

        {formError && <Alert tone="error" className="mb-5">{formError}</Alert>}

        {step === 0 && (
          <div className="space-y-5">
            <Field id="title" label="שם המוצר" error={errors.title} required hint="לדוגמה: אופני ילדים 20 אינץ׳ במצב מצוין">
              <Input {...fieldProps("title", errors.title, true)} value={details.title} onChange={(e) => setDetails({ ...details, title: e.target.value })} maxLength={80} autoFocus />
            </Field>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                id="categoryId"
                label="קטגוריה"
                error={errors.categoryId}
                required
                hint={categories.length === 0 ? "עדיין לא הוגדרו קטגוריות באתר. מנהל האתר צריך להוסיף קטגוריות לפני שניתן לפרסם מוצרים." : undefined}
              >
                <Select {...fieldProps("categoryId", errors.categoryId, categories.length === 0)} value={details.categoryId} onChange={(e) => setDetails({ ...details, categoryId: e.target.value })} disabled={categories.length === 0}>
                  <option value="">{categories.length === 0 ? "אין קטגוריות זמינות" : "בחירת קטגוריה"}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field id="price" label="מחיר (₪)" error={errors.price} required hint="0 = למסירה בחינם">
                <div className="relative">
                  <Input {...fieldProps("price", errors.price, true)} type="number" inputMode="numeric" min={0} step={1} value={details.price} onChange={(e) => setDetails({ ...details, price: e.target.value })} className="pe-9" />
                  <span className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span>
                </div>
              </Field>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">מצב המוצר<span className="ms-0.5 text-danger" aria-hidden>*</span></legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CONDITIONS.map((c) => (
                  <label
                    key={c.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition",
                      details.condition === c.value ? "border-primary bg-primary-50/70 ring-1 ring-primary" : "border-border hover:border-stone-300",
                    )}
                  >
                    <input type="radio" name="condition" value={c.value} checked={details.condition === c.value} onChange={() => setDetails({ ...details, condition: c.value })} className="mt-1 accent-primary-600" />
                    <span>
                      <span className="block text-sm font-semibold">{c.label}</span>
                      <span className="block text-xs text-muted-foreground">{c.description}</span>
                    </span>
                  </label>
                ))}
              </div>
              {errors.condition && <p role="alert" className="mt-1.5 text-xs font-medium text-danger">{errors.condition[0]}</p>}
            </fieldset>
          </div>
        )}

        {step === 1 && (
          <ImageUploader items={items} setItems={setItems} primaryKey={primaryKey} setPrimaryKey={setPrimaryKey} max={maxImages} error={errors.imageIds?.[0]} />
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Field id="city" label="עיר" error={errors.city} required>
              <Select {...fieldProps("city", errors.city)} value={location.city} onChange={(e) => setLocation({ ...location, city: e.target.value })}>
                <option value="">בחירת עיר</option>
                {REGIONS.map((r) => (
                  <optgroup key={r.value} label={r.label}>
                    {CITIES.filter((c) => c.region === r.value).map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </Field>
            <label className={cn("flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition", location.shippingAvailable ? "border-primary bg-primary-50/60" : "border-border")}>
              <span className="flex items-center gap-3">
                <Truck className="size-5 text-primary" aria-hidden />
                <span>
                  <span className="block font-medium">אפשרות למשלוח</span>
                  <span className="block text-sm text-muted-foreground">אני מוכן/ה לשלוח את המוצר לקונה</span>
                </span>
              </span>
              <input type="checkbox" className="size-5 accent-primary-600" checked={location.shippingAvailable} onChange={(e) => setLocation({ ...location, shippingAvailable: e.target.checked })} />
            </label>
            {location.shippingAvailable && (
              <div className="grid grid-cols-1 animate-fade-in gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <Field id="shippingPrice" label="עלות משלוח (₪)" error={errors.shippingPrice} hint="ריק = בתיאום">
                  <Input {...fieldProps("shippingPrice", errors.shippingPrice, true)} type="number" inputMode="numeric" min={0} value={location.shippingPrice} onChange={(e) => setLocation({ ...location, shippingPrice: e.target.value })} />
                </Field>
                <Field id="shippingDetails" label="פרטי משלוח" error={errors.shippingDetails} hint="לדוגמה: שליח עד הבית תוך 3 ימי עסקים">
                  <Input {...fieldProps("shippingDetails", errors.shippingDetails, true)} value={location.shippingDetails} onChange={(e) => setLocation({ ...location, shippingDetails: e.target.value })} maxLength={300} />
                </Field>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <Field id="description" label="תיאור המוצר" error={errors.description} required hint="ספרו על המוצר: מצב, גיל, מידות, סיבת מכירה, מה כלול. תיאור טוב = יותר פניות.">
            <Textarea {...fieldProps("description", errors.description, true)} value={description} onChange={(e) => setDescription(e.target.value)} rows={9} maxLength={5000} autoFocus />
            <p className="text-end text-xs text-muted-foreground"><span className="ltr-nums">{description.length} / 5000</span></p>
          </Field>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <p className="text-muted-foreground">כך המוצר ייראה באתר. אפשר לחזור לכל שלב ולערוך.</p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[16rem_minmax(0,1fr)]">
              <ProductCard
                showFavorite={false}
                product={{
                  id: "preview",
                  slug: "#",
                  title: details.title,
                  price: priceNumber,
                  condition: (details.condition || "GOOD") as ProductCondition,
                  status: "ACTIVE",
                  city: location.city,
                  shippingAvailable: location.shippingAvailable,
                  publishedAt: new Date(),
                  createdAt: new Date(),
                  images: previewImage ? [{ url: previewImage.url, width: null, height: null }] : [],
                }}
              />
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-border pb-2"><dt className="text-muted-foreground">שם</dt><dd className="font-medium">{details.title}</dd></div>
                <div className="flex justify-between gap-4 border-b border-border pb-2"><dt className="text-muted-foreground">קטגוריה</dt><dd className="font-medium">{category?.name}</dd></div>
                <div className="flex justify-between gap-4 border-b border-border pb-2"><dt className="text-muted-foreground">מחיר</dt><dd className="font-medium ltr-nums">{formatPrice(priceNumber)}</dd></div>
                <div className="flex justify-between gap-4 border-b border-border pb-2"><dt className="text-muted-foreground">מצב</dt><dd>{details.condition && <ConditionBadge condition={details.condition} />}</dd></div>
                <div className="flex justify-between gap-4 border-b border-border pb-2"><dt className="text-muted-foreground">מיקום</dt><dd className="flex items-center gap-1 font-medium"><MapPin className="size-3.5" aria-hidden />{location.city}</dd></div>
                <div className="flex justify-between gap-4 border-b border-border pb-2"><dt className="text-muted-foreground">משלוח</dt><dd className="font-medium">{location.shippingAvailable ? (location.shippingPrice ? `כן, ${formatPrice(Number(location.shippingPrice))}` : "כן") : "איסוף עצמי"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">תמונות</dt><dd className="font-medium">{uploadedIds.length}</dd></div>
              </dl>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">תיאור</h3>
              <p className="whitespace-pre-line rounded-2xl bg-muted/60 p-4 text-sm leading-relaxed text-stone-700">{description}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={pending}>
              <ChevronRight />הקודם
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={goNext} size="lg">
              המשך<ChevronLeft />
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(!isEdit || initial.status === "DRAFT") && (
                <Button variant="outline" size="lg" onClick={() => submit("DRAFT")} disabled={pending}>שמירה כטיוטה</Button>
              )}
              <Button size="lg" onClick={() => submit("ACTIVE")} loading={pending}>
                {isEdit ? (initial.status === "DRAFT" ? "פרסם מוצר" : "שמירת שינויים") : "פרסם מוצר"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
