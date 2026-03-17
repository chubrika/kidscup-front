import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewsById } from "@/lib/api";
import { Image as ImageIcon } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

function formatNewsDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ka-GE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const news = await getNewsById(id);

  if (!news) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 bg-white">
      <p className="mb-4 text-sm text-zinc-500">
        <Link href="/news" className="hover:text-zinc-700 underline">
          სიახლეები
        </Link>
        {" / "}
        <span className="text-zinc-700 line-clamp-1">{news.title}</span>
      </p>

      <article>
        <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
          {news.title}
        </h1>
        <time
          dateTime={news.createdAt ?? undefined}
          className="mt-2 block text-sm text-zinc-500"
        >
          {formatNewsDate(news.createdAt)}
        </time>

        {news.photoUrl?.trim() ? (
          <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-lg bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={news.photoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="mt-6 flex aspect-video w-full items-center justify-center rounded-lg bg-zinc-100 text-zinc-300">
            <ImageIcon className="h-20 w-20" strokeWidth={1.25} aria-hidden />
          </div>
        )}

        {news.description?.trim() ? (
          <div
            className="news-body mt-6 text-zinc-700 [&_p]:my-3 [&_h1]:mt-6 [&_h2]:mt-6 [&_h3]:mt-4 [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_a]:text-blue-600 [&_a]:underline [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1"
            dangerouslySetInnerHTML={{ __html: news.description }}
          />
        ) : null}
      </article>
    </div>
  );
}
