import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homepage = readFileSync("app/page.tsx", "utf8");
const storyArchive = readFileSync("app/stories/page.tsx", "utf8");
const storyCard = readFileSync("app/_components/story-card.tsx", "utf8");
const storyServer = readFileSync("app/_lib/stories.ts", "utf8");
const placeDirectory = readFileSync("app/places/page.tsx", "utf8");
const themeDirectory = readFileSync("app/themes/page.tsx", "utf8");

test("homepage discovery stays bounded and preserves failure and empty states", () => {
  assert.match(homepage, /const homepageStoryLimit = 5/);
  assert.match(homepage, /const homepageDirectoryLimit = 6/);
  assert.match(homepage, /getPublicStoryPage\(1, homepageStoryLimit\)/);
  assert.match(homepage, /getPublicPlaceDirectory\(\)/);
  assert.match(homepage, /getPublicThemeDirectory\(\)/);
  assert.equal(
    (homepage.match(/\.slice\(0, homepageDirectoryLimit\)/g) ?? []).length,
    2,
  );
  assert.match(homepage, /Stories are temporarily unavailable\./);
  assert.match(homepage, /The first Atlas stories are being prepared\./);
  assert.match(homepage, /No \$\{label\} are connected to published Stories yet\./);
  assert.match(homepage, /\$\{label\} are temporarily unavailable\./);
});

test("Story archive normalizes pages and keeps pagination bounded", () => {
  assert.match(storyArchive, /const storiesPerPage = 12/);
  assert.match(storyArchive, /Number\.isSafeInteger\(page\)/);
  assert.match(
    storyArchive,
    /pageParam !== undefined && page === 1 && pageParam !== "1"/,
  );
  assert.match(storyArchive, /redirect\("\/stories"\)/);
  assert.match(storyArchive, /getPublicStoryPage\(page, storiesPerPage\)/);
  assert.match(
    storyArchive,
    /Math\.max\(1, Math\.ceil\(total \/ storiesPerPage\)\)/,
  );
  assert.match(storyArchive, /total > 0 && page > totalPages/);
  assert.match(storyArchive, /redirect\(getPageHref\(totalPages\)\)/);
  assert.match(storyArchive, /getPageHref\(page - 1\)/);
  assert.match(storyArchive, /getPageHref\(page \+ 1\)/);
  assert.match(storyArchive, /Stories are temporarily unavailable\./);
  assert.match(storyArchive, /The first Atlas stories are being prepared\./);
});

test("public Story cards include the bounded primary Place relationship", () => {
  assert.match(storyServer, /\.from\("story_places"\)/);
  assert.match(storyServer, /\.eq\("is_primary", true\)/);
  assert.match(storyServer, /\.limit\(pageSize\)/);
  assert.match(
    storyServer,
    /primary_place: primaryPlacesByStoryId\.get\(story\.id\) \?\? null/,
  );
  assert.match(storyCard, /story\.primary_place/);
  assert.ok(
    storyCard.includes('href={`/places/${story.primary_place.slug}`}'),
  );
  assert.match(storyCard, /Primary Place/);
});

test("Place and Theme directories retain public states, counts, and links", () => {
  assert.match(placeDirectory, /getPublicPlaceDirectory\(\)/);
  assert.match(placeDirectory, /Places are temporarily unavailable\./);
  assert.match(
    placeDirectory,
    /No Places are connected to published Stories yet\./,
  );
  assert.match(placeDirectory, /place\.story_count/);
  assert.ok(placeDirectory.includes('href={`/places/${place.slug}`}'));

  assert.match(themeDirectory, /getPublicThemeDirectory\(\)/);
  assert.match(themeDirectory, /Themes are temporarily unavailable\./);
  assert.match(
    themeDirectory,
    /No Themes are connected to published Stories yet\./,
  );
  assert.match(themeDirectory, /theme\.story_count/);
  assert.ok(themeDirectory.includes('href={`/themes/${theme.slug}`}'));
});
