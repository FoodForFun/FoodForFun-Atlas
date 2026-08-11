"use client";

import { useActionState, useEffect, useState } from "react";

import type { EditorialStory } from "@/app/_lib/editorial/story";
import { SubmitButton } from "@/app/admin/_components/submit-button";
import {
  createStoryAction,
  updateStoryAction,
} from "@/app/admin/stories/actions";
import { initialStoryActionState } from "@/app/admin/stories/action-state";

type StoryFormRecord = Pick<
  EditorialStory,
  | "atlas_insight"
  | "body"
  | "cover_image_url"
  | "id"
  | "lock_version"
  | "original_language"
  | "seo_description"
  | "seo_title"
  | "slug"
  | "status"
  | "subtitle"
  | "summary"
  | "title"
>;

type StoryFormProps =
  | { mode: "create"; story?: never }
  | { mode: "edit"; story: StoryFormRecord };

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="admin-field-error" id={id} role="alert">
      {message}
    </p>
  ) : null;
}

export function StoryForm({ mode, story }: StoryFormProps) {
  const action = mode === "create" ? createStoryAction : updateStoryAction;
  const [state, formAction] = useActionState(action, initialStoryActionState);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) {
      return;
    }

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
          <input name="story_id" type="hidden" value={story.id} />
          <input
            name="lock_version"
            type="hidden"
            value={story.lock_version}
          />
        </>
      ) : null}

      <div className="admin-story-form-grid">
        <div className="admin-field admin-field-wide">
          <label htmlFor="title">Title</label>
          <input
            aria-describedby={describedBy("title")}
            aria-invalid={Boolean(state.fieldErrors.title)}
            defaultValue={story?.title ?? ""}
            id="title"
            maxLength={200}
            name="title"
            required
          />
          <FieldError id="title-error" message={state.fieldErrors.title} />
        </div>

        <div className="admin-field">
          <label htmlFor="slug">Slug</label>
          <input
            aria-describedby={describedBy("slug") || "slug-guidance"}
            aria-invalid={Boolean(state.fieldErrors.slug)}
            autoCapitalize="none"
            autoCorrect="off"
            defaultValue={story?.slug ?? ""}
            id="slug"
            maxLength={200}
            name="slug"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
            spellCheck={false}
          />
          <p id="slug-guidance">Lowercase words separated by single hyphens.</p>
          <FieldError id="slug-error" message={state.fieldErrors.slug} />
        </div>

        <div className="admin-field">
          <label htmlFor="original_language">Original language</label>
          <input
            aria-describedby={describedBy("original_language")}
            aria-invalid={Boolean(state.fieldErrors.original_language)}
            defaultValue={story?.original_language ?? ""}
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
          <label htmlFor="subtitle">Subtitle</label>
          <input
            aria-describedby={describedBy("subtitle")}
            aria-invalid={Boolean(state.fieldErrors.subtitle)}
            defaultValue={story?.subtitle ?? ""}
            id="subtitle"
            maxLength={300}
            name="subtitle"
          />
          <FieldError
            id="subtitle-error"
            message={state.fieldErrors.subtitle}
          />
        </div>

        <div className="admin-field admin-field-wide">
          <label htmlFor="summary">Summary</label>
          <textarea
            aria-describedby={describedBy("summary")}
            aria-invalid={Boolean(state.fieldErrors.summary)}
            defaultValue={story?.summary ?? ""}
            id="summary"
            maxLength={1_000}
            name="summary"
            required
            rows={4}
          />
          <FieldError
            id="summary-error"
            message={state.fieldErrors.summary}
          />
        </div>

        <div className="admin-field admin-field-wide">
          <label htmlFor="body">Body</label>
          <textarea
            aria-describedby={describedBy("body") || "body-guidance"}
            aria-invalid={Boolean(state.fieldErrors.body)}
            defaultValue={story?.body ?? ""}
            id="body"
            maxLength={100_000}
            name="body"
            required
            rows={18}
          />
          <p id="body-guidance">
            Plain text only for this MVP. Separate paragraphs with a blank line.
          </p>
          <FieldError id="body-error" message={state.fieldErrors.body} />
        </div>

        <div className="admin-field admin-field-wide">
          <label htmlFor="atlas_insight">Atlas insight</label>
          <textarea
            aria-describedby={describedBy("atlas_insight")}
            aria-invalid={Boolean(state.fieldErrors.atlas_insight)}
            defaultValue={story?.atlas_insight ?? ""}
            id="atlas_insight"
            maxLength={2_000}
            name="atlas_insight"
            rows={5}
          />
          <FieldError
            id="atlas_insight-error"
            message={state.fieldErrors.atlas_insight}
          />
        </div>

        <div className="admin-field">
          <label htmlFor="seo_title">SEO title</label>
          <input
            aria-describedby={describedBy("seo_title")}
            aria-invalid={Boolean(state.fieldErrors.seo_title)}
            defaultValue={story?.seo_title ?? ""}
            id="seo_title"
            maxLength={300}
            name="seo_title"
          />
          <FieldError
            id="seo_title-error"
            message={state.fieldErrors.seo_title}
          />
        </div>

        <div className="admin-field">
          <label htmlFor="seo_description">SEO description</label>
          <textarea
            aria-describedby={describedBy("seo_description")}
            aria-invalid={Boolean(state.fieldErrors.seo_description)}
            defaultValue={story?.seo_description ?? ""}
            id="seo_description"
            maxLength={1_000}
            name="seo_description"
            rows={4}
          />
          <FieldError
            id="seo_description-error"
            message={state.fieldErrors.seo_description}
          />
        </div>

        <div className="admin-field admin-field-wide">
          <label htmlFor="cover_image_url">Cover image URL</label>
          <input
            aria-describedby={
              describedBy("cover_image_url") || "cover-image-guidance"
            }
            aria-invalid={Boolean(state.fieldErrors.cover_image_url)}
            defaultValue={story?.cover_image_url ?? ""}
            id="cover_image_url"
            inputMode="url"
            maxLength={2_048}
            name="cover_image_url"
            type="url"
          />
          <p id="cover-image-guidance">
            Optional public HTTP(S) image reference. Uploads are not available yet.
          </p>
          <FieldError
            id="cover_image_url-error"
            message={state.fieldErrors.cover_image_url}
          />
        </div>
      </div>

      {story?.status === "published" ? (
        <label className="admin-confirmation">
          <input
            name="confirm_published_edit"
            required
            type="checkbox"
            value="confirm-published-edit"
          />
          <span>
            I confirm that this correction to a published Story should become
            public immediately. The database will retain the prior revision.
          </span>
        </label>
      ) : null}

      {state.status === "error" ? (
        <p className="admin-form-message admin-form-message-error" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="admin-form-actions">
        <SubmitButton
          label={mode === "create" ? "Create draft" : "Save Story"}
          pendingLabel={mode === "create" ? "Creating…" : "Saving…"}
        />
        {dirty ? <p role="status">Unsaved changes</p> : <p>Saved version</p>}
      </div>
    </form>
  );
}
