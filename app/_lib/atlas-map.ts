import type { PublicMapPoint } from "./map-core";

export const shopIcons = {
  restaurant: "🍽️", yatai: "🏮", izakaya: "🍶", cafe: "☕", market: "🛒",
} as const;
export type IconType = keyof typeof shopIcons;
export type AtlasMapPost = {
  id: string; title: string; slug: string; locationName: string;
  latitude: number; longitude: number; iconType: IconType;
};

// Existing Place type is editorially editable; no duplicate coordinate fields.
export function buildAtlasMapPosts(points: PublicMapPoint[]): AtlasMapPost[] {
  const posts = new Map<string, AtlasMapPost>();
  for (const point of points) {
    for (const place of point.places) {
      const iconType = Object.hasOwn(shopIcons, place.place_type ?? "")
        ? place.place_type as IconType : "restaurant";
      for (const story of place.stories) {
        if (!posts.has(story.id)) posts.set(story.id, {
          id: story.id, title: story.title, slug: story.slug,
          locationName: place.name, latitude: point.latitude,
          longitude: point.longitude, iconType,
        });
      }
    }
  }
  return [...posts.values()];
}
