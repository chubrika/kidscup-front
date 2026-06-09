import type { Video } from "@/lib/api";
import { VideoCard } from "@/components/videos/VideoCard";

type RelatedVideosProps = {
  videos: Video[];
  title?: string;
};

export function RelatedVideos({
  videos,
  title = "სხვა ვიდეოები",
}: RelatedVideosProps) {
  if (videos.length === 0) return null;

  return (
    <aside className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="arial-caps text-sm font-semibold tracking-wide text-zinc-800">
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-4">
        {videos.map((video) => (
          <li key={video._id}>
            <VideoCard video={video} compact />
          </li>
        ))}
      </ul>
    </aside>
  );
}
