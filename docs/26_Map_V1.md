# Map V1

The /map page uses MapLibre GL and the OpenFreeMap Positron basemap. Shop signs
link directly to /atlas/[slug], an alias of the existing /stories/[slug] page
with its existing canonical metadata. There are no popups or clusters.

The existing get_public_map_places RPC remains the only coordinate read boundary.
Only published Stories returned through RLS and their is_primary Place relationship
are used. Each Story has one marker. Hidden or unlocated primary Places are omitted;
secondary Places are not substituted. Overlapping Stories remain available in the
text index. Exact versus approximate public precision is preserved.

AtlasMapPost maps Place.name to locationName and Place.place_type to iconType:
restaurant, yatai, izakaya, cafe, market; other types use the restaurant icon.
Use the existing Place editor to set the type and reviewed coordinates, then
mark that Place as primary in the Story editor. No schema migration or duplicate
Story coordinate storage is required. Existing editorial content is not changed.

predev/prebuild copy the installed MapLibre worker AND shared module into public/maplibre.
Both files are required by MapLibre 6 under Next.js/Turbopack and are generated,
not committed. Loading failures and WebGL failures retain the Story text index.
The basemap uses external OpenFreeMap tile/font/style requests with attribution.

The original Phase L RPC migration must exist in the connected database. An absent
RPC yields an unavailable notice, without a raw-coordinate fallback.

## Local validation (2026-09-10)

Production Turbopack build and TypeScript passed. Full application tests passed;
public tests were rerun after adding two focused map tests (37 passed). ESLint
and diff whitespace checks passed. Desktop production tiles and mobile marker
rendering were verified with no browser errors; a temporary QA marker opened the
real Atlas Story using keyboard Enter. The QA page was removed afterward.

The connected public coordinate RPC currently returns zero rows, so the real map
shows the empty state until reviewed primary Place coordinates are supplied.
No database changes were made. npm audit reports four existing dependency issues
(three high, one critical) involving Next.js, sharp and js-yaml / ESLint; these
were not expanded into a framework upgrade. No remote deployment was performed.
