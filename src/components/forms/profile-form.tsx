"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { updateProfileAction, } from "@/actions/profile";
import { changePasswordAction } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, fieldProps } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { CITY_NAMES } from "@/lib/locations";
import { PasswordInput } from "./password-input";
import { useFormAction } from "./use-form-action";

export function ProfileForm({ profile }: { profile: { name: string; email: string; phone: string | null; city: string | null; bio: string | null } }) {
  const { state, onSubmit, pending, errors, formError } = useFormAction(updateProfileAction);
  useEffect(() => {
    if (state?.ok) toast.success(state.message);
  }, [state]);
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {formError && <Alert tone="error">{formError}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="שם מלא" error={errors?.name} required>
          <Input {...fieldProps("name", errors?.name)} defaultValue={profile.name} maxLength={60} autoComplete="name" />
        </Field>
        <Field id="email-ro" label="אימייל" hint="לא ניתן לשנות את כתובת האימייל">
          <Input id="email-ro" value={profile.email} disabled dir="ltr" />
        </Field>
        <Field id="phone" label="טלפון" error={errors?.phone} hint="לא מוצג באתר">
          <Input {...fieldProps("phone", errors?.phone, true)} defaultValue={profile.phone ?? ""} type="tel" dir="ltr" autoComplete="tel" />
        </Field>
        <Field id="city" label="עיר" error={errors?.city}>
          <Select {...fieldProps("city", errors?.city)} defaultValue={profile.city ?? ""}>
            <option value="">לא צוין</option>
            {CITY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
      </div>
      <Field id="bio" label="קצת עליי" error={errors?.bio}>
        <Textarea {...fieldProps("bio", errors?.bio)} defaultValue={profile.bio ?? ""} rows={3} maxLength={300} />
      </Field>
      <Button type="submit" loading={pending}>שמירת שינויים</Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const { state, onSubmit, pending, errors, formError } = useFormAction(changePasswordAction);
  return (
    <form onSubmit={(e) => { onSubmit(e); }} className="space-y-5" noValidate>
      {formError && <Alert tone="error">{formError}</Alert>}
      {state?.ok && <Alert tone="success">{state.message}</Alert>}
      <Field id="currentPassword" label="סיסמה נוכחית" error={errors?.currentPassword}>
        <PasswordInput {...fieldProps("currentPassword", errors?.currentPassword)} autoComplete="current-password" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="password" label="סיסמה חדשה" error={errors?.password} hint="לפחות 8 תווים, כולל אות וספרה">
          <PasswordInput {...fieldProps("password", errors?.password, true)} autoComplete="new-password" />
        </Field>
        <Field id="confirmPassword" label="אימות סיסמה" error={errors?.confirmPassword}>
          <PasswordInput {...fieldProps("confirmPassword", errors?.confirmPassword)} autoComplete="new-password" />
        </Field>
      </div>
      <Button type="submit" variant="outline" loading={pending}>עדכון סיסמה</Button>
    </form>
  );
}
