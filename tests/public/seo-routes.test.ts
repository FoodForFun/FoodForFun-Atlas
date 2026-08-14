import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildPublicSitemap,
  createPublicPageMetadata,
  createStoryArchiveMetadata,
  createStoryMetadata,
  getSafeSocialImageUrl,
  publicSitemapStoryLimit,
} from "../../app/_lib/seo.ts";

test("Sitemap keeps the six public entries when data is unavailable", () => {
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
      "https://atlas.example/map",
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
    entries.slice(6).map(({ url }) => url),
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

test("Public metadata shares one factual canonical and social description", () => {
  const metadata = createPublicPageMetadata({
    description: "A factual page description.",
    path: "/about",
    title: "About | FoodForFun Atlas",
  });

  assert.deepEqual(metadata.alternates, { canonical: "/about" });
  assert.deepEqual(metadata.openGraph, {
    description: "A factual page description.",
    siteName: "FoodForFun Atlas",
    title: "About | FoodForFun Atlas",
    type: "website",
    url: "/about",
  });
  assert.deepEqual(metadata.twitter, {
    card: "summary",
    description: "A factual page description.",
    title: "About | FoodForFun Atlas",
  });
});

test("Story metadata includes only safe real image and publication values", () => {
  const metadata = createStoryMetadata({
    coverImageUrl: "https://images.example/cover.jpg",
    publishedAt: "2026-08-14T00:00:00Z",
    slug: "food & work",
    summary: "A documented Story.",
    title: "Food and Work",
  });

  assert.deepEqual(metadata.alternates, {
    canonical: "/stories/food%20%26%20work",
  });
  assert.deepEqual(metadata.openGraph, {
    description: "A documented Story.",
    images: ["https://images.example/cover.jpg"],
    publishedTime: "2026-08-14T00:00:00Z",
    siteName: "FoodForFun Atlas",
    title: "Food and Work | FoodForFun Atlas",
    type: "article",
    url: "/stories/food%20%26%20work",
  });
  assert.deepEqual(metadata.twitter, {
    card: "summary_large_image",
    description: "A documented Story.",
    images: ["https://images.example/cover.jpg"],
    title: "Food and Work | FoodForFun Atlas",
  });

  const safeFallback = createStoryMetadata({
    coverImageUrl: "data:image/png;base64,private",
    publishedAt: "not-a-date",
    slug: "safe-story",
    summary: "Safe fallback.",
    title: "Safe Story",
  });
  assert.equal("images" in (safeFallback.openGraph ?? {}), false);
  assert.equal("publishedTime" in (safeFallback.openGraph ?? {}), false);
  assert.equal(safeFallback.twitter?.card, "summary");
  assert.equal(getSafeSocialImageUrl("javascript:alert(1)"), null);
  assert.equal(getSafeSocialImageUrl(`https://example.com/${"x".repeat(2_100)}`), null);
});

test("Story archive canonical and title follow the normalized page", () => {
  assert.equal(createStoryArchiveMetadata(1).alternates?.canonical, "/stories");
  assert.equal(createStoryArchiveMetadata(0).alternates?.canonical, "/stories");
  assert.equal(
    createStoryArchiveMetadata(3).alternates?.canonical,
    "/stories?page=3",
  );
  assert.equal(
    createStoryArchiveMetadata(3).title,
    "Stories - Page 3 | FoodForFun Atlas",
  );
});

test("Every public page declares shared metadata and the root validates its base", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  const publicPages = [
    "app/page.tsx",
    "app/about/page.tsx",
    "app/places/page.tsx",
    "app/places/[slug]/page.tsx",
    "app/themes/page.tsx",
    "app/themes/[slug]/page.tsx",
    "app/stories/page.tsx",
    "app/stories/[slug]/page.tsx",
    "app/search/page.tsx",
    "app/map/page.tsx",
  ];

  assert.match(layout, /metadataBase: getSiteUrl\(\)/);
  for (const file of publicPages) {
    assert.match(readFileSync(file, "utf8"), /create(?:PublicPage|Story)/, file);
  }
});
