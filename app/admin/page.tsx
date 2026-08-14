import Link from "next/link";

import { formatEditorialRole } from "@/app/_lib/auth/membership";
import { getAdminMfaState } from "@/app/_lib/auth/mfa-server";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { SignOutForm } from "@/app/admin/_components/sign-out-form";

const editorialSections = [
  {
    description: "Create, review, preview, and publish Stories",
    href: "/admin/stories",
    label: "Stories",
  },
  {
    description: "Maintain geographic identity, hierarchy, and privacy precision",
    href: "/admin/places",
    label: "Places",
  },
  {
    description: "Maintain reusable editorial vocabulary and discovery state",
    href: "/admin/themes",
    label: "Themes",
  },
  {
    description: "Preserve metadata, transcripts, processing, and rights review",
    href: "/admin/sources",
    label: "Sources",
  },
];

type AdminPageProps = {
  searchParams: Promise<{ status?: string | string[] }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const access = await requireEditorialAccess("/admin");
  const mfa = await getAdminMfaState(access.identity.userId);
  const parameters = await searchParams;
  const status = Array.isArray(parameters.status)
    ? parameters.status[0]
    : parameters.status;

  return (
    <main className="admin-page">
      <header className="admin-header">
        <p className="eyebrow">Editorial workspace</p>
        <h1>FoodForFun Atlas Admin</h1>
        <p>
          This secure workspace confirms account, editorial role, and session
          assurance before opening protected Story work.
        </p>
      </header>

      {status === "password-updated" ? (
        <p className="admin-status-banner" role="status">
          Your password has been updated.
        </p>
      ) : null}

      {mfa.sessionState === "challenge-required" ? (
        <p className="admin-status-banner" role="status">
          This session is AAL1. A verified authenticator is available.{" "}
          <Link href="/admin/mfa/challenge">Verify the session for AAL2</Link>.
        </p>
      ) : null}

      {access.role === "publisher" &&
      mfa.sessionState === "enrollment-required" ? (
        <p className="admin-status-banner" role="status">
          Publisher-sensitive operations require AAL2.{" "}
          <Link href="/admin/mfa/enroll">Enroll a TOTP authenticator</Link>{" "}
          before publication-level work begins.
        </p>
      ) : null}

      <section className="admin-session" aria-labelledby="session-heading">
        <div>
          <p className="eyebrow">Current session</p>
          <h2 id="session-heading">Signed-in account</h2>
        </div>
        <dl>
          <div>
            <dt>Account</dt>
            <dd>{access.identity.email}</dd>
          </div>
          <div>
            <dt>Active editorial role</dt>
            <dd>{formatEditorialRole(access.role)}</dd>
          </div>
          <div>
            <dt>Session assurance</dt>
            <dd>{mfa.currentLevel.toUpperCase()}</dd>
          </div>
        </dl>
      </section>

      <nav className="admin-section-nav" aria-label="Editorial sections">
        <p className="eyebrow">Editorial areas</p>
        <ul>
          {editorialSections.map((section) => (
            <li key={section.label}>
              {section.href ? (
                <Link href={section.href}>{section.label}</Link>
              ) : (
                <span>{section.label}</span>
              )}
              <small>{section.description}</small>
            </li>
          ))}
        </ul>
      </nav>

      <section className="admin-mfa-summary" aria-labelledby="security-heading">
        <div>
          <p className="eyebrow">Account security</p>
          <h2 id="security-heading">Multi-factor authentication</h2>
        </div>
        <div>
          <p>
            Review enrolled authenticators and verify the assurance level needed
            for sensitive Publisher operations.
          </p>
          <Link className="admin-primary-link" href="/admin/mfa">
            View MFA status
          </Link>
        </div>
      </section>

      <footer className="admin-footer">
        <Link href="/">Return to the public Atlas</Link>
        <SignOutForm />
      </footer>
    </main>
  );
}
