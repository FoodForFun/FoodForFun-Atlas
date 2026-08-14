import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildPublicSitemap,
  publicSitemapStoryLimit,
} from "../../app/_lib/seo.ts";

test("Sitemap keeps the five public entries when data is unavailable", () => {
  const entries = buildPublicSitemap(new URL("https://atlas.example/base?q=1#x"), {
    places: null,
    stories: null,
    themes: null,
  });

  assert.deepEqual(
    entries.map(({ url }) => url),
    [
      "https://atlas.example/",
      "https://atlas.example/stories",
      "https://atlas.example/places",
      "https://atlas.example/themes",
      "https://atlas.example/about",
    ],
  );
});

test("Sitemap adds sorted, encoded, deduplicated public detail paths", () => {
  const entries = buildPublicSitemap(new URL("https://atlas.example/"), {
    places: [{ slug: "oslo" }, { slug: "oslo" }],
    stories: [{ slug: "z-story" }, { slug: "a story" }],
    themes: [{ slug: "daily-life" }],
  });

  assert.deepEqual(
    entries.slice(5).map(({ url }) => url),
    [
      "https://atlas.example/stories/a%20story",
      "https://atlas.example/stories/z-story",
      "https://atlas.example/places/oslo",
      "https://atlas.example/themes/daily-life",
    ],
  );
  assert.equal(
    entries.filter(({ url }) => url.endsWith("/places/oslo")).length,
    1,
  );
});

test("SEO routes use public helpers and protect private and query routes", () => {
  const sitemap = readFileSync("app/sitemap.ts", "utf8");
  const robots = readFileSync("app/robots.ts", "utf8");
  const search = readFileSync("app/search/page.tsx", "utf8");

  assert.equal(publicSitemapStoryLimit, 1000);
  for (const helper of [
    "getPublicStoryPage",
    "getPublicPlaceDirectory",
    "getPublicThemeDirectory",
  ]) {
    assert.match(sitemap, new RegExp(helper));
  }
  assert.doesNotMatch(sitemap, /service[_-]?role/i);
  assert.match(robots, /getSiteUrl/);
  assert.match(robots, /"\/admin", "\/auth", "\/search"/);
  assert.match(robots, /\/sitemap\.xml/);
  assert.match(search, /robots: \{ follow: true, index: false \}/);
});
