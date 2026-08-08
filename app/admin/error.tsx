"use client";

import Link from "next/link";

export default function AdminError() {
  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="admin-error-heading">
        <p className="eyebrow">Admin unavailable</p>
        <h1 id="admin-error-heading">We could not verify access</h1>
        <p className="admin-auth-introduction">
          Your session and editorial membership could not be checked safely.
          No administrative content has been shown. Please try again later.
        </p>
        <div className="admin-auth-links">
          <Link href="/admin/login">Return to sign in</Link>
          <Link href="/">Return to the public Atlas</Link>
        </div>
      </section>
    </main>
  );
}
