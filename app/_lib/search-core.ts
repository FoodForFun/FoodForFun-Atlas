import type { SupabaseClient } from "@supabase/supabase-js";

export type PublicSearchStory = {
  id: string;
  title: string;
  slug: string;
  summary: string;
};

export type PublicSearchPlace = {
  id: string;
  name: string;
  slug: string;
  place_type: string | null;
  country_code: string | null;
};

export type PublicSearchTheme = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type PublicSearchResults = {
  stories: PublicSearchStory[];
  places: PublicSearchPlace[];
  themes: PublicSearchTheme[];
};

export type SearchQueryResult =
  | { data: PublicSearchResults; error: false }
  | { data: null; error: true };

type SearchDependencies = {
  createClient: () => Pick<SupabaseClient, "from">;
  logFailure: (error: unknown) => void;
};

export const searchResultLimit = 6;

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function searchPublicAtlasWithDependencies(
  query: string,
  { createClient, logFailure }: SearchDependencies,
): Promise<SearchQueryResult> {
  try {
    const supabase = createClient();
    const pattern = `%${escapeLikePattern(query)}%`;
    const storyFields = "id, title, slug, summary";

    const [titleStories, summaryStories, places, themes] = await Promise.all([
      supabase
        .from("stories")
        .select(storyFields)
        .ilike("title", pattern)
        .order("published_at", { ascending: false })
        .limit(searchResultLimit),
      supabase
        .from("stories")
        .select(storyFields)
        .ilike("summary", pattern)
        .order("published_at", { ascending: false })
        .limit(searchResultLimit),
      supabase
        .from("places")
        .select("id, name, slug, place_type, country_code")
        .ilike("name", pattern)
        .order("name", { ascending: true })
        .limit(searchResultLimit),
      supabase
        .from("themes")
        .select("id, name, slug, description")
        .ilike("name", pattern)
        .order("name", { ascending: true })
        .limit(searchResultLimit),
    ]);

    const queryError =
      titleStories.error ||
      summaryStories.error ||
      places.error ||
      themes.error;

    if (queryError) {
      logFailure(queryError);
      return { data: null, error: true };
    }

    const storiesById = new Map<string, PublicSearchStory>();

    for (const story of [
      ...((titleStories.data ?? []) as PublicSearchStory[]),
      ...((summaryStories.data ?? []) as PublicSearchStory[]),
    ]) {
      if (!storiesById.has(story.id)) {
        storiesById.set(story.id, story);
      }
    }

    return {
      data: {
        stories: Array.from(storiesById.values()).slice(0, searchResultLimit),
        places: (places.data ?? []) as PublicSearchPlace[],
        themes: (themes.data ?? []) as PublicSearchTheme[],
      },
      error: false,
    };
  } catch (error) {
    logFailure(error);
    return { data: null, error: true };
  }
}
