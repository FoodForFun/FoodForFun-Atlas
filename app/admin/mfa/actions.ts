"use server";

import { redirect } from "next/navigation";

import {
  findOwnedTotpFactor,
  isTotpCode,
} from "@/app/_lib/auth/mfa";
import { getSafeAdminRedirect } from "@/app/_lib/auth/redirects";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";
import {
  type MfaActionState,
  type MfaEnrollmentActionState,
} from "@/app/admin/mfa/action-state";

function readFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function mfaUnavailableState(): MfaActionState {
  return {
    message:
      "Authenticator verification is temporarily unavailable. No security change was completed. Please try again.",
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

export async function startTotpEnrollmentAction(
  _state: MfaEnrollmentActionState,
): Promise<MfaEnrollmentActionState> {
  void _state;
  await requireEditorialAccess("/admin/mfa/enroll");

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const factorsResult = await supabase.auth.mfa.listFactors();

    if (factorsResult.error || !factorsResult.data) {
      return mfaUnavailableState();
    }

    if (factorsResult.data.totp.length > 0) {
      return {
        message:
          "A verified authenticator is already enrolled. Use the MFA challenge page to verify this session.",
        status: "error",
      };
    }

    const interruptedTotpFactors = factorsResult.data.all.filter(
      (factor) =>
        factor.factor_type === "totp" && factor.status === "unverified",
    );

    for (const factor of interruptedTotpFactors) {
      const cleanupResult = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });

      if (cleanupResult.error) {
        return mfaUnavailableState();
      }
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
      !enrollmentResult.data.totp.qr_code ||
      !enrollmentResult.data.totp.secret
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
  await requireEditorialAccess("/admin/mfa/enroll");

  const code = readFormValue(formData, "code");
  const factorId = readFormValue(formData, "factor_id");

  if (!isTotpCode(code)) {
    return invalidCodeState();
  }

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const factorsResult = await supabase.auth.mfa.listFactors();

    if (
      factorsResult.error ||
      !factorsResult.data ||
      !findOwnedTotpFactor(
        factorsResult.data.all,
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

    if (verifyResult.error) {
      return invalidCodeState();
    }

    const assuranceResult =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (
      assuranceResult.error ||
      assuranceResult.data?.currentLevel !== "aal2"
    ) {
      return mfaUnavailableState();
    }
  } catch {
    return mfaUnavailableState();
  }

  redirect("/admin/mfa?status=enrolled");
}

export async function verifyTotpChallengeAction(
  _state: MfaActionState,
  formData: FormData,
): Promise<MfaActionState> {
  await requireEditorialAccess("/admin/mfa/challenge");

  const code = readFormValue(formData, "code");
  const factorId = readFormValue(formData, "factor_id");
  const next = getSafeAdminRedirect(readFormValue(formData, "next"));

  if (!isTotpCode(code)) {
    return invalidCodeState();
  }

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const factorsResult = await supabase.auth.mfa.listFactors();

    if (
      factorsResult.error ||
      !factorsResult.data ||
      !findOwnedTotpFactor(factorsResult.data.all, factorId, "verified")
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

    if (verifyResult.error) {
      return invalidCodeState();
    }

    const assuranceResult =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (
      assuranceResult.error ||
      assuranceResult.data?.currentLevel !== "aal2"
    ) {
      return mfaUnavailableState();
    }
  } catch {
    return mfaUnavailableState();
  }

  redirect(next);
}
