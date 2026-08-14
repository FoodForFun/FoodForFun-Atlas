export const publicMapPlaceLimit = 200;
export const publicMapRelationshipLimit = 600;

export type PublicMapPrecision = "exact" | "neighborhood" | "city" | "region";

export type PublicMapStory = {
  id: string;
  published_at: string;
  slug: string;
  summary: string;
  title: string;
};

export type PublicMapPlaceRow = {
  country_code: string | null;
  id: string;
  latitude: number | string;
  location_precision: PublicMapPrecision;
  longitude: number | string;
  name: string;
  place_type: string | null;
  slug: string;
};

export type PublicMapRelationshipRow = {
  place_id: string;
  story: PublicMapStory | PublicMapStory[] | null;
};

export type PublicMapPlace = Omit<
  PublicMapPlaceRow,
  "latitude" | "longitude"
> & {
  stories: PublicMapStory[];
};

export type PublicMapPoint = {
  key: string;
  latitude: number;
  longitude: number;
  places: PublicMapPlace[];
};

const supportedPrecisions = new Set<PublicMapPrecision>([
  "exact",
  "neighborhood",
  "city",
  "region",
]);

function finiteCoordinate(value: number | string, minimum: number, maximum: number) {
  const coordinate = typeof value === "number" ? value : Number(value);
  return Number.isFinite(coordinate) && coordinate >= minimum && coordinate <= maximum
    ? coordinate
    : null;
}

function storyTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function buildPublicMapPoints(
  placeRows: PublicMapPlaceRow[],
  relationshipRows: PublicMapRelationshipRow[],
): PublicMapPoint[] {
  const storiesByPlace = new Map<string, Map<string, PublicMapStory>>();

  relationshipRows.forEach(({ place_id, story }) => {
    const stories = Array.isArray(story) ? story : story ? [story] : [];
    const uniqueStories = storiesByPlace.get(place_id) ?? new Map();
    stories.forEach((item) => uniqueStories.set(item.id, item));
    storiesByPlace.set(place_id, uniqueStories);
  });

  const points = new Map<string, PublicMapPoint>();

  placeRows.forEach((place) => {
    const latitude = finiteCoordinate(place.latitude, -90, 90);
    const longitude = finiteCoordinate(place.longitude, -180, 180);
    const stories = Array.from(storiesByPlace.get(place.id)?.values() ?? []).sort(
      (left, right) =>
        storyTimestamp(right.published_at) - storyTimestamp(left.published_at) ||
        left.title.localeCompare(right.title),
    );

    if (
      latitude === null ||
      longitude === null ||
      !supportedPrecisions.has(place.location_precision) ||
      stories.length === 0
    ) {
      return;
    }

    const key = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    const point = points.get(key) ?? {
      key,
      latitude,
      longitude,
      places: [],
    };
    point.places.push({
      country_code: place.country_code,
      id: place.id,
      location_precision: place.location_precision,
      name: place.name,
      place_type: place.place_type,
      slug: place.slug,
      stories,
    });
    points.set(key, point);
  });

  return Array.from(points.values())
    .map((point) => ({
      ...point,
      places: point.places.sort((left, right) => left.name.localeCompare(right.name)),
    }))
    .sort((left, right) =>
      left.places[0].name.localeCompare(right.places[0].name),
    );
}

export function projectMapCoordinates(latitude: number, longitude: number) {
  const safeLatitude = Math.max(-90, Math.min(90, latitude));
  const safeLongitude = Math.max(-180, Math.min(180, longitude));

  return {
    left: ((safeLongitude + 180) / 360) * 100,
    top: ((90 - safeLatitude) / 180) * 100,
  };
}

export function getMapPrecisionLabel(precision: PublicMapPrecision) {
  switch (precision) {
    case "exact":
      return "Exact public point";
    case "neighborhood":
      return "Approximate neighborhood";
    case "city":
      return "City-level location";
    case "region":
      return "Broad regional location";
  }
}
