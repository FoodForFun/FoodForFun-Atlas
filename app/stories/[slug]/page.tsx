import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicStoryBySlug } from "@/app/_lib/stories";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeZone: "UTC",
});

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
      </article>

      <footer className="story-footer">
        <Link href="/">
          <span aria-hidden="true">←</span> Return to FoodForFun Atlas
        </Link>
      </footer>
    </main>
  );
}
