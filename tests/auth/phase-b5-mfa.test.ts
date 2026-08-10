import assert from "node:assert/strict";
import test from "node:test";

import {
  findOwnedTotpFactor,
  getMfaSessionState,
  getTotpFactorInventory,
  isPlausibleFactorId,
  isSafeTotpEnrollmentSecret,
  isSafeTotpQrCode,
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

test("enrollment material accepts only bounded Supabase TOTP formats", () => {
  assert.equal(isSafeTotpEnrollmentSecret("JBSWY3DPEHPK3PXP"), true);
  assert.equal(isSafeTotpEnrollmentSecret("too-short"), false);
  assert.equal(isSafeTotpEnrollmentSecret("JBSWY3DP-HPK3PXP"), false);
  assert.equal(isSafeTotpEnrollmentSecret("A".repeat(129)), false);
  assert.equal(
    isSafeTotpQrCode("data:image/svg+xml;utf-8,<svg></svg>"),
    true,
  );
  assert.equal(isSafeTotpQrCode("https://evil.example/qr.svg"), false);
  assert.equal(isSafeTotpQrCode("data:text/html,<script>"), false);
  assert.equal(
    isSafeTotpQrCode(`data:image/svg+xml;utf-8,${"A".repeat(100_000)}`),
    false,
  );
});

test("TOTP factor inventories reject unsupported, duplicate, and malformed state", () => {
  const unverifiedFactor = {
    ...verifiedFactor,
    id: "34e770dd-9ff9-416c-87fa-43b31d7ef226",
    status: "unverified",
  };

  assert.deepEqual(getTotpFactorInventory([]), {
    unverified: [],
    verified: [],
  });
  assert.deepEqual(getTotpFactorInventory([unverifiedFactor]), {
    unverified: [unverifiedFactor],
    verified: [],
  });
  assert.deepEqual(getTotpFactorInventory([verifiedFactor]), {
    unverified: [],
    verified: [verifiedFactor],
  });
  assert.deepEqual(
    getTotpFactorInventory([
      unverifiedFactor,
      {
        ...unverifiedFactor,
        id: "34e770dd-9ff9-416c-87fa-43b31d7ef228",
      },
    ]),
    {
      unverified: [
        unverifiedFactor,
        {
          ...unverifiedFactor,
          id: "34e770dd-9ff9-416c-87fa-43b31d7ef228",
        },
      ],
      verified: [],
    },
  );
  assert.equal(
    getTotpFactorInventory([
      verifiedFactor,
      { ...verifiedFactor, factor_type: "phone" },
    ]),
    null,
  );
  assert.equal(
    getTotpFactorInventory([verifiedFactor, verifiedFactor]),
    null,
  );
  assert.equal(
    getTotpFactorInventory([
      { ...verifiedFactor, id: "not-a-factor" },
    ]),
    null,
  );
  assert.equal(
    getTotpFactorInventory([
      { ...verifiedFactor, status: "unexpected" },
    ]),
    null,
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

test("MFA redirects reject protocol, encoding, control, and separator attacks", () => {
  const rejectedValues = [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/%2f%2fevil.example",
    "/%252f%252fevil.example",
    "javascript:alert(1)",
    "data:text/html,evil",
    "/admin%2f..%2f%2fevil.example",
    "/admin/%2e%2e/%2e%2e/evil",
    "/admin/%252e%252e/%252f%252fevil.example",
    "/admin/\u2215\u2215evil.example",
    "/admin/\uff0f\uff0fevil.example",
    "/admin/\uff3cevil.example",
    "/admin\nevil",
    " /admin",
    "/admin ",
    "/administrator",
  ];

  for (const value of rejectedValues) {
    assert.equal(getSafeAdminRedirect(value), "/admin", value);
  }

  assert.equal(
    getSafeAdminRedirect("/admin/stories?return=%2Fstories%2F123"),
    "/admin/stories?return=%2Fstories%2F123",
  );
});
