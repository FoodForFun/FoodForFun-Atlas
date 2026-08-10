import "server-only";

import { AdminAuthorizationError } from "@/app/_lib/auth/session";
import {
  getTotpFactorInventory,
  getMfaSessionState,
  type MfaAssuranceLevel,
} from "@/app/_lib/auth/mfa";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";

function isKnownAal(value: string | null): value is MfaAssuranceLevel {
  return value === "aal1" || value === "aal2";
}

export async function getAdminMfaState(expectedUserId: string) {
  const supabase = await createAuthenticatedServerSupabaseClient();
  const claimsResult = await supabase.auth.getClaims();

  if (
    claimsResult.error ||
    !claimsResult.data?.claims ||
    claimsResult.data.claims.sub !== expectedUserId ||
    !isKnownAal(
      typeof claimsResult.data.claims.aal === "string"
        ? claimsResult.data.claims.aal
        : null,
    )
  ) {
    throw new AdminAuthorizationError();
  }

  const factorsResult = await supabase.auth.mfa.listFactors();

  if (factorsResult.error || !factorsResult.data) {
    throw new AdminAuthorizationError();
  }

  const assuranceResult =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (
    assuranceResult.error ||
    !assuranceResult.data ||
    !isKnownAal(assuranceResult.data.currentLevel) ||
    !isKnownAal(assuranceResult.data.nextLevel) ||
    assuranceResult.data.currentLevel !== claimsResult.data.claims.aal
  ) {
    throw new AdminAuthorizationError();
  }

  const verifiedTotpFactors = factorsResult.data.totp.map((factor) => ({
    createdAt: factor.created_at,
    friendlyName: factor.friendly_name,
    id: factor.id,
  }));
  const factorInventory = getTotpFactorInventory(factorsResult.data.all);
  const hasAmbiguousFactorState =
    !factorInventory ||
    factorInventory.unverified.length > 1 ||
    (factorInventory.unverified.length > 0 &&
      factorInventory.verified.length > 0);

  return {
    currentLevel: assuranceResult.data.currentLevel,
    nextLevel: assuranceResult.data.nextLevel,
    sessionState: hasAmbiguousFactorState
      ? ("stale-session" as const)
      : getMfaSessionState({
          currentLevel: assuranceResult.data.currentLevel,
          nextLevel: assuranceResult.data.nextLevel,
          verifiedTotpCount: verifiedTotpFactors.length,
        }),
    verifiedTotpFactors,
  };
}
