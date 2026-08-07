import "server-only";

import { cache } from "react";

import {
  createServerSupabaseClient,
  SupabaseConfigurationError,
} from "./supabase/server";

export type PublicStoryListItem = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  cover_image_url: string | null;
  published_at: string;
};

export type PublicPlace = {
  id: string;
  name: string;
  slug: string;
  place_type: string | null;
  country_code: string | null;
};

export type PublicTheme = {
  id: string;
  name: string;
  slug: string;
};

export type PublicSourceMetadata = {
  id: string;
  source_type: string;
  original_title: string | null;
  source_url: string | null;
  publisher: string | null;
  original_published_at: string | null;
  original_language: string | null;
  availability_status: string | null;
};

export type PublicStory = PublicStoryListItem & {
  body: string;
  places: PublicPlace[];
  themes: PublicTheme[];
  sources: PublicSourceMetadata[];
};

type PublicStoryRow = PublicStoryListItem & {
  body: string;
  story_places: Array<{ place: PublicPlace | PublicPlace[] | null }>;
  story_themes: Array<{ theme: PublicTheme | PublicTheme[] | null }>;
  story_sources: Array<{
    source: PublicSourceMetadata | PublicSourceMetadata[] | null;
  }>;
};

type StoryQueryResult<T> =
  | { data: T; error: false }
  | { data: null; error: true };

function logStoryReadFailure(operation: string, error: unknown) {
  if (error instanceof SupabaseConfigurationError) {
    console.error(`[stories] ${error.message}`);
    return;
  }

  console.error(`[stories] ${operation} failed.`);
}

export async function getPublicStories(): Promise<
  StoryQueryResult<PublicStoryListItem[]>
> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("stories")
      .select("id, title, slug, summary, cover_image_url, published_at")
      .order("published_at", { ascending: false });

    if (error) {
      logStoryReadFailure("Public Story list query", error);
      return { data: null, error: true };
    }

    return {
      data: (data ?? []) as PublicStoryListItem[],
      error: false,
    };
  } catch (error) {
    logStoryReadFailure("Public Story list query", error);
    return { data: null, error: true };
  }
}

async function getPublicStoryBySlugUncached(
  slug: string,
): Promise<StoryQueryResult<PublicStory | null>> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("stories")
      .select(
        `
          id,
          title,
          slug,
          summary,
          body,
          cover_image_url,
          published_at,
          story_places (
            place:places (
              id,
              name,
              slug,
              place_type,
              country_code
            )
          ),
          story_themes (
            theme:themes (
              id,
              name,
              slug
            )
          ),
          story_sources (
            source:sources (
              id,
              source_type,
              original_title,
              source_url,
              publisher,
              original_published_at,
              original_language,
              availability_status
            )
          )
        `,
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      logStoryReadFailure("Public Story detail query", error);
      return { data: null, error: true };
    }

    if (!data) {
      return { data: null, error: false };
    }

    const storyRow = data as PublicStoryRow;

    return {
      data: {
        id: storyRow.id,
        title: storyRow.title,
        slug: storyRow.slug,
        summary: storyRow.summary,
        body: storyRow.body,
        cover_image_url: storyRow.cover_image_url,
        published_at: storyRow.published_at,
        places: storyRow.story_places
          .flatMap(({ place }) =>
            Array.isArray(place) ? place : place ? [place] : [],
          )
          .sort((left, right) => left.name.localeCompare(right.name)),
        themes: storyRow.story_themes
          .flatMap(({ theme }) =>
            Array.isArray(theme) ? theme : theme ? [theme] : [],
          )
          .sort((left, right) => left.name.localeCompare(right.name)),
        sources: storyRow.story_sources
          .flatMap(({ source }) =>
            Array.isArray(source) ? source : source ? [source] : [],
          )
          .sort((left, right) =>
            (left.original_title || left.source_type).localeCompare(
              right.original_title || right.source_type,
            ),
          ),
      },
      error: false,
    };
  } catch (error) {
    logStoryReadFailure("Public Story detail query", error);
    return { data: null, error: true };
  }
}

export const getPublicStoryBySlug = cache(getPublicStoryBySlugUncached);
