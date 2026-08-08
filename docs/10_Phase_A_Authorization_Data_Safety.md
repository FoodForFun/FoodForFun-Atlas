# FoodForFun Atlas — Phase A Authorization and Data Safety

**Document Version:** 0.2

**Project Version:** 0.1

**Status:** Foundation applied to Production; RPC privilege remediation pending review

**Last Updated:** August 2026

## Scope

Phase A implements only the database authorization and data-safety foundation
approved in `09_Admin_Authentication_Architecture.md`. It does not add login,
session handling, admin routes, admin screens, Auth configuration, users, or
memberships.

The append-only migrations are:

```text
supabase/migrations/20260808090500_phase_a_authorization_foundation.sql
supabase/migrations/20260808125100_phase_a_rpc_privilege_remediation.sql
```

The foundation migration was applied to the linked Production database after
separate owner approval. The RPC privilege remediation remains unapplied and
requires another explicit Production approval after review and dry-run.

## Authorization model

`editorial_memberships` remains the authorization source of truth. It supports
Contributor, Editor, and Publisher while the initial rollout provisions only
the owner as Publisher through a separately reviewed operational step.

An authenticated user receives no editorial access without an active
membership. The `private` schema contains fixed-search-path, narrowly scoped
helpers that resolve the current database membership for RLS. No role decision
depends only on email, UI state, user metadata, or a JWT role claim.

Authenticated non-members receive the same base-table columns and public rows
as anonymous visitors. Editorial lifecycle, actor, deletion, and concurrency
metadata is available only through membership-gated `editorial_*` views.

The role model implements these boundaries:

- Contributors create Sources and draft Stories, edit their own non-public
  records, submit their own Stories, and manage relationships for their own
  draft or review Stories.
- Editors manage non-public editorial records, Places, Themes, and Story
  approval, but cannot publish or perform destructive recovery.
- Publishers may correct published content and relationships and, with an
  `aal2` session plus explicit confirmation, publish, unpublish, archive,
  restore, soft-delete, or restore revisions.

No application role has direct table `INSERT`, `UPDATE`, or `DELETE` privileges
for editorial data, can write memberships, or can hard-delete entity rows.
Narrow mutation functions are the only application write path. Relationship
deletion remains a protected physical association change and is audited.

## Function privileges

Every Phase A function has an explicit application-role classification:

- public read-only helpers are executable by `anon` and `authenticated`;
- editorial mutation RPCs are executable only by `authenticated` and continue
  to enforce membership, role, AAL, confirmation, concurrency, and audit rules;
- internal security helpers are executable by neither application role; and
- trigger-only functions are executable by neither application role.

The six approved read-only helpers expose only public-visibility or
authorization booleans required by RLS. Anonymous callers cannot enter any of
the twelve editorial mutation RPCs. Authentication alone grants an RPC entry
point, not mutation authorization.

Production migrations and Phase A functions are owned by `postgres`. The
remediation removes `PUBLIC` and `anon` from the default function privileges
for future `postgres`-owned functions in the `public` schema. It intentionally
does not make a broader default change for other owners, schemas, or roles;
future migrations must still grant each intended function explicitly.

## Lifecycle, concurrency, and workflow

Mutable entity and relationship tables receive ownership, actor,
soft-deletion, and `lock_version` metadata. Database triggers derive
`created_by` and `updated_by` from `auth.uid()` and increment `lock_version`;
submitted actor IDs are rejected by function payload allowlists.

Creation and update functions enforce the role and ownership matrix. Every
update accepts an expected version, locks the row, compares the current version,
and fails with a serialization conflict before changing stale data. Because
direct writes are revoked, callers cannot omit this concurrency boundary.
Published Story content, public Source metadata/review data, and published
Story relationships additionally require Publisher `aal2` and confirmation
that is exactly true.

Stories support `draft`, `needs_review`, `approved`, `published`, and `archived`.
Scheduled publication remains `published` with a future `published_at`. The
protected transition function enforces role and ownership rules, current
`lock_version`, Publisher `aal2`, deliberate confirmation, and publication
requirements for content, a primary Source, a primary Place, an active Theme,
Source availability and rights review, and reviewed location precision.

Protected functions implement Publisher-only soft deletion and restoration for
Stories, Sources, Places, and Themes. Source, Place, and Theme soft deletion is
blocked while relationships or required dependencies remain. Theme
deactivation is an Editor action; reactivation is protected Publisher recovery.
All confirmation-sensitive functions reject false, omitted, and explicit NULL
confirmation values.

## Private Source migration

`source_private_details` stores transcripts, processing and transcript-quality
state, rights status and notes, and internal notes. The migration copies every
existing Source into this one-to-one table and preserves the current values of
the legacy sensitive columns.

The legacy columns remain in `sources`; they are not removed or cleared. Their
restrictive grants remain in effect, and future admin code must use only
`source_private_details`. Removing the legacy columns is a separate destructive
migration requiring explicit approval.

## Audit and recovery

`editorial_revisions` is append-only to application roles. Security-definer
triggers capture entity and relationship inserts, updates, transitions,
soft-deletes, restores, relationship deletes, and exceptional owner-level hard
deletes. Snapshots include the actor, time, operation, entity identity, and
before/after data needed for review and recovery.

Source and membership snapshots are sensitive. Editors may read ordinary
history; only Publishers may read sensitive history. Protected `aal2`
Publisher functions restore prior editable entity content or recreate an
audited deleted relationship. Lifecycle state is restored only through the
dedicated transition and soft-delete recovery functions.

Protected functions communicate authoritative operation labels to audit
triggers through a private backend-scoped table. Application roles have no
table access and cannot execute the private setter, so a caller-controlled
session setting cannot relabel an ordinary mutation as a protected operation.

The additive legacy Source backfill occurs before audit triggers are installed,
so it is represented by the reviewed migration rather than one revision per
backfilled Source.

## Public and private access

Anonymous and authenticated base grants use the same explicit safe column
lists. Public policies preserve the
existing behavior for published and due Stories, non-deleted Places, active
Themes, public Source metadata, and public relationships, while excluding
archived and soft-deleted records.

Anonymous users receive no privileges on editorial views, memberships, private
Source details, or revision history. Ordinary authenticated non-members receive
no rows from membership-gated editorial views. Actor IDs, relationship update
metadata, lock versions, legacy private Source columns, private Source details,
and audit snapshots are never anonymously selectable.

## Validation plan

`supabase/tests/database/phase_a_authorization_foundation.sql` is a
transactional pgTAP policy suite for anonymous, authenticated non-member,
inactive member, Contributor, Editor, and Publisher behavior. It covers draft,
future, archived, soft-deleted, private Source, transition, hard-delete denial,
actor derivation, concurrency, audit, soft-delete, and restore cases. It also
checks direct-write denial, AAL1 bypass attempts, NULL/false confirmation,
exact anonymous relationship columns, audit-label protection, and relationship
recovery.

The suite must run only against an isolated local/test database. If Docker is
unavailable, use an isolated PostgreSQL-compatible validator where feasible,
record that limitation, and do not substitute the linked Production database
for fixture-based policy testing.
