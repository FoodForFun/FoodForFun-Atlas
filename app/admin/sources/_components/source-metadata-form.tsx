"use client";

import { useActionState, useEffect, useState } from "react";

import {
  type EditorialSource,
  formatSourceStatus,
  sourceAvailabilityStatuses,
} from "@/app/_lib/editorial/source";
import { SubmitButton } from "@/app/admin/_components/submit-button";
import {
  createSourceAction,
  updateSourceMetadataAction,
} from "@/app/admin/sources/actions";
import { initialSourceMetadataActionState } from "@/app/admin/sources/action-state";

type SourceFormRecord = Pick<
  EditorialSource,
  | "availability_status"
  | "external_id"
  | "id"
  | "lock_version"
  | "original_description"
  | "original_language"
  | "original_published_at"
  | "original_title"
  | "publisher"
  | "source_type"
  | "source_url"
>;

type SourceMetadataFormProps =
  | { mode: "create"; requiresPublicationAssurance?: never; source?: never }
  | {
      mode: "edit";
      requiresPublicationAssurance: boolean;
      source: SourceFormRecord;
    };

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="admin-field-error" id={id} role="alert">
      {message}
    </p>
  ) : null;
}

function toUtcInputValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
}

export function SourceMetadataForm({
  mode,
  requiresPublicationAssurance,
  source,
}: SourceMetadataFormProps) {
  const action =
    mode === "create" ? createSourceAction : updateSourceMetadataAction;
  const [state, formAction] = useActionState(
    action,
    initialSourceMetadataActionState,
  );
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
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
          <input name="source_id" type="hidden" value={source.id} />
          <input
            name="metadata_lock_version"
            type="hidden"
            value={source.lock_version}
          />
        </>
      ) : null}

      <div className="admin-story-form-grid">
        <div className="admin-field">
          <label htmlFor="source_type">Source type</label>
          <input
            aria-describedby={describedBy("source_type") || "source-type-guidance"}
            aria-invalid={Boolean(state.fieldErrors.source_type)}
            autoCapitalize="none"
            autoCorrect="off"
            defaultValue={source?.source_type ?? ""}
            id="source_type"
            maxLength={100}
            name="source_type"
            pattern="[a-z0-9]+(?:_[a-z0-9]+)*"
            required
            spellCheck={false}
          />
          <p id="source-type-guidance">
            Lowercase words separated by underscores, such as youtube_video.
          </p>
          <FieldError
            id="source_type-error"
            message={state.fieldErrors.source_type}
          />
        </div>

        <div className="admin-field">
          <label htmlFor="availability_status">Availability</label>
          <select
            aria-describedby={describedBy("availability_status")}
            aria-invalid={Boolean(state.fieldErrors.availability_status)}
            defaultValue={(source?.availability_status ?? "").toLowerCase()}
            id="availability_status"
            name="availability_status"
          >
            <option value="">Not set</option>
            {sourceAvailabilityStatuses.map((status) => (
              <option key={status} value={status}>
                {formatSourceStatus(status)}
              </option>
            ))}
          </select>
          <FieldError
            id="availability_status-error"
            message={state.fieldErrors.availability_status}
          />
        </div>

        <div className="admin-field admin-field-wide">
          <label htmlFor="original_title">Original title</label>
          <input
            aria-describedby={describedBy("original_title")}
            aria-invalid={Boolean(state.fieldErrors.original_title)}
            defaultValue={source?.original_title ?? ""}
            id="original_title"
            maxLength={500}
            name="original_title"
            required
          />
          <FieldError
            id="original_title-error"
            message={state.fieldErrors.original_title}
          />
        </div>

        <div className="admin-field admin-field-wide">
          <label htmlFor="source_url">Source URL</label>
          <input
            aria-describedby={describedBy("source_url") || "source-url-guidance"}
            aria-invalid={Boolean(state.fieldErrors.source_url)}
            defaultValue={source?.source_url ?? ""}
            id="source_url"
            inputMode="url"
            maxLength={2_048}
            name="source_url"
            type="url"
          />
          <p id="source-url-guidance">
            A complete HTTP(S) URL. Exact matches trigger a duplicate warning.
          </p>
          <FieldError
            id="source_url-error"
            message={state.fieldErrors.source_url}
          />
        </div>

        <div className="admin-field">
          <label htmlFor="external_id">External ID</label>
          <input
            aria-describedby={describedBy("external_id")}
            aria-invalid={Boolean(state.fieldErrors.external_id)}
            defaultValue={source?.external_id ?? ""}
            id="external_id"
            maxLength={500}
            name="external_id"
          />
          <FieldError
            id="external_id-error"
            message={state.fieldErrors.external_id}
          />
        </div>

        <div className="admin-field">
          <label htmlFor="publisher">Publisher</label>
          <input
            aria-describedby={describedBy("publisher")}
            aria-invalid={Boolean(state.fieldErrors.publisher)}
            defaultValue={source?.publisher ?? ""}
            id="publisher"
            maxLength={500}
            name="publisher"
          />
          <FieldError
            id="publisher-error"
            message={state.fieldErrors.publisher}
          />
        </div>

        <div className="admin-field">
          <label htmlFor="original_published_at">
            Original publication time (UTC)
          </label>
          <input
            aria-describedby={describedBy("original_published_at")}
            aria-invalid={Boolean(state.fieldErrors.original_published_at)}
            defaultValue={toUtcInputValue(source?.original_published_at)}
            id="original_published_at"
            name="original_published_at"
            type="datetime-local"
          />
          <FieldError
            id="original_published_at-error"
            message={state.fieldErrors.original_published_at}
          />
        </div>

        <div className="admin-field">
          <label htmlFor="original_language">Original language</label>
          <input
            aria-describedby={describedBy("original_language")}
            aria-invalid={Boolean(state.fieldErrors.original_language)}
            defaultValue={source?.original_language ?? ""}
            id="original_language"
            maxLength={100}
            name="original_language"
          />
          <FieldError
            id="original_language-error"
            message={state.fieldErrors.original_language}
          />
        </div>

        <div className="admin-field admin-field-wide">
          <label htmlFor="original_description">Original description</label>
          <textarea
            aria-describedby={describedBy("original_description")}
            aria-invalid={Boolean(state.fieldErrors.original_description)}
            defaultValue={source?.original_description ?? ""}
            id="original_description"
            maxLength={20_000}
            name="original_description"
            rows={8}
          />
          <FieldError
            id="original_description-error"
            message={state.fieldErrors.original_description}
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
            separate Source record.
          </span>
        </label>
      ) : null}

      {mode === "edit" && requiresPublicationAssurance ? (
        <label className="admin-confirmation">
          <input
            name="confirm_public_source_edit"
            required
            type="checkbox"
            value="confirm-public-source-edit"
          />
          <span>
            I confirm this Source is connected to a published or scheduled
            Story and that this metadata correction may affect public content.
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
          label={mode === "create" ? "Create Source" : "Save metadata"}
          pendingLabel={mode === "create" ? "Creating…" : "Saving…"}
        />
        {dirty ? <p role="status">Unsaved changes</p> : <p>Saved version</p>}
      </div>
    </form>
  );
}
