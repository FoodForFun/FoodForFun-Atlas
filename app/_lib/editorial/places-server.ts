import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { type EditorialPlace, isPlaceId, type ValidatedPlaceInput } from "@/app/_lib/editorial/place";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";

const columns = "id, name, slug, place_type, parent_place_id, country_code, latitude, longitude, location_precision, is_verified, created_at, updated_at, created_by, deleted_at, lock_version";
type Result<T> = { data: T; error: false } | { data: null; error: true };

function isPlaceRow(value: unknown): value is EditorialPlace {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === "string" && isPlaceId(row.id) && typeof row.name === "string" && typeof row.slug === "string" && typeof row.is_verified === "boolean" && typeof row.lock_version === "number";
}

export async function getEditorialPlaces(): Promise<Result<EditorialPlace[]>> {
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const { data, error } = await supabase.from("editorial_places").select(columns).order("name");
    if (error) return { data: null, error: true };
    return { data: (data ?? []).flatMap((row) => (isPlaceRow(row) ? [row] : [])), error: false };
  } catch {
    return { data: null, error: true };
  }
}

export async function getEditorialPlaceWithClient(supabase: SupabaseClient, placeId: string) {
  const { data, error } = await supabase.from("editorial_places").select(columns).eq("id", placeId).maybeSingle();
  return error || !isPlaceRow(data) ? null : data;
}

export async function getEditorialPlace(placeId: string): Promise<Result<EditorialPlace | null>> {
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const { data, error } = await supabase.from("editorial_places").select(columns).eq("id", placeId).maybeSingle();
    if (error) return { data: null, error: true };
    return { data: isPlaceRow(data) ? data : null, error: false };
  } catch {
    return { data: null, error: true };
  }
}

export async function getPlaceParentCandidates(currentPlaceId?: string): Promise<Result<Pick<EditorialPlace, "id" | "name" | "parent_place_id">[]>> {
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const { data, error } = await supabase.from("editorial_places").select("id, name, parent_place_id, deleted_at").is("deleted_at", null).order("name").limit(500);
    if (error) return { data: null, error: true };
    const rows = (data ?? []).filter((row) => isPlaceId(row.id));
    const excluded = new Set<string>(currentPlaceId ? [currentPlaceId] : []);
    if (currentPlaceId) {
      let changed = true;
      while (changed) {
        changed = false;
        for (const row of rows) {
          if (row.parent_place_id && excluded.has(row.parent_place_id) && !excluded.has(row.id)) {
            excluded.add(row.id);
            changed = true;
          }
        }
      }
    }
    return { data: rows.filter((row) => !excluded.has(row.id)).map(({ id, name, parent_place_id }) => ({ id, name, parent_place_id })), error: false };
  } catch {
    return { data: null, error: true };
  }
}

export async function validateParentPlaceWithClient(supabase: SupabaseClient, parentId: string | null, currentPlaceId?: string) {
  if (!parentId) return { data: true, error: false } as const;
  const visited = new Set<string>();
  let cursor: string | null = parentId;
  for (let depth = 0; cursor && depth < 100; depth += 1) {
    if (cursor === currentPlaceId || visited.has(cursor)) return { data: false, error: false } as const;
    visited.add(cursor);
    const result = await supabase.from("editorial_places").select("id, parent_place_id, deleted_at").eq("id", cursor).maybeSingle();
    const row = result.data as {
      deleted_at: string | null;
      id: string;
      parent_place_id: string | null;
    } | null;
    if (result.error || !row || row.deleted_at) return { data: null, error: true } as const;
    cursor = row.parent_place_id;
  }
  return cursor ? { data: null, error: true } as const : { data: true, error: false } as const;
}

function escapeLike(value: string) { return value.replace(/[\\%_]/g, "\\$&"); }
export async function findDuplicatePlacesWithClient(supabase: SupabaseClient, input: Pick<ValidatedPlaceInput, "name" | "slug">, excludedId?: string): Promise<Result<Pick<EditorialPlace, "id" | "name" | "slug">[]>> {
  let names = supabase.from("editorial_places").select("id, name, slug").ilike("name", escapeLike(input.name));
  let slugs = supabase.from("editorial_places").select("id, name, slug").eq("slug", input.slug);
  if (excludedId) { names = names.neq("id", excludedId); slugs = slugs.neq("id", excludedId); }
  const results = await Promise.all([names.limit(10), slugs.limit(10)]);
  if (results.some((result) => result.error)) return { data: null, error: true };
  const values = new Map<string, Pick<EditorialPlace, "id" | "name" | "slug">>();
  for (const result of results) for (const row of result.data ?? []) if (isPlaceId(row.id)) values.set(row.id, row);
  return { data: Array.from(values.values()), error: false };
}
