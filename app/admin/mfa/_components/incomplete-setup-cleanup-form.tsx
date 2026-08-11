"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/app/admin/_components/submit-button";
import { initialMfaActionState } from "@/app/admin/mfa/action-state";
import { cleanupIncompleteTotpSetupAction } from "@/app/admin/mfa/actions";

export function IncompleteSetupCleanupForm() {
  const [state, formAction] = useActionState(
    cleanupIncompleteTotpSetupAction,
    initialMfaActionState,
  );

  return (
    <form action={formAction} className="admin-form admin-mfa-cleanup-form">
      <label className="admin-confirmation">
        <input
          name="confirm_cleanup"
          required
          type="checkbox"
          value="remove-incomplete-setup"
        />
        <span>
          I understand this removes only the incomplete authenticator setup and
          does not start a new enrollment.
        </span>
      </label>
      {state.message ? (
        <p className="admin-form-message admin-form-message-error" role="alert">
          {state.message}
        </p>
      ) : null}
      <SubmitButton
        label="Remove incomplete authenticator setup"
        pendingLabel="Removing incomplete setup..."
      />
    </form>
  );
}
