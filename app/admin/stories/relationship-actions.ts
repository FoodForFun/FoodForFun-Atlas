"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";

import { requireEditorialAccess } from "@/app/_lib/auth/session";
import {
  canManageStoryRelationships,
  getSafeRelationshipMutationError,
  isRelationshipId,
  isStoryRelationshipType,
  type RelationshipInput,
  validateRelationshipInput,
} from "@/app/_lib/editorial/relationship";
import { isStoryId } from "@/app/_lib/editorial/story";
import { getEditorialStoryWithClient } from "@/app/_lib/editorial/stories-server";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";
import type { RelationshipActionState } from "@/app/admin/stories/relationship-action-state";

function readFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readRelationshipInput(formData: FormData): RelationshipInput {
  return {
    display_order: readFormValue(formData, "display_order"),
    is_primary: readFormValue(formData, "is_primary") === "true",
    place_relationship_type: readFormValue(
      formData,
      "place_relationship_type",
    ),
    related_id: readFormValue(formData, "related_id"),
    relationship_type: readFormValue(formData, "relationship_type"),
    source_role: readFormValue(formData, "source_role"),
    theme_relevance: readFormValue(formData, "theme_relevance"),
  };
}

function readLockVersion(formData: FormData) {
  const value = Number(readFormValue(formData, "lock_version"));
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function errorState(
  message: string,
  fieldErrors: RelationshipActionState["fieldErrors"] = {},
): RelationshipActionState {
  return { fieldErrors, message, status: "error" };
}

function verifyResult(
  data: unknown,
  storyId: string,
  relatedId: string,
  relationshipType: string,
) {
  if (!Array.isArray(data) || data.length !== 1) return false;
  const row = data[0];
  if (!row || typeof row !== "object") return false;
  const value = row as Record<string, unknown>;
  return (
    value.story_id === storyId &&
    value.related_id === relatedId &&
    value.relationship_type === relationshipType
  );
}

function refreshRelationshipPaths(storyId: string, slug: string) {
  revalidatePath("/admin/stories");
  revalidatePath(`/admin/stories/${storyId}`);
  revalidatePath(`/admin/stories/${storyId}/preview`);
  revalidatePath("/");
  revalidatePath("/stories");
  revalidatePath(`/stories/${slug}`);
  revalidatePath("/places");
  revalidatePath("/themes");
  revalidatePath("/search");
}

async function getActionContext(formData: FormData) {
  const storyId = readFormValue(formData, "story_id");
  if (!isStoryId(storyId)) return null;
  const access = await requireEditorialAccess(`/admin/stories/${storyId}`);
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const story = await getEditorialStoryWithClient(supabase, storyId);
    if (!story) return null;
    const canManage = canManageStoryRelationships({
      aal: access.identity.aal,
      role: access.role,
      story,
      userId: access.identity.userId,
    });
    return { canManage, story, storyId, supabase };
  } catch {
    return null;
  }
}

function isPublishedConfirmed(formData: FormData, published: boolean) {
  return (
    !published ||
    readFormValue(formData, "confirm_published_relationship") ===
      "confirm-published-relationship"
  );
}

export async function createStoryRelationshipAction(
  _state: RelationshipActionState,
  formData: FormData,
): Promise<RelationshipActionState> {
  void _state;
  const validated = validateRelationshipInput(readRelationshipInput(formData));
  if (!validated.data) {
    return errorState("Review the highlighted connection fields.", validated.errors);
  }

  const context = await getActionContext(formData);
  if (!context || !context.canManage) {
    return errorState(
      "Your current role, Story state, ownership, or session assurance does not permit adding this connection.",
    );
  }
  const published = context.story.status === "published";
  if (!isPublishedConfirmed(formData, published)) {
    return errorState("Confirm this published Story connection change.");
  }

  let storyId = "";
  let slug = "";
  try {
    const { data, error } = await context.supabase.rpc(
      "create_story_relationship",
      {
        attributes: validated.data.attributes,
        confirmed: published,
        target_related_id: validated.data.relatedId,
        target_relationship_type: validated.data.relationshipType,
        target_story_id: context.storyId,
      },
    );
    if (error) return errorState(getSafeRelationshipMutationError(error));
    if (
      !verifyResult(
        data,
        context.storyId,
        validated.data.relatedId,
        validated.data.relationshipType,
      )
    ) {
      return errorState("The created connection could not be verified.");
    }
    storyId = context.storyId;
    slug = context.story.slug;
  } catch {
    return errorState("The Story connection could not be created.");
  }

  refreshRelationshipPaths(storyId, slug);
  redirect(
    `/admin/stories/${storyId}?status=connection-created`,
    RedirectType.replace,
  );
}

export async function updateStoryRelationshipAction(
  _state: RelationshipActionState,
  formData: FormData,
): Promise<RelationshipActionState> {
  void _state;
  const validated = validateRelationshipInput(readRelationshipInput(formData));
  const lockVersion = readLockVersion(formData);
  if (!validated.data || !lockVersion) {
    return errorState(
      "Review the connection fields or reload its current version.",
      validated.errors,
    );
  }

  const context = await getActionContext(formData);
  if (!context || !context.canManage) {
    return errorState(
      "Your current role, Story state, ownership, or session assurance does not permit editing this connection.",
    );
  }
  const published = context.story.status === "published";
  if (!isPublishedConfirmed(formData, published)) {
    return errorState("Confirm this published Story connection change.");
  }

  let storyId = "";
  let slug = "";
  try {
    const { data, error } = await context.supabase.rpc(
      "update_story_relationship",
      {
        attributes: validated.data.attributes,
        confirmed: published,
        expected_lock_version: lockVersion,
        target_related_id: validated.data.relatedId,
        target_relationship_type: validated.data.relationshipType,
        target_story_id: context.storyId,
      },
    );
    if (error) return errorState(getSafeRelationshipMutationError(error));
    if (
      !verifyResult(
        data,
        context.storyId,
        validated.data.relatedId,
        validated.data.relationshipType,
      )
    ) {
      return errorState("The updated connection could not be verified.");
    }
    storyId = context.storyId;
    slug = context.story.slug;
  } catch {
    return errorState("The Story connection could not be updated.");
  }

  refreshRelationshipPaths(storyId, slug);
  redirect(
    `/admin/stories/${storyId}?status=connection-updated`,
    RedirectType.replace,
  );
}

export async function deleteStoryRelationshipAction(
  _state: RelationshipActionState,
  formData: FormData,
): Promise<RelationshipActionState> {
  void _state;
  const storyId = readFormValue(formData, "story_id");
  const relatedId = readFormValue(formData, "related_id");
  const relationshipType = readFormValue(formData, "relationship_type");
  const lockVersion = readLockVersion(formData);
  const removalConfirmed =
    readFormValue(formData, "confirm_removal") === "confirm-removal";

  if (
    !isStoryId(storyId) ||
    !isRelationshipId(relatedId) ||
    !isStoryRelationshipType(relationshipType) ||
    !lockVersion ||
    !removalConfirmed
  ) {
    return errorState("Confirm removal using the current connection version.");
  }

  const context = await getActionContext(formData);
  if (!context || !context.canManage) {
    return errorState(
      "Your current role, Story state, ownership, or session assurance does not permit removing this connection.",
    );
  }
  const published = context.story.status === "published";
  if (!isPublishedConfirmed(formData, published)) {
    return errorState("Confirm this published Story connection change.");
  }

  let slug = "";
  try {
    const { data, error } = await context.supabase.rpc(
      "delete_story_relationship",
      {
        confirmed: published,
        expected_lock_version: lockVersion,
        target_related_id: relatedId,
        target_relationship_type: relationshipType,
        target_story_id: context.storyId,
      },
    );
    if (error) return errorState(getSafeRelationshipMutationError(error));
    if (!verifyResult(data, context.storyId, relatedId, relationshipType)) {
      return errorState("The removed connection could not be verified.");
    }
    slug = context.story.slug;
  } catch {
    return errorState("The Story connection could not be removed.");
  }

  refreshRelationshipPaths(storyId, slug);
  redirect(
    `/admin/stories/${storyId}?status=connection-deleted`,
    RedirectType.replace,
  );
}
