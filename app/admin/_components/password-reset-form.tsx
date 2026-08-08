"use client";

import { useActionState } from "react";

import { initialAuthActionState } from "@/app/admin/action-state";
import { requestPasswordResetAction } from "@/app/admin/actions";
import { SubmitButton } from "@/app/admin/_components/submit-button";

export function PasswordResetForm() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="admin-form">
      <div className="admin-field">
        <label htmlFor="reset-email">Email address</label>
        <input
          autoComplete="email"
          id="reset-email"
          inputMode="email"
          name="email"
          required
          type="email"
        />
      </div>
      {state.message ? (
        <p
          className={`admin-form-message admin-form-message-${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
      <SubmitButton
        label="Send reset email"
        pendingLabel="Sending request…"
      />
    </form>
  );
}
