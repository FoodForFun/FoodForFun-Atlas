import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { type EditorialPlace, canCreatePlaces, canEditPlace, getSafePlaceMutationError, validatePlaceInput } from "../../app/_lib/editorial/place.ts";

const base = { country_code: " no ", is_verified: true, latitude: "59.9139", location_precision: "city", longitude: "10.7522", name: " Oslo ", parent_place_id: "", place_type: "CITY", postal_code: " 0154 ", slug: "OSLO", street_address: " Dronningens gate 1 " };
function place(changes: Partial<EditorialPlace> = {}): EditorialPlace { return { country_code: "NO", created_at: "2026-08-14T00:00:00Z", created_by: null, deleted_at: null, id: "6fc3e20e-5406-4020-96ee-d20c8845e643", is_verified: true, latitude: 59.9139, location_precision: "city", lock_version: 1, longitude: 10.7522, name: "Oslo", parent_place_id: null, place_type: "city", postal_code: "0154", slug: "oslo", street_address: "Dronningens gate 1", updated_at: "2026-08-14T00:00:00Z", ...changes }; }

test("Place validation normalizes safe geography fields", () => {
  const result = validatePlaceInput(base);
  assert.deepEqual(result.data, { country_code: "NO", is_verified: true, latitude: 59.9139, location_precision: "city", longitude: 10.7522, name: "Oslo", parent_place_id: null, place_type: "city", postal_code: "0154", slug: "oslo", street_address: "Dronningens gate 1" });
});

test("Place validation rejects invalid identity, geography, and self-parenting", () => {
  const current = "6fc3e20e-5406-4020-96ee-d20c8845e643";
  const result = validatePlaceInput({ ...base, country_code: "NOR", latitude: "91", location_precision: "hidden", longitude: "181", name: "", parent_place_id: current, place_type: "Not A Type", slug: "not a slug" }, current);
  assert.equal(result.data, null);
  for (const field of ["name", "slug", "place_type", "parent_place_id", "country_code", "latitude", "longitude", "location_precision"] as const) assert.ok(result.errors[field], field);
});

test("coordinates are paired and hidden precision stores none", () => {
  const paired = validatePlaceInput({ ...base, longitude: "" });
  assert.equal(paired.data, null);
  assert.match(paired.errors.longitude || "", /together/i);
  const hidden = validatePlaceInput({ ...base, latitude: "", location_precision: "hidden", longitude: "" });
  assert.equal(hidden.data?.latitude, null);
  assert.equal(hidden.data?.longitude, null);
});

test("Place capabilities are Editor-or-Publisher and retained records are read-only", () => {
  assert.equal(canCreatePlaces("contributor"), false);
  assert.equal(canCreatePlaces("editor"), true);
  assert.equal(canEditPlace("publisher", place()), true);
  assert.equal(canEditPlace("publisher", place({ deleted_at: "2026-08-14T01:00:00Z" })), false);
});

test("Place errors remain safe", () => {
  assert.match(getSafePlaceMutationError({ code: "40001" }), /reload/i);
  assert.match(getSafePlaceMutationError({ code: "23503" }), /parent/i);
  assert.doesNotMatch(getSafePlaceMutationError({ code: "XX000", message: "secret" }), /secret/i);
});

test("Place routes authorize and reads use only the editorial view", () => {
  for (const file of ["app/admin/places/page.tsx", "app/admin/places/new/page.tsx", "app/admin/places/[id]/page.tsx"]) assert.match(readFileSync(file, "utf8"), /requireEditorialAccess/);
  const server = readFileSync("app/_lib/editorial/places-server.ts", "utf8");
  assert.match(server, /editorial_places/);
  assert.doesNotMatch(server, /\.from\("places"\)/);
  assert.match(server, /validateParentPlaceWithClient/);
  assert.match(server, /depth < 100/);
});

test("Place writes use protected RPCs, locks, fail-closed duplicates, and no service role", () => {
  const actions = readFileSync("app/admin/places/actions.ts", "utf8");
  const form = readFileSync("app/admin/places/_components/place-form.tsx", "utf8");
  for (const rpc of ["create_atlas_place", "update_atlas_place"]) assert.equal(actions.includes(`"${rpc}"`), true, rpc);
  assert.doesNotMatch(actions, /\.(insert|update|delete)\(/);
  assert.doesNotMatch(actions, /service[_-]?role/i);
  assert.match(actions, /duplicates\.error/);
  assert.match(actions, /expected_lock_version/);
  assert.match(form, /confirm_duplicate/);
  assert.match(form, /precision === "hidden"/);
});
