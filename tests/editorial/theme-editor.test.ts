import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  type EditorialTheme,
  canCreateThemes,
  getSafeThemeMutationError,
  getThemeCapabilities,
  validateThemeInput,
} from "../../app/_lib/editorial/theme.ts";

function createTheme(changes: Partial<EditorialTheme> = {}): EditorialTheme {
  return {
    created_at: "2026-08-14T00:00:00.000Z",
    created_by: "4fc3e20e-5406-4020-96ee-d20c8845e643",
    deleted_at: null,
    description: "A careful vocabulary description.",
    id: "6fc3e20e-5406-4020-96ee-d20c8845e643",
    is_active: true,
    lock_version: 1,
    name: "Morning Work",
    slug: "morning-work",
    theme_group: "Daily life",
    updated_at: "2026-08-14T00:00:00.000Z",
    ...changes,
  };
}

test("Theme validation normalizes only approved bounded fields", () => {
  const result = validateThemeInput({
    description: "  A careful description.  ",
    name: "  Morning Work  ",
    slug: "MORNING-WORK",
    theme_group: "  Daily life  ",
  });

  assert.deepEqual(result.data, {
    description: "A careful description.",
    name: "Morning Work",
    slug: "morning-work",
    theme_group: "Daily life",
  });
});

test("Theme validation rejects missing identity, unsafe slugs, and oversized text", () => {
  const result = validateThemeInput({
    description: "x".repeat(10_001),
    name: " ",
    slug: "not a slug",
    theme_group: "x".repeat(201),
  });

  assert.equal(result.data, null);
  assert.match(result.errors.name || "", /required/i);
  assert.match(result.errors.slug || "", /lowercase/i);
  assert.match(result.errors.description || "", /10,000/i);
  assert.match(result.errors.theme_group || "", /200/i);
});

test("Theme capabilities mirror role, active state, deletion, and AAL", () => {
  assert.equal(canCreateThemes("contributor"), false);
  assert.equal(canCreateThemes("editor"), true);
  assert.equal(
    getThemeCapabilities({ aal: "aal1", role: "contributor", theme: createTheme() }).canEdit,
    false,
  );
  assert.equal(
    getThemeCapabilities({ aal: "aal1", role: "editor", theme: createTheme() }).canDeactivate,
    true,
  );
  assert.equal(
    getThemeCapabilities({ aal: "aal2", role: "editor", theme: createTheme({ is_active: false }) }).canReactivate,
    false,
  );
  assert.equal(
    getThemeCapabilities({ aal: "aal1", role: "publisher", theme: createTheme({ is_active: false }) }).canReactivate,
    false,
  );
  assert.equal(
    getThemeCapabilities({ aal: "aal2", role: "publisher", theme: createTheme({ is_active: false }) }).canReactivate,
    true,
  );
  assert.equal(
    getThemeCapabilities({ aal: "aal2", role: "publisher", theme: createTheme({ deleted_at: "2026-08-14T01:00:00.000Z" }) }).canEdit,
    false,
  );
});

test("Theme database errors map to safe messages", () => {
  assert.match(getSafeThemeMutationError({ code: "40001" }), /reload/i);
  assert.match(getSafeThemeMutationError({ code: "23505" }), /already exists/i);
  assert.match(getSafeThemeMutationError({ code: "42501" }), /does not permit/i);
  assert.doesNotMatch(
    getSafeThemeMutationError({ code: "XX000", message: "private detail" }),
    /private detail/i,
  );
});

test("Theme routes repeat editorial authorization and Admin navigation is active", () => {
  for (const file of [
    "app/admin/themes/page.tsx",
    "app/admin/themes/new/page.tsx",
    "app/admin/themes/[id]/page.tsx",
  ]) {
    assert.match(readFileSync(file, "utf8"), /requireEditorialAccess/);
  }
  assert.match(readFileSync("app/admin/page.tsx", "utf8"), /href: "\/admin\/themes"/);
});

test("Theme reads use the editorial view and duplicate checks fail closed", () => {
  const server = readFileSync("app/_lib/editorial/themes-server.ts", "utf8");
  const actions = readFileSync("app/admin/themes/actions.ts", "utf8");
  const form = readFileSync("app/admin/themes/_components/theme-form.tsx", "utf8");

  assert.match(server, /editorial_themes/);
  assert.doesNotMatch(server, /\.from\("themes"\)/);
  assert.match(server, /findDuplicateThemesWithClient/);
  assert.match(actions, /duplicates\.error/);
  assert.match(actions, /confirm_duplicate/);
  assert.match(form, /confirm_duplicate/);
});

test("all Theme writes use protected RPCs, locks, and confirmed reactivation", () => {
  const actions = readFileSync("app/admin/themes/actions.ts", "utf8");
  const activeForm = readFileSync(
    "app/admin/themes/_components/theme-active-form.tsx",
    "utf8",
  );

  for (const rpc of [
    "create_editorial_entity",
    "update_editorial_entity",
    "set_theme_active",
  ]) {
    assert.equal(actions.includes(`"${rpc}"`), true, rpc);
  }
  assert.doesNotMatch(actions, /\.(insert|update|delete)\(/);
  assert.doesNotMatch(actions, /service[_-]?role/i);
  assert.doesNotMatch(actions, /created_by|updated_by|deleted_by/);
  assert.match(actions, /expected_lock_version/);
  assert.match(actions, /confirm_state_change/);
  assert.match(actions, /confirmed: active/);
  assert.match(actions, /verifyThemeStateResult/);
  assert.match(activeForm, /name="lock_version"/);
  assert.match(activeForm, /confirm_state_change/);
});
