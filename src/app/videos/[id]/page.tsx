import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVideoById, getVideos, type Video } from "@/lib/api";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { RelatedVideos } from "@/components/videos/RelatedVideos";

type Props = {
  params: Promise<{ id: string }>;
};

function pickRelatedVideos(current: Video, all: Video[], limit = 4): Video[] {
  return all
    .filter((video) => video._id !== current._id)
    .sort((a, b) => {
      const aSameCategory = a.category === current.category ? 1 : 0;
      const bSameCategory = b.category === current.category ? 1 : 0;
      if (aSameCategory !== bSameCategory) return bSameCategory - aSameCategory;

      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    })
    .slice(0, limit);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideoById(id);

  if (!video) {
    return { title: "ვიდეო ვერ მოიძებნა | Kids Cup" };
  }

  const description =
    video.description?.trim() ||
    `${video.category} — ${video.title}`;

  return {
    title: `${video.title} | Kids Cup`,
    description,
    openGraph: {
      title: video.title,
      description,
      images: [
        {
          url: `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`,
          width: 1280,
          height: 720,
          alt: video.title,
        },
      ],
    },
  };
}

export default async function VideoDetailPage({ params }: Props) {
  const { id } = await params;

  let video: Video | null = null;
  let allVideos: Video[] = [];

  try {
    [video, allVideos] = await Promise.all([getVideoById(id), getVideos()]);
  } catch {
    notFound();
  }

  if (!video) {
    notFound();
  }

  const relatedVideos = pickRelatedVideos(video, allVideos);
  const embedSrc = youtubeEmbedUrl(video.youtubeId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="mb-4 text-sm text-zinc-500">
        <Link href="/videos" className="underline hover:text-zinc-700">
          ვიდეოები
        </Link>
        {" / "}
        <span className="line-clamp-1 dejavu-sans text-zinc-700">{video.title}</span>
      </p>

      <div className="grid gap-8 lg:grid-cols-12">
        <article className="lg:col-span-8">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-black shadow-sm">
            <div className="relative aspect-video w-full">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={embedSrc}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>

          <div className="mt-6">
            <span className="arial-caps inline-flex rounded-full bg-[#00112d] px-3 py-1 text-[11px] font-semibold tracking-wide text-white">
              {video.category}
            </span>
            <h1 className="mt-3 text-2xl dejavu-sans font-semibold text-zinc-900 sm:text-3xl">
              {video.title}
            </h1>
            {video.description?.trim() ? (
              <p className="dejavu-sans mt-4 whitespace-pre-wrap text-base leading-relaxed text-zinc-700">
                {video.description}
              </p>
            ) : null}
          </div>
        </article>

        <div className="lg:col-span-4">
          <RelatedVideos videos={relatedVideos} />
        </div>
      </div>
    </div>
  );
}
