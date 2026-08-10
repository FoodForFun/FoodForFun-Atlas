"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/app/admin/_components/submit-button";
import { initialMfaActionState } from "@/app/admin/mfa/action-state";
import { verifyTotpChallengeAction } from "@/app/admin/mfa/actions";

type ChallengeFactor = {
  friendlyName?: string;
  id: string;
};

export function MfaChallengeForm({
  factors,
  next,
}: {
  factors: ChallengeFactor[];
  next: string;
}) {
  const [state, formAction] = useActionState(
    verifyTotpChallengeAction,
    initialMfaActionState,
  );

  return (
    <form action={formAction} className="admin-form">
      <input name="next" type="hidden" value={next} />
      {factors.length === 1 ? (
        <input name="factor_id" type="hidden" value={factors[0].id} />
      ) : (
        <div className="admin-field">
          <label htmlFor="challenge-factor">Authenticator</label>
          <select id="challenge-factor" name="factor_id" required>
            {factors.map((factor, index) => (
              <option key={factor.id} value={factor.id}>
                {factor.friendlyName || `Authenticator ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="admin-field">
        <label htmlFor="challenge-code">Authenticator code</label>
        <input
          autoComplete="one-time-code"
          autoFocus
          id="challenge-code"
          inputMode="numeric"
          maxLength={6}
          name="code"
          pattern="[0-9]{6}"
          required
          type="text"
        />
        <p>Enter the current six-digit code from your authenticator app.</p>
      </div>
      {state.message ? (
        <p className="admin-form-message admin-form-message-error" role="alert">
          {state.message}
        </p>
      ) : null}
      <SubmitButton label="Verify session" pendingLabel="Verifying session…" />
    </form>
  );
}
