"use client";

import { useActionState, useEffect, useState } from "react";
import { type EditorialPlace, locationPrecisions } from "@/app/_lib/editorial/place";
import { SubmitButton } from "@/app/admin/_components/submit-button";
import { createPlaceAction, updatePlaceAction } from "@/app/admin/places/actions";
import { initialPlaceActionState } from "@/app/admin/places/action-state";

type Candidate = Pick<EditorialPlace, "id" | "name" | "parent_place_id">;
type Props = { candidates: Candidate[] } & (
  | { mode: "create"; place?: never }
  | { mode: "edit"; place: EditorialPlace }
);

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p className="admin-field-error" id={id} role="alert">{message}</p> : null;
}

export function PlaceForm({ candidates, mode, place }: Props) {
  const [state, action] = useActionState(mode === "create" ? createPlaceAction : updatePlaceAction, initialPlaceActionState);
  const [dirty, setDirty] = useState(false);
  const [precision, setPrecision] = useState(place?.location_precision ?? "");
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const described = (field: keyof typeof state.fieldErrors) => state.fieldErrors[field] ? `${field}-error` : undefined;
  const coordinateDisabled = precision === "hidden";

  return (
    <form action={action} className="admin-form admin-story-form" onChange={() => setDirty(true)}>
      {mode === "edit" ? <><input name="place_id" type="hidden" value={place.id} /><input name="lock_version" type="hidden" value={place.lock_version} /></> : null}
      <div className="admin-story-form-grid">
        <div className="admin-field"><label htmlFor="name">Place name</label><input aria-describedby={described("name")} aria-invalid={Boolean(state.fieldErrors.name)} defaultValue={place?.name ?? ""} id="name" maxLength={200} name="name" required /><FieldError id="name-error" message={state.fieldErrors.name} /></div>
        <div className="admin-field"><label htmlFor="slug">Slug</label><input aria-describedby={described("slug") || "place-slug-help"} aria-invalid={Boolean(state.fieldErrors.slug)} autoCapitalize="none" autoCorrect="off" defaultValue={place?.slug ?? ""} id="slug" maxLength={200} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required spellCheck={false} /><p id="place-slug-help">Lowercase words separated by single hyphens.</p><FieldError id="slug-error" message={state.fieldErrors.slug} /></div>
        <div className="admin-field"><label htmlFor="place_type">Place type</label><input aria-describedby={described("place_type")} aria-invalid={Boolean(state.fieldErrors.place_type)} defaultValue={place?.place_type ?? ""} id="place_type" maxLength={100} name="place_type" pattern="[a-z0-9]+(?:_[a-z0-9]+)*" /><FieldError id="place_type-error" message={state.fieldErrors.place_type} /></div>
        <div className="admin-field"><label htmlFor="country_code">Country code</label><input aria-describedby={described("country_code")} aria-invalid={Boolean(state.fieldErrors.country_code)} autoCapitalize="characters" defaultValue={place?.country_code ?? ""} id="country_code" maxLength={2} name="country_code" pattern="[A-Za-z]{2}" /><FieldError id="country_code-error" message={state.fieldErrors.country_code} /></div>
        <div className="admin-field admin-field-wide"><label htmlFor="parent_place_id">Parent Place</label><select aria-describedby={described("parent_place_id") || "parent-help"} aria-invalid={Boolean(state.fieldErrors.parent_place_id)} defaultValue={place?.parent_place_id ?? ""} id="parent_place_id" name="parent_place_id"><option value="">No parent</option>{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select><p id="parent-help">The current Place and known descendants are excluded.</p><FieldError id="parent_place_id-error" message={state.fieldErrors.parent_place_id} /></div>
        <div className="admin-field admin-field-wide"><label htmlFor="location_precision">Public location precision</label><select aria-describedby={described("location_precision") || "precision-help"} aria-invalid={Boolean(state.fieldErrors.location_precision)} defaultValue={precision} id="location_precision" name="location_precision" onChange={(event) => setPrecision(event.target.value)}><option value="">Not set</option>{locationPrecisions.map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}</select><p id="precision-help">Hidden precision stores no coordinates. Coordinates require a non-hidden precision.</p><FieldError id="location_precision-error" message={state.fieldErrors.location_precision} /></div>
        <div className="admin-field"><label htmlFor="latitude">Latitude</label><input aria-describedby={described("latitude")} aria-invalid={Boolean(state.fieldErrors.latitude)} defaultValue={place?.latitude ?? ""} disabled={coordinateDisabled} id="latitude" inputMode="decimal" name="latitude" placeholder={coordinateDisabled ? "Hidden" : "-90 to 90"} /><FieldError id="latitude-error" message={state.fieldErrors.latitude} /></div>
        <div className="admin-field"><label htmlFor="longitude">Longitude</label><input aria-describedby={described("longitude")} aria-invalid={Boolean(state.fieldErrors.longitude)} defaultValue={place?.longitude ?? ""} disabled={coordinateDisabled} id="longitude" inputMode="decimal" name="longitude" placeholder={coordinateDisabled ? "Hidden" : "-180 to 180"} /><FieldError id="longitude-error" message={state.fieldErrors.longitude} /></div>
      </div>
      <label className="admin-confirmation"><input defaultChecked={place?.is_verified ?? false} name="is_verified" type="checkbox" value="true" /><span>Place details and location precision have been editorially verified.</span></label>
      {state.status === "duplicate" ? <label className="admin-confirmation"><input name="confirm_duplicate" required type="checkbox" value="confirm-duplicate" /><span>I reviewed the possible duplicate and confirm this should remain a separate Place.</span></label> : null}
      {state.status !== "idle" ? <p className="admin-form-message admin-form-message-error" role="alert">{state.message}</p> : null}
      <div className="admin-form-actions"><SubmitButton label={mode === "create" ? "Create Place" : "Save Place"} pendingLabel={mode === "create" ? "Creating…" : "Saving…"} />{dirty ? <p role="status">Unsaved changes</p> : <p>Saved version</p>}</div>
    </form>
  );
}
