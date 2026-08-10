"use client";

import { type MouseEvent, useActionState } from "react";

import { SubmitButton } from "@/app/admin/_components/submit-button";
import {
  initialMfaActionState,
  initialMfaEnrollmentActionState,
} from "@/app/admin/mfa/action-state";
import {
  startTotpEnrollmentAction,
  verifyTotpEnrollmentAction,
} from "@/app/admin/mfa/actions";

function replaceCurrentPage(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  window.location.replace(event.currentTarget.href);
}

export function MfaEnrollmentExitLinks() {
  return (
    <div className="admin-auth-links">
      <a href="/admin/mfa" onClick={replaceCurrentPage}>
        Return to MFA status
      </a>
      <a href="/admin" onClick={replaceCurrentPage}>
        Continue to the basic admin shell
      </a>
    </div>
  );
}

function EnrollmentVerificationForm({ factorId }: { factorId: string }) {
  const [state, formAction] = useActionState(
    verifyTotpEnrollmentAction,
    initialMfaActionState,
  );

  return (
    <form action={formAction} className="admin-form">
      <input name="factor_id" type="hidden" value={factorId} />
      <div className="admin-field">
        <label htmlFor="enrollment-code">Authenticator code</label>
        <input
          autoComplete="one-time-code"
          id="enrollment-code"
          inputMode="numeric"
          maxLength={6}
          name="code"
          pattern="[0-9]{6}"
          required
          type="text"
        />
        <p>Enter the current six-digit code. Codes change every 30 seconds.</p>
      </div>
      {state.message ? (
        <p className="admin-form-message admin-form-message-error" role="alert">
          {state.message}
        </p>
      ) : null}
      <SubmitButton
        label="Verify and enable MFA"
        pendingLabel="Verifying code…"
      />
    </form>
  );
}

export function MfaEnrollmentForm() {
  const [state, formAction] = useActionState(
    startTotpEnrollmentAction,
    initialMfaEnrollmentActionState,
  );

  if (state.status !== "setup") {
    return (
      <form action={formAction} className="admin-form">
        {state.message ? (
          <p className="admin-form-message admin-form-message-error" role="alert">
            {state.message}
          </p>
        ) : null}
        <SubmitButton
          label="Start authenticator setup"
          pendingLabel="Starting secure setup…"
        />
      </form>
    );
  }

  return (
    <div className="admin-mfa-setup">
      <p className="admin-status-banner" role="status">
        {state.message}
      </p>
      <div className="admin-mfa-qr">
        {/* Supabase returns this short-lived data URL only for enrollment. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="FoodForFun Atlas authenticator enrollment QR code"
          height="240"
          src={state.setup.qrCode}
          width="240"
        />
      </div>
      <details className="admin-mfa-secret">
        <summary>Cannot scan the QR code?</summary>
        <p>Enter this one-time setup secret manually in your authenticator:</p>
        <code>{state.setup.secret}</code>
        <p>Do not copy this secret into messages, logs, or screenshots.</p>
      </details>
      <EnrollmentVerificationForm factorId={state.setup.factorId} />
      <a
        className="admin-secondary-link"
        href="/admin/mfa/enroll?restart=1"
        onClick={replaceCurrentPage}
      >
        Restart setup
      </a>
    </div>
  );
}
