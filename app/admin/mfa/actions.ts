"use server";

import { redirect, RedirectType } from "next/navigation";

import {
  cleanupIncompleteTotpFactor,
  findOwnedTotpFactor,
  getTotpFactorInventory,
  isSafeTotpEnrollmentSecret,
  isSafeTotpQrCode,
  isTotpCode,
  type MfaAssuranceLevel,
} from "@/app/_lib/auth/mfa";
import { getSafeAdminRedirect } from "@/app/_lib/auth/redirects";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";
import {
  type MfaActionState,
  type MfaEnrollmentActionState,
} from "@/app/admin/mfa/action-state";

const cleanupConfirmationValue = "remove-incomplete-setup";

function readFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function mfaUnavailableState(): MfaActionState {
  return {
    message:
      "Authenticator security state could not be confirmed. Return to MFA status and try again.",
    status: "error",
  };
}

function invalidCodeState(): MfaActionState {
  return {
    message:
      "That authenticator code is invalid or has expired. Enter the current six-digit code and try again.",
    status: "error",
  };
}

type AuthenticatedSupabaseClient = Awaited<
  ReturnType<typeof createAuthenticatedServerSupabaseClient>
>;

function isKnownAal(value: string | null): value is MfaAssuranceLevel {
  return value === "aal1" || value === "aal2";
}

async function getBoundMfaAssurance(
  supabase: AuthenticatedSupabaseClient,
  expectedUserId: string,
) {
  const claimsResult = await supabase.auth.getClaims();

  if (
    claimsResult.error ||
    !claimsResult.data?.claims ||
    claimsResult.data.claims.sub !== expectedUserId
  ) {
    return null;
  }

  const claimsAal =
    typeof claimsResult.data.claims.aal === "string"
      ? claimsResult.data.claims.aal
      : null;

  if (!isKnownAal(claimsAal)) {
    return null;
  }

  const assuranceResult =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (
    assuranceResult.error ||
    !assuranceResult.data ||
    !isKnownAal(assuranceResult.data.currentLevel) ||
    !isKnownAal(assuranceResult.data.nextLevel) ||
    assuranceResult.data.currentLevel !== claimsAal
  ) {
    return null;
  }

  return assuranceResult.data;
}

async function hasAuthoritativeAal2Session(
  supabase: AuthenticatedSupabaseClient,
  expectedUserId: string,
  accessToken: string,
) {
  const verifiedTokenClaims = await supabase.auth.getClaims(accessToken);
  const currentSessionClaims = await supabase.auth.getClaims();

  return [verifiedTokenClaims, currentSessionClaims].every(
    (result) =>
      !result.error &&
      result.data?.claims.sub === expectedUserId &&
      result.data.claims.aal === "aal2",
  );
}

export async function cleanupIncompleteTotpSetupAction(
  _state: MfaActionState,
  formData: FormData,
): Promise<MfaActionState> {
  void _state;
  const access = await requireEditorialAccess("/admin/mfa");

  if (
    readFormValue(formData, "confirm_cleanup") !== cleanupConfirmationValue
  ) {
    return {
      message: "Confirm the cleanup before removing the incomplete setup.",
      status: "error",
    };
  }

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const assurance = await getBoundMfaAssurance(
      supabase,
      access.identity.userId,
    );

    if (
      !assurance ||
      assurance.currentLevel !== "aal1" ||
      assurance.nextLevel !== "aal1"
    ) {
      return mfaUnavailableState();
    }

    const cleaned = await cleanupIncompleteTotpFactor({
      listFactors: () => supabase.auth.mfa.listFactors(),
      unenroll: (parameters) => supabase.auth.mfa.unenroll(parameters),
    });

    if (!cleaned) {
      return mfaUnavailableState();
    }
  } catch {
    return mfaUnavailableState();
  }

  redirect("/admin/mfa?status=cleanup-complete", RedirectType.replace);
}

export async function startTotpEnrollmentAction(
  _state: MfaEnrollmentActionState,
): Promise<MfaEnrollmentActionState> {
  void _state;
  const access = await requireEditorialAccess("/admin/mfa/enroll");

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const assurance = await getBoundMfaAssurance(
      supabase,
      access.identity.userId,
    );

    if (
      !assurance ||
      assurance.currentLevel !== "aal1" ||
      assurance.nextLevel !== "aal1"
    ) {
      return mfaUnavailableState();
    }

    const factorsResult = await supabase.auth.mfa.listFactors();

    if (factorsResult.error || !factorsResult.data) {
      return mfaUnavailableState();
    }

    const factorInventory = getTotpFactorInventory(factorsResult.data.all);

    if (!factorInventory) {
      return mfaUnavailableState();
    }

    if (
      factorInventory.verified.length === 1 &&
      factorInventory.unverified.length === 0
    ) {
      return {
        message:
          "A verified authenticator is already enrolled. Use the MFA challenge page to verify this session.",
        status: "error",
      };
    }

    if (
      factorInventory.verified.length > 0 ||
      factorInventory.unverified.length > 1
    ) {
      return mfaUnavailableState();
    }

    for (const factor of factorInventory.unverified) {
      const cleanupResult = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });

      if (cleanupResult.error || cleanupResult.data?.id !== factor.id) {
        return mfaUnavailableState();
      }
    }

    const cleanedFactorsResult = await supabase.auth.mfa.listFactors();
    const cleanedAssurance = await getBoundMfaAssurance(
      supabase,
      access.identity.userId,
    );
    const cleanedInventory = cleanedFactorsResult.data
      ? getTotpFactorInventory(cleanedFactorsResult.data.all)
      : null;

    if (
      cleanedFactorsResult.error ||
      !cleanedInventory ||
      cleanedInventory.verified.length !== 0 ||
      cleanedInventory.unverified.length !== 0 ||
      !cleanedAssurance ||
      cleanedAssurance.currentLevel !== "aal1" ||
      cleanedAssurance.nextLevel !== "aal1"
    ) {
      return mfaUnavailableState();
    }

    const enrollmentResult = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "FoodForFun Atlas authenticator",
      issuer: "FoodForFun Atlas",
    });

    if (
      enrollmentResult.error ||
      !enrollmentResult.data ||
      enrollmentResult.data.type !== "totp" ||
      !enrollmentResult.data.id ||
      !isSafeTotpQrCode(enrollmentResult.data.totp.qr_code) ||
      !isSafeTotpEnrollmentSecret(enrollmentResult.data.totp.secret)
    ) {
      return mfaUnavailableState();
    }

    const enrolledFactorsResult = await supabase.auth.mfa.listFactors();
    const enrolledInventory = enrolledFactorsResult.data
      ? getTotpFactorInventory(enrolledFactorsResult.data.all)
      : null;

    if (
      enrolledFactorsResult.error ||
      !enrolledInventory ||
      enrolledInventory.verified.length !== 0 ||
      enrolledInventory.unverified.length !== 1 ||
      enrolledInventory.unverified[0].id !== enrollmentResult.data.id
    ) {
      return mfaUnavailableState();
    }

    return {
      message:
        "Scan the QR code, then verify the current six-digit code from your authenticator app.",
      setup: {
        factorId: enrollmentResult.data.id,
        qrCode: enrollmentResult.data.totp.qr_code,
        secret: enrollmentResult.data.totp.secret,
      },
      status: "setup",
    };
  } catch {
    return mfaUnavailableState();
  }
}

export async function verifyTotpEnrollmentAction(
  _state: MfaActionState,
  formData: FormData,
): Promise<MfaActionState> {
  void _state;
  const access = await requireEditorialAccess("/admin/mfa/enroll");

  const code = readFormValue(formData, "code");
  const factorId = readFormValue(formData, "factor_id");

  if (!isTotpCode(code)) {
    return invalidCodeState();
  }

  let aal2Confirmed = false;
  let verificationSucceeded = false;

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const assurance = await getBoundMfaAssurance(
      supabase,
      access.identity.userId,
    );
    const factorsResult = await supabase.auth.mfa.listFactors();
    const factorInventory = factorsResult.data
      ? getTotpFactorInventory(factorsResult.data.all)
      : null;

    if (
      !assurance ||
      assurance.currentLevel !== "aal1" ||
      assurance.nextLevel !== "aal1" ||
      factorsResult.error ||
      !factorInventory ||
      factorInventory.verified.length !== 0 ||
      factorInventory.unverified.length !== 1 ||
      !findOwnedTotpFactor(
        factorInventory.unverified,
        factorId,
        "unverified",
      )
    ) {
      return {
        message:
          "This enrollment is no longer available. Start a new setup and scan the new QR code.",
        status: "error",
      };
    }

    const challengeResult = await supabase.auth.mfa.challenge({ factorId });

    if (challengeResult.error || !challengeResult.data?.id) {
      return invalidCodeState();
    }

    const verifyResult = await supabase.auth.mfa.verify({
      challengeId: challengeResult.data.id,
      code,
      factorId,
    });

    if (
      verifyResult.error ||
      !verifyResult.data?.access_token ||
      verifyResult.data.user.id !== access.identity.userId
    ) {
      return invalidCodeState();
    }

    verificationSucceeded = true;
    aal2Confirmed = await hasAuthoritativeAal2Session(
      supabase,
      access.identity.userId,
      verifyResult.data.access_token,
    );
  } catch {
    if (!verificationSucceeded) {
      return mfaUnavailableState();
    }
  }

  if (!aal2Confirmed) {
    redirect("/admin/mfa", RedirectType.replace);
  }

  redirect("/admin/mfa?status=enrolled", RedirectType.replace);
}

export async function verifyTotpChallengeAction(
  _state: MfaActionState,
  formData: FormData,
): Promise<MfaActionState> {
  void _state;
  const access = await requireEditorialAccess("/admin/mfa/challenge");

  const code = readFormValue(formData, "code");
  const factorId = readFormValue(formData, "factor_id");
  const next = getSafeAdminRedirect(readFormValue(formData, "next"));

  if (!isTotpCode(code)) {
    return invalidCodeState();
  }

  let aal2Confirmed = false;
  let verificationSucceeded = false;

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const assurance = await getBoundMfaAssurance(
      supabase,
      access.identity.userId,
    );
    const factorsResult = await supabase.auth.mfa.listFactors();
    const factorInventory = factorsResult.data
      ? getTotpFactorInventory(factorsResult.data.all)
      : null;

    if (
      !assurance ||
      assurance.currentLevel !== "aal1" ||
      assurance.nextLevel !== "aal2" ||
      factorsResult.error ||
      !factorInventory ||
      factorInventory.verified.length === 0 ||
      factorInventory.unverified.length !== 0 ||
      !findOwnedTotpFactor(
        factorInventory.verified,
        factorId,
        "verified",
      )
    ) {
      return {
        message:
          "That authenticator is not available for this account. Return to MFA status and try again.",
        status: "error",
      };
    }

    const challengeResult = await supabase.auth.mfa.challenge({ factorId });

    if (challengeResult.error || !challengeResult.data?.id) {
      return invalidCodeState();
    }

    const verifyResult = await supabase.auth.mfa.verify({
      challengeId: challengeResult.data.id,
      code,
      factorId,
    });

    if (
      verifyResult.error ||
      !verifyResult.data?.access_token ||
      verifyResult.data.user.id !== access.identity.userId
    ) {
      return invalidCodeState();
    }

    verificationSucceeded = true;
    aal2Confirmed = await hasAuthoritativeAal2Session(
      supabase,
      access.identity.userId,
      verifyResult.data.access_token,
    );
  } catch {
    if (!verificationSucceeded) {
      return mfaUnavailableState();
    }
  }

  if (!aal2Confirmed) {
    redirect("/admin/mfa", RedirectType.replace);
  }

  redirect(next);
}
