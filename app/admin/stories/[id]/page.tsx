import Link from "next/link";
import { notFound } from "next/navigation";

import { formatEditorialRole } from "@/app/_lib/auth/membership";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import {
  formatStoryStatus,
  getStoryCapabilities,
  getStoryPublicationState,
  isStoryId,
} from "@/app/_lib/editorial/story";
import { getEditorialStory } from "@/app/_lib/editorial/stories-server";
import { StoryForm } from "@/app/admin/stories/_components/story-form";
import { StoryRecoveryForm } from "@/app/admin/stories/_components/story-recovery-form";
import { StoryTransitionForm } from "@/app/admin/stories/_components/story-transition-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const statusMessages: Record<string, string> = {
  created: "Story draft created.",
  deleted: "Story soft-deleted. Its record and revisions remain recoverable.",
  restored: "Story restored to the editorial workflow.",
  saved: "Story content saved.",
  transitioned: "Story workflow state updated.",
};

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Not set";
}

type StoryEditorPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string | string[] }>;
};

export default async function StoryEditorPage({
  params,
  searchParams,
}: StoryEditorPageProps) {
  const { id } = await params;

  if (!isStoryId(id)) {
    notFound();
  }

  const access = await requireEditorialAccess(`/admin/stories/${id}`);
  const storyResult = await getEditorialStory(id);

  if (storyResult.error) {
    throw new Error("The editorial Story could not be loaded.");
  }

  if (!storyResult.data) {
    notFound();
  }

  const story = storyResult.data;
  const capabilities = getStoryCapabilities({
    aal: access.identity.aal,
    role: access.role,
    story,
    userId: access.identity.userId,
  });
  const parameters = await searchParams;
  const status = Array.isArray(parameters.status)
    ? parameters.status[0]
    : parameters.status;
  const publicationState = getStoryPublicationState(story);
  const storyFormRecord = {
    atlas_insight: story.atlas_insight,
    body: story.body,
    cover_image_url: story.cover_image_url,
    id: story.id,
    lock_version: story.lock_version,
    original_language: story.original_language,
    seo_description: story.seo_description,
    seo_title: story.seo_title,
    slug: story.slug,
    status: story.status,
    subtitle: story.subtitle,
    summary: story.summary,
    title: story.title,
  };

  return (
    <main className="admin-page admin-story-page">
      <nav className="admin-breadcrumb" aria-label="Admin breadcrumb">
        <Link href="/admin">Admin</Link>
        <span aria-hidden="true">/</span>
        <Link href="/admin/stories">Stories</Link>
        <span aria-hidden="true">/</span>
        <span>{story.title}</span>
      </nav>

      <header className="admin-header admin-editorial-header">
        <div>
          <p className="eyebrow">Story editor</p>
          <h1>{story.title}</h1>
          <p>
            Version {story.lock_version} · {formatStoryStatus(story.status)} ·{" "}
            {publicationState === "public"
              ? "Public"
              : publicationState === "scheduled"
                ? "Scheduled and private until publication time"
                : "Private"}
          </p>
        </div>
        <div className="admin-header-actions">
          <p>
            {formatEditorialRole(access.role)} ·{" "}
            {access.identity.aal.toUpperCase()}
          </p>
          {capabilities.canPreview ? (
            <Link
              className="admin-primary-link"
              href={`/admin/stories/${story.id}/preview`}
            >
              Preview Story
            </Link>
          ) : null}
        </div>
      </header>

      {status && statusMessages[status] ? (
        <p className="admin-status-banner" role="status">
          {statusMessages[status]}
        </p>
      ) : null}

      {access.role === "publisher" && access.identity.aal === "aal1" ? (
        <p className="admin-status-banner" role="status">
          Publication, published corrections, archival, deletion, and recovery
          require AAL2. <Link href="/admin/mfa/challenge">Verify this session</Link>.
        </p>
      ) : null}

      <section className="admin-story-metadata" aria-labelledby="metadata-heading">
        <div className="admin-section-heading">
          <p className="eyebrow">Record state</p>
          <h2 id="metadata-heading">Workflow metadata</h2>
        </div>
        <dl>
          <div>
            <dt>Workflow status</dt>
            <dd>{formatStoryStatus(story.status)}</dd>
          </div>
          <div>
            <dt>Publication state</dt>
            <dd>{publicationState}</dd>
          </div>
          <div>
            <dt>Published at</dt>
            <dd>{formatDate(story.published_at)}</dd>
          </div>
          <div>
            <dt>Updated at</dt>
            <dd>{formatDate(story.updated_at)}</dd>
          </div>
          <div>
            <dt>Lock version</dt>
            <dd>{story.lock_version}</dd>
          </div>
          <div>
            <dt>Deletion</dt>
            <dd>{story.deleted_at ? formatDate(story.deleted_at) : "Active"}</dd>
          </div>
        </dl>
      </section>

      {story.deleted_at ? (
        <section className="admin-editor-section" aria-labelledby="recovery-heading">
          <div className="admin-section-heading">
            <p className="eyebrow">Recovery</p>
            <h2 id="recovery-heading">Soft-deleted Story</h2>
            <p>Content editing and preview remain unavailable until restoration.</p>
          </div>
          {capabilities.canRestore ? (
            <StoryRecoveryForm
              lockVersion={story.lock_version}
              mode="restore"
              storyId={story.id}
            />
          ) : (
            <p>A Publisher AAL2 session is required to restore this Story.</p>
          )}
        </section>
      ) : (
        <>
          <section className="admin-editor-section" aria-labelledby="content-heading">
            <div className="admin-section-heading">
              <p className="eyebrow">Content</p>
              <h2 id="content-heading">Story fields</h2>
              {!capabilities.canEdit ? (
                <p>
                  This Story is read-only for the current role, owner, lifecycle
                  state, or session assurance.
                </p>
              ) : null}
            </div>
            {capabilities.canEdit ? (
              <StoryForm mode="edit" story={storyFormRecord} />
            ) : (
              <div className="admin-readonly-story">
                <h3>{story.title}</h3>
                <p>{story.summary}</p>
                <pre>{story.body}</pre>
              </div>
            )}
          </section>

          <section className="admin-editor-section" aria-labelledby="workflow-heading">
            <div className="admin-section-heading">
              <p className="eyebrow">Workflow</p>
              <h2 id="workflow-heading">Story transitions</h2>
              <p>
                Lifecycle fields are changed only by the protected database
                transition RPC. Scheduled publication is a future UTC
                <code> published_at </code> time on a Published Story.
              </p>
            </div>
            {capabilities.transitions.length > 0 ? (
              <div className="admin-workflow-grid">
                {capabilities.transitions.map((transition) => (
                  <StoryTransitionForm
                    key={transition.status}
                    lockVersion={story.lock_version}
                    storyId={story.id}
                    transition={transition}
                  />
                ))}
              </div>
            ) : (
              <p>No workflow transition is available in this session.</p>
            )}
          </section>

          <section className="admin-editor-section" aria-labelledby="deletion-heading">
            <div className="admin-section-heading">
              <p className="eyebrow">Recovery boundary</p>
              <h2 id="deletion-heading">Soft deletion</h2>
              <p>Story records are never hard-deleted by the application.</p>
            </div>
            {capabilities.canDelete ? (
              <StoryRecoveryForm
                lockVersion={story.lock_version}
                mode="delete"
                storyId={story.id}
              />
            ) : (
              <p>A Publisher AAL2 session is required for soft deletion.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
