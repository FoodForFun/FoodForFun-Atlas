import Link from "next/link";

import { formatEditorialRole } from "@/app/_lib/auth/membership";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { canCreateThemes } from "@/app/_lib/editorial/theme";
import { ThemeForm } from "@/app/admin/themes/_components/theme-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewThemePage() {
  const access = await requireEditorialAccess("/admin/themes/new");
  const canCreate = canCreateThemes(access.role);

  return (
    <main className="admin-page admin-story-page">
      <nav className="admin-breadcrumb" aria-label="Admin breadcrumb">
        <Link href="/admin">Admin</Link>
        <span aria-hidden="true">/</span>
        <Link href="/admin/themes">Themes</Link>
        <span aria-hidden="true">/</span>
        <span>New</span>
      </nav>
      <header className="admin-header admin-editorial-header">
        <div>
          <p className="eyebrow">New editorial record</p>
          <h1>Create Theme</h1>
          <p>Check the existing vocabulary before adding a separate reusable Theme.</p>
        </div>
        <p className="admin-session-summary">
          {formatEditorialRole(access.role)} · {access.identity.aal.toUpperCase()}
        </p>
      </header>
      <section className="admin-editor-section" aria-labelledby="theme-heading">
        <div className="admin-section-heading">
          <p className="eyebrow">Vocabulary</p>
          <h2 id="theme-heading">Theme identity</h2>
          <p>Matching names or slugs require deliberate duplicate confirmation.</p>
        </div>
        {canCreate ? (
          <ThemeForm mode="create" />
        ) : (
          <div className="admin-empty-state">
            <h3>Read-only role</h3>
            <p>An Editor or Publisher role is required to create Themes.</p>
            <Link href="/admin/themes">Return to Themes</Link>
          </div>
        )}
      </section>
    </main>
  );
}
