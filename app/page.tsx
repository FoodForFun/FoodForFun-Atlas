import Link from "next/link";

import { getPublicStories } from "@/app/_lib/stories";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeZone: "UTC",
});

function formatPublicationDate(date: string) {
  return dateFormatter.format(new Date(date));
}

export default async function Home() {
  const storiesResult = await getPublicStories();

  return (
    <main className="site-shell">
      <header className="site-header" aria-labelledby="page-title">
        <p className="eyebrow">A record of food and everyday life</p>
        <h1 id="page-title">FoodForFun Atlas</h1>
        <p className="statement">
          Through food, understand people.
          <br />
          Through people, understand the world.
        </p>
        <p className="introduction">
          Atlas gathers documentary stories about the people, places, and daily
          work connected through food.
        </p>
      </header>

      <section className="story-index" aria-labelledby="stories-heading">
        <div className="section-heading">
          <p className="eyebrow">From the Atlas</p>
          <h2 id="stories-heading">Stories</h2>
        </div>

        {storiesResult.error ? (
          <div className="notice" role="status">
            <p>Stories are temporarily unavailable.</p>
            <p>Please return in a little while.</p>
          </div>
        ) : storiesResult.data.length === 0 ? (
          <div className="notice" role="status">
            <p>The first Atlas stories are being prepared.</p>
            <p>Please visit again soon.</p>
          </div>
        ) : (
          <div className="story-list">
            {storiesResult.data.map((story) => (
              <article className="story-card" key={story.id}>
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
                    {formatPublicationDate(story.published_at)}
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
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
