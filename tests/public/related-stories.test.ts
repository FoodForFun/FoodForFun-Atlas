import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  rankRelatedStories,
  relatedStoryCandidateLimit,
  relatedStoryDisplayLimit,
  type RelatedStoryCandidate,
} from "../../app/_lib/related-stories.ts";

function story(
  id: string,
  publishedAt = "2026-08-14T00:00:00Z",
): RelatedStoryCandidate {
  return {
    cover_image_url: null,
    id,
    published_at: publishedAt,
    slug: `story-${id}`,
    summary: `Summary ${id}`,
    title: `Story ${id}`,
  };
}

const places = [
  { id: "place-no", name: "Norway" },
  { id: "place-oslo", name: "Oslo" },
];
const themes = [
  { id: "theme-food", name: "Fast Food" },
  { id: "theme-work", name: "Daily Work" },
];

test("Related Stories rank by explained shared connections before recency", () => {
  const result = rankRelatedStories({
    currentStoryId: "current",
    limit: 3,
    placeMatches: [
      { relatedId: "place-no", storyId: "a" },
      { relatedId: "place-no", storyId: "b" },
      { relatedId: "place-no", storyId: "c" },
      { relatedId: "place-oslo", storyId: "c" },
      { relatedId: "place-no", storyId: "current" },
    ],
    places,
    stories: [
      story("current"),
      story("a", "2026-01-01T00:00:00Z"),
      story("b", "2026-08-14T00:00:00Z"),
      story("c", "2026-08-13T00:00:00Z"),
      story("unmatched", "2026-08-15T00:00:00Z"),
    ],
    themeMatches: [
      { relatedId: "theme-food", storyId: "a" },
      { relatedId: "theme-work", storyId: "a" },
      { relatedId: "theme-food", storyId: "b" },
      { relatedId: "theme-food", storyId: "current" },
    ],
    themes,
  });

  assert.deepEqual(
    result.map(({ id }) => id),
    ["a", "b", "c"],
  );
  assert.equal(
    result[0].connectionLabel,
    "Related through Daily Work, Fast Food, and 1 more connections",
  );
  assert.equal(result[1].connectionLabel, "Related through Fast Food and Norway");
  assert.equal(result[2].connectionLabel, "Related through Norway and Oslo");
});

test("Related Stories deduplicate matches and enforce the display limit", () => {
  const candidates = ["a", "b", "c", "d"].map((id) =>
    story(id, "not-a-date"),
  );
  const duplicateMatches = candidates.flatMap(({ id }) => [
    { relatedId: "theme-food", storyId: id },
    { relatedId: "theme-food", storyId: id },
  ]);
  const result = rankRelatedStories({
    currentStoryId: "current",
    limit: 99,
    placeMatches: [],
    places,
    stories: candidates,
    themeMatches: duplicateMatches,
    themes,
  });

  assert.equal(relatedStoryCandidateLimit, 50);
  assert.equal(relatedStoryDisplayLimit, 3);
  assert.deepEqual(
    result.map(({ id }) => id),
    ["a", "b", "c"],
  );
  assert.deepEqual(result[0].sharedThemeNames, ["Fast Food"]);
});

test("Related Story reads are public, bounded, fail-safe, and rendered with context", () => {
  const server = readFileSync("app/_lib/stories.ts", "utf8");
  const page = readFileSync("app/stories/[slug]/page.tsx", "utf8");

  for (const table of ["story_places", "story_themes", "stories"]) {
    assert.match(server, new RegExp(`\\.from\\(\"${table}\"\\)`), table);
  }
  assert.match(server, /\.neq\("story_id", story\.id\)/);
  assert.match(server, /\.order\("created_at", \{ ascending: false \}\)/);
  assert.match(server, /\.order\("story_id", \{ ascending: true \}\)/);
  assert.match(server, /\.limit\(relatedStoryCandidateLimit\)/);
  assert.match(server, /\.limit\(relatedStoryCandidateLimit \* 2\)/);
  assert.doesNotMatch(server, /service[_-]?role/i);
  assert.doesNotMatch(server, /editorial_(?:stories|story_places|story_themes)/);
  assert.match(page, /getRelatedPublicStories\(story\)/);
  assert.match(page, /!relatedStoriesResult\.error/);
  assert.match(page, /context=\{relatedStory\.connectionLabel\}/);
});
