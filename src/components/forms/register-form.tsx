"use client";

import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Field, fieldProps } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "./password-input";
import { useFormAction } from "./use-form-action";
import { Button } from "@/components/ui/button";

export function RegisterForm({ next }: { next?: string }) {
  const { onSubmit, pending, errors, formError } = useFormAction(registerAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError && <Alert tone="error">{formError}</Alert>}
      {next && <input type="hidden" name="next" value={next} />}
      <Field id="name" label="שם מלא" error={errors?.name} required>
        <Input {...fieldProps("name", errors?.name)} autoComplete="name" required maxLength={60} />
      </Field>
      <Field id="email" label="אימייל" error={errors?.email} required>
        <Input {...fieldProps("email", errors?.email)} type="email" autoComplete="email" dir="ltr" required placeholder="name@example.com" />
      </Field>
      <Field id="password" label="סיסמה" hint="לפחות 8 תווים, כולל אות וספרה" error={errors?.password} required>
        <PasswordInput {...fieldProps("password", errors?.password, true)} autoComplete="new-password" required minLength={8} />
      </Field>
      <Field id="confirmPassword" label="אימות סיסמה" error={errors?.confirmPassword} required>
        <PasswordInput {...fieldProps("confirmPassword", errors?.confirmPassword)} autoComplete="new-password" required />
      </Field>
      <div>
        <Checkbox id="terms" name="terms" label={<>אני מאשר/ת את <Link href="/terms" className="text-primary underline">תנאי השימוש</Link></>} aria-invalid={!!errors?.terms || undefined} />
        {errors?.terms && <p role="alert" className="mt-1 text-xs font-medium text-danger">{errors.terms[0]}</p>}
      </div>
      <Button type="submit" loading={pending} size="lg" className="w-full">יצירת חשבון</Button>
    </form>
  );
}
