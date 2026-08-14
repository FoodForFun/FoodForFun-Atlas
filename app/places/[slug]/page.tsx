import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createPublicPageMetadata } from "@/app/_lib/seo";
import {
  getPublicPlaceBySlug,
  type PublicPlaceStory,
} from "@/app/_lib/places";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeZone: "UTC",
});

function formatMetadataLabel(value: string) {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

type PlacePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PlacePageProps): Promise<Metadata> {
  const { slug } = await params;
  const placeResult = await getPublicPlaceBySlug(slug);

  if (placeResult.error || !placeResult.data) {
    return createPublicPageMetadata({
      description: "Explore places connected to published FoodForFun Atlas stories.",
      path: "/places",
      title: "Place | FoodForFun Atlas",
    });
  }

  return createPublicPageMetadata({
    path: `/places/${encodeURIComponent(placeResult.data.slug)}`,
    title: `${placeResult.data.name} | FoodForFun Atlas`,
    description: `Explore published FoodForFun Atlas stories connected to ${placeResult.data.name}.`,
  });
}

export default async function PlacePage({ params }: PlacePageProps) {
  const { slug } = await params;
  const placeResult = await getPublicPlaceBySlug(slug);

  if (placeResult.error) {
    return (
      <main className="site-shell place-page">
        <nav className="back-nav" aria-label="Breadcrumb">
          <Link href="/places">← All Places</Link>
        </nav>
        <div className="notice" role="status">
          <p>Place information is temporarily unavailable.</p>
          <p>Please return in a little while.</p>
        </div>
      </main>
    );
  }

  if (!placeResult.data) {
    notFound();
  }

  const place = placeResult.data;
  const placeDetails = [
    place.place_type ? formatMetadataLabel(place.place_type) : null,
    place.country_code,
  ].filter(Boolean);

  return (
    <main className="site-shell place-page">
      <nav className="back-nav" aria-label="Breadcrumb">
        <Link href="/places">← All Places</Link>
      </nav>

      <header className="place-header">
        <p className="eyebrow">Atlas Place</p>
        <h1>{place.name}</h1>
        {placeDetails.length > 0 ? (
          <p className="place-metadata">{placeDetails.join(" · ")}</p>
        ) : null}
        {place.parent ? (
          <p className="place-parent">
            Part of{" "}
            <Link href={`/places/${place.parent.slug}`}>
              {place.parent.name}
            </Link>
          </p>
        ) : null}
      </header>

      <section className="place-stories" aria-labelledby="stories-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">From this Place</p>
            <h2 id="stories-heading">Stories</h2>
          </div>
        </div>

        {place.stories.length === 0 ? (
          <div className="notice" role="status">
            <p>No published Stories are currently connected to this Place.</p>
            <p>Please explore the latest Atlas Stories from the homepage.</p>
          </div>
        ) : (
          <div className="story-list">
            {place.stories.map((story) => (
              <PlaceStoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function PlaceStoryCard({ story }: { story: PublicPlaceStory }) {
  return (
    <article className="story-card">
      {story.cover_image_url ? (
        // The database stores public image URLs from varied hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="story-card-image"
          src={story.cover_image_url}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <div className="story-card-content">
        <time dateTime={story.published_at}>
          {dateFormatter.format(new Date(story.published_at))}
        </time>
        <h3>
          <Link href={`/stories/${story.slug}`}>{story.title}</Link>
        </h3>
        <p>{story.summary}</p>
        <Link className="story-link" href={`/stories/${story.slug}`}>
          Read the story <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
