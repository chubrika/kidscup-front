import Link from "next/link";
import { getNews } from "@/lib/api";
import { Image as ImageIcon } from "lucide-react";

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

export default async function NewsPage() {
  let news: Awaited<ReturnType<typeof getNews>> = [];
  try {
    news = await getNews();
  } catch {
    // show empty state if API fails
  }

  const sortedNews = [...news].sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    const aMs = Number.isFinite(aTime) ? aTime : 0;
    const bMs = Number.isFinite(bTime) ? bTime : 0;
    return bMs - aMs; // newest first
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900 arial-caps">სიახლეები</h1>

      {news.length === 0 ? (
        <p className="mt-4 text-zinc-600">სიახლეები ჯერ არ არის.</p>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sortedNews.map((item) => (
            <li key={item._id}>
              <Link href={`/news/${item._id}`} className="block h-full">
                <article className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <div className="relative aspect-[16/10] w-full shrink-0 bg-zinc-100">
                  {item.photoUrl?.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-300">
                      <ImageIcon className="h-16 w-16" strokeWidth={1.25} aria-hidden />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="font-medium text-md dejavu-sans text-zinc-700 line-clamp-2">
                    {item.title}
                  </h2>
                  <time
                    dateTime={item.createdAt ?? undefined}
                    className="mt-2 text-sm text-zinc-500 dejavu-sans"
                  >
                    {formatNewsDate(item.createdAt)}
                  </time>
                </div>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
