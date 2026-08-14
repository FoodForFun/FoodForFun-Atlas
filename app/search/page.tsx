import type { Metadata } from "next";
import Link from "next/link";

import {
  searchPublicAtlas,
  searchResultLimit,
  type PublicSearchPlace,
  type PublicSearchResults,
  type PublicSearchStory,
  type PublicSearchTheme,
} from "@/app/_lib/search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search | FoodForFun Atlas",
  description:
    "Search published FoodForFun Atlas Stories, public Places, and active Themes.",
  robots: { follow: true, index: false },
};

const minimumQueryLength = 2;
const maximumQueryLength = 80;

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

type ParsedQuery =
  | { state: "empty"; inputValue: string }
  | { state: "invalid"; inputValue: string }
  | { state: "valid"; inputValue: string; query: string };

function parseQuery(value: string | string[] | undefined): ParsedQuery {
  if (value === undefined) {
    return { state: "empty", inputValue: "" };
  }

  if (typeof value !== "string") {
    return { state: "invalid", inputValue: "" };
  }

  const query = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  const inputValue = query.slice(0, maximumQueryLength);
  const hasSearchableText = /[\p{L}\p{N}]/u.test(query);

  if (query.length === 0) {
    return { state: "empty", inputValue: "" };
  }

  if (
    query.length < minimumQueryLength ||
    query.length > maximumQueryLength ||
    !hasSearchableText
  ) {
    return { state: "invalid", inputValue };
  }

  return { state: "valid", inputValue: query, query };
}

function formatMetadataLabel(value: string) {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const parsedQuery = parseQuery(q);
  const searchResult =
    parsedQuery.state === "valid"
      ? await searchPublicAtlas(parsedQuery.query)
      : null;

  return (
    <main className="site-shell search-page">
      <header className="search-header" aria-labelledby="page-title">
        <p className="eyebrow">Explore the Atlas</p>
        <h1 id="page-title">Search</h1>
        <p>
          Find published Stories and the public Places and active Themes that
          connect them.
        </p>

        <form className="search-form" action="/search" method="get" role="search">
          <label htmlFor="atlas-search">Search the Atlas</label>
          <div className="search-form-controls">
            <input
              id="atlas-search"
              name="q"
              type="search"
              minLength={minimumQueryLength}
              maxLength={maximumQueryLength}
              defaultValue={parsedQuery.inputValue}
              placeholder="Search stories, places, and themes"
              aria-describedby="search-guidance"
            />
            <button type="submit">Search</button>
          </div>
          <p id="search-guidance">
            Use {minimumQueryLength} to {maximumQueryLength} characters. Search
            covers Story titles and summaries, Place names, and Theme names.
          </p>
        </form>
      </header>

      <SearchState parsedQuery={parsedQuery} searchResult={searchResult} />
    </main>
  );
}

type SearchStateProps = {
  parsedQuery: ParsedQuery;
  searchResult: Awaited<ReturnType<typeof searchPublicAtlas>> | null;
};

function SearchState({ parsedQuery, searchResult }: SearchStateProps) {
  if (parsedQuery.state === "empty") {
    return (
      <div className="notice search-notice" role="status">
        <p>Begin with a Story, Place, or Theme.</p>
        <p>Your search will appear here and remain available in the page URL.</p>
      </div>
    );
  }

  if (parsedQuery.state === "invalid") {
    return (
      <div className="notice search-notice" role="alert">
        <p>That search cannot be used.</p>
        <p>
          Enter {minimumQueryLength} to {maximumQueryLength} characters and
          include at least one letter or number.
        </p>
      </div>
    );
  }

  if (!searchResult || searchResult.error) {
    return (
      <div className="notice search-notice" role="alert">
        <p>Search is temporarily unavailable.</p>
        <p>Please try again in a little while.</p>
      </div>
    );
  }

  const totalResults =
    searchResult.data.stories.length +
    searchResult.data.places.length +
    searchResult.data.themes.length;

  if (totalResults === 0) {
    return <NoResults query={parsedQuery.query} />;
  }

  return <SearchResults query={parsedQuery.query} results={searchResult.data} />;
}

function NoResults({ query }: { query: string }) {
  return (
    <section className="no-results" aria-labelledby="no-results-title">
      <p className="eyebrow">No results</p>
      <h2 id="no-results-title">No public records matched “{query}”</h2>
      <p>
        Try a broader place name, another spelling, or a related idea. You can
        also browse the Atlas directly.
      </p>
      <nav className="search-browse-links" aria-label="Browse the Atlas">
        <Link href="/stories">Browse Stories</Link>
        <Link href="/places">Browse Places</Link>
        <Link href="/themes">Browse Themes</Link>
      </nav>
    </section>
  );
}

function SearchResults({
  query,
  results,
}: {
  query: string;
  results: PublicSearchResults;
}) {
  return (
    <section className="search-results" aria-labelledby="search-results-title">
      <header className="search-results-header">
        <p className="eyebrow">Search results</p>
        <h2 id="search-results-title">Results for “{query}”</h2>
        <p>
          Up to {searchResultLimit} results are shown in each public record
          group.
        </p>
      </header>

      <div className="search-result-groups">
        <ResultGroup
          id="story-results"
          title="Stories"
          count={results.stories.length}
          emptyMessage="No published Stories matched this search."
        >
          {results.stories.map((story) => (
            <StoryResult key={story.id} story={story} />
          ))}
        </ResultGroup>

        <ResultGroup
          id="place-results"
          title="Places"
          count={results.places.length}
          emptyMessage="No public Places matched this search."
        >
          {results.places.map((place) => (
            <PlaceResult key={place.id} place={place} />
          ))}
        </ResultGroup>

        <ResultGroup
          id="theme-results"
          title="Themes"
          count={results.themes.length}
          emptyMessage="No active Themes matched this search."
        >
          {results.themes.map((theme) => (
            <ThemeResult key={theme.id} theme={theme} />
          ))}
        </ResultGroup>
      </div>
    </section>
  );
}

function ResultGroup({
  id,
  title,
  count,
  emptyMessage,
  children,
}: {
  id: string;
  title: string;
  count: number;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  return (
    <section className="search-result-group" aria-labelledby={id}>
      <header>
        <h3 id={id}>{title}</h3>
        <p>{count} found</p>
      </header>
      {count === 0 ? (
        <p className="search-group-empty">{emptyMessage}</p>
      ) : (
        <ul>{children}</ul>
      )}
    </section>
  );
}

function StoryResult({ story }: { story: PublicSearchStory }) {
  return (
    <li>
      <Link className="search-result-card" href={`/stories/${story.slug}`}>
        <span className="search-result-type">Published Story</span>
        <span className="search-result-title">{story.title}</span>
        <span className="search-result-description">{story.summary}</span>
      </Link>
    </li>
  );
}

function PlaceResult({ place }: { place: PublicSearchPlace }) {
  const details = [
    place.place_type ? formatMetadataLabel(place.place_type) : null,
    place.country_code,
  ].filter(Boolean);

  return (
    <li>
      <Link className="search-result-card" href={`/places/${place.slug}`}>
        <span className="search-result-type">Public Place</span>
        <span className="search-result-title">{place.name}</span>
        {details.length > 0 ? (
          <span className="search-result-description">{details.join(" · ")}</span>
        ) : null}
      </Link>
    </li>
  );
}

function ThemeResult({ theme }: { theme: PublicSearchTheme }) {
  return (
    <li>
      <Link className="search-result-card" href={`/themes/${theme.slug}`}>
        <span className="search-result-type">Active Theme</span>
        <span className="search-result-title">{theme.name}</span>
        {theme.description ? (
          <span className="search-result-description">{theme.description}</span>
        ) : null}
      </Link>
    </li>
  );
}
