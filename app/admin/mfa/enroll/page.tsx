import { redirect } from "next/navigation";

import { getAdminMfaState } from "@/app/_lib/auth/mfa-server";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { SignOutForm } from "@/app/admin/_components/sign-out-form";
import {
  MfaEnrollmentExitLinks,
  MfaEnrollmentForm,
} from "@/app/admin/mfa/_components/enrollment-form";

export default async function MfaEnrollmentPage() {
  const access = await requireEditorialAccess("/admin/mfa/enroll");
  const mfa = await getAdminMfaState(access.identity.userId);

  if (mfa.verifiedTotpFactors.length > 0) {
    if (mfa.sessionState === "challenge-required") {
      redirect("/admin/mfa/challenge?next=%2Fadmin%2Fmfa");
    }

    redirect("/admin/mfa");
  }

  if (mfa.sessionState !== "enrollment-required") {
    redirect("/admin/mfa");
  }

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="enrollment-heading">
        <p className="eyebrow">Account security</p>
        <h1 id="enrollment-heading">Enroll an authenticator</h1>
        <p className="admin-auth-introduction">
          Start setup, scan the one-time QR code with an authenticator app, and
          verify the current code. The factor is not active and the session does
          not reach AAL2 until verification succeeds.
        </p>
        <MfaEnrollmentForm />
        <MfaEnrollmentExitLinks />
        <SignOutForm />
      </section>
    </main>
  );
}
