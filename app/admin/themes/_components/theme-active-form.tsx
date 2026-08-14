"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/app/admin/_components/submit-button";
import { setThemeActiveAction } from "@/app/admin/themes/actions";
import { initialThemeActionState } from "@/app/admin/themes/action-state";

export function ThemeActiveForm({
  active,
  lockVersion,
  themeId,
}: {
  active: boolean;
  lockVersion: number;
  themeId: string;
}) {
  const [state, action] = useActionState(
    setThemeActiveAction,
    initialThemeActionState,
  );
  const nextActive = !active;
  return (
    <form action={action} className="admin-workflow-form">
      <input name="theme_id" type="hidden" value={themeId} />
      <input name="lock_version" type="hidden" value={lockVersion} />
      <input name="next_active" type="hidden" value={String(nextActive)} />
      <h3>{nextActive ? "Reactivate Theme" : "Deactivate Theme"}</h3>
      <p>
        {nextActive
          ? "Reactivation makes this Theme publicly readable and available for new Story connections."
          : "Deactivation hides the Theme publicly and prevents new connections without deleting existing records."}
      </p>
      <label className="admin-confirmation">
        <input
          name="confirm_state_change"
          required
          type="checkbox"
          value="confirm-state-change"
        />
        <span>I confirm this Theme state change.</span>
      </label>
      {state.status === "error" ? (
        <p className="admin-form-message admin-form-message-error" role="alert">
          {state.message}
        </p>
      ) : null}
      <SubmitButton
        label={nextActive ? "Reactivate Theme" : "Deactivate Theme"}
        pendingLabel={nextActive ? "Reactivating…" : "Deactivating…"}
      />
    </form>
  );
}
