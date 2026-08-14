import Link from "next/link";
import { formatEditorialRole } from "@/app/_lib/auth/membership";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { canCreatePlaces } from "@/app/_lib/editorial/place";
import { getPlaceParentCandidates } from "@/app/_lib/editorial/places-server";
import { PlaceForm } from "@/app/admin/places/_components/place-form";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewPlacePage() {
  const access = await requireEditorialAccess("/admin/places/new");
  const candidates = await getPlaceParentCandidates();
  const canCreate = canCreatePlaces(access.role);
  return <main className="admin-page admin-story-page"><nav className="admin-breadcrumb" aria-label="Admin breadcrumb"><Link href="/admin">Admin</Link><span aria-hidden="true">/</span><Link href="/admin/places">Places</Link><span aria-hidden="true">/</span><span>New</span></nav><header className="admin-header admin-editorial-header"><div><p className="eyebrow">New geographic record</p><h1>Create Place</h1><p>Record only the public precision justified by editorial verification.</p></div><p className="admin-session-summary">{formatEditorialRole(access.role)} · {access.identity.aal.toUpperCase()}</p></header><section className="admin-editor-section" aria-labelledby="place-heading"><div className="admin-section-heading"><p className="eyebrow">Geography</p><h2 id="place-heading">Place identity and privacy</h2><p>Duplicate names or slugs require deliberate review.</p></div>{!canCreate ? <p>An Editor or Publisher role is required to create Places.</p> : candidates.error ? <p role="alert">Parent Places could not be verified. No Place can be created safely.</p> : <PlaceForm candidates={candidates.data} mode="create" />}</section></main>;
}
