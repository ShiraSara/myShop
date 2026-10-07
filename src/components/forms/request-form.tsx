"use client";

import { useState } from "react";
import { createRequestAction } from "@/actions/requests";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, fieldProps } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { CITIES, REGIONS } from "@/lib/locations";
import { useFormAction } from "./use-form-action";

export function RequestForm({ categories }: { categories: { id: string; name: string }[] }) {
  const { onSubmit, pending, errors, formError } = useFormAction(createRequestAction);
  const [region, setRegion] = useState("");
  const cities = region ? CITIES.filter((c) => c.region === region) : CITIES;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {formError && <Alert tone="error">{formError}</Alert>}
      <Field id="title" label="מה אתם מחפשים?" error={errors?.title} required hint='לדוגמה: "אופניים לילד בן 10"'>
        <Input {...fieldProps("title", errors?.title, true)} maxLength={100} required />
      </Field>
      <Field id="description" label="תיאור" error={errors?.description} hint="מידה, צבע, דגם, מצב רצוי...">
        <Textarea {...fieldProps("description", errors?.description, true)} rows={3} maxLength={1000} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="categoryId" label="קטגוריה" error={errors?.categoryId}>
          <Select {...fieldProps("categoryId", errors?.categoryId)} defaultValue="">
            <option value="">לא משנה</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field id="maxBudget" label="תקציב מקסימלי (₪)" error={errors?.maxBudget}>
          <Input {...fieldProps("maxBudget", errors?.maxBudget)} type="number" inputMode="numeric" min={0} placeholder="לדוגמה: 500" />
        </Field>
        <Field id="region" label="אזור" error={errors?.region}>
          <Select {...fieldProps("region", errors?.region)} value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">כל הארץ</option>
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
        </Field>
        <Field id="city" label="עיר" error={errors?.city}>
          <Select {...fieldProps("city", errors?.city)} defaultValue="">
            <option value="">לא משנה</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </Select>
        </Field>
      </div>
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border p-4">
        <span>
          <span className="block font-medium">מתאים לי משלוח</span>
          <span className="block text-sm text-muted-foreground">נציג גם מוצרים מאזורים אחרים עם אפשרות משלוח</span>
        </span>
        <input type="checkbox" name="shippingOk" className="size-5 accent-primary-600" />
      </label>
      <Field id="details" label="פרטים נוספים" error={errors?.details}>
        <Textarea {...fieldProps("details", errors?.details)} rows={2} maxLength={1000} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>פרסום הבקשה</Button>
    </form>
  );
}
