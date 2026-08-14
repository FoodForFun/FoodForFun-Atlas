export const relatedStoryCandidateLimit = 50;
export const relatedStoryDisplayLimit = 3;

export type RelatedStoryCandidate = {
  cover_image_url: string | null;
  id: string;
  published_at: string;
  slug: string;
  summary: string;
  title: string;
};

export type RelatedStoryMatch = {
  relatedId: string;
  storyId: string;
};

export type RelatedStoryEntity = {
  id: string;
  name: string;
};

export type RelatedPublicStory = RelatedStoryCandidate & {
  connectionLabel: string;
  sharedPlaceNames: string[];
  sharedThemeNames: string[];
};

type RankRelatedStoriesInput = {
  currentStoryId: string;
  limit?: number;
  placeMatches: RelatedStoryMatch[];
  places: RelatedStoryEntity[];
  stories: RelatedStoryCandidate[];
  themeMatches: RelatedStoryMatch[];
  themes: RelatedStoryEntity[];
};

function getConnectionLabel(themeNames: string[], placeNames: string[]) {
  const names = [...themeNames, ...placeNames];

  if (names.length === 1) {
    return `Related through ${names[0]}`;
  }

  if (names.length === 2) {
    return `Related through ${names[0]} and ${names[1]}`;
  }

  return `Related through ${names[0]}, ${names[1]}, and ${names.length - 2} more connections`;
}

function getPublishedTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function rankRelatedStories({
  currentStoryId,
  limit = relatedStoryDisplayLimit,
  placeMatches,
  places,
  stories,
  themeMatches,
  themes,
}: RankRelatedStoriesInput): RelatedPublicStory[] {
  const placeNames = new Map(places.map(({ id, name }) => [id, name]));
  const themeNames = new Map(themes.map(({ id, name }) => [id, name]));
  const matchesByStory = new Map<
    string,
    { placeNames: Set<string>; themeNames: Set<string> }
  >();

  const addMatch = (
    match: RelatedStoryMatch,
    entityNames: Map<string, string>,
    type: "placeNames" | "themeNames",
  ) => {
    if (match.storyId === currentStoryId) {
      return;
    }

    const name = entityNames.get(match.relatedId);

    if (!name) {
      return;
    }

    const matches = matchesByStory.get(match.storyId) ?? {
      placeNames: new Set<string>(),
      themeNames: new Set<string>(),
    };
    matches[type].add(name);
    matchesByStory.set(match.storyId, matches);
  };

  placeMatches.forEach((match) => addMatch(match, placeNames, "placeNames"));
  themeMatches.forEach((match) => addMatch(match, themeNames, "themeNames"));

  const safeLimit =
    Number.isSafeInteger(limit) && limit > 0
      ? Math.min(limit, relatedStoryDisplayLimit)
      : relatedStoryDisplayLimit;

  return stories
    .filter(({ id }) => id !== currentStoryId && matchesByStory.has(id))
    .map((story) => {
      const matches = matchesByStory.get(story.id)!;
      const sharedPlaceNames = Array.from(matches.placeNames).sort();
      const sharedThemeNames = Array.from(matches.themeNames).sort();

      return {
        ...story,
        connectionLabel: getConnectionLabel(
          sharedThemeNames,
          sharedPlaceNames,
        ),
        sharedPlaceNames,
        sharedThemeNames,
      };
    })
    .sort((left, right) => {
      const leftConnections =
        left.sharedThemeNames.length + left.sharedPlaceNames.length;
      const rightConnections =
        right.sharedThemeNames.length + right.sharedPlaceNames.length;

      return (
        rightConnections - leftConnections ||
        right.sharedThemeNames.length - left.sharedThemeNames.length ||
        right.sharedPlaceNames.length - left.sharedPlaceNames.length ||
        getPublishedTimestamp(right.published_at) -
          getPublishedTimestamp(left.published_at) ||
        left.title.localeCompare(right.title)
      );
    })
    .slice(0, safeLimit);
}
