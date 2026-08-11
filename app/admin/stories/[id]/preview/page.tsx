import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireEditorialAccess } from "@/app/_lib/auth/session";
import {
  formatStoryStatus,
  getSafeHttpUrl,
  isStoryId,
} from "@/app/_lib/editorial/story";
import { getEditorialStoryPreview } from "@/app/_lib/editorial/stories-server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Private Story preview | FoodForFun Atlas",
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeZone: "UTC",
});

type StoryPreviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StoryPreviewPage({
  params,
}: StoryPreviewPageProps) {
  const { id } = await params;

  if (!isStoryId(id)) {
    notFound();
  }

  await requireEditorialAccess(`/admin/stories/${id}/preview`);
  const result = await getEditorialStoryPreview(id);

  if (result.error) {
    throw new Error("The private Story preview could not be loaded.");
  }

  if (!result.data) {
    notFound();
  }

  const { places, sources, story, themes } = result.data;
  const coverImageUrl = getSafeHttpUrl(story.cover_image_url);
  const paragraphs = story.body
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <main className="story-page admin-story-preview">
      <aside className="admin-preview-banner" aria-label="Private preview">
        <div>
          <strong>Private authenticated preview</strong>
          <span>
            {formatStoryStatus(story.status)} · Version {story.lock_version}
          </span>
        </div>
        <Link href={`/admin/stories/${story.id}`}>Return to editor</Link>
      </aside>

      <article>
        <header className="story-header">
          <p className="eyebrow">Atlas Story preview</p>
          <h1>{story.title}</h1>
          {story.subtitle ? <p>{story.subtitle}</p> : null}
          <p className="story-summary">{story.summary}</p>
          {story.published_at ? (
            <time dateTime={story.published_at}>
              Publication time {dateFormatter.format(new Date(story.published_at))}
            </time>
          ) : (
            <p>Publication time not set</p>
          )}
        </header>

        {coverImageUrl ? (
          // The approved MVP preserves image-source rendering and never inserts markup.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="story-cover" src={coverImageUrl} alt="" />
        ) : null}

        <div className="story-body">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {story.atlas_insight ? (
          <section className="story-connections" aria-labelledby="insight-heading">
            <p className="eyebrow">Atlas insight</p>
            <h2 id="insight-heading">Editorial observation</h2>
            <p>{story.atlas_insight}</p>
          </section>
        ) : null}

        {places.length > 0 || themes.length > 0 ? (
          <section className="story-connections" aria-labelledby="connections-heading">
            <p className="eyebrow">Explore this Story</p>
            <h2 id="connections-heading">Atlas connections</h2>
            <div className="connection-groups">
              {places.length > 0 ? (
                <section aria-labelledby="preview-places-heading">
                  <h3 id="preview-places-heading">Places</h3>
                  <ul className="place-list">
                    {places.map((place) => (
                      <li key={place.id}>
                        <strong>{place.name}</strong>
                        <span>
                          {[place.placeType, place.countryCode]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {themes.length > 0 ? (
                <section aria-labelledby="preview-themes-heading">
                  <h3 id="preview-themes-heading">Themes</h3>
                  <ul className="theme-list">
                    {themes.map((theme) => (
                      <li key={theme.id}>{theme.name}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          </section>
        ) : null}

        {sources.length > 0 ? (
          <section className="story-sources" aria-labelledby="preview-sources-heading">
            <p className="eyebrow">Documentation</p>
            <h2 id="preview-sources-heading">Sources</h2>
            <p className="sources-introduction">
              Preview includes only public-safe Source metadata. Transcripts,
              rights notes, internal notes, actors, and audit history are excluded.
            </p>
            <ol className="source-list">
              {sources.map((source) => {
                const sourceUrl = getSafeHttpUrl(source.sourceUrl);

                return (
                  <li key={source.id}>
                    <p className="source-type">{source.sourceType}</p>
                    <h3>{source.originalTitle || "Untitled source"}</h3>
                    {source.publisher ? <p>{source.publisher}</p> : null}
                    {sourceUrl ? (
                      <a href={sourceUrl} rel="noreferrer" target="_blank">
                        View original source
                      </a>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}
      </article>
    </main>
  );
}
