import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  PlaceRelationshipType,
  SourceRole,
  ThemeRelevance,
} from "@/app/_lib/editorial/relationship";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";

export type SourceCandidate = {
  availability_status: string | null;
  id: string;
  original_title: string | null;
  source_type: string;
};
export type PlaceCandidate = {
  country_code: string | null;
  id: string;
  name: string;
  place_type: string | null;
};
export type ThemeCandidate = {
  id: string;
  is_active: boolean;
  name: string;
};

export type StorySourceConnection = {
  display_order: number;
  is_primary: boolean;
  lock_version: number;
  source: SourceCandidate;
  source_id: string;
  source_role: SourceRole;
};
export type StoryPlaceConnection = {
  display_order: number;
  is_primary: boolean;
  lock_version: number;
  place: PlaceCandidate;
  place_id: string;
  relationship_type: PlaceRelationshipType;
};
export type StoryThemeConnection = {
  display_order: number;
  lock_version: number;
  relevance: ThemeRelevance;
  theme: ThemeCandidate;
  theme_id: string;
};

export type StoryRelationshipWorkspace = {
  candidates: {
    places: PlaceCandidate[];
    sources: SourceCandidate[];
    themes: ThemeCandidate[];
  };
  places: StoryPlaceConnection[];
  sources: StorySourceConnection[];
  themes: StoryThemeConnection[];
};

type EditorialResult<T> =
  | { data: T; error: false }
  | { data: null; error: true };

function byLabel<T>(getLabel: (value: T) => string) {
  return (left: T, right: T) =>
    getLabel(left).localeCompare(getLabel(right), "en", { sensitivity: "base" });
}

function mergeById<T extends { id: string }>(...groups: T[][]) {
  const values = new Map<string, T>();
  for (const group of groups) {
    for (const value of group) values.set(value.id, value);
  }
  return Array.from(values.values());
}

async function selectExistingByIds<T extends { id: string }>(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  ids: string[],
) {
  if (ids.length === 0) return { data: [] as T[], error: null };
  const result = await supabase.from(table).select(columns).in("id", ids);
  return { data: (result.data ?? []) as unknown as T[], error: result.error };
}

export async function getStoryRelationshipWorkspaceWithClient(
  supabase: SupabaseClient,
  storyId: string,
): Promise<EditorialResult<StoryRelationshipWorkspace>> {
  const [sourceRows, placeRows, themeRows] = await Promise.all([
    supabase
      .from("editorial_story_sources")
      .select("source_id, is_primary, source_role, display_order, lock_version")
      .eq("story_id", storyId),
    supabase
      .from("editorial_story_places")
      .select("place_id, is_primary, relationship_type, display_order, lock_version")
      .eq("story_id", storyId),
    supabase
      .from("editorial_story_themes")
      .select("theme_id, relevance, display_order, lock_version")
      .eq("story_id", storyId),
  ]);

  if (sourceRows.error || placeRows.error || themeRows.error) {
    return { data: null, error: true };
  }

  const sourceIds = (sourceRows.data ?? []).map((row) => row.source_id);
  const placeIds = (placeRows.data ?? []).map((row) => row.place_id);
  const themeIds = (themeRows.data ?? []).map((row) => row.theme_id);
  const [sourceCandidates, placeCandidates, themeCandidates, existingSources, existingPlaces, existingThemes] =
    await Promise.all([
      supabase
        .from("editorial_sources")
        .select("id, source_type, original_title, availability_status")
        .is("deleted_at", null)
        .order("original_title")
        .limit(200),
      supabase
        .from("editorial_places")
        .select("id, name, place_type, country_code")
        .is("deleted_at", null)
        .order("name")
        .limit(200),
      supabase
        .from("editorial_themes")
        .select("id, name, is_active")
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("name")
        .limit(200),
      selectExistingByIds<SourceCandidate>(
        supabase,
        "editorial_sources",
        "id, source_type, original_title, availability_status",
        sourceIds,
      ),
      selectExistingByIds<PlaceCandidate>(
        supabase,
        "editorial_places",
        "id, name, place_type, country_code",
        placeIds,
      ),
      selectExistingByIds<ThemeCandidate>(
        supabase,
        "editorial_themes",
        "id, name, is_active",
        themeIds,
      ),
    ]);

  if (
    sourceCandidates.error ||
    placeCandidates.error ||
    themeCandidates.error ||
    existingSources.error ||
    existingPlaces.error ||
    existingThemes.error
  ) {
    return { data: null, error: true };
  }

  const sources = mergeById(
    (sourceCandidates.data ?? []) as SourceCandidate[],
    existingSources.data,
  ).sort(byLabel((source) => source.original_title || source.source_type));
  const places = mergeById(
    (placeCandidates.data ?? []) as PlaceCandidate[],
    existingPlaces.data,
  ).sort(byLabel((place) => place.name));
  const themes = mergeById(
    (themeCandidates.data ?? []) as ThemeCandidate[],
    existingThemes.data,
  ).sort(byLabel((theme) => theme.name));
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const placeById = new Map(places.map((place) => [place.id, place]));
  const themeById = new Map(themes.map((theme) => [theme.id, theme]));

  return {
    data: {
      candidates: {
        places,
        sources,
        themes: themes.filter((theme) => theme.is_active),
      },
      places: (placeRows.data ?? []).flatMap((row) => {
        const place = placeById.get(row.place_id);
        return place ? [{ ...row, place } as StoryPlaceConnection] : [];
      }),
      sources: (sourceRows.data ?? []).flatMap((row) => {
        const source = sourceById.get(row.source_id);
        return source ? [{ ...row, source } as StorySourceConnection] : [];
      }),
      themes: (themeRows.data ?? []).flatMap((row) => {
        const theme = themeById.get(row.theme_id);
        return theme ? [{ ...row, theme } as StoryThemeConnection] : [];
      }),
    },
    error: false,
  };
}

export async function getStoryRelationshipWorkspace(storyId: string) {
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    return await getStoryRelationshipWorkspaceWithClient(supabase, storyId);
  } catch {
    return { data: null, error: true } as const;
  }
}
