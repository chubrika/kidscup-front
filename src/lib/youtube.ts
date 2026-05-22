/** Kidscup YouTube channel live page */
export const KIDSCUP_CHANNEL_LIVE_URL =
  "https://www.youtube.com/channel/UCpSRLZUX0cn7kAO0YRYUgqw/live";

export function getYouTubeChannelId(inputUrl: string): string | null {
  try {
    const url = new URL(inputUrl);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "youtube.com" && host !== "m.youtube.com") return null;

    const parts = url.pathname.split("/").filter(Boolean);
    const channelIdx = parts.indexOf("channel");
    if (channelIdx >= 0 && parts[channelIdx + 1]) return parts[channelIdx + 1];

    return null;
  } catch {
    return null;
  }
}

export function getYouTubeVideoId(inputUrl: string): string | null {
  // Accepts: https://www.youtube.com/watch?v=VIDEOID, https://youtu.be/VIDEOID, and /live style links.
  // Returns `null` when we can’t confidently extract an ID.
  try {
    const url = new URL(inputUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      // Standard watch URL.
      const v = url.searchParams.get("v");
      if (v) return v;

      // Embedded or shorts.
      const parts = url.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
      const shortsIdx = parts.indexOf("shorts");
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
    }

    return null;
  } catch {
    return null;
  }
}

export function toYouTubeEmbedUrl(inputUrl: string): string | null {
  const channelId = getYouTubeChannelId(inputUrl);
  if (channelId) {
    return `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(channelId)}`;
  }

  const id = getYouTubeVideoId(inputUrl);
  if (!id) return null;
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
}

export function withYouTubeEmbedParams(
  embedUrl: string,
  params: { autoplay?: "0" | "1"; mute?: "0" | "1"; playsinline?: "0" | "1" }
): string {
  const url = new URL(embedUrl);
  if (params.autoplay) url.searchParams.set("autoplay", params.autoplay);
  if (params.mute) url.searchParams.set("mute", params.mute);
  if (params.playsinline) url.searchParams.set("playsinline", params.playsinline);
  return url.toString();
}

