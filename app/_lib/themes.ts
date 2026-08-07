import "server-only";

import { cache } from "react";

import {
  createServerSupabaseClient,
  SupabaseConfigurationError,
} from "./supabase/server";

export type PublicThemeStory = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  cover_image_url: string | null;
  published_at: string;
};

export type PublicThemePlace = {
  id: string;
  name: string;
  slug: string;
};

export type PublicTheme = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  places: PublicThemePlace[];
  stories: PublicThemeStory[];
};

export type PublicThemeDirectoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  story_count: number;
};

type PublicThemeStoryRow = PublicThemeStory & {
  story_places: Array<{
    place: PublicThemePlace | PublicThemePlace[] | null;
  }>;
};

type PublicThemeRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  story_themes: Array<{
    story: PublicThemeStoryRow | PublicThemeStoryRow[] | null;
  }>;
};

type PublicThemeDirectoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  story_themes: Array<{
    story: { id: string } | Array<{ id: string }> | null;
  }>;
};

type ThemeQueryResult =
  | { data: PublicTheme | null; error: false }
  | { data: null; error: true };

type ThemeDirectoryQueryResult =
  | { data: PublicThemeDirectoryItem[]; error: false }
  | { data: null; error: true };

function logThemeReadFailure(operation: string, error: unknown) {
  if (error instanceof SupabaseConfigurationError) {
    console.error(`[themes] ${error.message}`);
    return;
  }

  console.error(`[themes] ${operation} failed.`);
}

export async function getPublicThemeDirectory(): Promise<ThemeDirectoryQueryResult> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("themes")
      .select(
        `
          id,
          name,
          slug,
          description,
          story_themes (
            story:stories (id)
          )
        `,
      )
      .order("name", { ascending: true });

    if (error) {
      logThemeReadFailure("Public Theme directory query", error);
      return { data: null, error: true };
    }

    return {
      data: ((data ?? []) as PublicThemeDirectoryRow[])
        .map((theme) => ({
          id: theme.id,
          name: theme.name,
          slug: theme.slug,
          description: theme.description,
          story_count: theme.story_themes.flatMap(({ story }) =>
            Array.isArray(story) ? story : story ? [story] : [],
          ).length,
        }))
        .filter((theme) => theme.story_count > 0),
      error: false,
    };
  } catch (error) {
    logThemeReadFailure("Public Theme directory query", error);
    return { data: null, error: true };
  }
}

export const getPublicThemeBySlug = cache(
  async (slug: string): Promise<ThemeQueryResult> => {
    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("themes")
        .select(
          `
            id,
            name,
            slug,
            description,
            story_themes (
              story:stories (
                id,
                title,
                slug,
                summary,
                cover_image_url,
                published_at,
                story_places (
                  place:places (
                    id,
                    name,
                    slug
                  )
                )
              )
            )
          `,
        )
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        logThemeReadFailure("Public Theme detail query", error);
        return { data: null, error: true };
      }

      if (!data) {
        return { data: null, error: false };
      }

      const themeRow = data as PublicThemeRow;
      const storyRows = themeRow.story_themes.flatMap(({ story }) =>
        Array.isArray(story) ? story : story ? [story] : [],
      );
      const placesById = new Map<string, PublicThemePlace>();

      storyRows.forEach((story) => {
        story.story_places
          .flatMap(({ place }) =>
            Array.isArray(place) ? place : place ? [place] : [],
          )
          .forEach((place) => placesById.set(place.id, place));
      });

      return {
        data: {
          id: themeRow.id,
          name: themeRow.name,
          slug: themeRow.slug,
          description: themeRow.description,
          places: Array.from(placesById.values()).sort((left, right) =>
            left.name.localeCompare(right.name),
          ),
          stories: storyRows
            .map((story) => ({
              id: story.id,
              title: story.title,
              slug: story.slug,
              summary: story.summary,
              cover_image_url: story.cover_image_url,
              published_at: story.published_at,
            }))
            .sort((left, right) =>
              right.published_at.localeCompare(left.published_at),
            ),
        },
        error: false,
      };
    } catch (error) {
      logThemeReadFailure("Public Theme detail query", error);
      return { data: null, error: true };
    }
  },
);
