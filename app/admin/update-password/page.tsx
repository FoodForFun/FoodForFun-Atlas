import Link from "next/link";

import { requireAuthenticatedIdentity } from "@/app/_lib/auth/session";
import { PasswordUpdateForm } from "@/app/admin/_components/password-update-form";

type UpdatePasswordPageProps = {
  searchParams: Promise<{ flow?: string | string[] }>;
};

export default async function UpdatePasswordPage({
  searchParams,
}: UpdatePasswordPageProps) {
  await requireAuthenticatedIdentity();
  const parameters = await searchParams;
  const flow = Array.isArray(parameters.flow)
    ? parameters.flow[0]
    : parameters.flow;
  const introduction =
    flow === "invite"
      ? "Your invitation was verified. Set a password before continuing."
      : "Choose a new password for your invited account.";

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="password-heading">
        <p className="eyebrow">Secure account</p>
        <h1 id="password-heading">Set your password</h1>
        <p className="admin-auth-introduction">{introduction}</p>
        <PasswordUpdateForm />
        <div className="admin-auth-links">
          <Link href="/admin">Return to the admin shell</Link>
        </div>
      </section>
    </main>
  );
}
