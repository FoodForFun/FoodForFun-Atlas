export const publicSitemapStoryLimit = 1000;

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
