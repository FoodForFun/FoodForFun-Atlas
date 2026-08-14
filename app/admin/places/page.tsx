import Link from "next/link";
import { formatEditorialRole } from "@/app/_lib/auth/membership";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { canCreatePlaces } from "@/app/_lib/editorial/place";
import { getEditorialPlaces } from "@/app/_lib/editorial/places-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const dates = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export default async function AdminPlacesPage() {
  const access = await requireEditorialAccess("/admin/places");
  const result = await getEditorialPlaces();
  const canCreate = canCreatePlaces(access.role);
  return <main className="admin-page admin-story-page">
    <nav className="admin-breadcrumb" aria-label="Admin breadcrumb"><Link href="/admin">Admin</Link><span aria-hidden="true">/</span><span>Places</span></nav>
    <header className="admin-header admin-editorial-header"><div><p className="eyebrow">Editorial workspace</p><h1>Places</h1><p>Maintain geographic identity, hierarchy, verification, and public location precision.</p></div><div className="admin-header-actions"><p>{formatEditorialRole(access.role)} · {access.identity.aal.toUpperCase()}</p>{canCreate ? <Link className="admin-primary-link" href="/admin/places/new">Create Place</Link> : null}</div></header>
    {!canCreate ? <p className="admin-status-banner" role="status">Contributor access is read-only. An Editor or Publisher manages Places.</p> : null}
    {result.error ? <section className="admin-empty-state" role="alert"><h2>Places are temporarily unavailable</h2><p>The editorial Place view could not be read. No data was changed.</p></section> : result.data.length === 0 ? <section className="admin-empty-state"><h2>No Places are available</h2><p>Create the first Place through the protected workflow.</p></section> : <div className="admin-table-shell"><table className="admin-story-table"><caption className="visually-hidden">Places available to this editorial member</caption><thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Country</th><th scope="col">Precision</th><th scope="col">Verified</th><th scope="col">Updated</th><th scope="col">Action</th></tr></thead><tbody>{result.data.map((place) => <tr key={place.id}><th data-label="Name" scope="row">{place.name}{place.deleted_at ? " (soft-deleted)" : ""}</th><td data-label="Type">{place.place_type || "Not set"}</td><td data-label="Country">{place.country_code || "Not set"}</td><td data-label="Precision">{place.location_precision || "Not set"}</td><td data-label="Verified">{place.is_verified ? "Yes" : "No"}</td><td data-label="Updated">{dates.format(new Date(place.updated_at))}</td><td data-label="Action"><Link href={`/admin/places/${place.id}`}>Open Place</Link></td></tr>)}</tbody></table></div>}
  </main>;
}
