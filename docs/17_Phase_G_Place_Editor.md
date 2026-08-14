# FoodForFun Atlas — Phase G Place Editor MVP

**Status:** Implemented for Pull Request review; not merged

**Last Updated:** August 2026

## Scope and routes

Phase G adds protected Place list, creation, and editing routes at
`/admin/places`, `/admin/places/new`, and `/admin/places/[id]`. Contributors
have read-only access; Editors and Publishers create and edit through existing
protected RPCs. No migration, seed, remote database mutation, map, geocoding,
soft deletion, recovery, or relationship change is included.

## Privacy and hierarchy

The form supports name, slug, type, parent, country code, coordinates, public
location precision, and verification state. Latitude and longitude must be
paired and bounded. Coordinates require `exact`, `neighborhood`, `city`, or
`region` precision. `hidden` disables and omits both coordinates. The existing
database checks remain authoritative for these constraints.

Parent candidates are bounded to 500 active editorial Places and exclude the
current Place and known descendants. Every Server Action independently walks
the submitted parent's ancestry, fails closed on unavailable data or excessive
depth, and rejects self-parenting and descendant cycles before calling the RPC.

## Data and mutation boundaries

All reads use `editorial_places`. Creates use
`create_editorial_entity('places', payload)` and edits use
`update_editorial_entity('places', id, lock, changes, false)`. The application
performs no direct table write, uses no service-role client, and accepts no
actor metadata. Exact case-insensitive names and exact slugs trigger a
fail-closed duplicate review. Each edit uses the database-managed
`lock_version`; stale writes return a safe reload message without retrying.

## Validation

Focused tests cover normalization, coordinate pairing and bounds, hidden
locations, roles, retained records, safe errors, authorization, editorial-view
reads, hierarchy checks, duplicate confirmation, protected RPCs, and optimistic
locks. Existing application and isolated pgTAP suites remain authoritative.
