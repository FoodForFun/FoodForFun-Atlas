import Link from "next/link";

import { formatEditorialRole } from "@/app/_lib/auth/membership";
import { getAdminMfaState } from "@/app/_lib/auth/mfa-server";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { SignOutForm } from "@/app/admin/_components/sign-out-form";

type MfaStatusPageProps = {
  searchParams: Promise<{ status?: string | string[] }>;
};

export default async function MfaStatusPage({
  searchParams,
}: MfaStatusPageProps) {
  const access = await requireEditorialAccess("/admin/mfa");
  const mfa = await getAdminMfaState(access.identity.userId);
  const parameters = await searchParams;
  const status = Array.isArray(parameters.status)
    ? parameters.status[0]
    : parameters.status;

  return (
    <main className="admin-page">
      <header className="admin-header">
        <p className="eyebrow">Account security</p>
        <h1>Multi-factor authentication</h1>
        <p>
          Review enrolled authenticators and the assurance level of this signed-in
          session. Publisher-sensitive operations require AAL2 at the database.
        </p>
      </header>

      {status === "enrolled" && mfa.sessionState === "verified" ? (
        <p className="admin-status-banner" role="status">
          Authenticator enrollment is complete. This session is now AAL2.
        </p>
      ) : null}

      <section className="admin-session" aria-labelledby="mfa-session-heading">
        <div>
          <p className="eyebrow">Current session</p>
          <h2 id="mfa-session-heading">Assurance status</h2>
        </div>
        <dl>
          <div>
            <dt>Editorial role</dt>
            <dd>{formatEditorialRole(access.role)}</dd>
          </div>
          <div>
            <dt>Current assurance</dt>
            <dd>{mfa.currentLevel.toUpperCase()}</dd>
          </div>
          <div>
            <dt>Verified TOTP authenticators</dt>
            <dd>{mfa.verifiedTotpFactors.length}</dd>
          </div>
        </dl>
      </section>

      <section className="admin-mfa-actions" aria-labelledby="mfa-action-heading">
        <p className="eyebrow">Available action</p>
        <h2 id="mfa-action-heading">
          {mfa.sessionState === "verified"
            ? "This session is ready for AAL2 operations"
            : mfa.sessionState === "challenge-required"
              ? "Verify this session"
              : mfa.sessionState === "enrollment-required"
                ? "Enroll an authenticator"
                : "Refresh this session safely"}
        </h2>
        {mfa.sessionState === "verified" ? (
          <p>
            The session has completed a TOTP challenge. Database controls still
            evaluate role, membership, and AAL for each sensitive operation.
          </p>
        ) : null}
        {mfa.sessionState === "challenge-required" ? (
          <>
            <p>
              A verified authenticator is enrolled, but this password-only session
              is AAL1 until a current TOTP code is verified.
            </p>
            <Link className="admin-primary-link" href="/admin/mfa/challenge">
              Verify with authenticator
            </Link>
          </>
        ) : null}
        {mfa.sessionState === "enrollment-required" ? (
          <>
            <p>
              No verified TOTP authenticator is enrolled. Enrollment is required
              before a Publisher can complete publication-level operations.
            </p>
            <Link className="admin-primary-link" href="/admin/mfa/enroll">
              Enroll authenticator
            </Link>
          </>
        ) : null}
        {mfa.sessionState === "stale-session" ? (
          <p>
            The session or factor inventory is inconsistent. Sign out and sign
            in again before attempting an AAL2 operation. If this state
            persists, do not retry enrollment; ask the project owner to review
            the account&apos;s factors in the Supabase Dashboard.
          </p>
        ) : null}
      </section>

      <footer className="admin-footer">
        <Link href="/admin">Return to the admin shell</Link>
        <SignOutForm />
      </footer>
    </main>
  );
}
