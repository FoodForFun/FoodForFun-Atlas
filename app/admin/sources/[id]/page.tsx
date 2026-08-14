import Link from "next/link";
import { notFound } from "next/navigation";

import { formatEditorialRole } from "@/app/_lib/auth/membership";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import {
  formatSourceStatus,
  getSourceCapabilities,
  isSourceId,
} from "@/app/_lib/editorial/source";
import { getSafeHttpUrl } from "@/app/_lib/editorial/story";
import { getEditorialSource } from "@/app/_lib/editorial/sources-server";
import { SourceMetadataForm } from "@/app/admin/sources/_components/source-metadata-form";
import { SourcePrivateForm } from "@/app/admin/sources/_components/source-private-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const statusMessages: Record<string, string> = {
  created: "Source created. Private transcript and rights fields are now available.",
  "private-saved": "Private Source details saved.",
  saved: "Source metadata saved.",
};

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Not set";
}

function ReadonlyMetadata({
  source,
}: {
  source: NonNullable<Awaited<ReturnType<typeof getEditorialSource>>["data"]>["source"];
}) {
  return (
    <dl>
      <div><dt>Type</dt><dd>{formatSourceStatus(source.source_type)}</dd></div>
      <div><dt>URL</dt><dd>{source.source_url || "Not set"}</dd></div>
      <div><dt>External ID</dt><dd>{source.external_id || "Not set"}</dd></div>
      <div><dt>Publisher</dt><dd>{source.publisher || "Not set"}</dd></div>
      <div><dt>Language</dt><dd>{source.original_language || "Not set"}</dd></div>
      <div><dt>Availability</dt><dd>{formatSourceStatus(source.availability_status)}</dd></div>
    </dl>
  );
}

type SourceEditorPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string | string[] }>;
};

export default async function SourceEditorPage({
  params,
  searchParams,
}: SourceEditorPageProps) {
  const { id } = await params;
  if (!isSourceId(id)) notFound();

  const access = await requireEditorialAccess(`/admin/sources/${id}`);
  const result = await getEditorialSource(id);
  if (result.error) throw new Error("The editorial Source could not be loaded.");
  if (!result.data) notFound();

  const { privateDetails, requiresPublicationAssurance, source } = result.data;
  const capabilities = getSourceCapabilities({
    aal: access.identity.aal,
    requiresPublicationAssurance,
    role: access.role,
    source,
    userId: access.identity.userId,
  });
  const parameters = await searchParams;
  const status = Array.isArray(parameters.status)
    ? parameters.status[0]
    : parameters.status;
  const title = source.original_title || "Untitled Source";
  const safeSourceUrl = getSafeHttpUrl(source.source_url);

  return (
    <main className="admin-page admin-story-page">
      <nav className="admin-breadcrumb" aria-label="Admin breadcrumb">
        <Link href="/admin">Admin</Link>
        <span aria-hidden="true">/</span>
        <Link href="/admin/sources">Sources</Link>
        <span aria-hidden="true">/</span>
        <span>{title}</span>
      </nav>

      <header className="admin-header admin-editorial-header">
        <div>
          <p className="eyebrow">Source editor</p>
          <h1>{title}</h1>
          <p>
            Metadata version {source.lock_version} · Private version{" "}
            {privateDetails.lock_version} · {formatSourceStatus(source.source_type)}
          </p>
        </div>
        <div className="admin-header-actions">
          <p>
            {formatEditorialRole(access.role)} · {access.identity.aal.toUpperCase()}
          </p>
          {safeSourceUrl ? (
            <a className="admin-primary-link" href={safeSourceUrl} rel="noreferrer" target="_blank">
              Open original Source
            </a>
          ) : null}
        </div>
      </header>

      {status && statusMessages[status] ? (
        <p className="admin-status-banner" role="status">
          {statusMessages[status]}
        </p>
      ) : null}

      {requiresPublicationAssurance && !capabilities.canEditMetadata ? (
        <p className="admin-status-banner" role="status">
          This Source is connected to a published or scheduled Story. Only a
          Publisher AAL2 session can correct it. {access.role === "publisher" ? (
            <Link href="/admin/mfa/challenge">Verify this session</Link>
          ) : null}
        </p>
      ) : null}

      <section className="admin-story-metadata" aria-labelledby="state-heading">
        <div className="admin-section-heading">
          <p className="eyebrow">Record state</p>
          <h2 id="state-heading">Source boundaries</h2>
        </div>
        <dl>
          <div><dt>Availability</dt><dd>{formatSourceStatus(source.availability_status)}</dd></div>
          <div><dt>Public assurance</dt><dd>{requiresPublicationAssurance ? "Required" : "Not required"}</dd></div>
          <div><dt>Metadata updated</dt><dd>{formatDate(source.updated_at)}</dd></div>
          <div><dt>Private details updated</dt><dd>{formatDate(privateDetails.updated_at)}</dd></div>
          <div><dt>Metadata lock</dt><dd>{source.lock_version}</dd></div>
          <div><dt>Private lock</dt><dd>{privateDetails.lock_version}</dd></div>
        </dl>
      </section>

      {source.deleted_at ? (
        <section className="admin-editor-section" aria-labelledby="deleted-heading">
          <div className="admin-section-heading">
            <p className="eyebrow">Read only</p>
            <h2 id="deleted-heading">Soft-deleted Source</h2>
          </div>
          <p>
            This retained Source cannot be edited. Source recovery is outside
            the Phase D scope.
          </p>
        </section>
      ) : (
        <>
          <section className="admin-editor-section" aria-labelledby="metadata-heading">
            <div className="admin-section-heading">
              <p className="eyebrow">Public-safe metadata</p>
              <h2 id="metadata-heading">Source identity</h2>
              <p>
                These fields may appear publicly when the Source is connected to
                a published Story. Private text is stored separately below.
              </p>
            </div>
            {capabilities.canEditMetadata ? (
              <SourceMetadataForm
                mode="edit"
                requiresPublicationAssurance={requiresPublicationAssurance}
                source={source}
              />
            ) : (
              <ReadonlyMetadata source={source} />
            )}
          </section>

          <section className="admin-editor-section" aria-labelledby="private-heading">
            <div className="admin-section-heading">
              <p className="eyebrow">Member-only details</p>
              <h2 id="private-heading">Transcript and rights review</h2>
              <p>
                These fields are read only through the private editorial view
                and never selected by public pages or the Source list.
              </p>
            </div>
            {capabilities.canEditPrivateDetails ? (
              <SourcePrivateForm
                details={privateDetails}
                requiresPublicationAssurance={requiresPublicationAssurance}
              />
            ) : (
              <div className="admin-readonly-story">
                <h3>Private details are read-only in this session</h3>
                <p>Processing: {formatSourceStatus(privateDetails.processing_status)}</p>
                <p>Rights: {formatSourceStatus(privateDetails.rights_status)}</p>
                <pre>{privateDetails.cleaned_transcript || privateDetails.raw_transcript || "No transcript stored."}</pre>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
