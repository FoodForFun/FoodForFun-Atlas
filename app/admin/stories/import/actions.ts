"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";

import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { isStoryId } from "@/app/_lib/editorial/story";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";
import type { AtlasImportActionState } from "@/app/admin/stories/import/action-state";

function error(message: string, storyId?: string): AtlasImportActionState {
  return { message, status: "error", storyId };
}

function importValidationError(errorDetails: { code?: string; message?: string } | null): string {
  const safeCodes = new Set(["22023", "23514", "42501"]);
  const code = errorDetails?.code?.trim();
  const message = errorDetails?.message?.trim();
  if (code && safeCodes.has(code) && message && message.length <= 240) {
    return `Atlas validation: ${message} Nothing was imported.`;
  }
  if (code && /^[A-Z0-9]{5}$/.test(code)) {
    return `The package did not pass Atlas validation (code ${code}). Nothing was imported.`;
  }
  return "The package did not pass Atlas validation. Nothing was imported.";
}

function importedStory(data: unknown) {
  if (!Array.isArray(data) || data.length !== 1 || !data[0] || typeof data[0] !== "object") return null;
  const row = data[0] as Record<string, unknown>;
  return typeof row.story_id === "string" && isStoryId(row.story_id) &&
    typeof row.lock_version === "number"
    ? { id: row.story_id, lockVersion: row.lock_version }
    : null;
}

export async function publishAtlasPackageAction(
  _state: AtlasImportActionState,
  formData: FormData,
): Promise<AtlasImportActionState> {
  void _state;
  const access = await requireEditorialAccess("/admin/stories/import");
  if (access.role !== "publisher" || access.identity.aal !== "aal2") {
    return error("Publish to Atlas requires a Publisher session verified with MFA.");
  }
  if (formData.get("confirm_publish") !== "confirm-publish") {
    return error("Confirm that the approved package should become public now.");
  }
  const raw = formData.get("publish_package");
  if (typeof raw !== "string" || !raw.trim() || raw.length > 1_000_000) {
    return error("Paste one Atlas publish-package.json file of 1 MB or less.");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return error("The publish package is not valid JSON.");
  }

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const imported = await supabase.rpc("import_approved_atlas_package", { payload });
    if (imported.error) {
      return error(importValidationError(imported.error));
    }
    const story = importedStory(imported.data);
    if (!story) return error("The imported Story could not be verified.");

    const published = await supabase.rpc("transition_story_status", {
      confirmed: true,
      expected_lock_version: story.lockVersion,
      new_status: "published",
      requested_published_at: new Date().toISOString(),
      target_story_id: story.id,
    });
    if (published.error) {
      return error(
        "The package was imported as Approved, but publication checks did not pass. Open the Story to review and publish it.",
        story.id,
      );
    }

    for (const path of ["/", "/stories", "/places", "/themes", "/search", "/admin", "/admin/stories", `/admin/stories/${story.id}`]) {
      revalidatePath(path);
    }
    redirect(`/admin/stories/${story.id}?status=published`, RedirectType.replace);
  } catch (caught) {
    if (caught && typeof caught === "object" && "digest" in caught) throw caught;
    return error("Atlas publishing is temporarily unavailable. No unverified result was accepted.");
  }
}
