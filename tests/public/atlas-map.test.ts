import assert from "node:assert/strict";
import test from "node:test";
import { buildAtlasMapPosts } from "../../app/_lib/atlas-map.ts";

test("Map V1 preserves public coordinates, maps shop types and emits one marker per Story", () => {
  const story = { id: "a", title: "Story", slug: "story", published_at: "2026-01-01", summary: "" };
  const place = { id: "p", name: "Shop", slug: "shop", country_code: "JP", location_precision: "city" as const, place_type: "yatai", stories: [story, story] };
  const result = buildAtlasMapPosts([{ key: "35,139", latitude: 35, longitude: 139, places: [place] }]);
  assert.deepEqual(result, [{ id: "a", title: "Story", slug: "story", locationName: "Shop", latitude: 35, longitude: 139, iconType: "yatai" }]);
  assert.equal(buildAtlasMapPosts([{ key: "0,0", latitude: 0, longitude: 0, places: [{ ...place, place_type: "city" }] }])[0].iconType, "restaurant");
  assert.deepEqual(buildAtlasMapPosts([]), []);
});
