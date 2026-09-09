"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Map as LibreMap } from "maplibre-gl";
import { shopIcons, type AtlasMapPost } from "@/app/_lib/atlas-map";
import "maplibre-gl/dist/maplibre-gl.css";

export function MapExplorer({ posts }: { posts: AtlasMapPost[] }) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading the map…");
  useEffect(() => {
    let disposed = false;
    let map: LibreMap | undefined;
    let observer: ResizeObserver | undefined;
    const timer = window.setTimeout(() => {
      if (!disposed) setStatus("The basemap is taking longer to load. You can still open Stories below.");
    }, 15000);
    async function initialize() {
      try {
        const { Map, Marker, NavigationControl, LngLatBounds, setWorkerUrl } = await import("maplibre-gl");
        if (disposed || !container.current) return;
        setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
        map = new Map({
          container: container.current,
          style: "https://tiles.openfreemap.org/styles/positron",
          center: [138, 36], zoom: 4,
          maxZoom: 18, renderWorldCopies: false,
        });
        map.addControl(new NavigationControl({ showCompass: false }), "top-right");
        map.on("load", () => { window.clearTimeout(timer); setStatus(""); });
        map.on("error", () => {
          window.clearTimeout(timer);
          if (!disposed) setStatus("Some map details could not load. You can still open Stories below.");
        });
        const bounds = new LngLatBounds();
        for (const post of posts) {
          const link = document.createElement("a");
          link.href = "/atlas/" + encodeURIComponent(post.slug);
          link.className = "shop-map-marker";
          link.setAttribute("aria-label", post.locationName + " — " + post.title);
          link.title = post.title;
          const icon = document.createElement("span");
          icon.className = "shop-map-marker-icon";
          icon.setAttribute("aria-hidden", "true");
          icon.textContent = shopIcons[post.iconType];
          const label = document.createElement("span");
          label.className = "shop-map-marker-label";
          label.textContent = post.locationName;
          link.append(icon, label);
          new Marker({ element: link, anchor: "bottom" })
            .setLngLat([post.longitude, post.latitude]).addTo(map);
          bounds.extend([post.longitude, post.latitude]);
        }
        if (posts.length) map.fitBounds(bounds, { padding: 70, maxZoom: 13, duration: 0 });
        observer = new ResizeObserver(() => map?.resize());
        observer.observe(container.current);
      } catch {
        window.clearTimeout(timer);
        if (!disposed) setStatus("The map could not start in this browser. Open a Story from the list below.");
      }
    }
    void initialize();
    return () => { disposed = true; window.clearTimeout(timer); observer?.disconnect(); map?.remove(); };
  }, [posts]);

  return (
    <div className="shop-map-explorer">
      <div className="shop-map-canvas" ref={container} role="region" aria-label="Map of Atlas Stories" />
      <p className="map-caption" role="status">{status || "Choose a shop to read its Story. Locations follow the editorial team's public precision."}</p>
      <section className="map-location-index" aria-labelledby="map-index-heading">
        <div><p className="eyebrow">From place to story</p><h2 id="map-index-heading">On the map</h2></div>
        {posts.length === 0 ? <p>No published Stories have a primary public map location yet.</p> : (
          <ul>{posts.map((post) => <li key={post.id}>
            <Link href={"/atlas/" + encodeURIComponent(post.slug)}>
              <span>{shopIcons[post.iconType]} {post.locationName}</span><small>{post.title}</small>
            </Link>
          </li>)}</ul>
        )}
      </section>
    </div>
  );
}
