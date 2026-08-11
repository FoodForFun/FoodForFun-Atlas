import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  cleanupIncompleteTotpFactor,
  type IncompleteTotpCleanupClient,
  type MfaFactorSummary,
} from "../../app/_lib/auth/mfa.ts";

const unverifiedFactor: MfaFactorSummary = {
  factor_type: "totp",
  friendly_name: "FoodForFun Atlas authenticator",
  id: "34e770dd-9ff9-416c-87fa-43b31d7ef226",
  status: "unverified",
};

const verifiedFactor: MfaFactorSummary = {
  ...unverifiedFactor,
  id: "34e770dd-9ff9-416c-87fa-43b31d7ef225",
  status: "verified",
};

type MockOptions = {
  factorLists: MfaFactorSummary[][];
  unenrollError?: Error;
};

function createCleanupClient({ factorLists, unenrollError }: MockOptions) {
  let factorListIndex = 0;
  const calls = {
    challenge: 0,
    enroll: 0,
    listFactors: 0,
    unenroll: [] as string[],
    verify: 0,
  };

  const client = {
    challenge: async () => {
      calls.challenge += 1;
    },
    enroll: async () => {
      calls.enroll += 1;
    },
    listFactors: async () => {
      calls.listFactors += 1;
      const factors =
        factorLists[Math.min(factorListIndex, factorLists.length - 1)] ?? [];
      factorListIndex += 1;

      return {
        data: { all: factors },
        error: null,
      };
    },
    unenroll: async ({ factorId }: { factorId: string }) => {
      calls.unenroll.push(factorId);

      return unenrollError
        ? { data: null, error: unenrollError }
        : { data: { id: factorId }, error: null };
    },
    verify: async () => {
      calls.verify += 1;
    },
  };

  return {
    calls,
    client: client satisfies IncompleteTotpCleanupClient,
  };
}

test("one unverified TOTP factor is removed only after stable preflight checks", async () => {
  const { calls, client } = createCleanupClient({
    factorLists: [[unverifiedFactor], [unverifiedFactor], []],
  });

  assert.equal(await cleanupIncompleteTotpFactor(client), true);
  assert.equal(calls.listFactors, 3);
  assert.deepEqual(calls.unenroll, [unverifiedFactor.id]);
  assert.equal(calls.enroll, 0);
  assert.equal(calls.challenge, 0);
  assert.equal(calls.verify, 0);
});

test("zero factors are rejected without an unenroll call", async () => {
  const { calls, client } = createCleanupClient({ factorLists: [[]] });

  assert.equal(await cleanupIncompleteTotpFactor(client), false);
  assert.equal(calls.listFactors, 1);
  assert.deepEqual(calls.unenroll, []);
});

test("a verified factor is rejected", async () => {
  const { calls, client } = createCleanupClient({
    factorLists: [[verifiedFactor]],
  });

  assert.equal(await cleanupIncompleteTotpFactor(client), false);
  assert.deepEqual(calls.unenroll, []);
});

test("verified and unverified factors are rejected", async () => {
  const { calls, client } = createCleanupClient({
    factorLists: [[verifiedFactor, unverifiedFactor]],
  });

  assert.equal(await cleanupIncompleteTotpFactor(client), false);
  assert.deepEqual(calls.unenroll, []);
});

test("multiple unverified factors are rejected", async () => {
  const { calls, client } = createCleanupClient({
    factorLists: [
      [
        unverifiedFactor,
        {
          ...unverifiedFactor,
          id: "34e770dd-9ff9-416c-87fa-43b31d7ef227",
        },
      ],
    ],
  });

  assert.equal(await cleanupIncompleteTotpFactor(client), false);
  assert.deepEqual(calls.unenroll, []);
});

test("a non-TOTP factor is rejected", async () => {
  const { calls, client } = createCleanupClient({
    factorLists: [[{ ...unverifiedFactor, factor_type: "phone" }]],
  });

  assert.equal(await cleanupIncompleteTotpFactor(client), false);
  assert.deepEqual(calls.unenroll, []);
});

test("a changed factor state between preflight checks is rejected", async () => {
  const { calls, client } = createCleanupClient({
    factorLists: [[unverifiedFactor], [verifiedFactor]],
  });

  assert.equal(await cleanupIncompleteTotpFactor(client), false);
  assert.equal(calls.listFactors, 2);
  assert.deepEqual(calls.unenroll, []);
});

test("a Supabase unenroll error fails closed without retrying", async () => {
  const { calls, client } = createCleanupClient({
    factorLists: [[unverifiedFactor], [unverifiedFactor]],
    unenrollError: new Error("Auth API rejected cleanup"),
  });

  assert.equal(await cleanupIncompleteTotpFactor(client), false);
  assert.deepEqual(calls.unenroll, [unverifiedFactor.id]);
  assert.equal(calls.listFactors, 2);
});

test("an apparently successful unenroll fails if the factor remains", async () => {
  const { calls, client } = createCleanupClient({
    factorLists: [[unverifiedFactor], [unverifiedFactor], [unverifiedFactor]],
  });

  assert.equal(await cleanupIncompleteTotpFactor(client), false);
  assert.deepEqual(calls.unenroll, [unverifiedFactor.id]);
  assert.equal(calls.listFactors, 3);
});

test("cleanup action requires authenticated active editorial access", () => {
  const actionsSource = readFileSync(
    new URL("../../app/admin/mfa/actions.ts", import.meta.url),
    "utf8",
  );
  const sessionSource = readFileSync(
    new URL("../../app/_lib/auth/session.ts", import.meta.url),
    "utf8",
  );
  const actionStart = actionsSource.indexOf(
    "export async function cleanupIncompleteTotpSetupAction",
  );
  const actionEnd = actionsSource.indexOf(
    "export async function startTotpEnrollmentAction",
  );
  const cleanupActionSource = actionsSource.slice(actionStart, actionEnd);

  assert.ok(actionStart >= 0 && actionEnd > actionStart);
  assert.ok(
    cleanupActionSource.indexOf('requireEditorialAccess("/admin/mfa")') <
      cleanupActionSource.indexOf("createAuthenticatedServerSupabaseClient"),
  );
  assert.match(
    sessionSource,
    /access\.kind === "unauthenticated"[\s\S]*redirect\(`\/admin\/login/,
  );
  assert.match(
    sessionSource,
    /access\.kind === "denied"[\s\S]*redirect\("\/admin\/access-denied"\)/,
  );
});

test("cleanup action exposes no factor input and invokes no MFA setup operation", () => {
  const actionsSource = readFileSync(
    new URL("../../app/admin/mfa/actions.ts", import.meta.url),
    "utf8",
  );
  const formSource = readFileSync(
    new URL(
      "../../app/admin/mfa/_components/incomplete-setup-cleanup-form.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const actionStart = actionsSource.indexOf(
    "export async function cleanupIncompleteTotpSetupAction",
  );
  const actionEnd = actionsSource.indexOf(
    "export async function startTotpEnrollmentAction",
  );
  const cleanupActionSource = actionsSource.slice(actionStart, actionEnd);

  assert.doesNotMatch(formSource, /factor[_-]?id/i);
  assert.doesNotMatch(cleanupActionSource, /\.mfa\.(enroll|challenge|verify)\(/);
  assert.doesNotMatch(cleanupActionSource, /service[_-]?role|auth\.admin/i);
  assert.match(formSource, /required/);
  assert.match(formSource, /confirm_cleanup/);
});
