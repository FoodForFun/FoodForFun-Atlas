"use client";

import { useActionState } from "react";

import { initialAuthActionState } from "@/app/admin/action-state";
import { updatePasswordAction } from "@/app/admin/actions";
import { SubmitButton } from "@/app/admin/_components/submit-button";

export function PasswordUpdateForm() {
  const [state, formAction] = useActionState(
    updatePasswordAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="admin-form">
      <div className="admin-field">
        <label htmlFor="new-password">New password</label>
        <input
          aria-describedby="password-guidance"
          autoComplete="new-password"
          id="new-password"
          minLength={12}
          name="password"
          required
          type="password"
        />
        <p id="password-guidance">Use at least 12 characters.</p>
      </div>
      <div className="admin-field">
        <label htmlFor="password-confirmation">Confirm new password</label>
        <input
          autoComplete="new-password"
          id="password-confirmation"
          minLength={12}
          name="password_confirmation"
          required
          type="password"
        />
      </div>
      {state.message ? (
        <p className="admin-form-message admin-form-message-error" role="alert">
          {state.message}
        </p>
      ) : null}
      <SubmitButton label="Set password" pendingLabel="Saving password…" />
    </form>
  );
}
