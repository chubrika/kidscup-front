import Link from "next/link";
import Image from "next/image";
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
              <Link href={`/news/${item._id}`} className="group block h-full">
                <article className="h-full overflow-hidden">
                  <div className="relative h-36 w-full bg-zinc-100 sm:h-40">
                    {item.photoUrl?.trim() ? (
                      <Image
                        src={item.photoUrl}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-[1.02]"
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        unoptimized
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-[#00112d] to-[#fd7209]/80" />
                        <div className="absolute inset-0 flex items-center justify-center text-white/70">
                          <ImageIcon className="h-16 w-16" strokeWidth={1.25} aria-hidden />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="py-3">
                    <p className="dejavu-sans text-sm font-semibold text-zinc-900 line-clamp-2">
                      {item.title}
                    </p>
                    <p className="arial-caps mt-2 text-[11px] text-zinc-600">
                      {formatNewsDate(item.createdAt)}
                    </p>
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
