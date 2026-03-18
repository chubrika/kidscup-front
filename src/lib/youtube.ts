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
  const id = getYouTubeVideoId(inputUrl);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

