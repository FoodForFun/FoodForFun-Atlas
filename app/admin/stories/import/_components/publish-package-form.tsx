"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SubmitButton } from "@/app/admin/_components/submit-button";
import { initialAtlasImportActionState } from "@/app/admin/stories/import/action-state";
import { publishAtlasPackageAction } from "@/app/admin/stories/import/actions";

export function PublishPackageForm() {
  const [state, action] = useActionState(publishAtlasPackageAction, initialAtlasImportActionState);
  return (
    <form action={action} className="admin-form admin-story-form">
      <div className="admin-field">
        <label htmlFor="publish_package">Approved publish-package.json</label>
        <textarea id="publish_package" maxLength={1_000_000} name="publish_package" required rows={22} spellCheck={false} />
        <p>Paste the file generated after daily copy approval. Atlas validates bilingual copy, tags, the original YouTube ID/URL, a primary Place, and Theme categories.</p>
      </div>
      <label className="admin-confirmation">
        <input name="confirm_publish" required type="checkbox" value="confirm-publish" />
        <span>I confirm this package has been editorially approved and should be published to Atlas now.</span>
      </label>
      {state.status === "error" ? (
        <p className="admin-form-message admin-form-message-error" role="alert">
          {state.message} {state.storyId ? <Link href={`/admin/stories/${state.storyId}`}>Open approved Story</Link> : null}
        </p>
      ) : null}
      <SubmitButton label="Publish package to Atlas" pendingLabel="Publishing…" />
    </form>
  );
}
