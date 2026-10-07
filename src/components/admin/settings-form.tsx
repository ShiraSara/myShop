"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { adminSaveSettingsAction } from "@/actions/admin";
import { useFormAction } from "@/components/forms/use-form-action";
import { Button } from "@/components/ui/button";
import { Field, fieldProps } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import type { SiteSettings } from "@/lib/validation/misc";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const { state, onSubmit, pending, errors, formError } = useFormAction(adminSaveSettingsAction);
  useEffect(() => {
    if (state?.ok) toast.success(state.message);
  }, [state]);
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {formError && <Alert tone="error">{formError}</Alert>}
      <Field id="announcement" label="הודעת מערכת (באנר בראש האתר)" error={errors?.announcement} hint="השאירו ריק כדי להסתיר">
        <Input {...fieldProps("announcement", errors?.announcement, true)} defaultValue={settings.announcement ?? ""} maxLength={200} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="maxImagesPerProduct" label="מספר תמונות מקסימלי למוצר" error={errors?.maxImagesPerProduct}>
          <Input {...fieldProps("maxImagesPerProduct", errors?.maxImagesPerProduct)} type="number" min={1} max={20} defaultValue={settings.maxImagesPerProduct} />
        </Field>
        <Field id="contactEmail" label="אימייל ליצירת קשר" error={errors?.contactEmail}>
          <Input {...fieldProps("contactEmail", errors?.contactEmail)} type="email" dir="ltr" defaultValue={settings.contactEmail ?? ""} />
        </Field>
      </div>
      <Checkbox id="allowRegistration" name="allowRegistration" defaultChecked={settings.allowRegistration} label="הרשמה פתוחה למשתמשים חדשים" />
      <Button type="submit" loading={pending}>שמירת הגדרות</Button>
    </form>
  );
}
