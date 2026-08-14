"use client";

import { useActionState, useEffect, useState } from "react";

import type { EditorialTheme } from "@/app/_lib/editorial/theme";
import { SubmitButton } from "@/app/admin/_components/submit-button";
import {
  createThemeAction,
  updateThemeAction,
} from "@/app/admin/themes/actions";
import { initialThemeActionState } from "@/app/admin/themes/action-state";

type ThemeFormProps =
  | { mode: "create"; theme?: never }
  | {
      mode: "edit";
      theme: Pick<
        EditorialTheme,
        "description" | "id" | "lock_version" | "name" | "slug" | "theme_group"
      >;
    };

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="admin-field-error" id={id} role="alert">
      {message}
    </p>
  ) : null;
}

export function ThemeForm({ mode, theme }: ThemeFormProps) {
  const action = mode === "create" ? createThemeAction : updateThemeAction;
  const [state, formAction] = useActionState(action, initialThemeActionState);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  const describedBy = (field: keyof typeof state.fieldErrors) =>
    state.fieldErrors[field] ? `${field}-error` : undefined;

  return (
    <form
      action={formAction}
      className="admin-form admin-story-form"
      onChange={() => setDirty(true)}
    >
      {mode === "edit" ? (
        <>
          <input name="theme_id" type="hidden" value={theme.id} />
          <input name="lock_version" type="hidden" value={theme.lock_version} />
        </>
      ) : null}

      <div className="admin-story-form-grid">
        <div className="admin-field">
          <label htmlFor="name">Theme name</label>
          <input
            aria-describedby={describedBy("name")}
            aria-invalid={Boolean(state.fieldErrors.name)}
            defaultValue={theme?.name ?? ""}
            id="name"
            maxLength={200}
            name="name"
            required
          />
          <FieldError id="name-error" message={state.fieldErrors.name} />
        </div>

        <div className="admin-field">
          <label htmlFor="slug">Slug</label>
          <input
            aria-describedby={describedBy("slug") || "theme-slug-guidance"}
            aria-invalid={Boolean(state.fieldErrors.slug)}
            autoCapitalize="none"
            autoCorrect="off"
            defaultValue={theme?.slug ?? ""}
            id="slug"
            maxLength={200}
            name="slug"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
            spellCheck={false}
          />
          <p id="theme-slug-guidance">
            Lowercase words separated by single hyphens.
          </p>
          <FieldError id="slug-error" message={state.fieldErrors.slug} />
        </div>

        <div className="admin-field admin-field-wide">
          <label htmlFor="theme_group">Theme group</label>
          <input
            aria-describedby={describedBy("theme_group")}
            aria-invalid={Boolean(state.fieldErrors.theme_group)}
            defaultValue={theme?.theme_group ?? ""}
            id="theme_group"
            maxLength={200}
            name="theme_group"
          />
          <FieldError
            id="theme_group-error"
            message={state.fieldErrors.theme_group}
          />
        </div>

        <div className="admin-field admin-field-wide">
          <label htmlFor="description">Description</label>
          <textarea
            aria-describedby={describedBy("description")}
            aria-invalid={Boolean(state.fieldErrors.description)}
            defaultValue={theme?.description ?? ""}
            id="description"
            maxLength={10_000}
            name="description"
            rows={8}
          />
          <FieldError
            id="description-error"
            message={state.fieldErrors.description}
          />
        </div>
      </div>

      {state.status === "duplicate" ? (
        <label className="admin-confirmation">
          <input
            name="confirm_duplicate"
            required
            type="checkbox"
            value="confirm-duplicate"
          />
          <span>
            I reviewed the possible duplicate and confirm this should remain a
            separate reusable Theme.
          </span>
        </label>
      ) : null}

      {state.status !== "idle" ? (
        <p className="admin-form-message admin-form-message-error" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="admin-form-actions">
        <SubmitButton
          label={mode === "create" ? "Create Theme" : "Save Theme"}
          pendingLabel={mode === "create" ? "Creating…" : "Saving…"}
        />
        {dirty ? <p role="status">Unsaved changes</p> : <p>Saved version</p>}
      </div>
    </form>
  );
}
