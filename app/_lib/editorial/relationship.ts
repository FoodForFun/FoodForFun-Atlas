import type { EditorialRole } from "../auth/membership";
import type { EditorialStory } from "./story";

export const storyRelationshipTypes = [
  "story_sources",
  "story_places",
  "story_themes",
] as const;
export const sourceRoles = [
  "primary",
  "supporting",
  "context",
  "fact_check",
] as const;
export const placeRelationshipTypes = [
  "featured",
  "origin",
  "setting",
  "mentioned",
] as const;
export const themeRelevances = ["primary", "related", "contextual"] as const;

export type StoryRelationshipType = (typeof storyRelationshipTypes)[number];
export type SourceRole = (typeof sourceRoles)[number];
export type PlaceRelationshipType = (typeof placeRelationshipTypes)[number];
export type ThemeRelevance = (typeof themeRelevances)[number];

export type RelationshipInput = {
  display_order: string;
  is_primary: boolean;
  place_relationship_type: string;
  related_id: string;
  relationship_type: string;
  source_role: string;
  theme_relevance: string;
};

export type ValidatedRelationship = {
  attributes: Record<string, boolean | number | string>;
  relatedId: string;
  relationshipType: StoryRelationshipType;
};

export type RelationshipFieldErrors = Partial<
  Record<keyof RelationshipInput, string>
>;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isListedValue<T extends readonly string[]>(
  values: T,
  value: string,
): value is T[number] {
  return values.some((candidate) => candidate === value);
}

export function isRelationshipId(value: string) {
  return uuidPattern.test(value);
}

export function isStoryRelationshipType(
  value: string,
): value is StoryRelationshipType {
  return isListedValue(storyRelationshipTypes, value);
}

export function formatRelationshipValue(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function validateRelationshipInput(input: RelationshipInput):
  | { data: ValidatedRelationship; errors: RelationshipFieldErrors }
  | { data: null; errors: RelationshipFieldErrors } {
  const errors: RelationshipFieldErrors = {};
  const relationshipType = input.relationship_type.trim();
  const relatedId = input.related_id.trim();
  const displayOrder = Number(input.display_order.trim());

  if (!isStoryRelationshipType(relationshipType)) {
    errors.relationship_type = "Choose a supported relationship type.";
  }
  if (!isRelationshipId(relatedId)) {
    errors.related_id = "Choose an available editorial record.";
  }
  if (
    !Number.isSafeInteger(displayOrder) ||
    displayOrder < 0 ||
    displayOrder > 10_000
  ) {
    errors.display_order = "Display order must be a whole number from 0 to 10,000.";
  }

  let attributes: Record<string, boolean | number | string> = {};

  if (relationshipType === "story_sources") {
    const sourceRole = input.source_role.trim();
    if (!isListedValue(sourceRoles, sourceRole)) {
      errors.source_role = "Choose a supported Source role.";
    } else {
      attributes = {
        display_order: displayOrder,
        is_primary: sourceRole === "primary",
        source_role: sourceRole,
      };
    }
  } else if (relationshipType === "story_places") {
    const placeType = input.place_relationship_type.trim();
    if (!isListedValue(placeRelationshipTypes, placeType)) {
      errors.place_relationship_type = "Choose a supported Place relationship.";
    } else {
      attributes = {
        display_order: displayOrder,
        is_primary: input.is_primary,
        relationship_type: placeType,
      };
    }
  } else if (relationshipType === "story_themes") {
    const relevance = input.theme_relevance.trim();
    if (!isListedValue(themeRelevances, relevance)) {
      errors.theme_relevance = "Choose a supported Theme relevance.";
    } else {
      attributes = {
        display_order: displayOrder,
        relevance,
      };
    }
  }

  if (Object.keys(errors).length > 0 || !isStoryRelationshipType(relationshipType)) {
    return { data: null, errors };
  }

  return {
    data: { attributes, relatedId, relationshipType },
    errors,
  };
}

export function canManageStoryRelationships({
  aal,
  role,
  story,
  userId,
}: {
  aal: "aal1" | "aal2";
  role: EditorialRole;
  story: Pick<EditorialStory, "created_by" | "deleted_at" | "status">;
  userId: string;
}) {
  if (story.deleted_at) return false;
  if (story.status === "published") {
    return role === "publisher" && aal === "aal2";
  }
  if (role === "publisher") return true;
  if (role === "editor") {
    return ["draft", "needs_review", "approved"].includes(story.status);
  }
  return (
    story.created_by === userId &&
    (story.status === "draft" || story.status === "needs_review")
  );
}

export type RelationshipMutationError = { code?: string; message?: string };

export function getSafeRelationshipMutationError(
  error: RelationshipMutationError,
) {
  if (error.code === "40001") {
    return "This connection changed after you opened it. Reload before trying again.";
  }
  if (error.code === "23505") {
    return "That connection already exists, or this Story already has a primary Source or Place.";
  }
  if (error.code === "23503") {
    return "The selected related record is no longer available.";
  }
  if (error.code === "42501") {
    return "Your current role, Story state, or session assurance does not permit this connection change.";
  }
  if (error.code === "23514" || error.code === "22023") {
    return "The connection attributes did not pass database validation.";
  }
  if (error.code === "P0002") {
    return "The Story connection is no longer available.";
  }
  return "The Story connection could not be changed. No unverified result was accepted.";
}
