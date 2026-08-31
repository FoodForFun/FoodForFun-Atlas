export type VideoPlatform = "bilibili" | "weibo" | "youtube";

export type VideoSourceInput = {
  availability_status: string | null;
  external_id: string | null;
  id: string;
  original_title: string | null;
  source_type: string;
  source_url: string | null;
};

export type DisplayVideoSource = {
  embedUrl: string | null;
  externalId: string | null;
  id: string;
  label: string;
  platform: VideoPlatform;
  title: string;
  url: string;
};

const unavailableStatuses = new Set(["private", "unavailable", "unknown"]);

function platformFor(sourceType: string): VideoPlatform | null {
  const normalized = sourceType.toLowerCase().replaceAll("-", "_");
  if (normalized === "youtube" || normalized === "youtube_video") return "youtube";
  if (normalized === "bilibili" || normalized === "bilibili_video") return "bilibili";
  if (normalized === "weibo" || normalized === "weibo_video") return "weibo";
  return null;
}

function safeUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function youtubeId(source: VideoSourceInput, url: URL) {
  const candidate = source.external_id ||
    (url.hostname === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v"));
  return candidate && /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : null;
}

function bilibiliId(source: VideoSourceInput, url: URL) {
  const candidate = source.external_id || /\/(BV[A-Za-z0-9]+|av\d+)/i.exec(url.pathname)?.[1];
  return candidate && /^(BV[A-Za-z0-9]+|av\d+)$/i.test(candidate) ? candidate : null;
}

function toDisplaySource(source: VideoSourceInput): DisplayVideoSource | null {
  if (unavailableStatuses.has(source.availability_status?.toLowerCase() || "")) return null;
  const platform = platformFor(source.source_type);
  const url = safeUrl(source.source_url);
  if (!platform || !url) return null;

  let externalId = source.external_id;
  let embedUrl: string | null = null;
  if (platform === "youtube") {
    externalId = youtubeId(source, url);
    if (externalId) embedUrl = `https://www.youtube-nocookie.com/embed/${externalId}`;
  } else if (platform === "bilibili") {
    externalId = bilibiliId(source, url);
    if (externalId?.toLowerCase().startsWith("bv")) {
      embedUrl = `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(externalId)}`;
    } else if (externalId?.toLowerCase().startsWith("av")) {
      embedUrl = `https://player.bilibili.com/player.html?aid=${externalId.slice(2)}`;
    }
  }

  const label = platform === "youtube" ? "YouTube" : platform === "bilibili" ? "Bilibili" : "Weibo";
  return {
    embedUrl,
    externalId,
    id: source.id,
    label,
    platform,
    title: source.original_title || `${label} source`,
    url: url.toString(),
  };
}

export function getCountryCodeFromHeaders(headers: Headers) {
  for (const name of ["x-vercel-ip-country", "cf-ipcountry", "cloudfront-viewer-country", "x-country-code"]) {
    const value = headers.get(name)?.trim().toUpperCase();
    if (value && /^[A-Z]{2}$/.test(value)) return value;
  }
  return null;
}

export function selectVideoSources(sources: VideoSourceInput[], countryCode: string | null) {
  const priorities: VideoPlatform[] = countryCode === "CN"
    ? ["bilibili", "weibo", "youtube"]
    : ["youtube", "bilibili", "weibo"];
  const order = new Map(priorities.map((platform, index) => [platform, index]));
  return sources
    .flatMap((source) => {
      const display = toDisplaySource(source);
      return display ? [display] : [];
    })
    .sort((left, right) => (order.get(left.platform) ?? 99) - (order.get(right.platform) ?? 99));
}
