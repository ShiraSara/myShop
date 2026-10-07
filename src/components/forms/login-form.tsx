"use client";

import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Field, fieldProps } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "./password-input";
import { useFormAction } from "./use-form-action";
import { Button } from "@/components/ui/button";

export function LoginForm({ next }: { next?: string }) {
  const { onSubmit, pending, errors, formError } = useFormAction(loginAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError && <Alert tone="error">{formError}</Alert>}
      {next && <input type="hidden" name="next" value={next} />}
      <Field id="email" label="אימייל" error={errors?.email}>
        <Input {...fieldProps("email", errors?.email)} type="email" autoComplete="email" dir="ltr" required placeholder="name@example.com" />
      </Field>
      <Field id="password" label="סיסמה" error={errors?.password}>
        <PasswordInput {...fieldProps("password", errors?.password)} autoComplete="current-password" required />
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">שכחתם סיסמה?</Link>
      </div>
      <Button type="submit" loading={pending} size="lg" className="w-full">התחברות</Button>
    </form>
  );
}
