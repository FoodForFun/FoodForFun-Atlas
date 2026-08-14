import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StoryCard } from "@/app/_components/story-card";
import { createStoryArchiveMetadata } from "@/app/_lib/seo";
import { getPublicStoryPage } from "@/app/_lib/stories";

export const dynamic = "force-dynamic";

const storiesPerPage = 12;

function getPageNumber(value: string | string[] | undefined) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return 1;
  }

  const page = Number(value);
  return Number.isSafeInteger(page) ? page : 1;
}

function getPageHref(page: number) {
  return page === 1 ? "/stories" : `/stories?page=${page}`;
}

type StoriesPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({
  searchParams,
}: StoriesPageProps): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const page = getPageNumber(pageParam);
  return createStoryArchiveMetadata(page);
}

export default async function StoriesPage({ searchParams }: StoriesPageProps) {
  const { page: pageParam } = await searchParams;
  const page = getPageNumber(pageParam);

  if (pageParam !== undefined && page === 1 && pageParam !== "1") {
    redirect("/stories");
  }

  const storiesResult = await getPublicStoryPage(page, storiesPerPage);

  if (storiesResult.error) {
    return (
      <main className="site-shell archive-page">
        <ArchiveHeader />
        <div className="notice" role="status">
          <p>Stories are temporarily unavailable.</p>
          <p>Please return in a little while.</p>
        </div>
      </main>
    );
  }

  const { stories, total } = storiesResult.data;
  const totalPages = Math.max(1, Math.ceil(total / storiesPerPage));

  if (total > 0 && page > totalPages) {
    redirect(getPageHref(totalPages));
  }

  return (
    <main className="site-shell archive-page">
      <ArchiveHeader />

      {total === 0 ? (
        <div className="notice" role="status">
          <p>The first Atlas stories are being prepared.</p>
          <p>Please visit again soon.</p>
        </div>
      ) : (
        <>
          <div className="story-list">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav className="pagination" aria-label="Story archive pagination">
              {page > 1 ? (
                <Link href={getPageHref(page - 1)}>← Previous</Link>
              ) : (
                <span aria-hidden="true" />
              )}
              <p aria-live="polite">
                Page {page} of {totalPages}
              </p>
              {page < totalPages ? (
                <Link href={getPageHref(page + 1)}>Next →</Link>
              ) : (
                <span aria-hidden="true" />
              )}
            </nav>
          ) : null}
        </>
      )}
    </main>
  );
}

function ArchiveHeader() {
  return (
    <header className="archive-header" aria-labelledby="page-title">
      <nav className="back-nav" aria-label="Breadcrumb">
        <Link href="/">← FoodForFun Atlas</Link>
      </nav>
      <p className="eyebrow">Browse the Atlas</p>
      <h1 id="page-title">Stories</h1>
      <p>
        Documentary stories about the people, places, and daily work connected
        through food.
      </p>
    </header>
  );
}
