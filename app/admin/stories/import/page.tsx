import Link from "next/link";

import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { PublishPackageForm } from "@/app/admin/stories/import/_components/publish-package-form";

export const dynamic = "force-dynamic";

export default async function ImportAtlasPackagePage() {
  const access = await requireEditorialAccess("/admin/stories/import");
  const canPublish = access.role === "publisher" && access.identity.aal === "aal2";
  return (
    <main className="admin-page admin-story-page">
      <nav className="admin-breadcrumb" aria-label="Admin breadcrumb">
        <Link href="/admin">Admin</Link><span aria-hidden="true">/</span>
        <Link href="/admin/stories">Stories</Link><span aria-hidden="true">/</span><span>Publish package</span>
      </nav>
      <header className="admin-header">
        <div><p className="eyebrow">Daily intake</p><h1>Publish to Atlas</h1><p>Import the confirmed daily package, reuse matching Sources, Places, and Themes, and publish the bilingual Story in one operation.</p></div>
      </header>
      {canPublish ? <PublishPackageForm /> : (
        <section className="admin-empty-state"><h2>Publisher MFA required</h2><p>This operation creates structured records and makes the Story public immediately.</p><Link className="admin-primary-link" href="/admin/mfa/challenge?next=%2Fadmin%2Fstories%2Fimport">Verify this session</Link></section>
      )}
    </main>
  );
}
