import "server-only";

import {
  buildPublicMapPoints,
  publicMapPlaceLimit,
  publicMapRelationshipLimit,
  type PublicMapPlaceRow,
  type PublicMapPoint,
  type PublicMapRelationshipRow,
} from "./map-core";
import {
  createServerSupabaseClient,
  SupabaseConfigurationError,
} from "./supabase/server";

type PublicMapResult =
  | { data: PublicMapPoint[]; error: false }
  | { data: null; error: true };

function logMapReadFailure(error: unknown) {
  if (error instanceof SupabaseConfigurationError) {
    console.error(`[map] ${error.message}`);
    return;
  }

  console.error("[map] Public map query failed.");
}

export async function getPublicMapPoints(): Promise<PublicMapResult> {
  try {
    const supabase = createServerSupabaseClient();
    const { data: placeData, error: placeError } = await supabase
      .rpc("get_public_map_places")
      .order("name", { ascending: true })
      .limit(publicMapPlaceLimit);

    if (placeError) {
      logMapReadFailure(placeError);
      return { data: null, error: true };
    }

    const places = (placeData ?? []) as PublicMapPlaceRow[];
    if (places.length === 0) {
      return { data: [], error: false };
    }

    const { data: relationshipData, error: relationshipError } = await supabase
      .from("story_places")
      .select(
        `
          place_id,
          story:stories (
            id,
            title,
            slug,
            summary,
            published_at
          )
        `,
      )
      .in(
        "place_id",
        places.map(({ id }) => id),
      )
      .order("display_order", { ascending: true })
      .limit(publicMapRelationshipLimit);

    if (relationshipError) {
      logMapReadFailure(relationshipError);
      return { data: null, error: true };
    }

    return {
      data: buildPublicMapPoints(
        places,
        (relationshipData ?? []) as PublicMapRelationshipRow[],
      ),
      error: false,
    };
  } catch (error) {
    logMapReadFailure(error);
    return { data: null, error: true };
  }
}
