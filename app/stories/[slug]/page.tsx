import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { StoryCard } from "@/app/_components/story-card";
import {
  createPublicPageMetadata,
  createStoryMetadata,
} from "@/app/_lib/seo";
import {
  getRelatedPublicStories,
  getPublicStoryBySlug,
  type PublicSourceMetadata,
} from "@/app/_lib/stories";
import { getCountryCodeFromHeaders, selectVideoSources } from "@/app/_lib/video-sources";

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
  searchParams: Promise<{ lang?: string | string[] }>;
};

function requestedLanguage(value: string | string[] | undefined) {
  const language = Array.isArray(value) ? value[0] : value;
  return language === "zh" ? "zh" : "en";
}

export async function generateMetadata({
  params,
  searchParams,
}: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const language = requestedLanguage((await searchParams).lang);
  const storyResult = await getPublicStoryBySlug(slug);

  if (storyResult.error || !storyResult.data) {
    return createPublicPageMetadata({
      path: "/stories",
      title: "Story | FoodForFun Atlas",
      description: "Read published documentary stories from FoodForFun Atlas.",
    });
  }

  const story = storyResult.data;
  const chinese = language === "zh" && story.title_zh && story.summary_zh;
  const metadata = createStoryMetadata({
    coverImageUrl: storyResult.data.cover_image_url,
    publishedAt: storyResult.data.published_at,
    slug: storyResult.data.slug,
    summary: chinese
      ? story.seo_description_zh || story.summary_zh || story.summary
      : story.seo_description || story.summary,
    title: chinese
      ? story.seo_title_zh || story.title_zh || story.title
      : story.seo_title || story.title,
  });
  const englishPath = `/stories/${story.slug}`;
  const chinesePath = `${englishPath}?lang=zh`;
  return {
    ...metadata,
    alternates: {
      canonical: language === "zh" ? chinesePath : englishPath,
      languages: story.title_zh && story.summary_zh && story.body_zh
        ? { en: englishPath, "zh-CN": chinesePath }
        : { en: englishPath },
    },
  };
}

export default async function StoryPage({ params, searchParams }: StoryPageProps) {
  const { slug } = await params;
  const language = requestedLanguage((await searchParams).lang);
  const storyResult = await getPublicStoryBySlug(slug);

  if (storyResult.error) {
    return (
      <main className="site-shell story-page">
        <nav className="back-nav" aria-label="Breadcrumb">
          <Link href="/stories">All Stories</Link>
        </nav>
        <div className="notice" role="status">
          <p>Story information is temporarily unavailable.</p>
          <p>Please return in a little while.</p>
        </div>
      </main>
    );
  }

  if (!storyResult.data) {
    notFound();
  }

  const story = storyResult.data;
  const useChinese = language === "zh" && Boolean(story.title_zh && story.summary_zh && story.body_zh);
  const displayTitle = useChinese ? story.title_zh! : story.title;
  const displaySummary = useChinese ? story.summary_zh! : story.summary;
  const displayBody = useChinese ? story.body_zh! : story.body;
  const countryCode = getCountryCodeFromHeaders(await headers());
  const videoSources = selectVideoSources(story.sources, countryCode);
  const preferredVideo = videoSources[0] ?? null;
  const relatedStoriesResult = await getRelatedPublicStories(story);
  const paragraphs = displayBody
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <main className="story-page">
      <nav className="back-nav" aria-label="Breadcrumb">
        <Link href="/stories">
          <span aria-hidden="true">←</span> Back to all Stories
        </Link>
      </nav>

      <article>
        <header className="story-header" lang={useChinese ? "zh-CN" : "en"}>
          <div className="story-header-topline">
            <p className="eyebrow">Atlas Story</p>
            <nav className="language-switcher" aria-label="Story language">
              <Link aria-current={!useChinese ? "page" : undefined} href={`/stories/${story.slug}`}>EN</Link>
              {story.title_zh && story.summary_zh && story.body_zh ? (
                <Link aria-current={useChinese ? "page" : undefined} href={`/stories/${story.slug}?lang=zh`}>中文</Link>
              ) : null}
            </nav>
          </div>
          <h1>{displayTitle}</h1>
          <p className="story-summary">{displaySummary}</p>
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

        {preferredVideo ? (
          <section className="story-video" aria-labelledby="story-video-heading">
            <p className="eyebrow">Watch</p>
            <h2 id="story-video-heading">Original video</h2>
            {preferredVideo.embedUrl ? (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                src={preferredVideo.embedUrl}
                title={`${preferredVideo.label}: ${preferredVideo.title}`}
              />
            ) : (
              <div className="video-link-fallback">
                <p>The preferred {preferredVideo.label} source opens on its original platform.</p>
                <a href={preferredVideo.url} rel="noreferrer" target="_blank">Open {preferredVideo.label} source</a>
              </div>
            )}
            <p className="video-region-note">
              Source order is selected from the server-provided country code{countryCode ? ` (${countryCode})` : ""}.
            </p>
            <ul className="video-fallback-list">
              {videoSources.map((source, index) => (
                <li key={source.id}>
                  <a href={source.url} rel="noreferrer" target="_blank">
                    {index === 0 ? "Preferred" : "Fallback"}: {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="story-body" lang={useChinese ? "zh-CN" : "en"}>
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {story.tags.length > 0 ? (
          <ul className="story-tags" aria-label="Story tags">
            {story.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        ) : null}

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
                          <strong>
                            <Link href={`/places/${place.slug}`}>
                              {place.name}
                            </Link>
                          </strong>
                          {place.is_primary ? (
                            <span className="primary-place-label">
                              Primary Place
                            </span>
                          ) : null}
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
                      <li key={theme.id}>
                        <Link href={`/themes/${theme.slug}`}>
                          {theme.name}
                        </Link>
                      </li>
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

      {!relatedStoriesResult.error && relatedStoriesResult.data.length > 0 ? (
        <section
          className="related-stories"
          aria-labelledby="related-stories-heading"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Continue exploring</p>
              <h2 id="related-stories-heading">Related Stories</h2>
            </div>
          </div>
          <div className="story-list">
            {relatedStoriesResult.data.map((relatedStory) => (
              <StoryCard
                context={relatedStory.connectionLabel}
                key={relatedStory.id}
                story={relatedStory}
              />
            ))}
          </div>
        </section>
      ) : null}

      <footer className="story-footer">
        <Link href="/stories">
          <span aria-hidden="true">←</span> Browse all Stories
        </Link>
      </footer>
    </main>
  );
}
