import assert from "node:assert/strict";
import test from "node:test";

import {
  getActiveEditorialRole,
  isEditorialRole,
} from "../../app/_lib/auth/membership.ts";
import { getSafeAdminRedirect } from "../../app/_lib/auth/redirects.ts";

test("admin redirects accept only local admin paths", () => {
  assert.equal(getSafeAdminRedirect("/admin"), "/admin");
  assert.equal(
    getSafeAdminRedirect("/admin/stories?status=draft"),
    "/admin/stories?status=draft",
  );
  assert.equal(getSafeAdminRedirect("https://example.com/admin"), "/admin");
  assert.equal(getSafeAdminRedirect("//example.com/admin"), "/admin");
  assert.equal(getSafeAdminRedirect("/stories"), "/admin");
  assert.equal(getSafeAdminRedirect("/administrator"), "/admin");
  assert.equal(getSafeAdminRedirect(" /admin"), "/admin");
  assert.equal(getSafeAdminRedirect("/admin\\@example.com"), "/admin");
  assert.equal(getSafeAdminRedirect("/admin%2f..%2fstories"), "/admin");
});

test("all approved active editorial roles authorize the shell", () => {
  for (const role of ["contributor", "editor", "publisher"]) {
    assert.equal(isEditorialRole(role), true);
    assert.equal(getActiveEditorialRole({ is_active: true, role }), role);
  }
});

test("missing, inactive, and unknown memberships do not authorize", () => {
  assert.equal(getActiveEditorialRole(null), null);
  assert.equal(
    getActiveEditorialRole({ is_active: false, role: "publisher" }),
    null,
  );
  assert.equal(
    getActiveEditorialRole({ is_active: true, role: "administrator" }),
    null,
  );
});
