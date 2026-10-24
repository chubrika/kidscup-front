import { getTikTokProfileUrl, getTikTokUsername, getTikTokVideos } from "@/lib/tiktok";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z" />
    </svg>
  );
}

export function TikTokFeedSkeleton() {
  return (
    <section className="px-4 pb-8 sm:px-6" aria-hidden="true">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-300/80" />
        <div className="h-4 w-36 animate-pulse rounded bg-zinc-300/80" />
        <div className="h-px flex-1 bg-[#45556c]/20" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="aspect-[9/16] animate-pulse rounded-2xl border border-zinc-200 bg-zinc-300/70"
          />
        ))}
      </div>
    </section>
  );
}

export async function TikTokFeed() {
  const username = getTikTokUsername();
  const videos = await getTikTokVideos();
  if (!username || videos.length === 0) return null;

  return (
    <section className="px-4 pb-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <a
          href={getTikTokProfileUrl(username)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 text-[#00112d] transition-colors hover:text-[#00306d]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
            <TikTokIcon className="h-5 w-5" />
          </span>
          <span className="dejavu-sans color-primary text-base font-semibold sm:text-lg">@{username}</span>
        </a>
        <div className="h-px flex-1 bg-[#45556c]/40" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {videos.map((video) => (
          <a
            key={video.id}
            href={video.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={video.title || "Open this video on TikTok"}
            className="group relative block aspect-[9/16] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900"
          >
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-zinc-800 to-black">
                <TikTokIcon className="h-10 w-10 text-white/80" />
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 pt-16">
              <p className="line-clamp-2 text-xs text-white">{video.title}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-white/90">
                <TikTokIcon className="h-3.5 w-3.5" />
                TikTok
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
