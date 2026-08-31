import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getSafeHttpUrl,
  getSafeStoryMutationError,
  getStoryCapabilities,
  getStoryPublicationState,
  parseUtcDateTimeInput,
  type EditorialStory,
  validateStoryInput,
} from "../../app/_lib/editorial/story.ts";

const ownerId = "4fc3e20e-5406-4020-96ee-d20c8845e643";
const otherId = "5fc3e20e-5406-4020-96ee-d20c8845e643";

function createStory(
  changes: Partial<EditorialStory> = {},
): EditorialStory {
  return {
    atlas_insight: null,
    body: "A careful body.",
    body_zh: null,
    cover_image_url: null,
    created_at: "2026-08-12T00:00:00.000Z",
    created_by: ownerId,
    deleted_at: null,
    id: "6fc3e20e-5406-4020-96ee-d20c8845e643",
    lock_version: 1,
    original_language: null,
    published_at: null,
    seo_description: null,
    seo_description_zh: null,
    seo_title: null,
    seo_title_zh: null,
    slug: "careful-story",
    status: "draft",
    subtitle: null,
    summary: "A careful summary.",
    summary_zh: null,
    tags: [],
    title: "A Careful Story",
    title_zh: null,
    updated_at: "2026-08-12T00:00:00.000Z",
    ...changes,
  };
}

test("Story validation normalizes approved fields and safe image URLs", () => {
  const result = validateStoryInput({
    atlas_insight: "  A restrained observation.  ",
    body: "  Body text.  ",
    body_zh: "  中文正文。  ",
    cover_image_url: "https://images.example/story.jpg",
    original_language: "  Japanese  ",
    seo_description: "",
    seo_description_zh: "",
    seo_title: "",
    seo_title_zh: "",
    slug: "morning-work",
    subtitle: "",
    summary: "  Morning work in context.  ",
    summary_zh: "  清晨工作。  ",
    tags: "breakfast, local history, breakfast",
    title: "  Morning Work  ",
    title_zh: "  清晨工作  ",
  });

  assert.ok(result.data);
  assert.equal(result.data.title, "Morning Work");
  assert.equal(result.data.summary, "Morning work in context.");
  assert.equal(result.data.atlas_insight, "A restrained observation.");
  assert.equal(result.data.subtitle, null);
  assert.deepEqual(result.data.tags, ["breakfast", "local history"]);
  assert.equal(
    result.data.cover_image_url,
    "https://images.example/story.jpg",
  );
});

test("Story validation rejects missing content, invalid slugs, and unsafe URLs", () => {
  const result = validateStoryInput({
    atlas_insight: "",
    body: " ",
    body_zh: "",
    cover_image_url: "javascript:alert(1)",
    original_language: "",
    seo_description: "",
    seo_description_zh: "",
    seo_title: "",
    seo_title_zh: "",
    slug: "Not A Slug",
    subtitle: "",
    summary: "",
    summary_zh: "",
    tags: "",
    title: "",
    title_zh: "",
  });

  assert.equal(result.data, null);
  assert.match(result.errors.title || "", /required/i);
  assert.match(result.errors.summary || "", /required/i);
  assert.match(result.errors.body || "", /required/i);
  assert.match(result.errors.slug || "", /lowercase/i);
  assert.match(result.errors.cover_image_url || "", /http or https/i);
  assert.equal(getSafeHttpUrl("data:image/svg+xml,<svg/>"), null);
  assert.equal(getSafeHttpUrl("//example.com/image.jpg"), null);
});

test("scheduled publication is derived and never creates a new workflow state", () => {
  const scheduled = createStory({
    published_at: "2026-08-13T00:00:00.000Z",
    status: "published",
  });
  const published = createStory({
    published_at: "2026-08-11T00:00:00.000Z",
    status: "published",
  });
  const now = new Date("2026-08-12T00:00:00.000Z");

  assert.equal(getStoryPublicationState(scheduled, now), "scheduled");
  assert.equal(getStoryPublicationState(published, now), "public");
  assert.equal(
    getStoryPublicationState(createStory({ status: "archived" }), now),
    "archived",
  );
});

test("UTC publication input rejects normalized or impossible dates", () => {
  assert.equal(
    parseUtcDateTimeInput("2026-08-12T14:30"),
    "2026-08-12T14:30:00.000Z",
  );
  assert.equal(parseUtcDateTimeInput("2026-02-30T14:30"), null);
  assert.equal(parseUtcDateTimeInput("2026-08-12T24:00"), null);
  assert.equal(parseUtcDateTimeInput("2026-08-12 14:30"), null);
});

test("Contributors edit and submit only their own draft or review Stories", () => {
  const ownDraft = getStoryCapabilities({
    aal: "aal1",
    role: "contributor",
    story: createStory(),
    userId: ownerId,
  });
  const otherDraft = getStoryCapabilities({
    aal: "aal1",
    role: "contributor",
    story: createStory(),
    userId: otherId,
  });
  const ownApproved = getStoryCapabilities({
    aal: "aal1",
    role: "contributor",
    story: createStory({ status: "approved" }),
    userId: ownerId,
  });

  assert.equal(ownDraft.canEdit, true);
  assert.deepEqual(
    ownDraft.transitions.map(({ status }) => status),
    ["needs_review"],
  );
  assert.equal(otherDraft.canEdit, false);
  assert.deepEqual(otherDraft.transitions, []);
  assert.equal(ownApproved.canEdit, false);
});

test("Editors manage non-public workflow but cannot publish or delete", () => {
  const review = getStoryCapabilities({
    aal: "aal1",
    role: "editor",
    story: createStory({ status: "needs_review" }),
    userId: otherId,
  });
  const approved = getStoryCapabilities({
    aal: "aal1",
    role: "editor",
    story: createStory({ status: "approved" }),
    userId: otherId,
  });

  assert.equal(review.canEdit, true);
  assert.deepEqual(
    review.transitions.map(({ status }) => status),
    ["draft", "approved"],
  );
  assert.deepEqual(
    approved.transitions.map(({ status }) => status),
    ["needs_review"],
  );
  assert.equal(approved.canDelete, false);
});

test("Publisher-sensitive actions remain unavailable at AAL1", () => {
  const approved = getStoryCapabilities({
    aal: "aal1",
    role: "publisher",
    story: createStory({ status: "approved" }),
    userId: ownerId,
  });
  const published = getStoryCapabilities({
    aal: "aal1",
    role: "publisher",
    story: createStory({
      published_at: "2026-08-12T00:00:00.000Z",
      status: "published",
    }),
    userId: ownerId,
  });

  assert.equal(approved.canDelete, false);
  assert.equal(
    approved.transitions.some(({ status }) => status === "published"),
    false,
  );
  assert.equal(published.canEdit, false);
  assert.deepEqual(published.transitions, []);
});

test("Publisher AAL2 enables confirmed publication, correction, and recovery paths", () => {
  const approved = getStoryCapabilities({
    aal: "aal2",
    role: "publisher",
    story: createStory({ status: "approved" }),
    userId: ownerId,
  });
  const published = getStoryCapabilities({
    aal: "aal2",
    role: "publisher",
    story: createStory({
      published_at: "2026-08-12T00:00:00.000Z",
      status: "published",
    }),
    userId: ownerId,
  });
  const deleted = getStoryCapabilities({
    aal: "aal2",
    role: "publisher",
    story: createStory({ deleted_at: "2026-08-12T01:00:00.000Z" }),
    userId: ownerId,
  });

  assert.equal(approved.canEdit, true);
  assert.equal(approved.canDelete, true);
  assert.equal(
    approved.transitions.some(
      ({ confirmation, publishedAtRequired, status }) =>
        status === "published" &&
        publishedAtRequired &&
        Boolean(confirmation),
    ),
    true,
  );
  assert.equal(published.canEdit, true);
  assert.deepEqual(
    published.transitions.map(({ status }) => status),
    ["approved", "archived"],
  );
  assert.equal(deleted.canEdit, false);
  assert.equal(deleted.canPreview, false);
  assert.equal(deleted.canRestore, true);
});

test("stale writes and database failures map to safe editorial messages", () => {
  assert.equal(getSafeStoryMutationError({ code: "40001" }).kind, "conflict");
  assert.match(
    getSafeStoryMutationError({ code: "40001" }).message,
    /changed.*reload/i,
  );
  assert.equal(getSafeStoryMutationError({ code: "23505" }).kind, "duplicate");
  assert.equal(getSafeStoryMutationError({ code: "42501" }).kind, "denied");
  assert.doesNotMatch(
    getSafeStoryMutationError({ code: "XX000", message: "secret detail" })
      .message,
    /secret detail/,
  );
});

test("Story routes repeat membership authorization and preview uses authenticated data only", () => {
  const routeFiles = [
    "app/admin/stories/page.tsx",
    "app/admin/stories/new/page.tsx",
    "app/admin/stories/[id]/page.tsx",
    "app/admin/stories/[id]/preview/page.tsx",
  ];

  for (const file of routeFiles) {
    assert.match(readFileSync(file, "utf8"), /requireEditorialAccess/);
  }

  const previewRoute = readFileSync(
    "app/admin/stories/[id]/preview/page.tsx",
    "utf8",
  );
  const previewData = readFileSync(
    "app/_lib/editorial/stories-server.ts",
    "utf8",
  );
  const previewFunction = previewData.slice(
    previewData.indexOf("export async function getEditorialStoryPreview"),
  );

  assert.match(previewRoute, /force-no-store/);
  assert.match(previewRoute, /index: false/);
  assert.match(previewData, /createAuthenticatedServerSupabaseClient/);
  assert.doesNotMatch(previewData, /createServerSupabaseClient/);
  assert.doesNotMatch(previewData, /editorial_source_private_details/);
  assert.doesNotMatch(
    previewFunction,
    /created_by|updated_by|deleted_by|original_language|availability_status/,
  );
});

test("all Story writes use the five protected Phase A RPCs", () => {
  const actions = readFileSync("app/admin/stories/actions.ts", "utf8");
  const storyForm = readFileSync(
    "app/admin/stories/_components/story-form.tsx",
    "utf8",
  );

  for (const rpc of [
    "create_atlas_story",
    "update_atlas_story",
    "transition_story_status",
    "soft_delete_entity",
    "restore_soft_deleted_entity",
  ]) {
    assert.equal(actions.includes(`"${rpc}"`), true, rpc);
  }

  assert.doesNotMatch(actions, /\.from\(\"stories\"\).*\.(insert|update|delete)\(/s);
  assert.doesNotMatch(actions, /service[_-]?role/i);
  assert.doesNotMatch(actions, /created_by|updated_by|published_by|deleted_by/);
  assert.doesNotMatch(storyForm, /created_by|updated_by|published_by|deleted_by/);
});

test("approved daily packages require Publisher AAL2 and protected import/publication RPCs", () => {
  const actions = readFileSync("app/admin/stories/import/actions.ts", "utf8");
  const page = readFileSync("app/admin/stories/import/page.tsx", "utf8");
  assert.match(actions, /role !== "publisher"/);
  assert.match(actions, /identity\.aal !== "aal2"/);
  assert.match(actions, /import_approved_atlas_package/);
  assert.match(actions, /transition_story_status/);
  assert.doesNotMatch(actions, /service[_-]?role/i);
  assert.match(page, /requireEditorialAccess/);
});
