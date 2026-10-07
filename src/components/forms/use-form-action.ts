"use client";

import { useActionState, startTransition } from "react";
import type { ActionResult } from "@/lib/validation/common";

/**
 * Wraps a `(prev, formData)` server action for use with onSubmit.
 * Unlike <form action>, this keeps the user's input when validation fails
 * (React resets uncontrolled forms after a form action).
 */
export function useFormAction(action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>) {
  const [state, dispatch, pending] = useActionState(action, null);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => dispatch(formData));
  };
  const errors = state && !state.ok ? state.fieldErrors : undefined;
  const formError = state && !state.ok && !state.fieldErrors ? state.error : null;
  return { state, onSubmit, pending, errors, formError };
}
