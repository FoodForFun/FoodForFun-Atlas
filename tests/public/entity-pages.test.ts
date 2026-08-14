import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const placeServer = readFileSync("app/_lib/places.ts", "utf8");
const placePage = readFileSync("app/places/[slug]/page.tsx", "utf8");
const themeServer = readFileSync("app/_lib/themes.ts", "utf8");
const themePage = readFileSync("app/themes/[slug]/page.tsx", "utf8");

const privateFieldPattern =
  /\b(?:latitude|longitude|exact_address|raw_transcript|cleaned_transcript|rights_notes?|internal_notes?)\b/i;

test("public Place and Theme detail reads stay within presentation fields", () => {
  assert.match(placeServer, /\.from\("places"\)/);
  assert.match(placeServer, /\.eq\("slug", slug\)/);
  assert.match(placeServer, /\.maybeSingle\(\)/);
  assert.match(placeServer, /story:stories \([\s\S]*published_at/);
  assert.doesNotMatch(placeServer, privateFieldPattern);
  assert.doesNotMatch(placeServer, /service[_-]?role/i);

  assert.match(themeServer, /\.from\("themes"\)/);
  assert.match(themeServer, /\.eq\("slug", slug\)/);
  assert.match(themeServer, /\.maybeSingle\(\)/);
  assert.match(themeServer, /place:places \([\s\S]*slug/);
  assert.doesNotMatch(themeServer, privateFieldPattern);
  assert.doesNotMatch(themeServer, /service[_-]?role/i);
});

test("public entity pages distinguish temporary failures from missing records", () => {
  assert.match(
    placePage,
    /if \(placeResult\.error\) \{[\s\S]*Place information is temporarily unavailable\./,
  );
  assert.match(
    placePage,
    /if \(!placeResult\.data\) \{\s*notFound\(\);\s*\}/,
  );

  assert.match(
    themePage,
    /if \(themeResult\.error\) \{[\s\S]*Theme information is temporarily unavailable\./,
  );
  assert.match(
    themePage,
    /if \(!themeResult\.data\) \{\s*notFound\(\);\s*\}/,
  );
});

test("public entity pages retain bounded relationship links and empty states", () => {
  assert.match(placePage, /href=\{`\/places\/\$\{place\.parent\.slug\}`\}/);
  assert.match(placePage, /href=\{`\/stories\/\$\{story\.slug\}`\}/);
  assert.match(
    placePage,
    /No published Stories are currently connected to this Place\./,
  );

  assert.match(themePage, /Represented Places/);
  assert.match(themePage, /href=\{`\/places\/\$\{place\.slug\}`\}/);
  assert.match(themePage, /href=\{`\/stories\/\$\{story\.slug\}`\}/);
  assert.match(
    themePage,
    /No published Stories are currently connected to this Theme\./,
  );
});
