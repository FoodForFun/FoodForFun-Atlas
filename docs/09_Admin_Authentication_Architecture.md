# FoodForFun Atlas — Admin and Authentication Architecture

**Document Version:** 0.2

**Project Version:** 0.1

**Status:** Approved

**Last Updated:** August 2026

## Purpose and decision boundary

This document defines the approved minimum secure architecture for the FoodForFun Atlas
editorial system. It covers authentication, authorization, administrative
routes, editorial writes, publication, private Source data, recovery, and
future image uploads.

All twelve owner decisions in Section 10 are approved. Phase A is implemented,
merged, and applied to Production. Phase B implementation is separately
authorized through a review-only Pull Request. This does not authorize changing
Production Supabase Auth configuration, handling Production secrets,
provisioning Production users or memberships, sending invitations, enrolling
MFA, beginning Phase C, or merging the Phase B Pull Request.

For the initial MVP rollout, retain Contributor, Editor, and Publisher in the
database authorization model while provisioning only the owner as Publisher.
Do not build contributor/editor user-management UI yet. The membership and
authorization design must preserve support for all three roles so they can be
provisioned later without a database or authorization redesign.

The current public Atlas remains the baseline:

- public reads use the Supabase publishable key;
- Row Level Security (RLS) exposes only published Stories that have reached
  `published_at`;
- anonymous clients cannot write;
- inactive Themes and non-public relationships remain hidden; and
- Source transcripts, processing fields, rights notes, and internal timestamps
  are excluded through column grants.

## 1. Recommended architecture

Use Supabase Auth for identity, Supabase PostgreSQL for authorization and
editorial data, and the existing Next.js App Router application for the admin
interface.

```text
Invite-only Supabase Auth
          |
          v
Cookie-backed user session
          |
          v
Next.js admin routes and Server Actions
  - optimistic redirect in proxy.ts
  - authoritative checks in a server-only data-access layer
          |
          v
Supabase publishable key + the editor's JWT
          |
          v
PostgreSQL grants, RLS, transition functions, and audit triggers
```

The application must never use a service-role or secret key. Administrative
queries and mutations should use the publishable key plus the signed-in user's
access token, so every database request remains subject to RLS.

Add `@supabase/ssr` when implementation begins. Maintain separate browser and
server client factories, but keep editorial reads and writes in server-only
modules and Server Actions wherever practical. Client Components should be
limited to interaction that genuinely requires browser state, such as pending
form feedback or an image picker.

Use a root `proxy.ts` only to refresh Auth cookies and perform an optimistic
redirect. It is not an authorization boundary. Every admin page, data-access
function, Server Action, Route Handler, and database mutation must independently
check access. Admin responses must be dynamic and non-cacheable.

Authentication and authorization are deliberately separate:

- **Authentication** proves which Supabase Auth user is making the request.
- **Authorization** reads an active Atlas editorial membership and determines
  which action that user may perform.

An authenticated Supabase user without an active Atlas membership has no admin
access and no editorial database permissions.

## 2. Authentication flow

### Account provisioning

1. Disable public email sign-up in every environment.
2. A project owner sends an invitation from the Supabase Dashboard.
3. After the Auth user exists, a separately reviewed operation adds an active
   row to `editorial_memberships` with the approved role.
4. No email-domain rule grants access. Possessing an account is insufficient
   without the membership row.

The first MVP should not contain user-management screens or call an Auth Admin
API. This avoids adding a server secret to the application. Membership changes
remain an owner-controlled operational task until a later, separately reviewed
publisher administration feature exists.

### Sign-in and session handling

1. `/admin/login` submits email and password to a Server Action.
2. Supabase Auth verifies the identity and `@supabase/ssr` stores the session in
   cookies shared by the browser and server.
3. `proxy.ts` refreshes expired tokens with `getClaims()` and forwards updated
   cookies.
4. The admin data-access layer verifies the session and confirms an active
   `editorial_memberships` row.
5. An unauthenticated visitor is redirected to `/admin/login`; an authenticated
   non-member receives a generic access-denied screen.
6. Sign-out is a Server Action that clears the Supabase session and returns the
   user to the login page.

Do not trust `getSession()` user data for authorization. Use verified claims or
a current Auth user response for identity, then rely on the database membership
check and RLS for permission decisions.

Provide email-based password reset and invitation-confirmation routes. Do not
provide public registration or social login in the MVP.

### Session assurance

The recommended production policy is TOTP multi-factor authentication for the
Publisher role, with RLS or transition functions requiring `aal2` for publish,
unpublish, archive, restore, soft-delete, and future role-management actions.
Contributor and Editor MFA may remain optional during the first internal pilot.
This recommendation requires owner approval and operational setup before it can
be enforced.

Offboarding must first set `editorial_memberships.is_active = false`, which
takes effect on the next RLS evaluation, and then revoke Auth sessions through
the Supabase Dashboard. Immediate authorization must not depend on waiting for a
JWT role claim to expire.

## 3. Authorization model

Create one database row per authorized Auth user:

```text
editorial_memberships
- user_id uuid primary key references auth.users(id)
- role text: contributor | editor | publisher
- is_active boolean
- created_at / created_by
- updated_at / updated_by
```

Use a small `security definer` authorization helper with an empty `search_path`
to read this table by `auth.uid()`. The helper should live outside the exposed
Data API schemas where practical, expose only a boolean permission result, and
be executable only by the roles required by RLS. Direct membership writes by
`anon` and `authenticated` remain revoked.

The membership table, not a custom JWT claim, is the initial source of truth.
This avoids stale role changes and immediate-revocation gaps. A custom access
token hook may be considered later only as an optimization; it must never become
the sole authorization boundary.

### Minimum role matrix

| Capability | Contributor | Editor | Publisher |
| --- | --- | --- | --- |
| Read non-deleted admin content | Yes | Yes | Yes |
| Create Sources and Stories | Yes | Yes | Yes |
| Edit own Sources and draft/review Stories | Yes | Yes | Yes |
| Submit a Story for review | Yes | Yes | Yes |
| Edit all non-published Sources and Stories | No | Yes | Yes |
| Create or edit Places and Themes | No | Yes | Yes |
| Approve a Story | No | Yes | Yes |
| Schedule or publish a Story | No | No | Yes, with deliberate confirmation |
| Edit a currently public Story | No | No | Yes, with `aal2`, confirmation, and revision capture |
| Unpublish, archive, restore, or soft-delete | No | No | Yes |
| Hard-delete an entity | No | No | No application role |
| Change editorial memberships | No | No | Deferred from MVP |

Contributors may manage relationships only for Stories they created while those
Stories are `draft` or `needs_review`. Editors may manage relationships for any
non-public Story. Publishers may correct relationships on any Story, with every
change audited.

## 4. Proposed RLS and database write model

### General rules

- Preserve every current anonymous public-read policy and narrow it further
  only to exclude soft-deleted or archived rows.
- Add editorial policies alongside, not in place of, public policies.
- Grant only the operations and columns an authenticated client needs.
- Give authenticated non-members exactly the anonymous base-table read surface;
  expose editorial-only columns through membership-gated views.
- Revoke direct application writes on editorial tables and route mutations
  through narrowly scoped functions that enforce authorization and concurrency.
- RLS is permissive across policies by default, so review the combined effect
  of every public and editorial policy.
- Set `created_by` and `updated_by` from `auth.uid()` in trusted database
  functions or triggers; never trust a submitted user ID.
- Use explicit column lists for all public and private queries.
- Deny entity-table hard deletion to every application role.

### Stories

**Select:** keep the current anonymous published-and-due policy. Active
editorial members may read non-deleted Stories in all workflow states;
Publishers may also read soft-deleted rows for recovery.

**Insert:** a protected creation function permits Contributor, Editor, and
Publisher to create only a `draft` Story. The function accepts only editable
content, derives ownership from `auth.uid()`, and leaves publication, archival,
deletion, and audit fields empty. Direct table insertion is revoked.

**Update content:** direct table updates are revoked. A protected mutation
function accepts only editable content plus the caller's expected
`lock_version`, locks the row, rechecks membership and ownership, and updates
only when the version still matches. Contributors may update their own `draft`
or `needs_review` rows. Editors may update any non-public, non-archived row.
Publishers may update any non-deleted row; currently published Story changes
also require `aal2` and deliberate confirmation.

**Workflow transitions:** a narrowly scoped `transition_story_status` database
function validates the current user, role, old and new states, publication
requirements, requested time, and `aal2` when required. It locks the row,
changes protected lifecycle columns, and writes the audit record in one
transaction. Direct client updates of lifecycle columns remain revoked.

**Delete:** no `DELETE` grant or policy. A Publisher-only function performs a
soft delete after dependency checks. A separate Publisher restore action clears
the deletion fields and creates another audit event. Physical deletion is an
exceptional maintenance operation requiring explicit approval outside the app.

### Sources and private Source details

Keep public Source metadata in `sources`. Create a one-to-one
`source_private_details` table for:

```text
raw_transcript
cleaned_transcript
transcript_quality
processing_status
rights_status
rights_note
internal_note
```

`anon` receives no privileges or policies on `source_private_details`.
Authenticated users also receive nothing merely by being signed in. Active
editorial members read private details through a membership-gated view.
Protected Source functions enforce ownership, expected `lock_version`, and
`aal2` plus confirmation when changes affect a Source attached to public
content. Direct private-detail insertion and updates are revoked.

The current sensitive columns in `sources` must keep their restrictive column
grants during an additive backfill. Removing those legacy columns later is a
separate destructive migration and requires explicit approval. Until then, new
admin code must read and write only `source_private_details`.

Source entity insertion and updates follow the same protected-function and
optimistic-concurrency model as Stories.
No application role can hard-delete a Source. A Publisher may soft-delete a
Source only after the interface identifies its Story relationships; deletion
must never cascade to a Story.

### Places and Themes

All active editorial members may select admin-visible Places and Themes through
membership-gated views. Editors and Publishers may create and update them only
through protected functions with expected versions. Theme deactivation is an
Editor capability; restoration and soft deletion are confirmed `aal2`
Publisher capabilities.

The public Place policy must exclude soft-deleted rows. Public Themes must
remain both active and not soft-deleted. A Place or Theme with Story
relationships cannot be physically deleted through the application. The
existing location-precision constraints remain in force, and publication checks
must reject a relationship that would expose an unsafe location.

### Story relationships

Keep current public relationship reads limited to publicly visible Stories.
Active members read editorial relationship metadata through membership-gated
views. Direct relationship insertion, update, and deletion are revoked.
Protected functions require ownership of a non-public Story for Contributors,
a non-public Story for Editors, and a non-deleted Story for Publishers. Changes
to a published Story require Publisher `aal2`, deliberate confirmation, and a
matching relationship `lock_version` for updates and deletions.

Relationship rows record `created_by`, `updated_at`, `updated_by`, and
`lock_version`; public grants exclude these internal fields.
Removing a relationship is a physical row deletion because it represents an
association, not the underlying content, but a database trigger must preserve
the deleted row in the audit history for recovery.

### Memberships and audit history

`editorial_memberships` has no public policy and no direct application write
grant. A member may receive a minimal self-read result for the admin shell, but
role decisions use the server data-access layer and the RLS helper.

`editorial_revisions` is append-only. Database triggers record entity and
relationship insert, update, transition, soft-delete, restore, and relationship
delete events, including actor, time, operation, record identity, and the
before/after snapshot required for recovery. Direct `INSERT`, `UPDATE`, and
`DELETE` are revoked from application roles. Editors may inspect ordinary
history; Publishers may inspect sensitive Source history and restore a prior
version through a controlled function. Protected audit labels are passed
through a private backend-scoped context table writable only by trusted
functions, rather than a caller-controlled session setting.

Audit snapshots contain private content and are never public. They should have
a documented retention and size-review policy before large transcript volumes
are imported.

## 5. Admin routes and screens

```text
/admin/login                     Sign-in and password-recovery entry
/admin/access-denied             Authenticated but unauthorized state
/admin                           Work-focused dashboard
/admin/sources                   Source list and filters
/admin/sources/new               Create Source
/admin/sources/[id]              Edit metadata and private transcript fields
/admin/stories                   Story list and workflow filters
/admin/stories/new               Create draft
/admin/stories/[id]              Content, connections, review, and history
/admin/stories/[id]/preview      Protected public-layout preview
/admin/places                    Place list, duplicate search, and creation
/admin/places/[id]               Place editing and privacy review
/admin/themes                    Theme list, duplicate search, and creation
/admin/themes/[id]               Theme editing and activation state
```

The admin layout should be a Server Component with semantic navigation, a clear
signed-in identity and role, sign-out, keyboard-accessible forms, visible save
states, field-level errors, and route-level failure states. Mobile admin support
may be a practical fallback rather than a fully optimized editing experience.

No Settings, account administration, AI, Media library, bulk editing, or public
contribution screens belong in the first admin implementation.

## 6. Editorial workflow

### Source workflow

```text
Create Source metadata
      -> check possible duplicates
      -> preserve raw transcript separately
      -> add cleaned transcript without overwriting the original
      -> review rights, availability, language, and processing status
      -> connect to one or more Stories
```

### Story workflow and state transitions

Persist the documented workflow states:

```text
draft -> needs_review -> approved -> published -> archived
  ^          |             |            |
  +----------+-------------+------------+
        permitted return paths by role
```

- **Draft:** private and incomplete; may be saved without publication fields.
- **Needs review:** private; Contributor may submit, and Editor may return it to
  draft.
- **Approved:** private and publishable after all blocking checks pass.
- **Scheduled:** a derived admin state, not another stored status. It is
  `status = 'published'` with `published_at > now()`. Existing public RLS keeps
  it private until database time reaches `published_at`, so no cron service is
  required.
- **Published:** `status = 'published'` with `published_at <= now()`. It is
  public only while the public RLS predicate remains true.
- **Archived:** private, excluded from indexes, and returns public 404 while its
  data, relationships, and history remain preserved.

Only a Publisher may move an approved Story to scheduled/published, unpublish a
Story back to approved, archive it, or restore it. Publication requires a
deliberate confirmation and database validation of required content, unique
slug, primary Source, primary Place, Theme relationship, safe location
precision, and any blocking rights state.

Editing a currently published Story is confirmed `aal2` Publisher-only in the
MVP. The change is visible immediately after save, so the interface must warn
clearly and the database must snapshot the prior version first. A staged-
revision system for published Stories is valuable but deferred to avoid
building a parallel content model before the manual workflow is proven.

### Preview behavior

Preview uses `/admin/stories/[id]/preview`, the authenticated editor's session,
and the admin data-access layer. It renders public-layout Story fields and only
public-safe relationship and Source metadata. It never includes transcripts,
rights notes, internal notes, user IDs, or audit history.

The preview route is dynamic, non-cacheable, excluded from robots and public
navigation, and returns no content to an unauthenticated or unauthorized user.
The MVP does not create shareable token previews. If external reviewer previews
are added later, they require a separately reviewed, expiring, revocable,
single-purpose token design.

## 7. Required schema changes

All changes should be append-only migrations and locally verified before any
remote application.

1. Add `editorial_memberships` and a database authorization helper.
2. Expand the Story status constraint to `draft`, `needs_review`, `approved`,
   `published`, and `archived`; retain future `published_at` scheduling.
3. Add missing Story editorial fields: `subtitle`, `atlas_insight`,
   `original_language`, `seo_title`, and `seo_description`.
4. Add ownership and lifecycle fields where appropriate: `created_by`,
   `updated_by`, `published_by`, `archived_at`, `archived_by`, `deleted_at`, and
   `deleted_by`.
5. Add `lock_version` to mutable entity tables for optimistic concurrency.
6. Add `source_private_details`, backfill existing sensitive Source values
   without deleting the originals, and preserve restrictive legacy grants.
7. Add structured Source processing, transcript-quality, availability, and
   rights constraints needed by forms and publication checks.
8. Extend relationship tables with primary flags, roles/relevance,
   relationship type, display order where relevant, and audit fields.
9. Add `editorial_revisions` plus protected triggers and restore functions.
10. Add narrowly scoped Story-transition and soft-delete/restore functions;
    revoke direct writes to protected lifecycle columns.
11. Amend public policies to exclude archived and soft-deleted records while
    preserving all current draft, future-publication, Theme, Source, and
    relationship protections.
12. Add indexes for membership lookup, admin status/date lists, soft-deletion,
    Source duplicate checks, and audit lookup.

Do not add People, Organizations, Foods, AI tables, analytics, a custom workflow
engine, or a Media library in this milestone.

## 8. Implementation phases

Each phase should use a focused Issue, branch, migration or application change,
test evidence, and Pull Request. No phase should be merged without review.

### Phase A — Authorization and data-safety foundation

- implement membership, roles, authorization helper, lifecycle metadata,
  private Source details, audit/recovery, grants, RLS, and policy tests;
- run migrations locally only first;
- verify anonymous, unauthenticated, Contributor, Editor, Publisher, inactive
  member, scheduled, archived, and soft-deleted cases;
- review any remote migration separately before applying it.

### Phase B — Authentication and admin shell

- add `@supabase/ssr`, cookie-based clients, Auth confirmation/reset routes,
  `proxy.ts`, server-only access checks, login, sign-out, access-denied, and the
  semantic admin shell;
- configure invite-only Auth and approved redirect URLs as an explicit
  operational step;
- verify caching, token refresh, route protection, direct Server Action calls,
  and public-route regressions.

### Phase C — Source management

- implement Source list, duplicate warnings, create/edit, transcript
  preservation, private-field access, processing state, error recovery, and
  audit history;
- keep YouTube retrieval and AI processing manual and out of scope.

### Phase D — Place and Theme management

- implement duplicate-aware lists and forms, location privacy review, Theme
  activation, and dependency-aware soft deletion;
- do not add the public map as part of these admin forms.

### Phase E — Story workflow and relationships

- implement Story list/forms, optimistic concurrency, Source/Place/Theme
  relationships, role-aware transitions, publication checks, protected preview,
  schedule/publish/unpublish/archive/restore, and revision recovery;
- functionally test the complete manual Source-to-Story workflow.

### Phase F — Future image uploads

- add a Media model only after the text workflow is stable;
- use a private `editorial-media` staging bucket and a public
  `published-media` delivery bucket with separate RLS policies;
- upload with the user's JWT, never a service key;
- restrict MIME types and size at the bucket and application layers;
- require alt text, credit, rights status, immutable UUID object names, and a
  reviewed promotion action before public delivery;
- do not overwrite published object paths; create a new version and update the
  Media reference;
- document a Storage backup/export plan because database backups do not include
  Storage objects.

## 9. Security risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Any authenticated user becomes an editor | Invite-only Auth plus an active database membership checked by RLS |
| Email-domain or UI-only authorization is bypassed | No domain authorization; checks in data-access functions, actions, grants, RLS, and transition functions |
| A stale JWT preserves a removed role | Database membership is authoritative; deactivate first, then revoke sessions |
| Public policies combine unexpectedly with editorial policies | Test the complete permissive-policy union for every role and operation |
| Private Source columns leak through a public Source row | Move them to an RLS-protected table with zero anonymous privileges |
| A Server Action is called directly | Treat every action as a public endpoint; validate input, identity, permission, and resulting row |
| Authenticated response caching leaks sessions | Dynamic admin routes and private/no-store handling for Auth refresh responses |
| A Contributor publishes by changing `status` | Revoke lifecycle-column updates and require the validated transition function |
| Scheduled content appears early | Preserve the database-time `published_at <= now()` public RLS boundary |
| Guessing a preview URL reveals a draft | Require an active editor session and authorization on every preview request |
| Concurrent editors overwrite work | Revoke direct writes; require an expected `lock_version` in protected mutations, return explicit conflict errors, and capture immutable revisions |
| An accidental edit or delete destroys content | Publisher-only soft deletion, append-only revisions, controlled restore, and backups |
| Audit records expose transcripts or rights notes | No public access; restrict sensitive history to authorized roles and define retention |
| A compromised Publisher session changes public content | TOTP `aal2`, deliberate confirmations, short sessions, audit history, and immediate offboarding |
| A `security definer` helper escalates privileges | Minimal functions, fixed empty `search_path`, schema-qualified objects, narrow execute grants, and negative tests |
| Image upload exposes drafts or malicious files | Private staging, Storage RLS, type/size checks, rights review, immutable names, and explicit promotion |
| Database restore does not recover images | Separate Storage backup/export and recovery testing |

The access test suite must cover both allowed and denied cases. At minimum it
should exercise anonymous, ordinary authenticated non-member, inactive member,
all three roles, ownership boundaries, every Story state, future publication,
private Source fields, relationships, soft-deleted rows, preview, direct RPC
calls, and invalid transition attempts.

## 10. Approved owner decisions

The owner approved all twelve decisions below for the phased implementation:

1. **Authorization source of truth:** database `editorial_memberships`, not
   email-domain checks, UI guards, user metadata, or a JWT role claim alone.
2. **Roles:** retain Contributor, Editor, and Publisher with the permission
   matrix in this proposal, even if the first user holds Publisher.
3. **Authentication:** invite-only email/password Supabase Auth, no public
   signup or social login; password reset remains available.
4. **Publisher MFA:** require TOTP `aal2` for publication-level and destructive
   recovery actions before production editorial access.
5. **Story states:** persist the documented five states and represent Scheduled
   as published-with-a-future-time, avoiding cron infrastructure.
6. **Unpublish/archive behavior:** unpublish returns a Story to Approved;
   Archived and soft-deleted Stories return public 404.
7. **Published edits:** Publisher-only immediate corrections with revision
   capture; staged revisions are deferred.
8. **Private Source migration:** add and backfill `source_private_details` now;
   remove legacy sensitive columns only in a later destructive migration with
   separate approval.
9. **Deletion and recovery:** no application hard deletion; use soft deletion,
   append-only revisions, and controlled Publisher restoration.
10. **Provisioning:** manage invitations in Supabase Dashboard and memberships
    through a reviewed operational/database step; no in-app user administration
    in the MVP.
11. **Dependency:** add only `@supabase/ssr` for cookie-based Supabase Auth
    integration.
12. **Images:** defer uploads until the manual text workflow is stable, then use
    private staging and explicit promotion to immutable public assets.

The initial MVP provisions only the owner as Publisher. Contributor and Editor
remain implemented database roles for later provisioning, without user-
management UI in the MVP. Production Auth configuration, users, memberships,
invitations, MFA enrollment, secret handling, Phase C work, and merging still
require their separately defined authorization or review.

## Primary implementation references

- [Supabase server-side Auth client guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase Row Level Security guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase role-based access control guidance](https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac)
- [Supabase column-level privilege guidance](https://supabase.com/docs/guides/database/postgres/column-level-security)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)
- [Next.js authentication and authorization guidance](https://nextjs.org/docs/app/guides/authentication)
