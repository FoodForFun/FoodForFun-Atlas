import "server-only";

import { cache } from "react";

import {
  createServerSupabaseClient,
  SupabaseConfigurationError,
} from "./supabase/server";

export type PublicPlaceStory = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  cover_image_url: string | null;
  published_at: string;
};

export type PublicPlaceSummary = {
  id: string;
  name: string;
  slug: string;
  place_type: string | null;
  country_code: string | null;
};

export type PublicPlace = PublicPlaceSummary & {
  parent: PublicPlaceSummary | null;
  stories: PublicPlaceStory[];
};

type PublicPlaceRow = PublicPlaceSummary & {
  parent_place_id: string | null;
  story_places: Array<{
    story: PublicPlaceStory | PublicPlaceStory[] | null;
  }>;
};

type PlaceQueryResult =
  | { data: PublicPlace | null; error: false }
  | { data: null; error: true };

function logPlaceReadFailure(error: unknown) {
  if (error instanceof SupabaseConfigurationError) {
    console.error(`[places] ${error.message}`);
    return;
  }

  console.error("[places] Public Place detail query failed.");
}

export const getPublicPlaceBySlug = cache(
  async (slug: string): Promise<PlaceQueryResult> => {
    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("places")
        .select(
          `
            id,
            name,
            slug,
            place_type,
            country_code,
            parent_place_id,
            story_places (
              story:stories (
                id,
                title,
                slug,
                summary,
                cover_image_url,
                published_at
              )
            )
          `,
        )
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        logPlaceReadFailure(error);
        return { data: null, error: true };
      }

      if (!data) {
        return { data: null, error: false };
      }

      const placeRow = data as PublicPlaceRow;
      let parent: PublicPlaceSummary | null = null;

      if (placeRow.parent_place_id) {
        const { data: parentData, error: parentError } = await supabase
          .from("places")
          .select("id, name, slug, place_type, country_code")
          .eq("id", placeRow.parent_place_id)
          .maybeSingle();

        if (parentError) {
          logPlaceReadFailure(parentError);
          return { data: null, error: true };
        }

        parent = parentData as PublicPlaceSummary | null;
      }

      return {
        data: {
          id: placeRow.id,
          name: placeRow.name,
          slug: placeRow.slug,
          place_type: placeRow.place_type,
          country_code: placeRow.country_code,
          parent,
          stories: placeRow.story_places
            .flatMap(({ story }) =>
              Array.isArray(story) ? story : story ? [story] : [],
            )
            .sort((left, right) =>
              right.published_at.localeCompare(left.published_at),
            ),
        },
        error: false,
      };
    } catch (error) {
      logPlaceReadFailure(error);
      return { data: null, error: true };
    }
  },
);
