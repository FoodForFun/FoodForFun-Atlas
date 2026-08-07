import type { Metadata } from "next";
import Link from "next/link";

import { getPublicThemeDirectory } from "@/app/_lib/themes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Themes | FoodForFun Atlas",
  description:
    "Explore recurring ideas across published FoodForFun Atlas stories.",
};

export default async function ThemesPage() {
  const themesResult = await getPublicThemeDirectory();

  return (
    <main className="site-shell directory-page">
      <header className="archive-header" aria-labelledby="page-title">
        <p className="eyebrow">Explore the Atlas</p>
        <h1 id="page-title">Themes</h1>
        <p>
          Find recurring ideas about work, family, migration, and community
          across published Stories.
        </p>
      </header>

      {themesResult.error ? (
        <div className="notice" role="status">
          <p>Themes are temporarily unavailable.</p>
          <p>Please return in a little while.</p>
        </div>
      ) : themesResult.data.length === 0 ? (
        <div className="notice" role="status">
          <p>No Themes are connected to published Stories yet.</p>
          <p>Browse Stories to begin exploring the Atlas.</p>
        </div>
      ) : (
        <ul className="directory-grid theme-directory-grid">
          {themesResult.data.map((theme) => {
            const storyLabel = theme.story_count === 1 ? "Story" : "Stories";

            return (
              <li key={theme.id}>
                <Link className="directory-card" href={`/themes/${theme.slug}`}>
                  <span className="directory-card-title">{theme.name}</span>
                  {theme.description ? (
                    <span className="directory-card-description">
                      {theme.description}
                    </span>
                  ) : null}
                  <span className="directory-card-count">
                    {theme.story_count} published {storyLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
