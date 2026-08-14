import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/app/_lib/auth/site-url";
import { getPublicPlaceDirectory } from "@/app/_lib/places";
import {
  buildPublicSitemap,
  publicSitemapStoryLimit,
} from "@/app/_lib/seo";
import { getPublicStoryPage } from "@/app/_lib/stories";
import { getPublicThemeDirectory } from "@/app/_lib/themes";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [storyResult, placeResult, themeResult] = await Promise.all([
    getPublicStoryPage(1, publicSitemapStoryLimit),
    getPublicPlaceDirectory(),
    getPublicThemeDirectory(),
  ]);

  return buildPublicSitemap(getSiteUrl(), {
    places: placeResult.error ? null : placeResult.data,
    stories: storyResult.error ? null : storyResult.data.stories,
    themes: themeResult.error ? null : themeResult.data,
  });
}
