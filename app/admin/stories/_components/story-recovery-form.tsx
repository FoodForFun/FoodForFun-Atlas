"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/app/admin/_components/submit-button";
import {
  restoreStoryAction,
  softDeleteStoryAction,
} from "@/app/admin/stories/actions";
import { initialStoryActionState } from "@/app/admin/stories/action-state";

type StoryRecoveryFormProps = {
  lockVersion: number;
  mode: "delete" | "restore";
  storyId: string;
};

export function StoryRecoveryForm({
  lockVersion,
  mode,
  storyId,
}: StoryRecoveryFormProps) {
  const action = mode === "delete" ? softDeleteStoryAction : restoreStoryAction;
  const [state, formAction] = useActionState(action, initialStoryActionState);

  return (
    <form action={formAction} className="admin-workflow-form">
      <input name="story_id" type="hidden" value={storyId} />
      <input name="lock_version" type="hidden" value={lockVersion} />
      <h3>{mode === "delete" ? "Soft-delete Story" : "Restore Story"}</h3>
      <p>
        {mode === "delete"
          ? "The Story will be removed from editorial work and public access, but its record and revision history will be preserved."
          : "The Story will return to the editorial workflow in its preserved lifecycle state."}
      </p>
      <label className="admin-confirmation">
        <input
          name={mode === "delete" ? "confirm_soft_delete" : "confirm_restore"}
          required
          type="checkbox"
          value={
            mode === "delete" ? "confirm-soft-delete" : "confirm-story-restore"
          }
        />
        <span>
          {mode === "delete"
            ? "I confirm this recoverable deletion."
            : "I confirm this Story restoration."}
        </span>
      </label>
      {state.status === "error" ? (
        <p className="admin-form-message admin-form-message-error" role="alert">
          {state.message}
        </p>
      ) : null}
      <SubmitButton
        label={mode === "delete" ? "Soft-delete Story" : "Restore Story"}
        pendingLabel={mode === "delete" ? "Removing…" : "Restoring…"}
      />
    </form>
  );
}
