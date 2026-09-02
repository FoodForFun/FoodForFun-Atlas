import Link from "next/link";

import { DoodleArrow } from "@/app/_components/doodles";
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
        {story.primary_place ? (
          <p className="story-card-place">
            <span>Primary Place</span>{" "}
            <Link href={`/places/${story.primary_place.slug}`}>
              {story.primary_place.name}
            </Link>
          </p>
        ) : null}
        <h3>
          <Link href={`/stories/${story.slug}`}>{story.title}</Link>
        </h3>
        <p>{story.summary}</p>
        <Link className="story-link" href={`/stories/${story.slug}`}>
          Read the story <DoodleArrow className="doodle-arrow" />
        </Link>
      </div>
    </article>
  );
}
