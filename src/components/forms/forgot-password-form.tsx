"use client";

import { forgotPasswordAction } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Field, fieldProps } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useFormAction } from "./use-form-action";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const { state, onSubmit, pending, errors, formError } = useFormAction(forgotPasswordAction);
  if (state?.ok) return <Alert tone="success">{state.message}</Alert>;
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError && <Alert tone="error">{formError}</Alert>}
      <Field id="email" label="אימייל" error={errors?.email}>
        <Input {...fieldProps("email", errors?.email)} type="email" autoComplete="email" dir="ltr" required />
      </Field>
      <Button type="submit" loading={pending} size="lg" className="w-full">שליחת קישור לאיפוס</Button>
    </form>
  );
}
