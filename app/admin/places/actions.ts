"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { requireEditorialAccess } from "@/app/_lib/auth/session";
import { canCreatePlaces, canEditPlace, getSafePlaceMutationError, isPlaceId, type PlaceInput, validatePlaceInput } from "@/app/_lib/editorial/place";
import { findDuplicatePlacesWithClient, getEditorialPlaceWithClient, validateParentPlaceWithClient } from "@/app/_lib/editorial/places-server";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";
import type { PlaceActionState } from "@/app/admin/places/action-state";

function value(data: FormData, name: string) { const item = data.get(name); return typeof item === "string" ? item.trim() : ""; }
function input(data: FormData): PlaceInput { return { country_code: value(data, "country_code"), is_verified: value(data, "is_verified") === "true", latitude: value(data, "latitude"), location_precision: value(data, "location_precision"), longitude: value(data, "longitude"), name: value(data, "name"), parent_place_id: value(data, "parent_place_id"), place_type: value(data, "place_type"), postal_code: value(data, "postal_code"), slug: value(data, "slug"), street_address: value(data, "street_address") }; }
function lock(data: FormData) { const number = Number(value(data, "lock_version")); return Number.isSafeInteger(number) && number > 0 ? number : null; }
function error(message: string, fieldErrors: PlaceActionState["fieldErrors"] = {}): PlaceActionState { return { fieldErrors, message, status: "error" }; }
function duplicate(count: number): PlaceActionState { return { fieldErrors: {}, message: `${count} possible duplicate Place${count === 1 ? "" : "s"} matched this name or slug. Review existing Places before confirming a separate record.`, status: "duplicate" }; }
function returnedId(data: unknown) { if (!Array.isArray(data) || data.length !== 1 || !data[0] || typeof data[0] !== "object") return null; const id = (data[0] as Record<string, unknown>).entity_id; return typeof id === "string" && isPlaceId(id) ? id : null; }
function refresh(id: string, slug: string) { for (const path of ["/admin", "/admin/places", `/admin/places/${id}`, "/", "/places", `/places/${slug}`, "/stories", "/search"]) revalidatePath(path); }

async function checks(supabase: Awaited<ReturnType<typeof createAuthenticatedServerSupabaseClient>>, validated: NonNullable<ReturnType<typeof validatePlaceInput>["data"]>, excludedId?: string) {
  const [parents, duplicates] = await Promise.all([
    validateParentPlaceWithClient(supabase, validated.parent_place_id, excludedId),
    findDuplicatePlacesWithClient(supabase, validated, excludedId),
  ]);
  return { duplicates, parents };
}

export async function createPlaceAction(_state: PlaceActionState, formData: FormData): Promise<PlaceActionState> {
  void _state;
  const access = await requireEditorialAccess("/admin/places/new");
  if (!canCreatePlaces(access.role)) return error("An Editor or Publisher role is required to create Places.");
  const validated = validatePlaceInput(input(formData));
  if (!validated.data) return error("Review the highlighted Place fields.", validated.errors);
  let id: string | null = null;
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const result = await checks(supabase, validated.data);
    if (result.parents.error || !result.parents.data) return error("The selected parent hierarchy could not be verified. No Place was created.");
    if (result.duplicates.error) return error("Possible duplicate Places could not be checked. No Place was created.");
    if (result.duplicates.data.length && value(formData, "confirm_duplicate") !== "confirm-duplicate") return duplicate(result.duplicates.data.length);
    const response = await supabase.rpc("create_atlas_place", { payload: validated.data });
    if (response.error) return error(getSafePlaceMutationError(response.error));
    id = returnedId(response.data);
  } catch { return error("The Place could not be created. Your entered values remain here."); }
  if (!id) return error("The created Place could not be verified.");
  refresh(id, validated.data.slug);
  redirect(`/admin/places/${id}?status=created`, RedirectType.replace);
}

export async function updatePlaceAction(_state: PlaceActionState, formData: FormData): Promise<PlaceActionState> {
  void _state;
  const id = value(formData, "place_id");
  const version = lock(formData);
  if (!isPlaceId(id) || !version) return error("The Place edit context is invalid. Reload the editor.");
  const access = await requireEditorialAccess(`/admin/places/${id}`);
  const validated = validatePlaceInput(input(formData), id);
  if (!validated.data) return error("Review the highlighted Place fields.", validated.errors);
  try {
    const supabase = await createAuthenticatedServerSupabaseClient();
    const place = await getEditorialPlaceWithClient(supabase, id);
    if (!place) return error("The Place is no longer available.");
    if (!canEditPlace(access.role, place)) return error("Your current role does not permit editing this Place.");
    const result = await checks(supabase, validated.data, id);
    if (result.parents.error || !result.parents.data) return error("The selected parent would create an invalid or unverifiable hierarchy.");
    if (result.duplicates.error) return error("Possible duplicate Places could not be checked. No changes were saved.");
    if (result.duplicates.data.length && value(formData, "confirm_duplicate") !== "confirm-duplicate") return duplicate(result.duplicates.data.length);
    const response = await supabase.rpc("update_atlas_place", { changes: validated.data, expected_lock_version: version, target_place_id: id });
    if (response.error) return error(getSafePlaceMutationError(response.error));
    if (returnedId(response.data) !== id) return error("The Place save result could not be verified.");
  } catch { return error("The Place could not be saved. Your entered values remain here."); }
  refresh(id, validated.data.slug);
  redirect(`/admin/places/${id}?status=saved`, RedirectType.replace);
}
