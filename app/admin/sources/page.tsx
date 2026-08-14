import Link from "next/link";

import { formatEditorialRole } from "@/app/_lib/auth/membership";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { formatSourceStatus } from "@/app/_lib/editorial/source";
import { getEditorialSources } from "@/app/_lib/editorial/sources-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Not set";
}

export default async function AdminSourcesPage() {
  const access = await requireEditorialAccess("/admin/sources");
  const result = await getEditorialSources();

  return (
    <main className="admin-page admin-story-page">
      <nav className="admin-breadcrumb" aria-label="Admin breadcrumb">
        <Link href="/admin">Admin</Link>
        <span aria-hidden="true">/</span>
        <span>Sources</span>
      </nav>

      <header className="admin-header admin-editorial-header">
        <div>
          <p className="eyebrow">Editorial workspace</p>
          <h1>Sources</h1>
          <p>
            Review public-safe Source metadata before opening its protected
            transcript, processing, and rights workspace.
          </p>
        </div>
        <div className="admin-header-actions">
          <p>
            {formatEditorialRole(access.role)} · {access.identity.aal.toUpperCase()}
          </p>
          <Link className="admin-primary-link" href="/admin/sources/new">
            Create Source
          </Link>
        </div>
      </header>

      {result.error ? (
        <section className="admin-empty-state" role="alert">
          <h2>Sources are temporarily unavailable</h2>
          <p>The editorial Source view could not be read. No data was changed.</p>
        </section>
      ) : result.data.length === 0 ? (
        <section className="admin-empty-state">
          <h2>No Sources are available</h2>
          <p>Create the first Source through the protected editorial workflow.</p>
          <Link className="admin-primary-link" href="/admin/sources/new">
            Create Source
          </Link>
        </section>
      ) : (
        <div className="admin-table-shell">
          <table className="admin-story-table">
            <caption className="visually-hidden">
              Public-safe Source metadata available to this editorial member
            </caption>
            <thead>
              <tr>
                <th scope="col">Original title</th>
                <th scope="col">Type</th>
                <th scope="col">Publisher</th>
                <th scope="col">Availability</th>
                <th scope="col">Updated</th>
                <th scope="col">Version</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((source) => (
                <tr key={source.id}>
                  <th data-label="Original title" scope="row">
                    {source.original_title || "Untitled Source"}
                    {source.deleted_at ? " (soft-deleted)" : ""}
                  </th>
                  <td data-label="Type">
                    {formatSourceStatus(source.source_type)}
                  </td>
                  <td data-label="Publisher">{source.publisher || "Not set"}</td>
                  <td data-label="Availability">
                    {formatSourceStatus(source.availability_status)}
                  </td>
                  <td data-label="Updated">{formatDate(source.updated_at)}</td>
                  <td data-label="Version">{source.lock_version}</td>
                  <td data-label="Action">
                    <Link href={`/admin/sources/${source.id}`}>Open editor</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
