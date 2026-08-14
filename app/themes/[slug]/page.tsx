import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createPublicPageMetadata } from "@/app/_lib/seo";
import {
  getPublicThemeBySlug,
  type PublicThemeStory,
} from "@/app/_lib/themes";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeZone: "UTC",
});

type ThemePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ThemePageProps): Promise<Metadata> {
  const { slug } = await params;
  const themeResult = await getPublicThemeBySlug(slug);

  if (themeResult.error || !themeResult.data) {
    return createPublicPageMetadata({
      description: "Explore recurring ideas across published FoodForFun Atlas stories.",
      path: "/themes",
      title: "Theme | FoodForFun Atlas",
    });
  }

  return createPublicPageMetadata({
    path: `/themes/${encodeURIComponent(themeResult.data.slug)}`,
    title: `${themeResult.data.name} | FoodForFun Atlas`,
    description:
      themeResult.data.description ||
      `Explore published FoodForFun Atlas stories connected through ${themeResult.data.name}.`,
  });
}

export default async function ThemePage({ params }: ThemePageProps) {
  const { slug } = await params;
  const themeResult = await getPublicThemeBySlug(slug);

  if (themeResult.error) {
    return (
      <main className="site-shell theme-page">
        <nav className="back-nav" aria-label="Breadcrumb">
          <Link href="/themes">← All Themes</Link>
        </nav>
        <div className="notice" role="status">
          <p>Theme information is temporarily unavailable.</p>
          <p>Please return in a little while.</p>
        </div>
      </main>
    );
  }

  if (!themeResult.data) {
    notFound();
  }

  const theme = themeResult.data;
  const storyLabel = theme.stories.length === 1 ? "Story" : "Stories";

  return (
    <main className="site-shell theme-page">
      <nav className="back-nav" aria-label="Breadcrumb">
        <Link href="/themes">← All Themes</Link>
      </nav>

      <header className="theme-header">
        <p className="eyebrow">Atlas Theme</p>
        <h1>{theme.name}</h1>
        {theme.description ? (
          <p className="theme-description">{theme.description}</p>
        ) : null}
        <p className="theme-count">
          {theme.stories.length} published {storyLabel}
        </p>
      </header>

      {theme.places.length > 0 ? (
        <section className="theme-places" aria-labelledby="places-heading">
          <p className="eyebrow">Across the Atlas</p>
          <h2 id="places-heading">Represented Places</h2>
          <ul>
            {theme.places.map((place) => (
              <li key={place.id}>
                <Link href={`/places/${place.slug}`}>{place.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="theme-stories" aria-labelledby="stories-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Explore this Theme</p>
            <h2 id="stories-heading">Stories</h2>
          </div>
        </div>

        {theme.stories.length === 0 ? (
          <div className="notice" role="status">
            <p>No published Stories are currently connected to this Theme.</p>
            <p>Please explore the latest Atlas Stories from the homepage.</p>
          </div>
        ) : (
          <div className="story-list">
            {theme.stories.map((story) => (
              <ThemeStoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ThemeStoryCard({ story }: { story: PublicThemeStory }) {
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
