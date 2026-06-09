import { getVideos } from "@/lib/api";
import { VideoCard } from "@/components/videos/VideoCard";

export const metadata = {
  title: "ვიდეოები | Kids Cup",
  description: "Kids Cup ჩემპიონატის მატჩების ვიდეოები, ჰაილაითები და ინტერვიუები.",
};

export default async function VideosPage() {
  let videos: Awaited<ReturnType<typeof getVideos>> = [];

  try {
    videos = await getVideos();
  } catch {
    // show empty state if API fails
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-zinc-900 arial-caps">ვიდეოები</h1>
        <p className="mt-2 text-sm text-zinc-600 dejavu-sans">
          სრული მატჩები, ჰაილაითები და ინტერვიუები Kids Cup ჩემპიონატიდან.
        </p>
      </div>

      {videos.length === 0 ? (
        <p className="mt-8 text-zinc-600">ვიდეოები ჯერ არ არის გამოქვეყნებული.</p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <li key={video._id}>
              <VideoCard video={video} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
