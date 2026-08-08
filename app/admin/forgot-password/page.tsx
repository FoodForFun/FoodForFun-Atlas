import Link from "next/link";

import { PasswordResetForm } from "@/app/admin/_components/password-reset-form";

export default function ForgotPasswordPage() {
  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="reset-heading">
        <p className="eyebrow">Account recovery</p>
        <h1 id="reset-heading">Reset your password</h1>
        <p className="admin-auth-introduction">
          Enter the email address for your invited account. The response is the
          same whether or not an account exists.
        </p>
        <PasswordResetForm />
        <div className="admin-auth-links">
          <Link href="/admin/login">Return to sign in</Link>
        </div>
      </section>
    </main>
  );
}
