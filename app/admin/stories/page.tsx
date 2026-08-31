import Link from "next/link";

import { formatEditorialRole } from "@/app/_lib/auth/membership";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import {
  formatStoryStatus,
  getStoryPublicationState,
} from "@/app/_lib/editorial/story";
import { getEditorialStories } from "@/app/_lib/editorial/stories-server";

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

function formatPublicationState(
  value: ReturnType<typeof getStoryPublicationState>,
) {
  const labels = {
    archived: "Private — archived",
    deleted: "Private — deleted",
    private: "Private",
    public: "Public",
    scheduled: "Private — scheduled",
  } as const;

  return labels[value];
}

export default async function AdminStoriesPage() {
  const access = await requireEditorialAccess("/admin/stories");
  const result = await getEditorialStories();

  return (
    <main className="admin-page admin-story-page">
      <nav className="admin-breadcrumb" aria-label="Admin breadcrumb">
        <Link href="/admin">Admin</Link>
        <span aria-hidden="true">/</span>
        <span>Stories</span>
      </nav>

      <header className="admin-header admin-editorial-header">
        <div>
          <p className="eyebrow">Editorial workspace</p>
          <h1>Stories</h1>
          <p>
            Review workflow state, publication visibility, and optimistic-lock
            versions before opening an edit.
          </p>
        </div>
        <div className="admin-header-actions">
          <p>
            {formatEditorialRole(access.role)} ·{" "}
            {access.identity.aal.toUpperCase()}
          </p>
          <Link className="admin-primary-link" href="/admin/stories/new">
            Create Story draft
          </Link>
          {access.role === "publisher" ? (
            <Link className="admin-primary-link" href="/admin/stories/import">
              Publish daily package
            </Link>
          ) : null}
        </div>
      </header>

      {result.error ? (
        <section className="admin-empty-state" role="alert">
          <h2>Stories are temporarily unavailable</h2>
          <p>
            The editorial Story view could not be read. No content was changed.
          </p>
        </section>
      ) : result.data.length === 0 ? (
        <section className="admin-empty-state">
          <h2>No Stories are available</h2>
          <p>Create the first draft through the protected editorial workflow.</p>
          <Link className="admin-primary-link" href="/admin/stories/new">
            Create Story draft
          </Link>
        </section>
      ) : (
        <div className="admin-table-shell">
          <table className="admin-story-table">
            <caption className="visually-hidden">
              Editorial Stories available to this member
            </caption>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Workflow</th>
                <th scope="col">Publication</th>
                <th scope="col">Published at</th>
                <th scope="col">Updated</th>
                <th scope="col">Version</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((story) => {
                const publicationState = getStoryPublicationState(story);

                return (
                  <tr key={story.id}>
                    <th data-label="Title" scope="row">
                      {story.title}
                    </th>
                    <td data-label="Workflow">
                      <span className={`admin-status admin-status-${story.status}`}>
                        {formatStoryStatus(story.status)}
                      </span>
                    </td>
                    <td data-label="Publication">
                      {formatPublicationState(publicationState)}
                    </td>
                    <td data-label="Published at">
                      {formatDate(story.published_at)}
                    </td>
                    <td data-label="Updated">{formatDate(story.updated_at)}</td>
                    <td data-label="Version">{story.lock_version}</td>
                    <td data-label="Action">
                      <Link href={`/admin/stories/${story.id}`}>Open editor</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
