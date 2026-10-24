export type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS";

export type InstagramMedia = {
  id: string;
  caption?: string;
  media_type: InstagramMediaType | string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  username?: string;
};

export type InstagramMediaResponse = {
  data?: InstagramMedia[];
};

export type InstagramVideo = {
  id: string;
  caption: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  permalink: string;
  username?: string;
};

export const INSTAGRAM_USERNAME = "tbilisi_kidscup";
export const INSTAGRAM_PROFILE_URL = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;

const MEDIA_FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,username";
const VIDEO_LIMIT = 4;

function hasText(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

export async function getInstagramVideos(): Promise<InstagramVideo[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return [];

  try {
    const url = new URL("https://graph.instagram.com/me/media");
    url.searchParams.set("fields", MEDIA_FIELDS);
    url.searchParams.set("limit", "50");
    url.searchParams.set("access_token", token);

    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return [];

    const payload = (await response.json()) as InstagramMediaResponse;
    const items = Array.isArray(payload.data) ? payload.data : [];

    return items
      .filter(
        (item): item is InstagramMedia & { permalink: string } =>
          item.media_type === "VIDEO" &&
          hasText(item.permalink) &&
          (hasText(item.media_url) || hasText(item.thumbnail_url)),
      )
      .slice(0, VIDEO_LIMIT)
      .map((item) => ({
        id: item.id,
        caption: item.caption?.trim() ?? "",
        mediaUrl: hasText(item.media_url) ? item.media_url : undefined,
        thumbnailUrl: item.thumbnail_url,
        permalink: item.permalink,
        username: item.username,
      }));
  } catch {
    return [];
  }
}
