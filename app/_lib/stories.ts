import "server-only";

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

export type PublicStory = PublicStoryListItem & {
  body: string;
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

export async function getPublicStoryBySlug(
  slug: string,
): Promise<StoryQueryResult<PublicStory | null>> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("stories")
      .select(
        "id, title, slug, summary, body, cover_image_url, published_at",
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      logStoryReadFailure("Public Story detail query", error);
      return { data: null, error: true };
    }

    return { data: data as PublicStory | null, error: false };
  } catch (error) {
    logStoryReadFailure("Public Story detail query", error);
    return { data: null, error: true };
  }
}
