import assert from "node:assert/strict";
import test from "node:test";

import {
  findOwnedTotpFactor,
  getMfaSessionState,
  isPlausibleFactorId,
  isTotpCode,
} from "../../app/_lib/auth/mfa.ts";
import { getSafeAdminRedirect } from "../../app/_lib/auth/redirects.ts";

const verifiedFactor = {
  factor_type: "totp",
  friendly_name: "FoodForFun Atlas authenticator",
  id: "34e770dd-9ff9-416c-87fa-43b31d7ef225",
  status: "verified",
};

test("TOTP codes require exactly six ASCII digits", () => {
  assert.equal(isTotpCode("123456"), true);
  assert.equal(isTotpCode("12345"), false);
  assert.equal(isTotpCode("1234567"), false);
  assert.equal(isTotpCode("１２３４５６"), false);
  assert.equal(isTotpCode("123 456"), false);
  assert.equal(isTotpCode("abcdef"), false);
});

test("factor lookup accepts only an owned TOTP factor in the required state", () => {
  const unverifiedFactor = {
    ...verifiedFactor,
    id: "34e770dd-9ff9-416c-87fa-43b31d7ef226",
    status: "unverified",
  };
  const otherFactor = {
    ...verifiedFactor,
    factor_type: "phone",
    id: "34e770dd-9ff9-416c-87fa-43b31d7ef227",
  };
  const factors = [verifiedFactor, unverifiedFactor, otherFactor];

  assert.deepEqual(
    findOwnedTotpFactor(factors, verifiedFactor.id, "verified"),
    verifiedFactor,
  );
  assert.equal(
    findOwnedTotpFactor(factors, verifiedFactor.id, "unverified"),
    null,
  );
  assert.equal(
    findOwnedTotpFactor(factors, unverifiedFactor.id, "unverified"),
    unverifiedFactor,
  );
  assert.equal(
    findOwnedTotpFactor(factors, otherFactor.id, "verified"),
    null,
  );
  assert.equal(
    findOwnedTotpFactor(
      factors,
      "34e770dd-9ff9-416c-87fa-43b31d7ef999",
      "verified",
    ),
    null,
  );
  assert.equal(findOwnedTotpFactor(factors, "not-a-factor", "verified"), null);
});

test("factor IDs must be canonical UUIDs", () => {
  assert.equal(isPlausibleFactorId(verifiedFactor.id), true);
  assert.equal(isPlausibleFactorId("not-a-factor"), false);
  assert.equal(
    isPlausibleFactorId("34e770dd-9ff9-016c-87fa-43b31d7ef225"),
    false,
  );
});

test("AAL and verified factors produce fail-closed MFA states", () => {
  assert.equal(
    getMfaSessionState({
      currentLevel: "aal1",
      nextLevel: "aal1",
      verifiedTotpCount: 0,
    }),
    "enrollment-required",
  );
  assert.equal(
    getMfaSessionState({
      currentLevel: "aal1",
      nextLevel: "aal2",
      verifiedTotpCount: 1,
    }),
    "challenge-required",
  );
  assert.equal(
    getMfaSessionState({
      currentLevel: "aal2",
      nextLevel: "aal2",
      verifiedTotpCount: 1,
    }),
    "verified",
  );
  assert.equal(
    getMfaSessionState({
      currentLevel: "aal2",
      nextLevel: "aal1",
      verifiedTotpCount: 0,
    }),
    "stale-session",
  );
  assert.equal(
    getMfaSessionState({
      currentLevel: "aal2",
      nextLevel: "aal2",
      verifiedTotpCount: 0,
    }),
    "stale-session",
  );
  assert.equal(
    getMfaSessionState({
      currentLevel: "aal1",
      nextLevel: "aal2",
      verifiedTotpCount: 0,
    }),
    "stale-session",
  );
});

test("MFA challenge return paths remain within local Admin routes", () => {
  assert.equal(
    getSafeAdminRedirect("/admin/stories/123?mode=publish"),
    "/admin/stories/123?mode=publish",
  );
  assert.equal(getSafeAdminRedirect("https://evil.example/admin"), "/admin");
  assert.equal(getSafeAdminRedirect("//evil.example/admin"), "/admin");
  assert.equal(getSafeAdminRedirect("/stories/123"), "/admin");
});
