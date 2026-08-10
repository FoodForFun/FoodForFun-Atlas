import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminMfaState } from "@/app/_lib/auth/mfa-server";
import { getSafeAdminRedirect } from "@/app/_lib/auth/redirects";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { SignOutForm } from "@/app/admin/_components/sign-out-form";
import { MfaChallengeForm } from "@/app/admin/mfa/_components/challenge-form";

type MfaChallengePageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function MfaChallengePage({
  searchParams,
}: MfaChallengePageProps) {
  const access = await requireEditorialAccess("/admin/mfa/challenge");
  const parameters = await searchParams;
  const requestedNext = Array.isArray(parameters.next)
    ? parameters.next[0]
    : parameters.next;
  const next = getSafeAdminRedirect(requestedNext);
  const mfa = await getAdminMfaState(access.identity.userId);

  if (mfa.sessionState === "verified") {
    redirect(next);
  }

  if (mfa.verifiedTotpFactors.length === 0) {
    redirect(
      mfa.sessionState === "enrollment-required"
        ? "/admin/mfa/enroll"
        : "/admin/mfa",
    );
  }

  if (mfa.sessionState !== "challenge-required") {
    redirect("/admin/mfa");
  }

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="challenge-heading">
        <p className="eyebrow">AAL2 verification</p>
        <h1 id="challenge-heading">Verify this session</h1>
        <p className="admin-auth-introduction">
          Password authentication established AAL1. Enter a current TOTP code
          from a verified authenticator to reach AAL2 for sensitive Publisher
          operations.
        </p>
        <MfaChallengeForm factors={mfa.verifiedTotpFactors} next={next} />
        <div className="admin-auth-links">
          <Link href="/admin/mfa">Return to MFA status</Link>
          <Link href="/admin">Continue to the basic admin shell</Link>
        </div>
        <SignOutForm />
      </section>
    </main>
  );
}
