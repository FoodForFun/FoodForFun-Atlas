import type { Metadata } from "next";
import Link from "next/link";

import { getPublicPlaceDirectory } from "@/app/_lib/places";
import { createPublicPageMetadata } from "@/app/_lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPublicPageMetadata({
  path: "/places",
  title: "Places | FoodForFun Atlas",
  description:
    "Explore places connected to published FoodForFun Atlas stories.",
});

function formatMetadataLabel(value: string) {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export default async function PlacesPage() {
  const placesResult = await getPublicPlaceDirectory();

  return (
    <main className="site-shell directory-page">
      <header className="archive-header" aria-labelledby="page-title">
        <p className="eyebrow">Explore the Atlas</p>
        <h1 id="page-title">Places</h1>
        <p>
          Follow published Stories through the cities, neighborhoods, and
          regions they document.
        </p>
      </header>

      {placesResult.error ? (
        <div className="notice" role="status">
          <p>Places are temporarily unavailable.</p>
          <p>Please return in a little while.</p>
        </div>
      ) : placesResult.data.length === 0 ? (
        <div className="notice" role="status">
          <p>No Places are connected to published Stories yet.</p>
          <p>Browse Stories to begin exploring the Atlas.</p>
        </div>
      ) : (
        <ul className="directory-grid">
          {placesResult.data.map((place) => {
            const details = [
              place.place_type ? formatMetadataLabel(place.place_type) : null,
              place.country_code,
            ].filter(Boolean);
            const storyLabel = place.story_count === 1 ? "Story" : "Stories";

            return (
              <li key={place.id}>
                <Link className="directory-card" href={`/places/${place.slug}`}>
                  <span className="directory-card-title">{place.name}</span>
                  {details.length > 0 ? (
                    <span className="directory-card-detail">
                      {details.join(" · ")}
                    </span>
                  ) : null}
                  <span className="directory-card-count">
                    {place.story_count} published {storyLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
