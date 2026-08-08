import Link from "next/link";
import { redirect } from "next/navigation";

import { getSafeAdminRedirect } from "@/app/_lib/auth/redirects";
import { getAdminAccess } from "@/app/_lib/auth/session";
import { LoginForm } from "@/app/admin/_components/login-form";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    status?: string | string[];
  }>;
};

const statusMessages: Record<string, string> = {
  "invalid-link":
    "That authentication link is invalid or has expired. Request a new link and try again.",
  "invalid-session": "Your session is no longer valid. Please sign in again.",
  "signed-out": "You have been signed out.",
};

export default async function AdminLoginPage({
  searchParams,
}: LoginPageProps) {
  const parameters = await searchParams;
  const requestedNext = Array.isArray(parameters.next)
    ? parameters.next[0]
    : parameters.next;
  const status = Array.isArray(parameters.status)
    ? parameters.status[0]
    : parameters.status;
  const next = getSafeAdminRedirect(requestedNext);
  const access = await getAdminAccess();

  if (access.kind === "authorized") {
    redirect(next);
  }

  if (access.kind === "denied") {
    redirect("/admin/access-denied");
  }

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="login-heading">
        <p className="eyebrow">Invite-only access</p>
        <h1 id="login-heading">FoodForFun Atlas Admin</h1>
        <p className="admin-auth-introduction">
          Sign in with the email and password attached to your invited account.
          A valid account must also have an active editorial membership.
        </p>
        {status && statusMessages[status] ? (
          <p className="admin-status-banner" role="status">
            {statusMessages[status]}
          </p>
        ) : null}
        <LoginForm next={next} />
        <div className="admin-auth-links">
          <Link href="/admin/forgot-password">Forgot your password?</Link>
          <Link href="/">Return to the public Atlas</Link>
        </div>
      </section>
    </main>
  );
}
