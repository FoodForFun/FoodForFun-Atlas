# FoodForFun Atlas — Phase D Source Editor MVP

**Status:** Implemented for Pull Request review; not merged

**Last Updated:** August 2026

## Scope

Phase D adds the first protected Source workspace to the existing Admin Shell.
It covers Source listing, metadata creation and editing, member-only transcript
and rights review, duplicate warnings, role-aware corrections, and independent
optimistic concurrency for the public-safe and private records.

The implementation adds no schema migration. It uses only the Phase A
membership-gated views and protected mutation functions already applied to the
database. It does not use a service-role client, Auth Admin operation, direct
table write, or submitted actor identity.

## Routes

| Route | Purpose | Protection |
| --- | --- | --- |
| `/admin/sources` | List only public-safe Source metadata | Active editorial membership |
| `/admin/sources/new` | Create Source metadata and its empty private-details record | Contributor, Editor, or Publisher |
| `/admin/sources/[id]` | Edit metadata separately from transcript and rights details | Membership plus database ownership/role rules |

Every route and Server Action repeats `requireEditorialAccess()`. The list uses
only `editorial_sources` and never selects transcripts, processing state,
rights notes, internal notes, actor IDs, or private lock versions.

## Read and write boundaries

Metadata reads use `editorial_sources`. Private detail reads use
`editorial_source_private_details` only inside the individual protected editor.
Published or scheduled Story relationships are detected through
`editorial_story_sources` and `editorial_stories` so the application can mirror
the database's publication-assurance boundary.

All writes use exactly these Phase A RPCs:

| Operation | Protected RPC |
| --- | --- |
| Create Source metadata and empty private record | `create_editorial_entity('sources', payload)` |
| Update public-safe Source metadata | `update_editorial_entity('sources', id, expected_lock_version, changes, confirmed)` |
| Update transcript, processing, rights, and internal notes | `update_source_private_details(...)` |

The application never reads or updates the legacy transcript columns retained
on `sources`. Those columns remain a future destructive-migration decision.

## Permissions and assurance

- Contributors create Sources and edit only their own non-public Sources.
- Editors edit non-public Sources regardless of ownership.
- Publishers edit non-public Sources at AAL1.
- A Source connected to any non-deleted Story in the `published` state,
  including a future scheduled Story, requires Publisher AAL2 and explicit
  confirmation for both metadata and private review changes.
- Soft-deleted Sources remain visible only to Publishers and read-only because
  deletion and recovery UI is outside Phase D.

The UI mirrors these rules for clarity. Each Server Action reloads current
Source state and permissions, and the RPC independently enforces the final
membership, role, ownership, AAL, confirmation, and concurrency boundary.

## Validation and duplicate warnings

The forms apply deterministic length bounds, permit only HTTP(S) Source URLs,
validate UTC publication times, and restrict database-controlled status values
to their approved sets. Source types use lowercase snake case.

Before create or metadata update, exact Source URLs and same-type external IDs
are checked through `editorial_sources`. A match stops the write and requires a
second explicit confirmation. A failed duplicate check fails closed. The
workflow never silently merges or deletes a Source.

## Independent concurrency

Source metadata and `source_private_details` have separate database-managed
`lock_version` values. Each form submits only its corresponding expected
version. A stale write maps SQLSTATE `40001` to a reload message and never
retries or overwrites newer data.

## Out of scope

Phase D does not add Source relationship management, Place or Theme editors,
soft deletion or revision restoration UI, rich text, automated YouTube import,
AI analysis, file upload, user management, schema changes, or Production
content operations.

## Validation boundary

Focused Node tests cover metadata and private validation, role and AAL
capabilities, stale-write safety, protected route authorization, list privacy,
duplicate confirmation, and protected-RPC-only writes. Existing Auth, Story,
Search, build, lint, audit, and isolated database tests remain authoritative for
their respective boundaries.
