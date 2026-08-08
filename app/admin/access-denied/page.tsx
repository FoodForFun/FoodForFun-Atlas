import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminAccess } from "@/app/_lib/auth/session";
import { SignOutForm } from "@/app/admin/_components/sign-out-form";

export default async function AccessDeniedPage() {
  const access = await getAdminAccess();

  if (access.kind === "unauthenticated") {
    redirect("/admin/login?status=invalid-session");
  }

  if (access.kind === "authorized") {
    redirect("/admin");
  }

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="denied-heading">
        <p className="eyebrow">Access denied</p>
        <h1 id="denied-heading">Editorial access is not available</h1>
        <p className="admin-auth-introduction">
          This signed-in account does not have an active FoodForFun Atlas
          editorial membership. Authentication alone does not grant access.
        </p>
        <div className="admin-auth-links">
          <Link href="/">Return to the public Atlas</Link>
        </div>
        <SignOutForm />
      </section>
    </main>
  );
}
