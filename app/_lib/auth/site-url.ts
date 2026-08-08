import "server-only";

const localSiteUrl = "http://localhost:3000";

export function getSiteUrl() {
  const vercelUrl =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_URL;
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? vercelUrl ?? localSiteUrl;
  const value = configuredUrl.startsWith("http")
    ? configuredUrl
    : `https://${configuredUrl}`;

  try {
    const url = new URL(value);
    const isLocalHttp =
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");

    if (url.protocol !== "https:" && !isLocalHttp) {
      return new URL(localSiteUrl);
    }

    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return new URL(localSiteUrl);
  }
}
