"use client";

import { useActionState } from "react";

import type { StoryTransition } from "@/app/_lib/editorial/story";
import { SubmitButton } from "@/app/admin/_components/submit-button";
import { transitionStoryAction } from "@/app/admin/stories/actions";
import { initialStoryActionState } from "@/app/admin/stories/action-state";

type StoryTransitionFormProps = {
  lockVersion: number;
  storyId: string;
  transition: StoryTransition;
};

function getDefaultUtcDateTime() {
  const date = new Date(Date.now() + 60_000);
  return date.toISOString().slice(0, 16);
}

export function StoryTransitionForm({
  lockVersion,
  storyId,
  transition,
}: StoryTransitionFormProps) {
  const [state, formAction] = useActionState(
    transitionStoryAction,
    initialStoryActionState,
  );

  return (
    <form action={formAction} className="admin-workflow-form">
      <input name="story_id" type="hidden" value={storyId} />
      <input name="lock_version" type="hidden" value={lockVersion} />
      <input name="target_status" type="hidden" value={transition.status} />

      <h3>{transition.label}</h3>

      {transition.publishedAtRequired ? (
        <div className="admin-field">
          <label htmlFor={`published_at-${transition.status}`}>
            Publication time (UTC)
          </label>
          <input
            defaultValue={getDefaultUtcDateTime()}
            id={`published_at-${transition.status}`}
            name="published_at"
            required
            type="datetime-local"
          />
          <p>Use a future UTC time to schedule publication.</p>
        </div>
      ) : null}

      {transition.confirmation ? (
        <label className="admin-confirmation">
          <input
            name="confirm_transition"
            required
            type="checkbox"
            value="confirm-story-transition"
          />
          <span>{transition.confirmation}</span>
        </label>
      ) : null}

      {state.status === "error" ? (
        <p className="admin-form-message admin-form-message-error" role="alert">
          {state.message}
        </p>
      ) : null}

      <SubmitButton label={transition.label} pendingLabel="Updating…" />
    </form>
  );
}
