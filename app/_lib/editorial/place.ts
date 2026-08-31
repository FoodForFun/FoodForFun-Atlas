import type { EditorialRole } from "../auth/membership";

export const locationPrecisions = [
  "exact",
  "neighborhood",
  "city",
  "region",
  "hidden",
] as const;
export type LocationPrecision = (typeof locationPrecisions)[number];

export type EditorialPlace = {
  country_code: string | null;
  created_at: string;
  created_by: string | null;
  deleted_at: string | null;
  id: string;
  is_verified: boolean;
  latitude: number | null;
  location_precision: LocationPrecision | null;
  lock_version: number;
  longitude: number | null;
  name: string;
  parent_place_id: string | null;
  place_type: string | null;
  slug: string;
  street_address: string | null;
  postal_code: string | null;
  updated_at: string;
};

export type PlaceInput = {
  country_code: string;
  is_verified: boolean;
  latitude: string;
  location_precision: string;
  longitude: string;
  name: string;
  parent_place_id: string;
  place_type: string;
  slug: string;
  street_address: string;
  postal_code: string;
};

export type ValidatedPlaceInput = Omit<
  PlaceInput,
  "country_code" | "latitude" | "location_precision" | "longitude" | "parent_place_id" | "place_type" | "street_address" | "postal_code"
> & {
  country_code: string | null;
  latitude: number | null;
  location_precision: LocationPrecision | null;
  longitude: number | null;
  parent_place_id: string | null;
  place_type: string | null;
  street_address: string | null;
  postal_code: string | null;
};

export type PlaceFieldErrors = Partial<Record<keyof PlaceInput, string>>;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const placeTypePattern = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const coordinatePattern = /^-?\d{1,3}(?:\.\d{1,6})?$/;

function bounded(value: string, label: string, max: number, required = false) {
  const trimmed = value.trim();
  if (required && !trimmed) return `${label} is required.`;
  return trimmed.length > max ? `${label} must be ${max} characters or fewer.` : null;
}

function listed<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.some((candidate) => candidate === value);
}

export function isPlaceId(value: string) {
  return uuidPattern.test(value);
}

function parseCoordinate(value: string, minimum: number, maximum: number) {
  const trimmed = value.trim();
  if (!coordinatePattern.test(trimmed)) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) && number >= minimum && number <= maximum
    ? number
    : null;
}

export function validatePlaceInput(
  input: PlaceInput,
  currentPlaceId?: string,
): { data: ValidatedPlaceInput; errors: PlaceFieldErrors } | { data: null; errors: PlaceFieldErrors } {
  const errors: PlaceFieldErrors = {};
  for (const [field, label, max, required] of [
    ["name", "Place name", 200, true],
    ["slug", "Place slug", 200, true],
    ["place_type", "Place type", 100, false],
    ["street_address", "Street address", 500, false],
    ["postal_code", "Postal code", 40, false],
  ] as const) {
    const error = bounded(input[field], label, max, required);
    if (error) errors[field] = error;
  }

  const slug = input.slug.trim().toLowerCase();
  if (slug && !slugPattern.test(slug)) {
    errors.slug = "Use lowercase letters and numbers separated by single hyphens.";
  }
  const placeType = input.place_type.trim().toLowerCase();
  if (placeType && !placeTypePattern.test(placeType)) {
    errors.place_type = "Use lowercase words separated by single underscores.";
  }
  const parentId = input.parent_place_id.trim();
  if (parentId && (!isPlaceId(parentId) || parentId === currentPlaceId)) {
    errors.parent_place_id = "Choose an available parent Place other than this Place.";
  }
  const countryCode = input.country_code.trim().toUpperCase();
  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
    errors.country_code = "Use a two-letter country code, or leave this blank.";
  }
  const precision = input.location_precision.trim().toLowerCase();
  if (precision && !listed(locationPrecisions, precision)) {
    errors.location_precision = "Choose a supported public location precision.";
  }

  const latitudeValue = input.latitude.trim();
  const longitudeValue = input.longitude.trim();
  if (Boolean(latitudeValue) !== Boolean(longitudeValue)) {
    errors.latitude = "Latitude and longitude must be supplied together.";
    errors.longitude = "Latitude and longitude must be supplied together.";
  }
  const latitude = latitudeValue ? parseCoordinate(latitudeValue, -90, 90) : null;
  const longitude = longitudeValue ? parseCoordinate(longitudeValue, -180, 180) : null;
  if (latitudeValue && latitude === null) errors.latitude = "Enter latitude from -90 to 90 with at most six decimals.";
  if (longitudeValue && longitude === null) errors.longitude = "Enter longitude from -180 to 180 with at most six decimals.";
  if (latitudeValue && (!precision || precision === "hidden")) {
    errors.location_precision = "Stored coordinates require exact, neighborhood, city, or region precision.";
  }
  if (precision === "hidden" && (latitudeValue || longitudeValue)) {
    errors.latitude = "Hidden Places cannot store coordinates.";
    errors.longitude = "Hidden Places cannot store coordinates.";
  }

  if (Object.keys(errors).length) return { data: null, errors };
  return {
    data: {
      country_code: countryCode || null,
      is_verified: input.is_verified,
      latitude,
      location_precision: precision ? (precision as LocationPrecision) : null,
      longitude,
      name: input.name.trim(),
      parent_place_id: parentId || null,
      place_type: placeType || null,
      slug,
      street_address: input.street_address.trim() || null,
      postal_code: input.postal_code.trim() || null,
    },
    errors,
  };
}

export function canCreatePlaces(role: EditorialRole) {
  return role === "editor" || role === "publisher";
}

export function canEditPlace(role: EditorialRole, place: EditorialPlace) {
  return !place.deleted_at && canCreatePlaces(role);
}

export type PlaceMutationError = { code?: string; message?: string };
export function getSafePlaceMutationError(error: PlaceMutationError) {
  if (error.code === "40001") return "This Place changed after you opened it. Reload before trying again.";
  if (error.code === "23505") return "A Place with this slug already exists.";
  if (error.code === "23503") return "The selected parent Place is no longer available.";
  if (error.code === "42501") return "Your current role does not permit this Place action.";
  if (error.code === "23514" || error.code === "22023") return "The Place did not pass location or database validation.";
  if (error.code === "P0002" || error.code === "55000") return "The Place is no longer available for this action.";
  return "The Place could not be saved. No unverified result was accepted.";
}
