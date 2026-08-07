import Link from "next/link";

import { StoryCard } from "@/app/_components/story-card";
import { getPublicStories } from "@/app/_lib/stories";

export const dynamic = "force-dynamic";

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
          <div>
            <p className="eyebrow">From the Atlas</p>
            <h2 id="stories-heading">Stories</h2>
          </div>
          <Link className="section-link" href="/stories">
            Browse all Stories <span aria-hidden="true">→</span>
          </Link>
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
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
