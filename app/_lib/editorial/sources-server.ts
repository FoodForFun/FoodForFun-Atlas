import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  type EditorialSource,
  type EditorialSourcePrivateDetails,
  isSourceId,
  type ValidatedSourceMetadataInput,
} from "@/app/_lib/editorial/source";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";

const sourceColumns = [
  "id",
  "source_type",
  "original_title",
  "source_url",
  "external_id",
  "publisher",
  "original_published_at",
  "original_language",
  "original_description",
  "availability_status",
  "created_at",
  "updated_at",
  "created_by",
  "deleted_at",
  "lock_version",
].join(", ");

const privateSourceColumns = [
  "source_id",
  "raw_transcript",
  "cleaned_transcript",
  "transcript_quality",
  "processing_status",
  "rights_status",
  "rights_note",
  "internal_note",
  "updated_at",
  "lock_version",
].join(", ");

export type EditorialSourceListItem = Pick<
  EditorialSource,
  | "availability_status"
  | "deleted_at"
  | "id"
  | "lock_version"
  | "original_title"
  | "publisher"
  | "source_type"
  | "updated_at"
>;

export type EditorialSourceRecord = {
  privateDetails: EditorialSourcePrivateDetails;
  requiresPublicationAssurance: boolean;
  source: EditorialSource;
};

export type DuplicateSource = Pick<
  EditorialSource,
  "external_id" | "id" | "original_title" | "source_type" | "source_url"
>;

type EditorialResult<T> =
  | { data: T; error: false }
  | { data: null; error: true };

function isSourceRow(value: unknown): value is EditorialSource {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;

  return (
    typeof row.id === "string" &&
    isSourceId(row.id) &&
    typeof row.source_type === "string" &&
    typeof row.created_at === "string" &&
    typeof row.updated_at === "string" &&
    typeof row.lock_version === "number"
  );
}

function isPrivateDetailsRow(
  value: unknown,
): value is EditorialSourcePrivateDetails {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;

  return (
    typeof row.source_id === "string" &&
    typeof row.processing_status === "string" &&
    typeof row.rights_status === "string" &&
    typeof row.updated_at === "string" &&
    typeof row.lock_version === "number"
  );
}

async function sourceRequiresPublicationAssurance(
  supabase: SupabaseClient,
  sourceId: string,
) {
  const relationships = await supabase
    .from("editorial_story_sources")
    .select("story_id")
    .eq("source_id", sourceId);

  if (relationships.error) return { data: null, error: true as const };

  const storyIds = Array.from(
    new Set(
      (relationships.data ?? []).flatMap((row) =>
        typeof row.story_id === "string" ? [row.story_id] : [],
      ),
    ),
  );

  if (storyIds.length === 0) return { data: false, error: false as const };

  const stories = await supabase
    .from("editorial_stories")
    .select("id")
    .in("id", storyIds)
    .eq("status", "published")
    .is("deleted_at", null)
    .limit(1);

  return stories.error
    ? { data: null, error: true as const }
    : { data: (stories.data ?? []).length > 0, error: false as const };
}

async function loadEditorialSourceWithClient(
  supabase: SupabaseClient,
  sourceId: string,
): Promise<EditorialResult<EditorialSourceRecord | null>> {
  const sourceResult = await supabase
    .from("editorial_sources")
    .select(sourceColumns)
    .eq("id", sourceId)
    .maybeSingle();

  if (sourceResult.error) return { data: null, error: true };
  if (!isSourceRow(sourceResult.data)) return { data: null, error: false };

  const [privateResult, assuranceResult] = await Promise.all([
    supabase
      .from("editorial_source_private_details")
      .select(privateSourceColumns)
      .eq("source_id", sourceId)
      .maybeSingle(),
    sourceRequiresPublicationAssurance(supabase, sourceId),
  ]);

  if (
    privateResult.error ||
    !isPrivateDetailsRow(privateResult.data) ||
    assuranceResult.error
  ) {
    return { data: null, error: true };
  }

  return {
    data: {
      privateDetails: privateResult.data,
      requiresPublicationAssurance: assuranceResult.data,
      source: sourceResult.data,
    },
    error: false,
  };
}

export async function getEditorialSources(): Promise<
  EditorialResult<EditorialSourceListItem[]>
> {
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const { data, error } = await supabase
      .from("editorial_sources")
      .select(
        "id, source_type, original_title, publisher, availability_status, updated_at, deleted_at, lock_version",
      )
      .order("updated_at", { ascending: false });

    return error
      ? { data: null, error: true }
      : { data: (data ?? []) as EditorialSourceListItem[], error: false };
  } catch {
    return { data: null, error: true };
  }
}

export async function getEditorialSourceWithClient(
  supabase: SupabaseClient,
  sourceId: string,
) {
  const result = await loadEditorialSourceWithClient(supabase, sourceId);
  return result.error ? null : result.data;
}

export async function getEditorialSource(
  sourceId: string,
): Promise<EditorialResult<EditorialSourceRecord | null>> {
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    return await loadEditorialSourceWithClient(supabase, sourceId);
  } catch {
    return { data: null, error: true };
  }
}

export async function findDuplicateSourcesWithClient(
  supabase: SupabaseClient,
  input: Pick<
    ValidatedSourceMetadataInput,
    "external_id" | "source_type" | "source_url"
  >,
  excludedSourceId?: string,
): Promise<EditorialResult<DuplicateSource[]>> {
  const columns = "id, source_type, original_title, source_url, external_id";
  const queries = [];

  if (input.source_url) {
    let query = supabase
      .from("editorial_sources")
      .select(columns)
      .eq("source_url", input.source_url);
    if (excludedSourceId) query = query.neq("id", excludedSourceId);
    queries.push(query.limit(10));
  }

  if (input.external_id) {
    let query = supabase
      .from("editorial_sources")
      .select(columns)
      .eq("source_type", input.source_type)
      .eq("external_id", input.external_id);
    if (excludedSourceId) query = query.neq("id", excludedSourceId);
    queries.push(query.limit(10));
  }

  if (queries.length === 0) return { data: [], error: false };

  const results = await Promise.all(queries);
  if (results.some((result) => result.error)) {
    return { data: null, error: true };
  }

  const duplicates = new Map<string, DuplicateSource>();
  for (const result of results) {
    for (const row of (result.data ?? []) as DuplicateSource[]) {
      if (isSourceId(row.id)) duplicates.set(row.id, row);
    }
  }

  return { data: Array.from(duplicates.values()), error: false };
}
