"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";

import { getStoryCapabilities } from "@/app/_lib/editorial/story";
import {
  getSafeStoryMutationError,
  isStoryId,
  isStoryStatus,
  parseUtcDateTimeInput,
  type StoryInput,
  validateStoryInput,
} from "@/app/_lib/editorial/story";
import { getEditorialStoryWithClient } from "@/app/_lib/editorial/stories-server";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";
import type { StoryActionState } from "@/app/admin/stories/action-state";

const storyFields = [
  "title",
  "subtitle",
  "slug",
  "summary",
  "body",
  "atlas_insight",
  "original_language",
  "seo_title",
  "seo_description",
  "cover_image_url",
] as const satisfies ReadonlyArray<keyof StoryInput>;

function readFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readRawFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function readStoryInput(formData: FormData) {
  return Object.fromEntries(
    storyFields.map((field) => [field, readRawFormValue(formData, field)]),
  ) as StoryInput;
}

function readLockVersion(formData: FormData) {
  const value = Number(readFormValue(formData, "lock_version"));
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function errorState(
  message: string,
  fieldErrors: StoryActionState["fieldErrors"] = {},
): StoryActionState {
  return { fieldErrors, message, status: "error" };
}

function getReturnedEntityId(data: unknown) {
  if (!Array.isArray(data) || data.length !== 1) {
    return null;
  }

  const row = data[0];

  if (!row || typeof row !== "object") {
    return null;
  }

  const entityId = (row as Record<string, unknown>).entity_id;
  return typeof entityId === "string" && isStoryId(entityId)
    ? entityId
    : null;
}

function getReturnedStoryId(data: unknown) {
  if (!Array.isArray(data) || data.length !== 1) {
    return null;
  }

  const row = data[0];

  if (!row || typeof row !== "object") {
    return null;
  }

  const storyId = (row as Record<string, unknown>).story_id;
  return typeof storyId === "string" && isStoryId(storyId) ? storyId : null;
}

function refreshStoryPaths(storyId: string, slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/stories");
  revalidatePath(`/admin/stories/${storyId}`);
  revalidatePath(`/admin/stories/${storyId}/preview`);
  revalidatePath("/stories");

  if (slug) {
    revalidatePath(`/stories/${slug}`);
  }
}

export async function createStoryAction(
  _state: StoryActionState,
  formData: FormData,
): Promise<StoryActionState> {
  void _state;
  await requireEditorialAccess("/admin/stories/new");
  const validated = validateStoryInput(readStoryInput(formData));

  if (!validated.data) {
    return errorState(
      "Review the highlighted Story fields before creating the draft.",
      validated.errors,
    );
  }

  let storyId: string | null = null;

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const { data, error } = await supabase.rpc("create_editorial_entity", {
      payload: validated.data,
      target_entity_type: "stories",
    });

    if (error) {
      const safeError = getSafeStoryMutationError(error);
      return errorState(
        safeError.message,
        safeError.kind === "duplicate"
          ? { slug: "Choose a unique Story slug." }
          : {},
      );
    }

    storyId = getReturnedEntityId(data);
  } catch {
    return errorState(
      "The Story draft could not be created. Your entered text remains here.",
    );
  }

  if (!storyId) {
    return errorState("The created Story could not be verified.");
  }

  refreshStoryPaths(storyId);
  redirect(`/admin/stories/${storyId}?status=created`, RedirectType.replace);
}

export async function updateStoryAction(
  _state: StoryActionState,
  formData: FormData,
): Promise<StoryActionState> {
  void _state;
  const storyId = readFormValue(formData, "story_id");
  const expectedLockVersion = readLockVersion(formData);

  if (!isStoryId(storyId) || !expectedLockVersion) {
    return errorState("The Story edit context is invalid. Reload the editor.");
  }

  const access = await requireEditorialAccess(`/admin/stories/${storyId}`);
  const validated = validateStoryInput(readStoryInput(formData));

  if (!validated.data) {
    return errorState(
      "Review the highlighted Story fields before saving.",
      validated.errors,
    );
  }

  let slug: string | undefined;

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const story = await getEditorialStoryWithClient(supabase, storyId);

    if (!story) {
      return errorState("The Story is no longer available to this account.");
    }

    const capabilities = getStoryCapabilities({
      aal: access.identity.aal,
      role: access.role,
      story,
      userId: access.identity.userId,
    });

    if (!capabilities.canEdit) {
      return errorState(
        "Your current role or session assurance does not permit this edit.",
      );
    }

    const publishedEditConfirmed =
      story.status !== "published" ||
      readFormValue(formData, "confirm_published_edit") ===
        "confirm-published-edit";

    if (!publishedEditConfirmed) {
      return errorState(
        "Confirm that the published Story correction should become public immediately.",
      );
    }

    const { data, error } = await supabase.rpc("update_editorial_entity", {
      changes: validated.data,
      confirmed: story.status === "published",
      expected_lock_version: expectedLockVersion,
      target_entity_id: storyId,
      target_entity_type: "stories",
    });

    if (error) {
      const safeError = getSafeStoryMutationError(error);
      return errorState(
        safeError.message,
        safeError.kind === "duplicate"
          ? { slug: "Choose a unique Story slug." }
          : {},
      );
    }

    if (getReturnedEntityId(data) !== storyId) {
      return errorState("The Story save result could not be verified.");
    }

    slug = validated.data.slug;
  } catch {
    return errorState(
      "The Story could not be saved. Your entered text remains here.",
    );
  }

  refreshStoryPaths(storyId, slug);
  redirect(`/admin/stories/${storyId}?status=saved`, RedirectType.replace);
}

export async function transitionStoryAction(
  _state: StoryActionState,
  formData: FormData,
): Promise<StoryActionState> {
  void _state;
  const storyId = readFormValue(formData, "story_id");
  const targetStatus = readFormValue(formData, "target_status");
  const expectedLockVersion = readLockVersion(formData);

  if (
    !isStoryId(storyId) ||
    !isStoryStatus(targetStatus) ||
    !expectedLockVersion
  ) {
    return errorState("The Story workflow context is invalid. Reload the editor.");
  }

  const access = await requireEditorialAccess(`/admin/stories/${storyId}`);
  let slug: string | undefined;

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const story = await getEditorialStoryWithClient(supabase, storyId);

    if (!story) {
      return errorState("The Story is no longer available to this account.");
    }

    const transition = getStoryCapabilities({
      aal: access.identity.aal,
      role: access.role,
      story,
      userId: access.identity.userId,
    }).transitions.find(({ status }) => status === targetStatus);

    if (!transition) {
      return errorState(
        "Your current role, Story state, or session assurance does not permit this transition.",
      );
    }

    const confirmed = transition.confirmation
      ? readFormValue(formData, "confirm_transition") ===
        "confirm-story-transition"
      : false;

    if (transition.confirmation && !confirmed) {
      return errorState("Confirm this publication-level Story transition.");
    }

    const requestedPublishedAt = transition.publishedAtRequired
      ? parseUtcDateTimeInput(readFormValue(formData, "published_at"))
      : null;

    if (transition.publishedAtRequired && !requestedPublishedAt) {
      return errorState("Enter a valid publication date and time in UTC.");
    }

    const { data, error } = await supabase.rpc("transition_story_status", {
      confirmed,
      expected_lock_version: expectedLockVersion,
      new_status: targetStatus,
      requested_published_at: requestedPublishedAt,
      target_story_id: storyId,
    });

    if (error) {
      return errorState(getSafeStoryMutationError(error).message);
    }

    if (getReturnedStoryId(data) !== storyId) {
      return errorState("The Story transition result could not be verified.");
    }

    slug = story.slug;
  } catch {
    return errorState("The Story workflow action could not be completed.");
  }

  refreshStoryPaths(storyId, slug);
  redirect(
    `/admin/stories/${storyId}?status=transitioned`,
    RedirectType.replace,
  );
}

export async function softDeleteStoryAction(
  _state: StoryActionState,
  formData: FormData,
): Promise<StoryActionState> {
  void _state;
  const storyId = readFormValue(formData, "story_id");
  const expectedLockVersion = readLockVersion(formData);

  if (!isStoryId(storyId) || !expectedLockVersion) {
    return errorState("The Story deletion context is invalid. Reload the editor.");
  }

  const access = await requireEditorialAccess(`/admin/stories/${storyId}`);
  let slug: string | undefined;

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const story = await getEditorialStoryWithClient(supabase, storyId);

    if (
      !story ||
      !getStoryCapabilities({
        aal: access.identity.aal,
        role: access.role,
        story,
        userId: access.identity.userId,
      }).canDelete
    ) {
      return errorState(
        "A confirmed Publisher AAL2 session is required to soft-delete this Story.",
      );
    }

    if (
      readFormValue(formData, "confirm_soft_delete") !==
      "confirm-soft-delete"
    ) {
      return errorState("Confirm the recoverable Story deletion.");
    }

    const { data, error } = await supabase.rpc("soft_delete_entity", {
      confirmed: true,
      expected_lock_version: expectedLockVersion,
      target_entity_id: storyId,
      target_entity_type: "stories",
    });

    if (error) {
      return errorState(getSafeStoryMutationError(error).message);
    }

    if (getReturnedEntityId(data) !== storyId) {
      return errorState("The Story deletion result could not be verified.");
    }

    slug = story.slug;
  } catch {
    return errorState("The Story could not be soft-deleted.");
  }

  refreshStoryPaths(storyId, slug);
  redirect(`/admin/stories/${storyId}?status=deleted`, RedirectType.replace);
}

export async function restoreStoryAction(
  _state: StoryActionState,
  formData: FormData,
): Promise<StoryActionState> {
  void _state;
  const storyId = readFormValue(formData, "story_id");
  const expectedLockVersion = readLockVersion(formData);

  if (!isStoryId(storyId) || !expectedLockVersion) {
    return errorState("The Story recovery context is invalid. Reload the editor.");
  }

  const access = await requireEditorialAccess(`/admin/stories/${storyId}`);
  let slug: string | undefined;

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const story = await getEditorialStoryWithClient(supabase, storyId);

    if (
      !story ||
      !getStoryCapabilities({
        aal: access.identity.aal,
        role: access.role,
        story,
        userId: access.identity.userId,
      }).canRestore
    ) {
      return errorState(
        "A confirmed Publisher AAL2 session is required to restore this Story.",
      );
    }

    if (
      readFormValue(formData, "confirm_restore") !== "confirm-story-restore"
    ) {
      return errorState("Confirm the Story restoration.");
    }

    const { data, error } = await supabase.rpc(
      "restore_soft_deleted_entity",
      {
        confirmed: true,
        expected_lock_version: expectedLockVersion,
        target_entity_id: storyId,
        target_entity_type: "stories",
      },
    );

    if (error) {
      return errorState(getSafeStoryMutationError(error).message);
    }

    if (getReturnedEntityId(data) !== storyId) {
      return errorState("The Story restoration result could not be verified.");
    }

    slug = story.slug;
  } catch {
    return errorState("The Story could not be restored.");
  }

  refreshStoryPaths(storyId, slug);
  redirect(`/admin/stories/${storyId}?status=restored`, RedirectType.replace);
}
