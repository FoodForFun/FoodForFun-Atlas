import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { type EditorialStory } from "@/app/_lib/editorial/story";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";

const editorialStoryColumns = [
  "id",
  "title",
  "subtitle",
  "slug",
  "summary",
  "body",
  "atlas_insight",
  "original_language",
  "seo_title",
  "seo_description",
  "status",
  "cover_image_url",
  "published_at",
  "created_at",
  "updated_at",
  "created_by",
  "deleted_at",
  "lock_version",
].join(", ");

export type EditorialStoryListItem = Pick<
  EditorialStory,
  | "deleted_at"
  | "id"
  | "lock_version"
  | "published_at"
  | "slug"
  | "status"
  | "title"
  | "updated_at"
>;

export type PreviewPlace = {
  countryCode: string | null;
  id: string;
  name: string;
  placeType: string | null;
};

export type PreviewTheme = {
  id: string;
  name: string;
};

export type PreviewSource = {
  id: string;
  originalTitle: string | null;
  publisher: string | null;
  sourceType: string;
  sourceUrl: string | null;
};

export type PreviewStory = Pick<
  EditorialStory,
  | "atlas_insight"
  | "body"
  | "cover_image_url"
  | "id"
  | "lock_version"
  | "published_at"
  | "status"
  | "subtitle"
  | "summary"
  | "title"
>;

export type EditorialStoryPreview = {
  places: PreviewPlace[];
  sources: PreviewSource[];
  story: PreviewStory;
  themes: PreviewTheme[];
};

type EditorialResult<T> =
  | { data: T; error: false }
  | { data: null; error: true };

type StoryPlaceRelationship = {
  display_order: number;
  place_id: string;
};

type StoryThemeRelationship = {
  display_order: number;
  theme_id: string;
};

type StorySourceRelationship = {
  display_order: number;
  source_id: string;
};

type PlaceRow = {
  country_code: string | null;
  id: string;
  name: string;
  place_type: string | null;
};

type ThemeRow = {
  id: string;
  name: string;
};

type SourceRow = {
  id: string;
  original_title: string | null;
  publisher: string | null;
  source_type: string;
  source_url: string | null;
};

type PreviewStoryRow = PreviewStory & {
  deleted_at: string | null;
};

const previewStoryColumns = [
  "id",
  "title",
  "subtitle",
  "summary",
  "body",
  "atlas_insight",
  "status",
  "cover_image_url",
  "published_at",
  "deleted_at",
  "lock_version",
].join(", ");

function isStoryRow(value: unknown): value is EditorialStory {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Record<string, unknown>;

  return (
    typeof row.id === "string" &&
    typeof row.title === "string" &&
    typeof row.slug === "string" &&
    typeof row.summary === "string" &&
    typeof row.body === "string" &&
    typeof row.status === "string" &&
    ["draft", "needs_review", "approved", "published", "archived"].includes(
      row.status,
    ) &&
    typeof row.created_at === "string" &&
    typeof row.updated_at === "string" &&
    typeof row.lock_version === "number"
  );
}

function isPreviewStoryRow(value: unknown): value is PreviewStoryRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Record<string, unknown>;

  return (
    typeof row.id === "string" &&
    typeof row.title === "string" &&
    typeof row.summary === "string" &&
    typeof row.body === "string" &&
    typeof row.status === "string" &&
    ["draft", "needs_review", "approved", "published", "archived"].includes(
      row.status,
    ) &&
    typeof row.lock_version === "number"
  );
}

export async function getEditorialStories(): Promise<
  EditorialResult<EditorialStoryListItem[]>
> {
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const { data, error } = await supabase
      .from("editorial_stories")
      .select(
        "id, title, slug, status, published_at, updated_at, deleted_at, lock_version",
      )
      .order("updated_at", { ascending: false });

    if (error) {
      return { data: null, error: true };
    }

    return {
      data: (data ?? []) as EditorialStoryListItem[],
      error: false,
    };
  } catch {
    return { data: null, error: true };
  }
}

export async function getEditorialStoryWithClient(
  supabase: SupabaseClient,
  storyId: string,
): Promise<EditorialStory | null> {
  const { data, error } = await supabase
    .from("editorial_stories")
    .select(editorialStoryColumns)
    .eq("id", storyId)
    .maybeSingle();

  if (error || !isStoryRow(data)) {
    return null;
  }

  return data;
}

export async function getEditorialStory(
  storyId: string,
): Promise<EditorialResult<EditorialStory | null>> {
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const { data, error } = await supabase
      .from("editorial_stories")
      .select(editorialStoryColumns)
      .eq("id", storyId)
      .maybeSingle();

    if (error) {
      return { data: null, error: true };
    }

    return {
      data: isStoryRow(data) ? data : null,
      error: false,
    };
  } catch {
    return { data: null, error: true };
  }
}

async function selectByIds<T>(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  ids: string[],
) {
  if (ids.length === 0) {
    return { data: [] as T[], error: null };
  }

  const result = await supabase.from(table).select(columns).in("id", ids);

  return {
    data: (result.data ?? []) as T[],
    error: result.error,
  };
}

function orderRelatedRows<T extends { id: string }>(
  rows: T[],
  relationships: Array<{ display_order: number; relatedId: string }>,
) {
  const byId = new Map(rows.map((row) => [row.id, row]));

  return relationships
    .slice()
    .sort((left, right) => left.display_order - right.display_order)
    .flatMap(({ relatedId }) => {
      const row = byId.get(relatedId);
      return row ? [row] : [];
    });
}

export async function getEditorialStoryPreview(
  storyId: string,
): Promise<EditorialResult<EditorialStoryPreview | null>> {
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const storyResult = await supabase
      .from("editorial_stories")
      .select(previewStoryColumns)
      .eq("id", storyId)
      .maybeSingle();
    const story = isPreviewStoryRow(storyResult.data)
      ? storyResult.data
      : null;

    if (storyResult.error) {
      return { data: null, error: true };
    }

    if (!story || story.deleted_at) {
      return { data: null, error: false };
    }

    const [placesResult, themesResult, sourcesResult] = await Promise.all([
      supabase
        .from("editorial_story_places")
        .select("place_id, display_order")
        .eq("story_id", storyId),
      supabase
        .from("editorial_story_themes")
        .select("theme_id, display_order")
        .eq("story_id", storyId),
      supabase
        .from("editorial_story_sources")
        .select("source_id, display_order")
        .eq("story_id", storyId),
    ]);

    if (placesResult.error || themesResult.error || sourcesResult.error) {
      return { data: null, error: true };
    }

    const placeRelationships =
      (placesResult.data ?? []) as StoryPlaceRelationship[];
    const themeRelationships =
      (themesResult.data ?? []) as StoryThemeRelationship[];
    const sourceRelationships =
      (sourcesResult.data ?? []) as StorySourceRelationship[];
    const [places, themes, sources] = await Promise.all([
      selectByIds<PlaceRow>(
        supabase,
        "editorial_places",
        "id, name, place_type, country_code",
        placeRelationships.map(({ place_id }) => place_id),
      ),
      selectByIds<ThemeRow>(
        supabase,
        "editorial_themes",
        "id, name",
        themeRelationships.map(({ theme_id }) => theme_id),
      ),
      selectByIds<SourceRow>(
        supabase,
        "editorial_sources",
        "id, source_type, original_title, source_url, publisher",
        sourceRelationships.map(({ source_id }) => source_id),
      ),
    ]);

    if (places.error || themes.error || sources.error) {
      return { data: null, error: true };
    }

    const orderedPlaces = orderRelatedRows(
      places.data,
      placeRelationships.map((relationship) => ({
        display_order: relationship.display_order,
        relatedId: relationship.place_id,
      })),
    );
    const orderedThemes = orderRelatedRows(
      themes.data,
      themeRelationships.map((relationship) => ({
        display_order: relationship.display_order,
        relatedId: relationship.theme_id,
      })),
    );
    const orderedSources = orderRelatedRows(
      sources.data,
      sourceRelationships.map((relationship) => ({
        display_order: relationship.display_order,
        relatedId: relationship.source_id,
      })),
    );

    return {
      data: {
        places: orderedPlaces.map((place) => ({
          countryCode: place.country_code,
          id: place.id,
          name: place.name,
          placeType: place.place_type,
        })),
        sources: orderedSources.map((source) => ({
          id: source.id,
          originalTitle: source.original_title,
          publisher: source.publisher,
          sourceType: source.source_type,
          sourceUrl: source.source_url,
        })),
        story: {
          atlas_insight: story.atlas_insight,
          body: story.body,
          cover_image_url: story.cover_image_url,
          id: story.id,
          lock_version: story.lock_version,
          published_at: story.published_at,
          status: story.status,
          subtitle: story.subtitle,
          summary: story.summary,
          title: story.title,
        },
        themes: orderedThemes,
      },
      error: false,
    };
  } catch {
    return { data: null, error: true };
  }
}
