import type { Metadata } from "next";

export const atlasName = "FoodForFun Atlas";
export const atlasDescription =
  "Through food, understand people. Through people, understand the world.";
export const publicSitemapStoryLimit = 1000;

type PublicPageMetadataInput = {
  description: string;
  path: string;
  title: string;
};

type StoryMetadataInput = {
  coverImageUrl: string | null;
  publishedAt: string;
  slug: string;
  summary: string;
  title: string;
};

const storyArchiveDescription =
  "Browse published FoodForFun Atlas stories about food, people, places, and everyday life.";

export function createPublicPageMetadata({
  description,
  path,
  title,
}: PublicPageMetadataInput): Metadata {
  return {
    alternates: { canonical: path },
    description,
    openGraph: {
      description,
      siteName: atlasName,
      title,
      type: "website",
      url: path,
    },
    title,
    twitter: {
      card: "summary",
      description,
      title,
    },
  };
}

export function getSafeSocialImageUrl(value: string | null) {
  if (!value || value.length > 2_048) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function createStoryMetadata({
  coverImageUrl,
  publishedAt,
  slug,
  summary,
  title,
}: StoryMetadataInput): Metadata {
  const pageTitle = `${title} | ${atlasName}`;
  const path = `/stories/${encodeURIComponent(slug)}`;
  const safeImageUrl = getSafeSocialImageUrl(coverImageUrl);
  const hasValidPublicationTime = !Number.isNaN(Date.parse(publishedAt));

  return {
    alternates: { canonical: path },
    description: summary,
    openGraph: {
      description: summary,
      ...(safeImageUrl ? { images: [safeImageUrl] } : {}),
      ...(hasValidPublicationTime ? { publishedTime: publishedAt } : {}),
      siteName: atlasName,
      title: pageTitle,
      type: "article",
      url: path,
    },
    title: pageTitle,
    twitter: {
      card: safeImageUrl ? "summary_large_image" : "summary",
      description: summary,
      ...(safeImageUrl ? { images: [safeImageUrl] } : {}),
      title: pageTitle,
    },
  };
}

export function createStoryArchiveMetadata(page: number): Metadata {
  const safePage = Number.isSafeInteger(page) && page > 1 ? page : 1;
  const pageLabel = safePage > 1 ? ` - Page ${safePage}` : "";
  const path = safePage > 1 ? `/stories?page=${safePage}` : "/stories";

  return createPublicPageMetadata({
    description: storyArchiveDescription,
    path,
    title: `Stories${pageLabel} | ${atlasName}`,
  });
}

type ChangeFrequency = "monthly" | "weekly";

export type PublicSitemapEntry = {
  changeFrequency: ChangeFrequency;
  priority: number;
  url: string;
};

export type PublicSitemapSources = {
  places?: Array<{ slug: string }> | null;
  stories?: Array<{ slug: string }> | null;
  themes?: Array<{ slug: string }> | null;
};

const staticEntries: Array<{
  changeFrequency: ChangeFrequency;
  path: string;
  priority: number;
}> = [
  { changeFrequency: "weekly", path: "/", priority: 1 },
  { changeFrequency: "weekly", path: "/stories", priority: 0.9 },
  { changeFrequency: "weekly", path: "/map", priority: 0.8 },
  { changeFrequency: "weekly", path: "/places", priority: 0.8 },
  { changeFrequency: "weekly", path: "/themes", priority: 0.8 },
  { changeFrequency: "monthly", path: "/about", priority: 0.6 },
];

function normalizeBaseUrl(value: URL) {
  const baseUrl = new URL(value);
  baseUrl.pathname = "/";
  baseUrl.search = "";
  baseUrl.hash = "";
  return baseUrl;
}

function getDynamicPaths(
  prefix: "places" | "stories" | "themes",
  values: Array<{ slug: string }> | null | undefined,
) {
  return (values ?? [])
    .map(({ slug }) => slug.trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
    .map((slug) => `/${prefix}/${encodeURIComponent(slug)}`);
}

export function buildPublicSitemap(
  siteUrl: URL,
  sources: PublicSitemapSources = {},
): PublicSitemapEntry[] {
  const baseUrl = normalizeBaseUrl(siteUrl);
  const entries = staticEntries.map(({ path, ...entry }) => ({
    ...entry,
    url: new URL(path, baseUrl).toString(),
  }));
  const dynamicGroups: Array<{
    changeFrequency: ChangeFrequency;
    paths: string[];
    priority: number;
  }> = [
    {
      changeFrequency: "monthly",
      paths: getDynamicPaths("stories", sources.stories),
      priority: 0.8,
    },
    {
      changeFrequency: "weekly",
      paths: getDynamicPaths("places", sources.places),
      priority: 0.7,
    },
    {
      changeFrequency: "weekly",
      paths: getDynamicPaths("themes", sources.themes),
      priority: 0.7,
    },
  ];
  const seenUrls = new Set(entries.map(({ url }) => url));

  dynamicGroups.forEach(({ changeFrequency, paths, priority }) => {
    paths.forEach((path) => {
      const url = new URL(path, baseUrl).toString();

      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        entries.push({ changeFrequency, priority, url });
      }
    });
  });

  return entries;
}
