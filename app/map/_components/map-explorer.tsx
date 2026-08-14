"use client";

import Link from "next/link";
import { useState } from "react";

import {
  getMapPrecisionLabel,
  projectMapCoordinates,
  type PublicMapPoint,
} from "@/app/_lib/map-core";

export function MapExplorer({ points }: { points: PublicMapPoint[] }) {
  const [selectedKey, setSelectedKey] = useState(points[0].key);
  const selectedPoint =
    points.find(({ key }) => key === selectedKey) ?? points[0];
  const previewStory = selectedPoint.places
    .flatMap(({ stories }) => stories)
    .sort(
      (left, right) =>
        Date.parse(right.published_at) - Date.parse(left.published_at) ||
        left.title.localeCompare(right.title),
    )[0];

  return (
    <div className="map-explorer">
      <div className="atlas-map-shell">
        <div
          className="atlas-map-canvas"
          aria-label={`World map with ${points.length} selectable ${points.length === 1 ? "marker" : "markers"}`}
          role="group"
        >
          <svg
            aria-hidden="true"
            className="atlas-map-land"
            preserveAspectRatio="none"
            viewBox="0 0 1000 500"
          >
            <path d="M55 105 150 48l92 20 45 63-26 59-54 13-27 74-57-28-17-62-49-25Z" />
            <path d="m245 276 58 25 30 82-25 93-38-33-22-91-31-45Z" />
            <path d="m438 103 79-38 96 19 54 48-28 34-58 5-23 55-42-4-19-73-67-17Z" />
            <path d="m503 223 69 4 44 66-18 105-48 58-33-68-27-101Z" />
            <path d="m641 123 101-52 131 25 78 65-60 45-92-7-36 59-70-20-30-63Z" />
            <path d="m815 332 78-24 59 51-25 68-88 10-42-53Z" />
          </svg>
          <span className="map-axis-label map-axis-label-north" aria-hidden="true">
            North
          </span>
          <span className="map-axis-label map-axis-label-south" aria-hidden="true">
            South
          </span>
          {points.map((point, index) => {
            const position = projectMapCoordinates(
              point.latitude,
              point.longitude,
            );
            const placeNames = point.places.map(({ name }) => name).join(", ");

            return (
              <button
                aria-controls="map-preview"
                aria-label={`Show ${placeNames}${point.places.length > 1 ? `, ${point.places.length} overlapping Places` : ""}`}
                aria-pressed={point.key === selectedPoint.key}
                className="map-marker"
                key={point.key}
                onClick={() => setSelectedKey(point.key)}
                style={{ left: `${position.left}%`, top: `${position.top}%` }}
                type="button"
              >
                <span>{index + 1}</span>
              </button>
            );
          })}
        </div>
        <p className="map-caption">
          A schematic world view. Markers reflect each Place&apos;s approved
          public precision and are not intended for navigation.
        </p>
      </div>

      <aside className="map-preview" id="map-preview" aria-live="polite">
        <p className="eyebrow">
          {selectedPoint.places.length === 1
            ? "Selected Place"
            : `${selectedPoint.places.length} overlapping Places`}
        </p>
        <article className="map-preview-place">
          <header>
            <h2>
              {selectedPoint.places.length === 1
                ? selectedPoint.places[0].name
                : "Places sharing this point"}
            </h2>
          </header>
          {selectedPoint.places.length === 1 ? (
            <div className="map-preview-single-meta">
              <span>
                {[
                  selectedPoint.places[0].place_type,
                  selectedPoint.places[0].country_code,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Atlas Place"}
              </span>
              <small>
                {getMapPrecisionLabel(
                  selectedPoint.places[0].location_precision,
                )}
              </small>
            </div>
          ) : (
            <ul className="map-preview-place-list">
              {selectedPoint.places.map((place) => (
                <li key={place.id}>
                  <Link href={`/places/${place.slug}`}>{place.name}</Link>
                  <span>
                    {[place.place_type, place.country_code]
                      .filter(Boolean)
                      .join(" · ") || "Atlas Place"}
                  </span>
                  <small>{getMapPrecisionLabel(place.location_precision)}</small>
                </li>
              ))}
            </ul>
          )}
          <div className="map-preview-story">
            <p className="eyebrow">Connected Story</p>
            <h3>{previewStory.title}</h3>
            <p>{previewStory.summary}</p>
          </div>
          <nav aria-label="Explore the selected map point">
            <Link href={`/stories/${previewStory.slug}`}>Read Story</Link>
            {selectedPoint.places.length === 1 ? (
              <Link href={`/places/${selectedPoint.places[0].slug}`}>
                Open Place
              </Link>
            ) : null}
          </nav>
        </article>
      </aside>

      <section className="map-location-index" aria-labelledby="map-index-heading">
        <div>
          <p className="eyebrow">Accessible index</p>
          <h2 id="map-index-heading">Locations on this map</h2>
        </div>
        <ul>
          {points.flatMap((point) =>
            point.places.map((place) => (
              <li key={place.id}>
                <Link href={`/places/${place.slug}`}>
                  <span>{place.name}</span>
                  <small>{getMapPrecisionLabel(place.location_precision)}</small>
                </Link>
              </li>
            )),
          )}
        </ul>
      </section>
    </div>
  );
}
