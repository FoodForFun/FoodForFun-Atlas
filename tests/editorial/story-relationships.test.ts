import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  canManageStoryRelationships,
  getSafeRelationshipMutationError,
  validateRelationshipInput,
} from "../../app/_lib/editorial/relationship.ts";

const ownerId = "4fc3e20e-5406-4020-96ee-d20c8845e643";
const otherId = "5fc3e20e-5406-4020-96ee-d20c8845e643";
const relatedId = "6fc3e20e-5406-4020-96ee-d20c8845e643";

function input(changes: Record<string, boolean | string> = {}) {
  return {
    display_order: "2",
    is_primary: false,
    place_relationship_type: "featured",
    related_id: relatedId,
    relationship_type: "story_sources",
    source_role: "supporting",
    theme_relevance: "related",
    ...changes,
  };
}

function story(changes: Record<string, null | string> = {}) {
  return {
    created_by: ownerId,
    deleted_at: null,
    status: "draft" as const,
    ...changes,
  };
}

test("relationship validation creates only type-specific approved attributes", () => {
  const source = validateRelationshipInput(
    input({ relationship_type: "story_sources", source_role: "primary" }),
  );
  const place = validateRelationshipInput(
    input({
      is_primary: true,
      place_relationship_type: "origin",
      relationship_type: "story_places",
    }),
  );
  const theme = validateRelationshipInput(
    input({ relationship_type: "story_themes", theme_relevance: "contextual" }),
  );

  assert.deepEqual(source.data?.attributes, {
    display_order: 2,
    is_primary: true,
    source_role: "primary",
  });
  assert.deepEqual(place.data?.attributes, {
    display_order: 2,
    is_primary: true,
    relationship_type: "origin",
  });
  assert.deepEqual(theme.data?.attributes, {
    display_order: 2,
    relevance: "contextual",
  });
});

test("relationship validation rejects forged IDs, enums, and display order", () => {
  const result = validateRelationshipInput(
    input({
      display_order: "-1",
      related_id: "not-an-id",
      relationship_type: "story_sources",
      source_role: "invented",
    }),
  );

  assert.equal(result.data, null);
  assert.match(result.errors.related_id || "", /available/i);
  assert.match(result.errors.display_order || "", /whole number/i);
  assert.match(result.errors.source_role || "", /supported/i);
});

test("relationship permissions mirror ownership, lifecycle, and AAL rules", () => {
  assert.equal(canManageStoryRelationships({ aal: "aal1", role: "contributor", story: story(), userId: ownerId }), true);
  assert.equal(canManageStoryRelationships({ aal: "aal1", role: "contributor", story: story(), userId: otherId }), false);
  assert.equal(canManageStoryRelationships({ aal: "aal1", role: "editor", story: story({ status: "approved" }), userId: otherId }), true);
  assert.equal(canManageStoryRelationships({ aal: "aal1", role: "publisher", story: story({ status: "published" }), userId: ownerId }), false);
  assert.equal(canManageStoryRelationships({ aal: "aal2", role: "publisher", story: story({ status: "published" }), userId: ownerId }), true);
  assert.equal(canManageStoryRelationships({ aal: "aal2", role: "publisher", story: story({ deleted_at: "2026-08-14T00:00:00.000Z" }), userId: ownerId }), false);
});

test("relationship database errors map to safe public messages", () => {
  assert.match(getSafeRelationshipMutationError({ code: "40001" }), /reload/i);
  assert.match(getSafeRelationshipMutationError({ code: "23505" }), /primary/i);
  assert.match(getSafeRelationshipMutationError({ code: "42501" }), /does not permit/i);
  assert.doesNotMatch(
    getSafeRelationshipMutationError({ code: "XX000", message: "private detail" }),
    /private detail/i,
  );
});

test("relationship actions repeat authorization and use only protected RPCs", () => {
  const actions = readFileSync("app/admin/stories/relationship-actions.ts", "utf8");

  assert.match(actions, /requireEditorialAccess/);
  assert.match(actions, /getEditorialStory/);
  assert.match(actions, /canManageStoryRelationships/);
  for (const rpc of ["create_story_relationship", "update_story_relationship", "delete_story_relationship"]) {
    assert.equal(actions.includes(`"${rpc}"`), true, rpc);
  }
  assert.doesNotMatch(actions, /\.(insert|update|delete)\(/);
  assert.doesNotMatch(actions, /service[_-]?role/i);
});

test("published changes require confirmation and every existing write carries its lock", () => {
  const actions = readFileSync("app/admin/stories/relationship-actions.ts", "utf8");
  const form = readFileSync("app/admin/stories/_components/story-connections.tsx", "utf8");

  assert.match(actions, /confirm_published_relationship/);
  assert.match(actions, /story\.status === "published"/);
  assert.match(form, /confirm_published_relationship/);
  assert.match(form, /name="lock_version"/);
  assert.match(form, /confirm_removal/);
  assert.match(actions, /expected_lock_version/);
});

test("relationship reads stay in editorial views and preserve bounded candidates", () => {
  const reads = readFileSync("app/_lib/editorial/relationships-server.ts", "utf8");
  const page = readFileSync("app/admin/stories/[id]/page.tsx", "utf8");

  for (const view of [
    "editorial_story_sources",
    "editorial_story_places",
    "editorial_story_themes",
    "editorial_sources",
    "editorial_places",
    "editorial_themes",
  ]) {
    assert.equal(reads.includes(`"${view}"`), true, view);
  }
  assert.doesNotMatch(reads, /editorial_source_private_details/);
  assert.equal((reads.match(/\.limit\(200\)/g) || []).length, 3);
  assert.match(reads, /eq\("is_active", true\)/);
  assert.match(page, /requireEditorialAccess/);
  assert.match(page, /StoryConnections/);
});
