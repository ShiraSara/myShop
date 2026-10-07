"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { adminSaveCategoryAction } from "@/actions/admin";
import { useFormAction } from "@/components/forms/use-form-action";
import { Button } from "@/components/ui/button";
import { Field, fieldProps } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { CATEGORY_ICONS } from "@/components/ui/dynamic-icon";

type Category = { id: string; name: string; slug: string; description: string | null; icon: string; sortOrder: number; isActive: boolean };

export function CategoryForm({ category, onDone }: { category?: Category; onDone?: () => void }) {
  const { state, onSubmit, pending, errors, formError } = useFormAction(adminSaveCategoryAction);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      if (!category) formRef.current?.reset();
      onDone?.();
    } else if (formError) toast.error(formError);
  }, [state, formError, category, onDone]);
  const p = category?.id ?? "new";
  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end" noValidate>
      {category && <input type="hidden" name="id" value={category.id} />}
      <Field id={`${p}-name`} label="שם" error={errors?.name} className="lg:col-span-2">
        <Input {...fieldProps(`${p}-name`, errors?.name)} name="name" defaultValue={category?.name} />
      </Field>
      <Field id={`${p}-slug`} label="מזהה URL" error={errors?.slug}>
        <Input {...fieldProps(`${p}-slug`, errors?.slug)} name="slug" defaultValue={category?.slug} dir="ltr" placeholder="electronics" />
      </Field>
      <Field id={`${p}-icon`} label="אייקון" error={errors?.icon}>
        <Select id={`${p}-icon`} name="icon" defaultValue={category?.icon ?? "tag"}>
          {Object.keys(CATEGORY_ICONS).map((k) => <option key={k} value={k}>{k}</option>)}
        </Select>
      </Field>
      <Field id={`${p}-sortOrder`} label="סדר" error={errors?.sortOrder}>
        <Input {...fieldProps(`${p}-sortOrder`, errors?.sortOrder)} name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} />
      </Field>
      <div className="flex items-center gap-3 pb-1">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={category?.isActive ?? true} className="size-4 accent-primary-600" />
          פעילה
        </label>
        <Button type="submit" size="sm" loading={pending}>{category ? "שמירה" : "הוספה"}</Button>
      </div>
      <Field id={`${p}-description`} label="תיאור" error={errors?.description} className="sm:col-span-2 lg:col-span-6">
        <Input {...fieldProps(`${p}-description`, errors?.description)} name="description" defaultValue={category?.description ?? ""} />
      </Field>
    </form>
  );
}
