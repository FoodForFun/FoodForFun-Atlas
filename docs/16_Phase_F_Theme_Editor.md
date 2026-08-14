# FoodForFun Atlas — Phase F Theme Editor MVP

**Status:** Implemented for Pull Request review; not merged

**Last Updated:** August 2026

## Scope

Phase F adds a protected Theme list, creation form, editor, and discovery-state
control to the Admin workspace. It allows the editorial team to maintain the
reusable vocabulary used by Story relationships without direct database access.
It adds no schema migration or seed change and performs no remote database
mutation.

Place editing, Theme soft deletion and recovery, revision restoration, bulk
editing, merging, relationship changes, and AI suggestions remain out of scope.

## Routes and roles

| Route | Purpose | Access |
| --- | --- | --- |
| `/admin/themes` | List active, inactive, and role-visible retained Themes | Active editorial membership |
| `/admin/themes/new` | Create a reusable Theme | Editor or Publisher |
| `/admin/themes/[id]` | Review or edit one Theme and manage its active state | Contributor read-only; Editor or Publisher edit |

Every route and Server Action repeats `requireEditorialAccess()`. Contributor
sessions can inspect Theme records but receive no mutation controls.

## Read and write boundaries

All reads use `editorial_themes`. All writes use the existing protected RPCs:

| Operation | Protected RPC |
| --- | --- |
| Create Theme | `create_editorial_entity('themes', payload)` |
| Edit Theme fields | `update_editorial_entity('themes', id, lock, changes, false)` |
| Deactivate or reactivate | `set_theme_active(id, active, lock, confirmed)` |

The application performs no direct table write, uses no service-role client,
and accepts no submitted actor or audit identity. Returned IDs and state changes
must match the requested Theme before the result is accepted.

## Discovery-state assurance

An Editor or Publisher may deactivate an active Theme. Deactivation removes it
from public Theme reads and new Story candidate lists while retaining the Theme
and all existing relationship records. Reactivation makes it publicly readable
again and therefore requires a Publisher AAL2 session plus explicit confirmation.
The database function remains authoritative for the final role, assurance,
confirmation, state, and concurrency checks.

## Validation, duplicates, and concurrency

Theme names and slugs are required and bounded. Slugs use lowercase words with
single hyphens; descriptions and Theme groups are optional and bounded. Exact
case-insensitive names or exact slugs produce a fail-closed duplicate warning
before a create or edit. A second deliberate confirmation may preserve a
separate same-name concept, while the database unique slug constraint still
prevents duplicate slugs.

Every edit and state form submits the current database-managed `lock_version`.
Stale writes fail with SQLSTATE `40001`, return a safe reload message, and are
never retried or permitted to overwrite newer data.

## Validation boundary

Focused Node tests cover field normalization and bounds, role/AAL capabilities,
safe database errors, repeated route authorization, editorial-view-only reads,
fail-closed duplicate handling, protected-RPC-only writes, state confirmation,
and optimistic locks. Existing Auth, Story, Source, Relationship, Search, lint,
build, audit, and isolated database tests remain authoritative for their
respective boundaries.
