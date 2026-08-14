import Link from "next/link";

import type { PublicStoryListItem } from "@/app/_lib/stories";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeZone: "UTC",
});

type StoryCardProps = {
  context?: string;
  story: PublicStoryListItem;
};

export function StoryCard({ context, story }: StoryCardProps) {
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
        {context ? <p className="eyebrow story-card-context">{context}</p> : null}
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
