import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const searchPage = readFileSync("app/search/page.tsx", "utf8");

test("Search normalizes and bounds public query input before reading data", () => {
  assert.match(searchPage, /const minimumQueryLength = 2/);
  assert.match(searchPage, /const maximumQueryLength = 80/);
  assert.ok(
    searchPage.includes(
      'value.normalize("NFKC").trim().replace(/\\s+/g, " ")',
    ),
  );
  assert.match(searchPage, /typeof value !== "string"/);
  assert.match(searchPage, /\[\\p\{L\}\\p\{N\}\]\/u\.test\(query\)/);
  assert.match(searchPage, /query\.length < minimumQueryLength/);
  assert.match(searchPage, /query\.length > maximumQueryLength/);
  assert.match(
    searchPage,
    /parsedQuery\.state === "valid"\s*\? await searchPublicAtlas\(parsedQuery\.query\)\s*: null/,
  );
  assert.match(searchPage, /action="\/search" method="get" role="search"/);
  assert.match(searchPage, /minLength=\{minimumQueryLength\}/);
  assert.match(searchPage, /maxLength=\{maximumQueryLength\}/);
});

test("Search retains distinct empty, invalid, unavailable, and no-result states", () => {
  assert.match(
    searchPage,
    /parsedQuery\.state === "empty"[\s\S]*role="status"[\s\S]*Begin with a Story, Place, or Theme\./,
  );
  assert.match(
    searchPage,
    /parsedQuery\.state === "invalid"[\s\S]*role="alert"[\s\S]*That search cannot be used\./,
  );
  assert.match(
    searchPage,
    /searchResult\.error[\s\S]*role="alert"[\s\S]*Search is temporarily unavailable\./,
  );
  assert.match(searchPage, /if \(totalResults === 0\)/);
  assert.match(searchPage, /<NoResults query=\{parsedQuery\.query\} \/>/);
  assert.match(searchPage, /aria-label="Browse the Atlas"/);
  assert.match(searchPage, /href="\/stories">Browse Stories/);
  assert.match(searchPage, /href="\/places">Browse Places/);
  assert.match(searchPage, /href="\/themes">Browse Themes/);
});

test("Search keeps bounded grouped results and safe public detail links", () => {
  assert.match(searchPage, /Up to \{searchResultLimit\} results/);
  assert.match(searchPage, /id="story-results"[\s\S]*title="Stories"/);
  assert.match(searchPage, /id="place-results"[\s\S]*title="Places"/);
  assert.match(searchPage, /id="theme-results"[\s\S]*title="Themes"/);
  assert.match(searchPage, /\{count\} found/);
  assert.ok(searchPage.includes('href={`/stories/${story.slug}`}'));
  assert.ok(searchPage.includes('href={`/places/${place.slug}`}'));
  assert.ok(searchPage.includes('href={`/themes/${theme.slug}`}'));
  assert.match(searchPage, /No published Stories matched this search\./);
  assert.match(searchPage, /No public Places matched this search\./);
  assert.match(searchPage, /No active Themes matched this search\./);
});
