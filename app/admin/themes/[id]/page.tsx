import Link from "next/link";
import { notFound } from "next/navigation";

import { formatEditorialRole } from "@/app/_lib/auth/membership";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { getThemeCapabilities, isThemeId } from "@/app/_lib/editorial/theme";
import { getEditorialTheme } from "@/app/_lib/editorial/themes-server";
import { ThemeActiveForm } from "@/app/admin/themes/_components/theme-active-form";
import { ThemeForm } from "@/app/admin/themes/_components/theme-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const statusMessages: Record<string, string> = {
  created: "Theme created and available for Story connections.",
  deactivated: "Theme deactivated. Existing records remain intact.",
  reactivated: "Theme reactivated and publicly readable.",
  saved: "Theme saved.",
};

type ThemeEditorPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string | string[] }>;
};

export default async function ThemeEditorPage({
  params,
  searchParams,
}: ThemeEditorPageProps) {
  const { id } = await params;
  if (!isThemeId(id)) notFound();
  const access = await requireEditorialAccess(`/admin/themes/${id}`);
  const result = await getEditorialTheme(id);
  if (result.error) throw new Error("The editorial Theme could not be loaded.");
  if (!result.data) notFound();
  const theme = result.data;
  const capabilities = getThemeCapabilities({
    aal: access.identity.aal,
    role: access.role,
    theme,
  });
  const parameters = await searchParams;
  const status = Array.isArray(parameters.status)
    ? parameters.status[0]
    : parameters.status;

  return (
    <main className="admin-page admin-story-page">
      <nav className="admin-breadcrumb" aria-label="Admin breadcrumb">
        <Link href="/admin">Admin</Link>
        <span aria-hidden="true">/</span>
        <Link href="/admin/themes">Themes</Link>
        <span aria-hidden="true">/</span>
        <span>{theme.name}</span>
      </nav>
      <header className="admin-header admin-editorial-header">
        <div>
          <p className="eyebrow">Theme editor</p>
          <h1>{theme.name}</h1>
          <p>
            Version {theme.lock_version} · {theme.is_active ? "Active" : "Inactive"}
          </p>
        </div>
        <p className="admin-session-summary">
          {formatEditorialRole(access.role)} · {access.identity.aal.toUpperCase()}
        </p>
      </header>

      {status && statusMessages[status] ? (
        <p className="admin-status-banner" role="status">
          {statusMessages[status]}
        </p>
      ) : null}

      {!theme.is_active && !capabilities.canReactivate ? (
        <p className="admin-status-banner" role="status">
          Reactivation requires a Publisher AAL2 session and explicit confirmation. {access.role === "publisher" ? (
            <Link href="/admin/mfa/challenge">Verify this session</Link>
          ) : null}
        </p>
      ) : null}

      <section className="admin-story-metadata" aria-labelledby="state-heading">
        <div className="admin-section-heading">
          <p className="eyebrow">Record state</p>
          <h2 id="state-heading">Theme metadata</h2>
        </div>
        <dl>
          <div><dt>State</dt><dd>{theme.is_active ? "Active" : "Inactive"}</dd></div>
          <div><dt>Group</dt><dd>{theme.theme_group || "Not set"}</dd></div>
          <div><dt>Slug</dt><dd>{theme.slug}</dd></div>
          <div><dt>Updated</dt><dd>{dateFormatter.format(new Date(theme.updated_at))}</dd></div>
          <div><dt>Lock version</dt><dd>{theme.lock_version}</dd></div>
          <div><dt>Deletion</dt><dd>{theme.deleted_at ? "Soft-deleted" : "Active record"}</dd></div>
        </dl>
      </section>

      <section className="admin-editor-section" aria-labelledby="content-heading">
        <div className="admin-section-heading">
          <p className="eyebrow">Vocabulary</p>
          <h2 id="content-heading">Theme fields</h2>
          {!capabilities.canEdit ? <p>This Theme is read-only in the current role or record state.</p> : null}
        </div>
        {capabilities.canEdit ? (
          <ThemeForm mode="edit" theme={theme} />
        ) : (
          <div className="admin-readonly-story">
            <h3>{theme.name}</h3>
            <p>{theme.theme_group || "No Theme group"}</p>
            <pre>{theme.description || "No description stored."}</pre>
          </div>
        )}
      </section>

      {!theme.deleted_at ? (
        <section className="admin-editor-section" aria-labelledby="state-change-heading">
          <div className="admin-section-heading">
            <p className="eyebrow">Discovery state</p>
            <h2 id="state-change-heading">Theme availability</h2>
            <p>State changes retain the Theme and all existing Story relationships.</p>
          </div>
          {capabilities.canDeactivate || capabilities.canReactivate ? (
            <ThemeActiveForm
              active={theme.is_active}
              lockVersion={theme.lock_version}
              themeId={theme.id}
            />
          ) : (
            <p>No Theme state change is available in this session.</p>
          )}
        </section>
      ) : null}
    </main>
  );
}
