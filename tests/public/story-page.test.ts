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

test("Atlas publishing grants bilingual Story fields without exposing precise addresses", () => {
  const migration = readFileSync("supabase/migrations/20260831143000_add_atlas_publishing_fields.sql", "utf8");
  assert.match(migration, /grant select \([^;]*title_zh[^;]*body_zh[^;]*tags[^;]*\) on table public\.stories/s);
  assert.doesNotMatch(migration, /grant select \([^;]*street_address[^;]*\) on table public\.places/s);
});

test("public Story detail preserves primary Place and editorial order", () => {
  assert.match(storyServer, /story_places \(\s*is_primary,\s*display_order,/);
  assert.match(storyServer, /Number\(right\.is_primary\) - Number\(left\.is_primary\)/);
  assert.match(storyServer, /left\.display_order - right\.display_order/);
  assert.match(storyPage, /place\.is_primary/);
  assert.match(storyPage, /className="primary-place-label"/);
  assert.match(storyPage, /Primary Place/);
});
