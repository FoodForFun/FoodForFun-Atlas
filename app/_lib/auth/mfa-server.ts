import "server-only";

import { AdminAuthorizationError } from "@/app/_lib/auth/session";
import {
  getMfaSessionState,
  type MfaAssuranceLevel,
} from "@/app/_lib/auth/mfa";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";

function isKnownAal(value: string | null): value is MfaAssuranceLevel {
  return value === "aal1" || value === "aal2";
}

export async function getAdminMfaState() {
  const supabase = await createAuthenticatedServerSupabaseClient();
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
    !isKnownAal(assuranceResult.data.nextLevel)
  ) {
    throw new AdminAuthorizationError();
  }

  const verifiedTotpFactors = factorsResult.data.totp.map((factor) => ({
    createdAt: factor.created_at,
    friendlyName: factor.friendly_name,
    id: factor.id,
  }));

  return {
    currentLevel: assuranceResult.data.currentLevel,
    nextLevel: assuranceResult.data.nextLevel,
    sessionState: getMfaSessionState({
      currentLevel: assuranceResult.data.currentLevel,
      nextLevel: assuranceResult.data.nextLevel,
      verifiedTotpCount: verifiedTotpFactors.length,
    }),
    verifiedTotpFactors,
  };
}
