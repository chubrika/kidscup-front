import { XMLParser } from "fast-xml-parser";

export type TikTokVideo = {
  id: string;
  title: string;
  link: string;
  pubDate?: string;
  thumbnailUrl?: string;
};

const VIDEO_LIMIT = 4;
const FEED_TIMEOUT_MS = 8000;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true,
  processEntities: true,
  cdataPropName: "__cdata",
});

function hasText(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

export function getTikTokUsername(): string {
  const raw ="tbilisikidscup";
  const username = raw.trim().replace(/^@/, "");
  return /^[A-Za-z0-9._]{2,24}$/.test(username) ? username : "";
}

export function getTikTokProfileUrl(username = getTikTokUsername()): string {
  return username ? `https://www.tiktok.com/@${username}` : "https://www.tiktok.com";
}

function feedUrls(username: string): string[] {
  const path = `/tiktok/user/${encodeURIComponent(username)}`;
  const mirrors = [
    `https://rsshub.ktachibana.party${path}`,
    `https://rsshub.rss.tips${path}`,
    `https://rsshub.app${path}`,
  ];
  const custom = process.env.TIKTOK_RSS_URL?.trim();
  return custom ? [custom, ...mirrors.filter((url) => url !== custom)] : mirrors;
}

function textOf(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (!value || typeof value !== "object") return "";

  if (Array.isArray(value)) {
    for (const entry of value) {
      const text = textOf(entry);
      if (text) return text;
    }
    return "";
  }

  const record = value as Record<string, unknown>;
  return textOf(record["#text"] ?? record.__cdata ?? "");
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function httpUrl(value: unknown): string | undefined {
  const text = decodeHtml(textOf(value));
  return /^https?:\/\//i.test(text) ? text : undefined;
}

function linkOf(value: unknown): string {
  const direct = httpUrl(value);
  if (direct) return direct;
  if (!value || typeof value !== "object") return "";

  if (Array.isArray(value)) {
    for (const entry of value) {
      const link = linkOf(entry);
      if (link) return link;
    }
    return "";
  }

  const record = value as Record<string, unknown>;
  return httpUrl(record["@_href"] ?? record.href ?? record["@_url"] ?? record.url) ?? "";
}

function firstUrl(value: unknown): string | undefined {
  const direct = httpUrl(value);
  if (direct) return direct;
  if (!value || typeof value !== "object") return undefined;

  if (Array.isArray(value)) {
    for (const entry of value) {
      const url = firstUrl(entry);
      if (url) return url;
    }
    return undefined;
  }

  const record = value as Record<string, unknown>;
  return (
    firstUrl(record["@_url"]) ||
    firstUrl(record.url) ||
    firstUrl(record["@_href"]) ||
    firstUrl(record.href)
  );
}

function thumbnailFromHtml(html: string): string | undefined {
  const decoded = decodeHtml(html);
  const patterns = [
    /poster\s*=\s*["']([^"']+)["']/i,
    /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i,
    /<media:thumbnail\b[^>]*\burl\s*=\s*["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern)?.[1];
    const url = match ? decodeHtml(match) : "";
    if (/^https?:\/\//i.test(url)) return url;
  }

  return undefined;
}

function thumbnailOf(item: Record<string, unknown>): string | undefined {
  const enclosure = firstUrl(item.enclosure);
  if (enclosure) return enclosure;

  const media = firstUrl(item["media:thumbnail"] ?? item["media:content"]);
  if (media && !/\.mp4($|\?)/i.test(media)) return media;

  return thumbnailFromHtml(textOf(item.description ?? item["media:description"] ?? item.summary));
}

function publishedAt(value: string | undefined): number {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function parseFeed(xml: string): TikTokVideo[] {
  const parsed = parser.parse(xml) as {
    rss?: { channel?: Record<string, unknown> };
    feed?: Record<string, unknown>;
  };
  const channel = parsed.rss?.channel ?? parsed.feed;
  const rawItems = channel?.item ?? channel?.entry;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  const videos: TikTokVideo[] = [];

  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const link = linkOf(item.link);
    if (!link) continue;

    const title = decodeHtml(textOf(item.title)) || "TikTok";
    const id = textOf(item.guid) || textOf(item.id) || link;
    const pubDate = textOf(item.pubDate ?? item.published ?? item.updated) || undefined;

    videos.push({
      id,
      title,
      link,
      pubDate,
      thumbnailUrl: thumbnailOf(item),
    });
  }

  return videos
    .sort((a, b) => publishedAt(b.pubDate) - publishedAt(a.pubDate))
    .slice(0, VIDEO_LIMIT);
}

function looksLikeFeed(body: string, contentType: string | null): boolean {
  if ((contentType ?? "").toLowerCase().includes("html")) return false;
  const start = body.trimStart().slice(0, 300).toLowerCase();
  return start.includes("<rss") || start.includes("<feed");
}

async function fetchFeed(url: string): Promise<TikTokVideo[] | null> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      "User-Agent": "KidsCupTikTokFeed/1.0",
    },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
  });

  if (!response.ok) return null;

  const xml = await response.text();
  if (!looksLikeFeed(xml, response.headers.get("content-type"))) return null;

  const videos = parseFeed(xml);
  return videos.length > 0 ? videos : null;
}

export async function getTikTokVideos(): Promise<TikTokVideo[]> {
  const username = getTikTokUsername();
  if (!username) return [];

  for (const url of feedUrls(username)) {
    try {
      const videos = await fetchFeed(url);
      if (videos) return videos;
    } catch {
      // Try the next public RSSHub instance.
    }
  }

  return [];
}
