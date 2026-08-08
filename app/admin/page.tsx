import Link from "next/link";

import { formatEditorialRole } from "@/app/_lib/auth/membership";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { SignOutForm } from "@/app/admin/_components/sign-out-form";

const editorialSections = ["Stories", "Places", "Themes", "Sources"];

type AdminPageProps = {
  searchParams: Promise<{ status?: string | string[] }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const access = await requireEditorialAccess("/admin");
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
          This secure shell confirms account and editorial access. Content
          editing will arrive in a later reviewed phase.
        </p>
      </header>

      {status === "password-updated" ? (
        <p className="admin-status-banner" role="status">
          Your password has been updated.
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
            <dd>{access.identity.aal.toUpperCase()}</dd>
          </div>
        </dl>
      </section>

      <nav className="admin-section-nav" aria-label="Editorial sections">
        <p className="eyebrow">Future work areas</p>
        <ul>
          {editorialSections.map((section) => (
            <li key={section}>
              <span>{section}</span>
              <small>Not available in Phase B</small>
            </li>
          ))}
        </ul>
      </nav>

      <footer className="admin-footer">
        <Link href="/">Return to the public Atlas</Link>
        <SignOutForm />
      </footer>
    </main>
  );
}
