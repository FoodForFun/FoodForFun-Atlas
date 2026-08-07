import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getPublicStoryBySlug,
  type PublicSourceMetadata,
} from "@/app/_lib/stories";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeZone: "UTC",
});

function formatMetadataLabel(value: string) {
  if (value.toLowerCase() === "youtube") {
    return "YouTube";
  }

  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getPublicSourceUrl(source: PublicSourceMetadata) {
  const availability = source.availability_status?.toLowerCase();

  if (
    !source.source_url ||
    availability === "unavailable" ||
    availability === "private" ||
    availability === "unknown"
  ) {
    return null;
  }

  try {
    const url = new URL(source.source_url);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function getSourceAvailabilityMessage(source: PublicSourceMetadata) {
  const availability = source.availability_status?.toLowerCase();

  if (availability === "unavailable") {
    return "The original source is currently unavailable.";
  }

  if (availability === "private") {
    return "The original source is not publicly available.";
  }

  if (availability === "unknown") {
    return "The original source's availability has not been confirmed.";
  }

  return null;
}

type StoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const storyResult = await getPublicStoryBySlug(slug);

  if (storyResult.error || !storyResult.data) {
    notFound();
  }

  const story = storyResult.data;
  const paragraphs = story.body
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <main className="story-page">
      <nav className="back-nav" aria-label="Breadcrumb">
        <Link href="/">
          <span aria-hidden="true">←</span> Back to all Stories
        </Link>
      </nav>

      <article>
        <header className="story-header">
          <p className="eyebrow">Atlas Story</p>
          <h1>{story.title}</h1>
          <p className="story-summary">{story.summary}</p>
          <time dateTime={story.published_at}>
            Published {dateFormatter.format(new Date(story.published_at))}
          </time>
        </header>

        {story.cover_image_url ? (
          // The database stores public image URLs from varied hosts.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="story-cover"
            src={story.cover_image_url}
            alt=""
            decoding="async"
          />
        ) : null}

        <div className="story-body">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {story.places.length > 0 || story.themes.length > 0 ? (
          <section
            className="story-connections"
            aria-labelledby="connections-heading"
          >
            <p className="eyebrow">Explore this Story</p>
            <h2 id="connections-heading">Atlas connections</h2>

            <div className="connection-groups">
              {story.places.length > 0 ? (
                <section aria-labelledby="places-heading">
                  <h3 id="places-heading">
                    {story.places.length === 1 ? "Place" : "Places"}
                  </h3>
                  <ul className="place-list">
                    {story.places.map((place) => {
                      const placeDetails = [
                        place.place_type
                          ? formatMetadataLabel(place.place_type)
                          : null,
                        place.country_code,
                      ].filter(Boolean);

                      return (
                        <li key={place.id}>
                          <strong>{place.name}</strong>
                          {placeDetails.length > 0 ? (
                            <span>{placeDetails.join(" · ")}</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}

              {story.themes.length > 0 ? (
                <section aria-labelledby="themes-heading">
                  <h3 id="themes-heading">
                    {story.themes.length === 1 ? "Theme" : "Themes"}
                  </h3>
                  <ul className="theme-list">
                    {story.themes.map((theme) => (
                      <li key={theme.id}>{theme.name}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          </section>
        ) : null}

        {story.sources.length > 0 ? (
          <section className="story-sources" aria-labelledby="sources-heading">
            <p className="eyebrow">Documentation</p>
            <h2 id="sources-heading">Sources</h2>
            <p className="sources-introduction">
              Public information about the original material connected to this
              Story.
            </p>

            <ol className="source-list">
              {story.sources.map((source) => {
                const publicUrl = getPublicSourceUrl(source);
                const availabilityMessage =
                  getSourceAvailabilityMessage(source);

                return (
                  <li key={source.id}>
                    <p className="source-type">
                      {formatMetadataLabel(source.source_type)}
                    </p>
                    <h3>
                      {source.original_title ||
                        `${formatMetadataLabel(source.source_type)} source`}
                    </h3>

                    {source.publisher ||
                    source.original_published_at ||
                    source.original_language ? (
                      <dl className="source-metadata">
                        {source.publisher ? (
                          <div>
                            <dt>Publisher</dt>
                            <dd>{source.publisher}</dd>
                          </div>
                        ) : null}
                        {source.original_published_at ? (
                          <div>
                            <dt>Published</dt>
                            <dd>
                              {dateFormatter.format(
                                new Date(source.original_published_at),
                              )}
                            </dd>
                          </div>
                        ) : null}
                        {source.original_language ? (
                          <div>
                            <dt>Original language</dt>
                            <dd>{source.original_language}</dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : null}

                    {publicUrl ? (
                      <a
                        className="source-link"
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View original source
                        <span className="visually-hidden">
                          {` for ${source.original_title || source.source_type}`}
                        </span>
                      </a>
                    ) : availabilityMessage ? (
                      <p className="source-status">{availabilityMessage}</p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}
      </article>

      <footer className="story-footer">
        <Link href="/">
          <span aria-hidden="true">←</span> Return to FoodForFun Atlas
        </Link>
      </footer>
    </main>
  );
}
