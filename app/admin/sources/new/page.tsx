import Link from "next/link";

import { formatEditorialRole } from "@/app/_lib/auth/membership";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { SourceMetadataForm } from "@/app/admin/sources/_components/source-metadata-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewSourcePage() {
  const access = await requireEditorialAccess("/admin/sources/new");

  return (
    <main className="admin-page admin-story-page">
      <nav className="admin-breadcrumb" aria-label="Admin breadcrumb">
        <Link href="/admin">Admin</Link>
        <span aria-hidden="true">/</span>
        <Link href="/admin/sources">Sources</Link>
        <span aria-hidden="true">/</span>
        <span>New</span>
      </nav>

      <header className="admin-header admin-editorial-header">
        <div>
          <p className="eyebrow">New editorial record</p>
          <h1>Create Source</h1>
          <p>
            Start with public-safe metadata. Private transcripts and rights
            review become available after the protected Source is created.
          </p>
        </div>
        <p className="admin-session-summary">
          {formatEditorialRole(access.role)} · {access.identity.aal.toUpperCase()}
        </p>
      </header>

      <section className="admin-editor-section" aria-labelledby="metadata-heading">
        <div className="admin-section-heading">
          <p className="eyebrow">Metadata</p>
          <h2 id="metadata-heading">Source identity</h2>
          <p>
            Exact URL or same-type external ID matches require deliberate
            duplicate confirmation before creation.
          </p>
        </div>
        <SourceMetadataForm mode="create" />
      </section>
    </main>
  );
}
