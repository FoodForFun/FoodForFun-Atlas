import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  type EditorialSource,
  getSafeSourceMutationError,
  getSourceCapabilities,
  validateSourceMetadataInput,
  validateSourcePrivateInput,
} from "../../app/_lib/editorial/source.ts";

const ownerId = "4fc3e20e-5406-4020-96ee-d20c8845e643";
const otherId = "5fc3e20e-5406-4020-96ee-d20c8845e643";

function createSource(changes: Partial<EditorialSource> = {}): EditorialSource {
  return {
    availability_status: "available",
    created_at: "2026-08-14T00:00:00.000Z",
    created_by: ownerId,
    deleted_at: null,
    external_id: null,
    id: "6fc3e20e-5406-4020-96ee-d20c8845e643",
    lock_version: 1,
    original_description: null,
    original_language: "en",
    original_published_at: null,
    original_title: "A Careful Source",
    publisher: null,
    source_type: "web_article",
    source_url: "https://example.test/source",
    updated_at: "2026-08-14T00:00:00.000Z",
    ...changes,
  };
}

test("Source metadata validation normalizes safe approved fields", () => {
  const result = validateSourceMetadataInput({
    availability_status: "AVAILABLE",
    external_id: "  video-123  ",
    original_description: "  Original context.  ",
    original_language: "  en  ",
    original_published_at: "2026-08-14T12:30",
    original_title: "  Morning Source  ",
    publisher: "  Example Publisher  ",
    source_type: "YOUTUBE_VIDEO",
    source_url: "https://example.test/watch?v=123",
  });

  assert.ok(result.data);
  assert.equal(result.data.source_type, "youtube_video");
  assert.equal(result.data.original_title, "Morning Source");
  assert.equal(result.data.availability_status, "available");
  assert.equal(
    result.data.original_published_at,
    "2026-08-14T12:30:00.000Z",
  );
  assert.equal(result.data.external_id, "video-123");
});

test("Source metadata rejects missing identity, unsafe URLs, and invalid states", () => {
  const result = validateSourceMetadataInput({
    availability_status: "online_forever",
    external_id: "",
    original_description: "",
    original_language: "",
    original_published_at: "2026-02-30T12:00",
    original_title: " ",
    publisher: "",
    source_type: "Not A Type",
    source_url: "javascript:alert(1)",
  });

  assert.equal(result.data, null);
  assert.match(result.errors.original_title || "", /required/i);
  assert.match(result.errors.source_type || "", /lowercase/i);
  assert.match(result.errors.source_url || "", /http or https/i);
  assert.match(result.errors.availability_status || "", /supported/i);
  assert.match(result.errors.original_published_at || "", /valid UTC/i);
});

test("private Source validation preserves only bounded supported review values", () => {
  const valid = validateSourcePrivateInput({
    cleaned_transcript: "  Cleaned text.  ",
    internal_note: "  Member only.  ",
    processing_status: "READY",
    raw_transcript: "  Raw text.  ",
    rights_note: "  Permission recorded.  ",
    rights_status: "PERMISSION_GRANTED",
    transcript_quality: "HUMAN_REVIEWED",
  });
  assert.ok(valid.data);
  assert.equal(valid.data.processing_status, "ready");
  assert.equal(valid.data.rights_status, "permission_granted");
  assert.equal(valid.data.cleaned_transcript, "Cleaned text.");

  const invalid = validateSourcePrivateInput({
    cleaned_transcript: "",
    internal_note: "",
    processing_status: "published",
    raw_transcript: "",
    rights_note: "",
    rights_status: "unknown",
    transcript_quality: "automatic",
  });
  assert.equal(invalid.data, null);
  assert.match(invalid.errors.processing_status || "", /supported/i);
  assert.match(invalid.errors.rights_status || "", /supported/i);
  assert.match(invalid.errors.transcript_quality || "", /supported/i);
});

test("Source capabilities mirror ownership and publication assurance boundaries", () => {
  const ownContributor = getSourceCapabilities({
    aal: "aal1",
    requiresPublicationAssurance: false,
    role: "contributor",
    source: createSource(),
    userId: ownerId,
  });
  const otherContributor = getSourceCapabilities({
    aal: "aal1",
    requiresPublicationAssurance: false,
    role: "contributor",
    source: createSource(),
    userId: otherId,
  });
  const publicEditor = getSourceCapabilities({
    aal: "aal2",
    requiresPublicationAssurance: true,
    role: "editor",
    source: createSource(),
    userId: otherId,
  });
  const publicPublisherAal1 = getSourceCapabilities({
    aal: "aal1",
    requiresPublicationAssurance: true,
    role: "publisher",
    source: createSource(),
    userId: otherId,
  });
  const publicPublisherAal2 = getSourceCapabilities({
    aal: "aal2",
    requiresPublicationAssurance: true,
    role: "publisher",
    source: createSource(),
    userId: otherId,
  });

  assert.equal(ownContributor.canEditMetadata, true);
  assert.equal(otherContributor.canEditMetadata, false);
  assert.equal(publicEditor.canEditPrivateDetails, false);
  assert.equal(publicPublisherAal1.canEditMetadata, false);
  assert.equal(publicPublisherAal2.canEditMetadata, true);
  assert.equal(publicPublisherAal2.canEditPrivateDetails, true);
});

test("soft-deleted Sources remain read-only and mutation errors stay safe", () => {
  const deleted = getSourceCapabilities({
    aal: "aal2",
    requiresPublicationAssurance: false,
    role: "publisher",
    source: createSource({ deleted_at: "2026-08-14T01:00:00.000Z" }),
    userId: ownerId,
  });
  assert.equal(deleted.canEditMetadata, false);
  assert.equal(deleted.canEditPrivateDetails, false);
  assert.equal(getSafeSourceMutationError({ code: "40001" }).kind, "conflict");
  assert.equal(getSafeSourceMutationError({ code: "42501" }).kind, "denied");
  assert.doesNotMatch(
    getSafeSourceMutationError({ code: "XX000", message: "private detail" })
      .message,
    /private detail/,
  );
});

test("Source routes repeat authorization and the list excludes private fields", () => {
  for (const file of [
    "app/admin/sources/page.tsx",
    "app/admin/sources/new/page.tsx",
    "app/admin/sources/[id]/page.tsx",
  ]) {
    assert.match(readFileSync(file, "utf8"), /requireEditorialAccess/);
  }

  const server = readFileSync(
    "app/_lib/editorial/sources-server.ts",
    "utf8",
  );
  const listFunction = server.slice(
    server.indexOf("export async function getEditorialSources"),
    server.indexOf("export async function getEditorialSourceWithClient"),
  );
  assert.match(listFunction, /editorial_sources/);
  assert.doesNotMatch(listFunction, /editorial_source_private_details/);
  assert.doesNotMatch(
    listFunction,
    /raw_transcript|cleaned_transcript|rights_note|internal_note/,
  );
});

test("Source writes use only the three protected Phase A RPCs", () => {
  const actions = readFileSync("app/admin/sources/actions.ts", "utf8");
  const server = readFileSync(
    "app/_lib/editorial/sources-server.ts",
    "utf8",
  );

  for (const rpc of [
    "create_editorial_entity",
    "update_editorial_entity",
    "update_source_private_details",
  ]) {
    assert.equal(actions.includes(`"${rpc}"`), true, rpc);
  }

  assert.match(server, /editorial_source_private_details/);
  assert.match(server, /editorial_story_sources/);
  assert.match(server, /editorial_stories/);
  assert.doesNotMatch(actions, /\.from\("sources"\).*\.(insert|update|delete)\(/s);
  assert.doesNotMatch(actions, /service[_-]?role/i);
  assert.doesNotMatch(actions, /created_by|updated_by|deleted_by/);
});

test("duplicate checks are fail-closed and require explicit confirmation", () => {
  const actions = readFileSync("app/admin/sources/actions.ts", "utf8");
  const form = readFileSync(
    "app/admin/sources/_components/source-metadata-form.tsx",
    "utf8",
  );

  assert.match(actions, /findDuplicateSourcesWithClient/);
  assert.match(actions, /confirm_duplicate/);
  assert.match(actions, /duplicates\.error/);
  assert.match(form, /confirm_duplicate/);
  assert.match(form, /possible duplicate/i);
});
