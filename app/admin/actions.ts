"use server";

import { redirect } from "next/navigation";

import { getActiveEditorialRole } from "@/app/_lib/auth/membership";
import { getSafeAdminRedirect } from "@/app/_lib/auth/redirects";
import { getSiteUrl } from "@/app/_lib/auth/site-url";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";
import { type AuthActionState } from "@/app/admin/action-state";

function readFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readRawFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function isPlausibleEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function signInAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readFormValue(formData, "email").toLowerCase();
  const password = readRawFormValue(formData, "password");
  const next = getSafeAdminRedirect(readFormValue(formData, "next"));

  if (!isPlausibleEmail(email) || !password || password.length > 1024) {
    return {
      message: "Enter a valid email address and password.",
      status: "error",
    };
  }

  let shouldChallengeMfa = false;

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return {
        message: "The email or password was not recognized.",
        status: "error",
      };
    }

    try {
      const { data: claimsData } = await supabase.auth.getClaims();
      const userId =
        typeof claimsData?.claims?.sub === "string"
          ? claimsData.claims.sub
          : null;

      if (userId) {
        const { data: membership, error: membershipError } = await supabase
          .from("editorial_memberships")
          .select("role, is_active")
          .eq("user_id", userId)
          .maybeSingle();
        const role = membershipError
          ? null
          : getActiveEditorialRole(membership);

        if (role) {
          const assuranceResult =
            await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

          shouldChallengeMfa =
            !assuranceResult.error &&
            assuranceResult.data?.currentLevel === "aal1" &&
            assuranceResult.data.nextLevel === "aal2";
        }
      }
    } catch {
      // The destination repeats authoritative membership and session checks.
      // MFA discovery must not turn a successful password sign-in into an
      // ambiguous failure or grant access by itself.
    }
  } catch {
    return {
      message: "Sign-in is temporarily unavailable. Please try again later.",
      status: "error",
    };
  }

  if (shouldChallengeMfa) {
    redirect(`/admin/mfa/challenge?next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function requestPasswordResetAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readFormValue(formData, "email").toLowerCase();

  if (!isPlausibleEmail(email)) {
    return {
      message: "Enter a valid email address.",
      status: "error",
    };
  }

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const callbackUrl = new URL("/auth/callback", getSiteUrl());
    callbackUrl.searchParams.set(
      "next",
      "/admin/update-password?flow=recovery",
    );
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl.toString(),
    });

    if (error) {
      return {
        message: "A reset request could not be sent. Please try again later.",
        status: "error",
      };
    }
  } catch {
    return {
      message: "A reset request could not be sent. Please try again later.",
      status: "error",
    };
  }

  return {
    message:
      "If an invited account exists for that address, a password reset email has been sent.",
    status: "success",
  };
}

export async function updatePasswordAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = readRawFormValue(formData, "password");
  const passwordConfirmation = readRawFormValue(
    formData,
    "password_confirmation",
  );

  if (password.length < 12 || password.length > 1024) {
    return {
      message: "Use a password of at least 12 characters.",
      status: "error",
    };
  }

  if (password !== passwordConfirmation) {
    return {
      message: "The password confirmation does not match.",
      status: "error",
    };
  }

  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims) {
      return {
        message: "This authentication link is invalid or has expired.",
        status: "error",
      };
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return {
        message:
          "The password could not be updated. Check the requirements and try again.",
        status: "error",
      };
    }
  } catch {
    return {
      message: "The password could not be updated. Please try again later.",
      status: "error",
    };
  }

  redirect("/admin?status=password-updated");
}

export async function signOutAction() {
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    await supabase.auth.signOut({ scope: "local" });
  } finally {
    redirect("/admin/login?status=signed-out");
  }
}
