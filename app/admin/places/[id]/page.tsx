import Link from "next/link";
import { notFound } from "next/navigation";
import { formatEditorialRole } from "@/app/_lib/auth/membership";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { canEditPlace, isPlaceId } from "@/app/_lib/editorial/place";
import { getEditorialPlace, getPlaceParentCandidates } from "@/app/_lib/editorial/places-server";
import { PlaceForm } from "@/app/admin/places/_components/place-form";
export const dynamic = "force-dynamic";
export const revalidate = 0;
const dates = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string | string[] }> };
export default async function PlaceEditorPage({ params, searchParams }: Props) {
  const { id } = await params;
  if (!isPlaceId(id)) notFound();
  const access = await requireEditorialAccess(`/admin/places/${id}`);
  const [result, candidates] = await Promise.all([getEditorialPlace(id), getPlaceParentCandidates(id)]);
  if (result.error || candidates.error) throw new Error("The editorial Place could not be loaded safely.");
  if (!result.data) notFound();
  const place = result.data;
  const canEdit = canEditPlace(access.role, place);
  const parameters = await searchParams;
  const status = Array.isArray(parameters.status) ? parameters.status[0] : parameters.status;
  return <main className="admin-page admin-story-page"><nav className="admin-breadcrumb" aria-label="Admin breadcrumb"><Link href="/admin">Admin</Link><span aria-hidden="true">/</span><Link href="/admin/places">Places</Link><span aria-hidden="true">/</span><span>{place.name}</span></nav><header className="admin-header admin-editorial-header"><div><p className="eyebrow">Place editor</p><h1>{place.name}</h1><p>Version {place.lock_version} · {place.location_precision || "No public precision"}</p></div><p className="admin-session-summary">{formatEditorialRole(access.role)} · {access.identity.aal.toUpperCase()}</p></header>{status === "created" || status === "saved" ? <p className="admin-status-banner" role="status">{status === "created" ? "Place created." : "Place saved."}</p> : null}<section className="admin-story-metadata" aria-labelledby="state-heading"><div className="admin-section-heading"><p className="eyebrow">Record state</p><h2 id="state-heading">Location boundary</h2></div><dl><div><dt>Precision</dt><dd>{place.location_precision || "Not set"}</dd></div><div><dt>Coordinates</dt><dd>{place.latitude === null ? "Not stored" : `${place.latitude}, ${place.longitude}`}</dd></div><div><dt>Verified</dt><dd>{place.is_verified ? "Yes" : "No"}</dd></div><div><dt>Updated</dt><dd>{dates.format(new Date(place.updated_at))}</dd></div><div><dt>Lock</dt><dd>{place.lock_version}</dd></div><div><dt>Deletion</dt><dd>{place.deleted_at ? "Soft-deleted" : "Active record"}</dd></div></dl></section><section className="admin-editor-section" aria-labelledby="content-heading"><div className="admin-section-heading"><p className="eyebrow">Geography</p><h2 id="content-heading">Place identity and privacy</h2>{!canEdit ? <p>This Place is read-only in the current role or record state.</p> : null}</div>{canEdit ? <PlaceForm candidates={candidates.data} mode="edit" place={place} /> : <div className="admin-readonly-story"><h3>{place.name}</h3><p>{place.place_type || "No Place type"} · {place.country_code || "No country code"}</p><p>Public precision: {place.location_precision || "Not set"}</p></div>}</section></main>;
}
