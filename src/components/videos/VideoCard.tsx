import Link from "next/link";
import type { Video } from "@/lib/api";
import { VideoThumbnail } from "@/components/videos/VideoThumbnail";

type VideoCardProps = {
  video: Video;
  compact?: boolean;
};

export function VideoCard({ video, compact = false }: VideoCardProps) {
  return (
    <Link href={`/videos/${video._id}`} className="group block h-full">
      <article
        className={`h-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md ${
          compact ? "" : ""
        }`}
      >
        <div
          className={`relative w-full bg-zinc-900 ${
            compact ? "aspect-video" : "aspect-video sm:h-44 sm:aspect-auto lg:h-40"
          }`}
        >
          <VideoThumbnail
            youtubeId={video.youtubeId}
            alt={video.title}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes={
              compact
                ? "(min-width: 1024px) 20vw, 100vw"
                : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            }
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="video-play-button" aria-hidden />
          </div>

          <span className="arial-caps absolute left-3 top-3 rounded-full bg-[#00112d]/85 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white backdrop-blur-sm">
            {video.category}
          </span>
        </div>

        <div className={compact ? "p-3" : "p-4"}>
          <h2
            className={`dejavu-sans font-semibold text-zinc-900 line-clamp-2 group-hover:text-[#00306d] ${
              compact ? "text-sm" : "text-base"
            }`}
          >
            {video.title}
          </h2>
        </div>
      </article>
    </Link>
  );
}
