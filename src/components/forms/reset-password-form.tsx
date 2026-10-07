"use client";

import { resetPasswordAction } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Field, fieldProps } from "@/components/ui/field";
import { PasswordInput } from "./password-input";
import { useFormAction } from "./use-form-action";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm({ token }: { token: string }) {
  const { onSubmit, pending, errors, formError } = useFormAction(resetPasswordAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError && <Alert tone="error">{formError}</Alert>}
      <input type="hidden" name="token" value={token} />
      <Field id="password" label="סיסמה חדשה" hint="לפחות 8 תווים, כולל אות וספרה" error={errors?.password}>
        <PasswordInput {...fieldProps("password", errors?.password, true)} autoComplete="new-password" required />
      </Field>
      <Field id="confirmPassword" label="אימות סיסמה" error={errors?.confirmPassword}>
        <PasswordInput {...fieldProps("confirmPassword", errors?.confirmPassword)} autoComplete="new-password" required />
      </Field>
      <Button type="submit" loading={pending} size="lg" className="w-full">עדכון סיסמה</Button>
    </form>
  );
}
