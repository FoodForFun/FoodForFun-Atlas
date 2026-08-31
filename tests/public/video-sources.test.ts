import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getCountryCodeFromHeaders, selectVideoSources } from "../../app/_lib/video-sources.ts";

const sources = [
  { availability_status: "available", external_id: "dQw4w9WgXcQ", id: "youtube", original_title: "Original", source_type: "youtube_video", source_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { availability_status: "available", external_id: "BV1xx411c7mD", id: "bilibili", original_title: "Bilibili", source_type: "bilibili_video", source_url: "https://www.bilibili.com/video/BV1xx411c7mD" },
  { availability_status: "available", external_id: null, id: "weibo", original_title: "Weibo", source_type: "weibo_video", source_url: "https://weibo.com/tv/show/example" },
];

test("server country headers are normalized without browser location", () => {
  assert.equal(getCountryCodeFromHeaders(new Headers({ "x-vercel-ip-country": "cn" })), "CN");
  assert.equal(getCountryCodeFromHeaders(new Headers()), null);
});

test("CN and non-CN source orders preserve usable fallbacks", () => {
  assert.deepEqual(selectVideoSources(sources, "CN").map(({ platform }) => platform), ["bilibili", "weibo", "youtube"]);
  assert.deepEqual(selectVideoSources(sources, "US").map(({ platform }) => platform), ["youtube", "bilibili", "weibo"]);
  assert.match(selectVideoSources(sources, "CN")[0].embedUrl || "", /player\.bilibili\.com/);
});

test("unavailable and unsafe sources are omitted", () => {
  const result = selectVideoSources([
    { ...sources[0], availability_status: "unavailable" },
    { ...sources[1], source_url: "javascript:alert(1)" },
  ], "CN");
  assert.deepEqual(result, []);
});

test("Story language switch is server-rendered with independent SEO fields", () => {
  const page = readFileSync("app/stories/[slug]/page.tsx", "utf8");
  const stories = readFileSync("app/_lib/stories.ts", "utf8");
  assert.match(page, /language-switcher/);
  assert.match(page, /searchParams/);
  assert.match(page, /seo_description_zh/);
  assert.match(stories, /body_zh/);
  assert.match(stories, /seo_title_zh/);
});
