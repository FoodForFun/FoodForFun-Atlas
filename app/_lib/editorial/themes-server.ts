import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  type EditorialTheme,
  isThemeId,
  type ValidatedThemeInput,
} from "@/app/_lib/editorial/theme";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";

const themeColumns = [
  "id",
  "name",
  "slug",
  "description",
  "theme_group",
  "is_active",
  "created_at",
  "updated_at",
  "created_by",
  "deleted_at",
  "lock_version",
].join(", ");

type EditorialResult<T> =
  | { data: T; error: false }
  | { data: null; error: true };

function isThemeRow(value: unknown): value is EditorialTheme {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    isThemeId(row.id) &&
    typeof row.name === "string" &&
    typeof row.slug === "string" &&
    typeof row.is_active === "boolean" &&
    typeof row.created_at === "string" &&
    typeof row.updated_at === "string" &&
    typeof row.lock_version === "number"
  );
}

export async function getEditorialThemes(): Promise<
  EditorialResult<EditorialTheme[]>
> {
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const { data, error } = await supabase
      .from("editorial_themes")
      .select(themeColumns)
      .order("name");
    if (error) return { data: null, error: true };
    return {
      data: (data ?? []).flatMap((row) => (isThemeRow(row) ? [row] : [])),
      error: false,
    };
  } catch {
    return { data: null, error: true };
  }
}

export async function getEditorialThemeWithClient(
  supabase: SupabaseClient,
  themeId: string,
) {
  const { data, error } = await supabase
    .from("editorial_themes")
    .select(themeColumns)
    .eq("id", themeId)
    .maybeSingle();
  return error || !isThemeRow(data) ? null : data;
}

export async function getEditorialTheme(
  themeId: string,
): Promise<EditorialResult<EditorialTheme | null>> {
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const { data, error } = await supabase
      .from("editorial_themes")
      .select(themeColumns)
      .eq("id", themeId)
      .maybeSingle();
    if (error) return { data: null, error: true };
    return { data: isThemeRow(data) ? data : null, error: false };
  } catch {
    return { data: null, error: true };
  }
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function findDuplicateThemesWithClient(
  supabase: SupabaseClient,
  input: Pick<ValidatedThemeInput, "name" | "slug">,
  excludedThemeId?: string,
): Promise<EditorialResult<Pick<EditorialTheme, "id" | "name" | "slug">[]>> {
  let nameQuery = supabase
    .from("editorial_themes")
    .select("id, name, slug")
    .ilike("name", escapeLikePattern(input.name));
  let slugQuery = supabase
    .from("editorial_themes")
    .select("id, name, slug")
    .eq("slug", input.slug);
  if (excludedThemeId) {
    nameQuery = nameQuery.neq("id", excludedThemeId);
    slugQuery = slugQuery.neq("id", excludedThemeId);
  }

  const results = await Promise.all([nameQuery.limit(10), slugQuery.limit(10)]);
  if (results.some((result) => result.error)) {
    return { data: null, error: true };
  }
  const duplicates = new Map<string, Pick<EditorialTheme, "id" | "name" | "slug">>();
  for (const result of results) {
    for (const row of result.data ?? []) {
      if (isThemeId(row.id)) duplicates.set(row.id, row);
    }
  }
  return { data: Array.from(duplicates.values()), error: false };
}
