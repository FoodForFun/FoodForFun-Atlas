"use client";

import { useActionState, useEffect, useState } from "react";

import {
  type EditorialSourcePrivateDetails,
  formatSourceStatus,
  sourceProcessingStatuses,
  sourceRightsStatuses,
  sourceTranscriptQualities,
} from "@/app/_lib/editorial/source";
import { SubmitButton } from "@/app/admin/_components/submit-button";
import { updateSourcePrivateDetailsAction } from "@/app/admin/sources/actions";
import { initialSourcePrivateActionState } from "@/app/admin/sources/action-state";

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="admin-field-error" id={id} role="alert">
      {message}
    </p>
  ) : null;
}

export function SourcePrivateForm({
  details,
  requiresPublicationAssurance,
}: {
  details: EditorialSourcePrivateDetails;
  requiresPublicationAssurance: boolean;
}) {
  const [state, formAction] = useActionState(
    updateSourcePrivateDetailsAction,
    initialSourcePrivateActionState,
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
      <input name="source_id" type="hidden" value={details.source_id} />
      <input
        name="private_lock_version"
        type="hidden"
        value={details.lock_version}
      />

      <div className="admin-story-form-grid">
        <div className="admin-field">
          <label htmlFor="transcript_quality">Transcript quality</label>
          <select
            aria-describedby={describedBy("transcript_quality")}
            aria-invalid={Boolean(state.fieldErrors.transcript_quality)}
            defaultValue={(details.transcript_quality ?? "").toLowerCase()}
            id="transcript_quality"
            name="transcript_quality"
          >
            <option value="">Not set</option>
            {sourceTranscriptQualities.map((status) => (
              <option key={status} value={status}>
                {formatSourceStatus(status)}
              </option>
            ))}
          </select>
          <FieldError
            id="transcript_quality-error"
            message={state.fieldErrors.transcript_quality}
          />
        </div>

        <div className="admin-field">
          <label htmlFor="processing_status">Processing status</label>
          <select
            aria-describedby={describedBy("processing_status")}
            aria-invalid={Boolean(state.fieldErrors.processing_status)}
            defaultValue={details.processing_status.toLowerCase()}
            id="processing_status"
            name="processing_status"
            required
          >
            {sourceProcessingStatuses.map((status) => (
              <option key={status} value={status}>
                {formatSourceStatus(status)}
              </option>
            ))}
          </select>
          <FieldError
            id="processing_status-error"
            message={state.fieldErrors.processing_status}
          />
        </div>

        <div className="admin-field admin-field-wide">
          <label htmlFor="raw_transcript">Raw transcript</label>
          <textarea
            aria-describedby={describedBy("raw_transcript")}
            aria-invalid={Boolean(state.fieldErrors.raw_transcript)}
            defaultValue={details.raw_transcript ?? ""}
            id="raw_transcript"
            maxLength={500_000}
            name="raw_transcript"
            rows={16}
          />
          <FieldError
            id="raw_transcript-error"
            message={state.fieldErrors.raw_transcript}
          />
        </div>

        <div className="admin-field admin-field-wide">
          <label htmlFor="cleaned_transcript">Cleaned transcript</label>
          <textarea
            aria-describedby={describedBy("cleaned_transcript")}
            aria-invalid={Boolean(state.fieldErrors.cleaned_transcript)}
            defaultValue={details.cleaned_transcript ?? ""}
            id="cleaned_transcript"
            maxLength={500_000}
            name="cleaned_transcript"
            rows={16}
          />
          <FieldError
            id="cleaned_transcript-error"
            message={state.fieldErrors.cleaned_transcript}
          />
        </div>

        <div className="admin-field">
          <label htmlFor="rights_status">Rights status</label>
          <select
            aria-describedby={describedBy("rights_status")}
            aria-invalid={Boolean(state.fieldErrors.rights_status)}
            defaultValue={details.rights_status.toLowerCase()}
            id="rights_status"
            name="rights_status"
            required
          >
            {sourceRightsStatuses.map((status) => (
              <option key={status} value={status}>
                {formatSourceStatus(status)}
              </option>
            ))}
          </select>
          <FieldError
            id="rights_status-error"
            message={state.fieldErrors.rights_status}
          />
        </div>

        <div className="admin-field admin-field-wide">
          <label htmlFor="rights_note">Rights note</label>
          <textarea
            aria-describedby={describedBy("rights_note")}
            aria-invalid={Boolean(state.fieldErrors.rights_note)}
            defaultValue={details.rights_note ?? ""}
            id="rights_note"
            maxLength={20_000}
            name="rights_note"
            rows={6}
          />
          <FieldError
            id="rights_note-error"
            message={state.fieldErrors.rights_note}
          />
        </div>

        <div className="admin-field admin-field-wide">
          <label htmlFor="internal_note">Internal note</label>
          <textarea
            aria-describedby={describedBy("internal_note")}
            aria-invalid={Boolean(state.fieldErrors.internal_note)}
            defaultValue={details.internal_note ?? ""}
            id="internal_note"
            maxLength={20_000}
            name="internal_note"
            rows={6}
          />
          <FieldError
            id="internal_note-error"
            message={state.fieldErrors.internal_note}
          />
        </div>
      </div>

      {requiresPublicationAssurance ? (
        <label className="admin-confirmation">
          <input
            name="confirm_public_source_edit"
            required
            type="checkbox"
            value="confirm-public-source-edit"
          />
          <span>
            I confirm this private review belongs to a Source connected to a
            published or scheduled Story and may affect publication checks.
          </span>
        </label>
      ) : null}

      {state.status === "error" ? (
        <p className="admin-form-message admin-form-message-error" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="admin-form-actions">
        <SubmitButton label="Save private details" pendingLabel="Saving…" />
        {dirty ? <p role="status">Unsaved changes</p> : <p>Saved version</p>}
      </div>
    </form>
  );
}
