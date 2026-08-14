import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildPublicMapPoints,
  getMapPrecisionLabel,
  projectMapCoordinates,
  publicMapPlaceLimit,
  publicMapRelationshipLimit,
  type PublicMapPlaceRow,
} from "../../app/_lib/map-core.ts";

const story = {
  id: "story-a",
  published_at: "2026-08-14T00:00:00Z",
  slug: "story-a",
  summary: "A public Story summary.",
  title: "Story A",
};

function place(
  id: string,
  changes: Partial<PublicMapPlaceRow> = {},
): PublicMapPlaceRow {
  return {
    country_code: "NO",
    id,
    latitude: 59.9,
    location_precision: "city",
    longitude: 10.8,
    name: `Place ${id}`,
    place_type: "city",
    slug: `place-${id}`,
    ...changes,
  };
}

test("Map points group overlapping safe coordinates and deduplicate Stories", () => {
  const points = buildPublicMapPoints(
    [place("b", { latitude: "59.900000" }), place("a")],
    [
      { place_id: "a", story },
      { place_id: "a", story },
      { place_id: "b", story: [story] },
    ],
  );

  assert.equal(points.length, 1);
  assert.deepEqual(
    points[0].places.map(({ id }) => id),
    ["a", "b"],
  );
  assert.equal(points[0].places[0].stories.length, 1);
});

test("Map points reject invalid, hidden, and unconnected Place rows", () => {
  const rows = [
    place("valid"),
    place("missing-story"),
    place("bad-latitude", { latitude: 91 }),
    place("hidden", { location_precision: "hidden" as never }),
  ];
  const points = buildPublicMapPoints(rows, [
    { place_id: "valid", story },
    { place_id: "bad-latitude", story },
    { place_id: "hidden", story },
  ]);

  assert.deepEqual(
    points.flatMap(({ places }) => places.map(({ id }) => id)),
    ["valid"],
  );
});

test("Map projection clamps world bounds and precision labels explain privacy", () => {
  assert.deepEqual(projectMapCoordinates(0, 0), { left: 50, top: 50 });
  assert.deepEqual(projectMapCoordinates(100, -200), { left: 0, top: 0 });
  assert.equal(getMapPrecisionLabel("exact"), "Exact public point");
  assert.equal(getMapPrecisionLabel("region"), "Broad regional location");
});

test("Map reads only the safe public projection and stays bounded and fail-safe", () => {
  const server = readFileSync("app/_lib/map.ts", "utf8");
  const page = readFileSync("app/map/page.tsx", "utf8");
  const client = readFileSync("app/map/_components/map-explorer.tsx", "utf8");

  assert.equal(publicMapPlaceLimit, 200);
  assert.equal(publicMapRelationshipLimit, 600);
  assert.match(server, /\.rpc\("get_public_map_places"\)/);
  assert.match(server, /\.from\("story_places"\)/);
  assert.doesNotMatch(server, /\.from\("places"\)/);
  assert.doesNotMatch(server, /service[_-]?role/i);
  assert.match(server, /return \{ data: null, error: true \}/);
  assert.match(page, /createPublicPageMetadata/);
  assert.match(page, /Hidden Places never appear/);
  assert.match(client, /aria-pressed/);
  assert.match(client, /map-location-index/);
});

test("Map migration removes raw coordinate grants and generalizes every public tier", () => {
  const migration = readFileSync(
    "supabase/migrations/20260814150000_add_privacy_preserving_public_map.sql",
    "utf8",
  );

  assert.match(migration, /revoke select \(latitude, longitude\)/);
  assert.match(migration, /create function public\.get_public_map_places\(\)/);
  assert.match(migration, /security definer/);
  assert.match(migration, /set search_path = ''/);
  assert.match(migration, /when 'exact' then p\.latitude/);
  assert.match(migration, /when 'neighborhood' then pg_catalog\.round\(p\.latitude, 2\)/);
  assert.match(migration, /when 'city' then pg_catalog\.round\(p\.latitude, 1\)/);
  assert.match(migration, /when 'region' then pg_catalog\.round\(p\.latitude, 0\)/);
  assert.match(migration, /p\.location_precision in \('exact', 'neighborhood', 'city', 'region'\)/);
  assert.match(migration, /s\.status = 'published'/);
  assert.doesNotMatch(migration, /location_precision in \([^)]*hidden/);
});
