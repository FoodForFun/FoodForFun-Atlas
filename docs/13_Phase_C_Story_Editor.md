# FoodForFun Atlas — Phase C Story Editor MVP

**Status:** Implemented for Pull Request review; not merged

**Last Updated:** August 2026

## Scope

Phase C adds the first secure editorial content workflow to the existing Admin
Shell. It covers Story listing, draft creation, content editing, workflow
transitions, authenticated preview, publication, archival, soft deletion, and
restoration. It does not add Source, Place, Theme, or relationship management,
rich-text editing, image uploads, user management, membership management, or
Production content changes.

No schema migration is required. The implementation uses the Phase A
authorization views and protected mutation functions already applied to the
database. The application continues to use only the Supabase publishable key
plus the signed-in user's cookie-backed session.

## Routes

| Route | Purpose | Protection |
| --- | --- | --- |
| `/admin/stories` | List Story workflow, publication, timestamp, and lock metadata | Verified Auth identity plus active editorial membership |
| `/admin/stories/new` | Create a private Story draft | Active Contributor, Editor, or Publisher membership |
| `/admin/stories/[id]` | Edit content and perform role-appropriate workflow actions | Active membership plus database row authorization |
| `/admin/stories/[id]/preview` | Render a private public-layout preview | Active membership; dynamic, private/no-store, and noindex |

Every page and Server Action repeats `requireEditorialAccess()`. The root proxy
remains an optimistic session-refresh layer, not an authorization boundary.
Authenticated users without an active membership are denied before Story data
is read or mutated.

## Database read and write model

Editorial reads use the membership-gated Phase A views:

```text
editorial_stories
editorial_story_places
editorial_story_themes
editorial_story_sources
editorial_places
editorial_themes
editorial_sources
```

Preview selects only public-layout Story fields and public-safe Place, Theme,
and Source metadata. It does not query `editorial_source_private_details`,
memberships, actor metadata for display, or revision snapshots.

All Story writes use these protected RPCs:

| Operation | Phase A RPC |
| --- | --- |
| Create private draft | `create_editorial_entity('stories', payload)` |
| Edit permitted content | `update_editorial_entity('stories', id, expected_lock_version, changes, confirmed)` |
| Submit, approve, publish, unpublish, archive, or restore archive | `transition_story_status(...)` |
| Recoverable deletion | `soft_delete_entity('stories', ...)` |
| Restore soft-deleted Story | `restore_soft_deleted_entity('stories', ...)` |

The application introduces no direct entity `INSERT`, `UPDATE`, or `DELETE`,
no service-role or Auth Admin client, and no submitted actor ID. Phase A derives
actors from `auth.uid()`, locks the row, verifies the current membership, and
captures audit revisions inside the database transaction.

## Content editing and validation

The MVP editor uses labeled text inputs and plain textareas for:

```text
title
subtitle
slug
summary
body
atlas_insight
original_language
seo_title
seo_description
cover_image_url
```

Title, slug, summary, and body are required. Slugs use lowercase letters,
numbers, and single hyphens. Text fields have deterministic length limits.
Cover images remain URL references only; the form accepts a bounded complete
HTTP(S) URL and does not add upload behavior. Preview renders an approved URL
as an image source and never injects image or Story markup as HTML.

Browser `beforeunload` protection warns when an editor tries to leave a dirty
form. Pending buttons communicate save state, Server Action failures keep the
entered browser values in place, and success redirects reload the authoritative
saved row with a visible status message.

## Workflow and role behavior

The stored states remain exactly:

```text
draft -> needs_review -> approved -> published -> archived
```

Scheduled is derived when `status = 'published'` and `published_at` is in the
future. It is not a new state, and public RLS continues to keep the Story
private until database time reaches the publication timestamp.

- **Contributor:** creates drafts; edits and submits or withdraws only their own
  Draft and Needs Review Stories.
- **Editor:** edits all non-public, non-archived Stories; returns review work to
  Draft; approves Needs Review Stories; returns Approved Stories to review.
- **Publisher:** has the Editor workflow and may edit any non-deleted Story.
  Published corrections, publishing, unpublishing, archival, archive restore,
  soft deletion, and soft-delete restoration require AAL2 and explicit
  confirmation.

The UI hides actions that the current role, ownership, lifecycle state, or AAL
cannot perform. This is usability only. Each Server Action reloads the Story,
re-evaluates those conditions, and the RPC independently enforces the final
role, ownership, AAL, confirmation, transition, and publication checks.

Publication remains possible only from Approved. The database checks required
content, exactly one primary non-deleted Source, cleared Source availability and
rights, exactly one primary non-deleted Place, reviewed safe location precision,
and at least one active non-deleted Theme. Phase C does not weaken or emulate
these requirements in UI code.

## Optimistic concurrency

The editor loads and submits the current `lock_version` as
`expected_lock_version`. The Phase A RPC locks the row and raises SQLSTATE
`40001` when a newer change exists. Phase C maps that result to a clear stale
edit message and never retries or silently overwrites. Every transition,
soft-delete, and restore action uses the same expected-version boundary.

Successful mutations redirect to a fresh server render so subsequent actions
receive the new database-managed version.

## Preview and public privacy

Preview is authenticated and server-authorized on every request. It uses the
cookie-backed authenticated Supabase client, never the anonymous public client.
The route is force-dynamic, `force-no-store`, covered by the Admin proxy's
`private, no-store` response policy, excluded from robots, and absent from
public navigation.

Draft, review, approved, future-published, archived, and soft-deleted Stories
remain governed by the existing public Story RLS predicate. Preview does not
change `status` or `published_at` and therefore cannot make a Story public.
Soft-deleted Stories do not render in preview.

## Deletion and recovery

The application never hard-deletes a Story. A Publisher AAL2 session may
soft-delete exactly one current Story after explicit confirmation and a matching
lock version. The database records deletion actor and time and preserves
relationships and revision history. Only Publishers can read a soft-deleted
Story through `editorial_stories`, and restoration again requires AAL2,
confirmation, and optimistic concurrency.

Archive is a lifecycle transition rather than deletion. Restoring an archived
Story returns it to Approved. Restoring a soft-deleted Story clears only its
deletion metadata and retains its preserved workflow state.

## Validation boundary

Focused Node tests cover field validation, safe image URLs, scheduled-state
derivation, Contributor and Editor permissions, Publisher AAL1 denial,
Publisher AAL2 publication and recovery capabilities, stale-write messaging,
authenticated preview contracts, and protected-RPC-only writes. Existing Auth
tests continue to cover unauthenticated, non-member, session, membership, and
MFA behavior. The Phase A transactional pgTAP suite remains the authoritative
database-level coverage for allowed and denied role operations, publication
checks, public visibility, direct-write denial, concurrency, audit, soft
deletion, and restoration.

Fixture-based role and mutation tests must run only in an isolated local/test
database. Development and Preview verification must not create or alter
Production editorial content.
