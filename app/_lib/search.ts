import "server-only";

import {
  createServerSupabaseClient,
  SupabaseConfigurationError,
} from "./supabase/server";
import { searchPublicAtlasWithDependencies } from "./search-core";

export {
  searchResultLimit,
  type PublicSearchPlace,
  type PublicSearchResults,
  type PublicSearchStory,
  type PublicSearchTheme,
} from "./search-core";

function logSearchFailure(error: unknown) {
  if (error instanceof SupabaseConfigurationError) {
    console.error(`[search] ${error.message}`);
    return;
  }

  console.error("[search] Public Atlas search failed.");
}

export async function searchPublicAtlas(
  query: string,
): ReturnType<typeof searchPublicAtlasWithDependencies> {
  return searchPublicAtlasWithDependencies(query, {
    createClient: createServerSupabaseClient,
    logFailure: logSearchFailure,
  });
}
