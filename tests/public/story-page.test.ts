import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const storyServer = readFileSync("app/_lib/stories.ts", "utf8");
const storyPage = readFileSync("app/stories/[slug]/page.tsx", "utf8");

const privateFieldPattern =
  /\b(?:raw_transcript|cleaned_transcript|rights_notes?|internal_notes?|exact_address|latitude|longitude)\b/i;

test("public Story detail reads only presentation-safe fields", () => {
  assert.match(storyServer, /\.from\("stories"\)/);
  assert.match(storyServer, /\.eq\("slug", slug\)/);
  assert.match(storyServer, /\.maybeSingle\(\)/);
  assert.match(storyServer, /story_places \([\s\S]*place:places/);
  assert.match(storyServer, /story_themes \([\s\S]*theme:themes/);
  assert.match(storyServer, /story_sources \([\s\S]*source:sources/);
  assert.doesNotMatch(storyServer, privateFieldPattern);
  assert.doesNotMatch(storyServer, /service[_-]?role/i);
});

test("public Story detail distinguishes temporary failures from missing records", () => {
  assert.match(
    storyPage,
    /if \(storyResult\.error\) \{[\s\S]*Story information is temporarily unavailable\./,
  );
  assert.match(
    storyPage,
    /if \(!storyResult\.data\) \{\s*notFound\(\);\s*\}/,
  );
  assert.match(
    storyPage,
    /Story information is temporarily unavailable\.[\s\S]*Please return in a little while\./,
  );
});

test("public Story detail retains safe connection and Source boundaries", () => {
  assert.ok(storyPage.includes('href={`/places/${place.slug}`}'));
  assert.ok(storyPage.includes('href={`/themes/${theme.slug}`}'));
  assert.match(
    storyPage,
    /url\.protocol === "http:" \|\| url\.protocol === "https:"/,
  );
  for (const unavailableState of ["unavailable", "private", "unknown"]) {
    assert.match(
      storyPage,
      new RegExp(`availability === "${unavailableState}"`),
      unavailableState,
    );
  }
  assert.match(storyPage, /target="_blank"/);
  assert.match(storyPage, /rel="noreferrer"/);
  assert.match(storyPage, /getRelatedPublicStories\(story\)/);
  assert.match(storyPage, /!relatedStoriesResult\.error/);
});
