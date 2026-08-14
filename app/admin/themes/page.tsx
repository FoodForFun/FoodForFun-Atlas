import Link from "next/link";

import { formatEditorialRole } from "@/app/_lib/auth/membership";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { canCreateThemes } from "@/app/_lib/editorial/theme";
import { getEditorialThemes } from "@/app/_lib/editorial/themes-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default async function AdminThemesPage() {
  const access = await requireEditorialAccess("/admin/themes");
  const result = await getEditorialThemes();
  const canCreate = canCreateThemes(access.role);

  return (
    <main className="admin-page admin-story-page">
      <nav className="admin-breadcrumb" aria-label="Admin breadcrumb">
        <Link href="/admin">Admin</Link>
        <span aria-hidden="true">/</span>
        <span>Themes</span>
      </nav>
      <header className="admin-header admin-editorial-header">
        <div>
          <p className="eyebrow">Editorial workspace</p>
          <h1>Themes</h1>
          <p>
            Maintain the reusable editorial vocabulary available to Story
            connections and public discovery.
          </p>
        </div>
        <div className="admin-header-actions">
          <p>
            {formatEditorialRole(access.role)} · {access.identity.aal.toUpperCase()}
          </p>
          {canCreate ? (
            <Link className="admin-primary-link" href="/admin/themes/new">
              Create Theme
            </Link>
          ) : null}
        </div>
      </header>

      {!canCreate ? (
        <p className="admin-status-banner" role="status">
          Contributor access is read-only. An Editor or Publisher manages Theme records.
        </p>
      ) : null}

      {result.error ? (
        <section className="admin-empty-state" role="alert">
          <h2>Themes are temporarily unavailable</h2>
          <p>The editorial Theme view could not be read. No data was changed.</p>
        </section>
      ) : result.data.length === 0 ? (
        <section className="admin-empty-state">
          <h2>No Themes are available</h2>
          <p>Create the first reusable Theme through the protected workflow.</p>
        </section>
      ) : (
        <div className="admin-table-shell">
          <table className="admin-story-table">
            <caption className="visually-hidden">
              Themes available to this editorial member
            </caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Group</th>
                <th scope="col">State</th>
                <th scope="col">Updated</th>
                <th scope="col">Version</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((theme) => (
                <tr key={theme.id}>
                  <th data-label="Name" scope="row">
                    {theme.name}{theme.deleted_at ? " (soft-deleted)" : ""}
                  </th>
                  <td data-label="Group">{theme.theme_group || "Not set"}</td>
                  <td data-label="State">{theme.is_active ? "Active" : "Inactive"}</td>
                  <td data-label="Updated">
                    {dateFormatter.format(new Date(theme.updated_at))}
                  </td>
                  <td data-label="Version">{theme.lock_version}</td>
                  <td data-label="Action">
                    <Link href={`/admin/themes/${theme.id}`}>Open Theme</Link>
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
