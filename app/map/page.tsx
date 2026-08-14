import type { Metadata } from "next";
import Link from "next/link";

import { getPublicMapPoints } from "@/app/_lib/map";
import { createPublicPageMetadata } from "@/app/_lib/seo";
import { MapExplorer } from "./_components/map-explorer";

const mapDescription =
  "Explore published FoodForFun Atlas stories by their approved public locations.";

export const metadata: Metadata = createPublicPageMetadata({
  description: mapDescription,
  path: "/map",
  title: "Map | FoodForFun Atlas",
});

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const result = await getPublicMapPoints();

  return (
    <main className="site-shell map-page">
      <header className="map-header">
        <div>
          <p className="eyebrow">Explore geographically</p>
          <h1>Atlas Map</h1>
        </div>
        <div>
          <p>
            See where published Stories connect to the world. Every marker
            follows the public location precision chosen by the editorial team.
          </p>
          <p>
            Approximate markers intentionally protect neighborhood, city, and
            regional boundaries. Hidden Places never appear.
          </p>
        </div>
      </header>

      {result.error ? (
        <MapNotice unavailable />
      ) : result.data.length === 0 ? (
        <MapNotice />
      ) : (
        <MapExplorer points={result.data} />
      )}
    </main>
  );
}

function MapNotice({ unavailable = false }: { unavailable?: boolean }) {
  return (
    <div className="notice map-notice" role="status">
      <p>
        {unavailable
          ? "The Atlas map is temporarily unavailable."
          : "No published Stories have a public map location yet."}
      </p>
      <p>
        <Link href="/stories">
          {unavailable ? "Browse Stories instead." : "Begin with Atlas Stories."}
        </Link>
      </p>
    </div>
  );
}
