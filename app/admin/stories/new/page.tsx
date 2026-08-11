import Link from "next/link";

import { formatEditorialRole } from "@/app/_lib/auth/membership";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { StoryForm } from "@/app/admin/stories/_components/story-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewStoryPage() {
  const access = await requireEditorialAccess("/admin/stories/new");

  return (
    <main className="admin-page admin-story-page">
      <nav className="admin-breadcrumb" aria-label="Admin breadcrumb">
        <Link href="/admin">Admin</Link>
        <span aria-hidden="true">/</span>
        <Link href="/admin/stories">Stories</Link>
        <span aria-hidden="true">/</span>
        <span>New</span>
      </nav>

      <header className="admin-header admin-editorial-header">
        <div>
          <p className="eyebrow">New editorial record</p>
          <h1>Create Story draft</h1>
          <p>
            All new Stories begin as private drafts. Workflow and publication
            fields are controlled separately by protected database transitions.
          </p>
        </div>
        <p className="admin-session-summary">
          {formatEditorialRole(access.role)} · {access.identity.aal.toUpperCase()}
        </p>
      </header>

      <section className="admin-editor-section" aria-labelledby="content-heading">
        <div className="admin-section-heading">
          <p className="eyebrow">Content</p>
          <h2 id="content-heading">Story fields</h2>
        </div>
        <StoryForm mode="create" />
      </section>
    </main>
  );
}
