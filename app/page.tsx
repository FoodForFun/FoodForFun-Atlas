import type { Metadata } from "next";
import Link from "next/link";

import { StoryCard } from "@/app/_components/story-card";
import {
  getPublicPlaceDirectory,
  type PublicPlaceDirectoryItem,
} from "@/app/_lib/places";
import { getPublicStoryPage } from "@/app/_lib/stories";
import {
  getPublicThemeDirectory,
  type PublicThemeDirectoryItem,
} from "@/app/_lib/themes";
import {
  atlasDescription,
  atlasName,
  createPublicPageMetadata,
} from "@/app/_lib/seo";

export const metadata: Metadata = createPublicPageMetadata({
  description: atlasDescription,
  path: "/",
  title: atlasName,
});

export const dynamic = "force-dynamic";

const homepageStoryLimit = 5;
const homepageDirectoryLimit = 6;

export default async function Home() {
  const [storiesResult, placesResult, themesResult] = await Promise.all([
    getPublicStoryPage(1, homepageStoryLimit),
    getPublicPlaceDirectory(),
    getPublicThemeDirectory(),
  ]);

  const stories = storiesResult.error ? [] : storiesResult.data.stories;
  const featuredStory = stories[0];
  const latestStories = stories.slice(1);

  return (
    <main className="site-shell home-page">
      <header className="home-hero" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">A record of food and everyday life</p>
          <h1 id="page-title">FoodForFun Atlas</h1>
        </div>
        <div className="home-hero-introduction">
          <p className="statement">
            Through food, understand people.
            <br />
            Through people, understand the world.
          </p>
          <p className="introduction">
            Atlas gathers documentary stories about the people, places, and
            daily work connected through food.
          </p>
          <nav className="home-entry-links" aria-label="Begin exploring">
            <Link href="/stories">Browse Stories</Link>
            <Link href="/map">Open the Map</Link>
            <Link href="/places">Explore Places</Link>
            <Link href="/themes">Explore Themes</Link>
          </nav>
        </div>
      </header>

      <section
        className="home-section featured-section"
        aria-labelledby="featured-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Begin with one Story</p>
            <h2 id="featured-heading">Featured Story</h2>
          </div>
        </div>

        {storiesResult.error ? (
          <StoryNotice unavailable />
        ) : featuredStory ? (
          <div className="featured-story">
            <StoryCard story={featuredStory} />
          </div>
        ) : (
          <StoryNotice />
        )}
      </section>

      <section
        className="home-section discovery-section"
        aria-labelledby="places-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Across the Atlas</p>
            <h2 id="places-heading">Explore by Place</h2>
          </div>
          <Link className="section-link" href="/places">
            View all Places <span aria-hidden="true">→</span>
          </Link>
        </div>
        <PlaceDiscovery result={placesResult} />
      </section>

      <section
        className="home-section discovery-section"
        aria-labelledby="themes-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Shared experiences</p>
            <h2 id="themes-heading">Explore by Theme</h2>
          </div>
          <Link className="section-link" href="/themes">
            View all Themes <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ThemeDiscovery result={themesResult} />
      </section>

      {latestStories.length > 0 ? (
        <section
          className="home-section story-index"
          aria-labelledby="latest-heading"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recently published</p>
              <h2 id="latest-heading">Latest Stories</h2>
            </div>
            <Link className="section-link" href="/stories">
              Browse all Stories <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="story-list">
            {latestStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      ) : null}

      <aside className="home-about" aria-labelledby="about-atlas-heading">
        <p className="eyebrow">About the Atlas</p>
        <h2 id="about-atlas-heading">Food is where the record begins.</h2>
        <p>
          FoodForFun Atlas documents the people, work, places, and communities
          that exist around food. It is not a restaurant ranking or review
          platform. Each record begins with a specific Story and the people
          behind it.
          {" "}
          <Link href="/about">Read how the Atlas works.</Link>
        </p>
      </aside>
    </main>
  );
}

function StoryNotice({ unavailable = false }: { unavailable?: boolean }) {
  return (
    <div className="notice" role="status">
      <p>
        {unavailable
          ? "Stories are temporarily unavailable."
          : "The first Atlas stories are being prepared."}
      </p>
      <p>
        {unavailable
          ? "Please return in a little while."
          : "Please visit again soon."}
      </p>
    </div>
  );
}

type PlaceDiscoveryProps = {
  result:
    | { data: PublicPlaceDirectoryItem[]; error: false }
    | { data: null; error: true };
};

function PlaceDiscovery({ result }: PlaceDiscoveryProps) {
  if (result.error) {
    return <DiscoveryNotice label="Places" />;
  }

  if (result.data.length === 0) {
    return <DiscoveryNotice label="Places" empty />;
  }

  return (
    <ul className="discovery-list place-discovery-list">
      {result.data.slice(0, homepageDirectoryLimit).map((place) => (
        <li key={place.id}>
          <Link href={`/places/${place.slug}`}>
            <span>{place.name}</span>
            <small>
              {place.story_count} {place.story_count === 1 ? "Story" : "Stories"}
            </small>
          </Link>
        </li>
      ))}
    </ul>
  );
}

type ThemeDiscoveryProps = {
  result:
    | { data: PublicThemeDirectoryItem[]; error: false }
    | { data: null; error: true };
};

function ThemeDiscovery({ result }: ThemeDiscoveryProps) {
  if (result.error) {
    return <DiscoveryNotice label="Themes" />;
  }

  if (result.data.length === 0) {
    return <DiscoveryNotice label="Themes" empty />;
  }

  return (
    <ul className="discovery-list theme-discovery-list">
      {result.data.slice(0, homepageDirectoryLimit).map((theme) => (
        <li key={theme.id}>
          <Link href={`/themes/${theme.slug}`}>
            <span>{theme.name}</span>
            {theme.description ? <small>{theme.description}</small> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function DiscoveryNotice({
  label,
  empty = false,
}: {
  label: "Places" | "Themes";
  empty?: boolean;
}) {
  return (
    <div className="notice compact-notice" role="status">
      <p>
        {empty
          ? `No ${label} are connected to published Stories yet.`
          : `${label} are temporarily unavailable.`}
      </p>
      <p>
        {empty
          ? "Begin with the latest Atlas Stories."
          : "Please return in a little while."}
      </p>
    </div>
  );
}
