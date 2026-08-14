# FoodForFun Atlas - Phase L Privacy-Preserving Public Map

**Status:** Application implemented; Production database rollout pending approval

**Last Updated:** August 2026

## Scope

Phase L adds the provider-free public `/map` route. Visitors can explore Places
connected to published Stories, select grouped map points, read Place and Story
previews, and use a complete text location index without depending on the visual
map.

## Database privacy boundary

The migration
`20260814150000_add_privacy_preserving_public_map.sql` removes anonymous and
ordinary authenticated access to the raw `places.latitude` and
`places.longitude` columns. Public map reads use only the
`get_public_map_places()` security-definer function, which has an empty search
path and an explicit execute grant.

The function includes only non-deleted Places with coordinates, an approved
public precision, and a relationship to a published, due, non-deleted Story.
Coordinates are returned according to the editorial precision:

| Precision | Public projection |
| --- | --- |
| `exact` | Reviewed coordinate |
| `neighborhood` | Rounded to two decimal places |
| `city` | Rounded to one decimal place |
| `region` | Rounded to a whole degree |
| `hidden` | Never returned |

Protected editorial reads remain behind the existing membership-gated
editorial view. Authentication alone does not grant raw-coordinate access.

## Application behavior

The server reads at most 200 safe Place projections and 600 public
Story-to-Place relationships. It never reads the `places` table directly and
never uses a service-role client. Overlapping safe coordinates are grouped into
one point, duplicate Stories are removed, and invalid, hidden, or unconnected
rows are rejected before rendering.

The interactive map uses buttons with pressed state, an announced preview
region, links to public Place and Story pages, and a text index that provides a
usable alternative to the visual projection. If configuration or a public read
fails, the page exposes no database detail and offers the Story archive instead.

## Validation

Application tests cover coordinate projection, overlap grouping, Story
deduplication, invalid and hidden row rejection, bounded public reads, and the
absence of a direct Place-table coordinate query. The isolated pgTAP test
verifies column privileges, function access, every supported precision, draft
exclusion, and hidden-location exclusion.

## Operational boundary

The migration is committed and passes fresh local and CI database validation.
It has not been applied to the remote Production database because remote
database changes require separate, explicit authorization. Until that rollout
is approved, the deployed `/map` application fails safely when the projection
function is unavailable. CI contains no linked Supabase project reference or
Production database credential and cannot perform that rollout.
