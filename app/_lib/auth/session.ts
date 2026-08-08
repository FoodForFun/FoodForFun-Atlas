import "server-only";

import { redirect } from "next/navigation";

import {
  getActiveEditorialRole,
  type EditorialRole,
} from "@/app/_lib/auth/membership";
import { getSafeAdminRedirect } from "@/app/_lib/auth/redirects";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";

type AuthenticatedIdentity = {
  aal: "aal1" | "aal2";
  email: string;
  userId: string;
};

type AdminAccess =
  | { kind: "unauthenticated" }
  | { identity: AuthenticatedIdentity; kind: "denied" }
  | {
      identity: AuthenticatedIdentity;
      kind: "authorized";
      role: EditorialRole;
    };

export class AdminAuthorizationError extends Error {
  constructor() {
    super("Editorial authorization could not be verified.");
    this.name = "AdminAuthorizationError";
  }
}

function getIdentityFromClaims(claims: Record<string, unknown>) {
  const userId = typeof claims.sub === "string" ? claims.sub : null;
  const email = typeof claims.email === "string" ? claims.email : null;

  if (!userId || !email) {
    return null;
  }

  return {
    aal: claims.aal === "aal2" ? "aal2" : "aal1",
    email,
    userId,
  } satisfies AuthenticatedIdentity;
}

export async function getAuthenticatedIdentity() {
  const supabase = await createAuthenticatedServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  return getIdentityFromClaims(data.claims);
}

export async function getAdminAccess(): Promise<AdminAccess> {
  const supabase = await createAuthenticatedServerSupabaseClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    return { kind: "unauthenticated" };
  }

  const identity = getIdentityFromClaims(claimsData.claims);

  if (!identity) {
    return { kind: "unauthenticated" };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("editorial_memberships")
    .select("role, is_active")
    .eq("user_id", identity.userId)
    .maybeSingle();

  if (membershipError) {
    throw new AdminAuthorizationError();
  }

  const role = getActiveEditorialRole(membership);

  if (!role) {
    return { identity, kind: "denied" };
  }

  return { identity, kind: "authorized", role };
}

export async function requireAuthenticatedIdentity() {
  const identity = await getAuthenticatedIdentity();

  if (!identity) {
    redirect("/admin/login?status=invalid-session");
  }

  return identity;
}

export async function requireEditorialAccess(requestedPath = "/admin") {
  const access = await getAdminAccess();

  if (access.kind === "unauthenticated") {
    const next = encodeURIComponent(getSafeAdminRedirect(requestedPath));
    redirect(`/admin/login?next=${next}`);
  }

  if (access.kind === "denied") {
    redirect("/admin/access-denied");
  }

  return access;
}
