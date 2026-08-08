"use client";

import { useActionState } from "react";

import { initialAuthActionState } from "@/app/admin/action-state";
import { signInAction } from "@/app/admin/actions";
import { SubmitButton } from "@/app/admin/_components/submit-button";

type LoginFormProps = {
  next: string;
};

export function LoginForm({ next }: LoginFormProps) {
  const [state, formAction] = useActionState(
    signInAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="admin-form">
      <input name="next" type="hidden" value={next} />
      <div className="admin-field">
        <label htmlFor="admin-email">Email address</label>
        <input
          autoComplete="email"
          id="admin-email"
          inputMode="email"
          name="email"
          required
          type="email"
        />
      </div>
      <div className="admin-field">
        <label htmlFor="admin-password">Password</label>
        <input
          autoComplete="current-password"
          id="admin-password"
          name="password"
          required
          type="password"
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
      <SubmitButton label="Sign in" pendingLabel="Signing in…" />
    </form>
  );
}
