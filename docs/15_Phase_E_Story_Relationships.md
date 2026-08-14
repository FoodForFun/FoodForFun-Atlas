# FoodForFun Atlas — Phase E Story Relationships MVP

**Status:** Implemented for Pull Request review; not merged

**Last Updated:** August 2026

## Scope

Phase E adds relationship management to the protected Story editor. Editorial
members can connect an existing Story to existing Sources, Places, and Themes,
edit relationship attributes, and remove a connection without deleting either
record. It adds no schema migration and performs no remote database mutation.

Entity creation, Source private details, Place and Theme editors, bulk
reordering, relationship revision recovery, and public content changes are out
of scope.

## Read boundary

The editor reads connections from `editorial_story_sources`,
`editorial_story_places`, and `editorial_story_themes`. Candidate selectors use
only `editorial_sources`, `editorial_places`, and `editorial_themes`, are bounded
to 200 active records per type, and never read Source transcripts, rights notes,
internal notes, actor IDs, or other private Source details. Existing connections
remain visible even when their related record falls outside the candidate cap;
an inactive Theme remains visible only when already connected.

## Write boundary

All relationship writes use the existing protected database functions:

| Operation | Protected RPC |
| --- | --- |
| Add connection | `create_story_relationship(...)` |
| Edit attributes | `update_story_relationship(...)` |
| Remove connection | `delete_story_relationship(...)` |

The application performs no direct table write, uses no service-role client,
and never accepts a submitted actor identity. Every Server Action repeats
membership authorization, reloads current Story state, applies the UI capability
check, and relies on the RPC for final authorization and validation.

## Permissions and publication assurance

- Contributors manage connections only on their own Draft or Needs Review Stories.
- Editors manage Draft, Needs Review, and Approved Story connections.
- Publishers manage non-deleted non-published Story connections at AAL1.
- Published Story connection changes require Publisher AAL2 and an explicit
  confirmation on every add, edit, or removal.
- Soft-deleted Stories expose no relationship mutation controls.

These application rules mirror `private.can_manage_story_relationship`; the
database remains authoritative.

## Attributes and concurrency

Source connections carry role, derived primary state, and display order. Place
connections carry relationship type, optional primary state, and display order.
Theme connections carry relevance and display order. Only one primary Source
and one primary Place are permitted for a Story.

Every existing connection exposes its own database-managed `lock_version` to
its edit and removal forms. Stale writes fail with SQLSTATE `40001`, return a
safe reload message, and are never retried or allowed to overwrite newer data.

## Validation boundary

Focused Node tests cover the three attribute shapes, rejected IDs and enum
values, permission and AAL rules, safe database error mapping, protected-RPC-only
writes, published confirmation, per-relationship locks, editorial-view-only
reads, candidate caps, and Source private-data isolation. Existing Auth, Story,
Source, Search, lint, build, audit, and isolated database tests remain
authoritative for their respective boundaries.
