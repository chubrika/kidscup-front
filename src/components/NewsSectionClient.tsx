"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { News } from "@/lib/api";

type NewsSectionClientProps = {
  news: News[];
};

function formatDateUtc(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy}`;
}

export default function NewsSectionClient({ news }: NewsSectionClientProps) {
  const latest = useMemo(() => {
    const sorted = [...news].sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bTime - aTime;
    });
    return sorted.slice(0, 4);
  }, [news]);

  const featured = latest[0];
  const rest = latest.slice(1, 4);

  return (
    <section className="overflow-hidden">
      {latest.length === 0 || !featured ? (
        <p className="text-sm text-zinc-600">სიახლეები ჯერ არ არის დამატებული.</p>
      ) : (
        <div className="flex flex-col gap-6">
          <article className="overflow-hidden">
            <Link href={`/news/${featured._id}`} className="block h-full">
              <div className="relative w-full bg-zinc-100 h-72 sm:h-96 lg:h-[520px] rounded-xl overflow-hidden">
                {featured.photoUrl ? (
                  <Image
                    src={featured.photoUrl}
                    alt={featured.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    priority
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00112d] to-[#fd7209]/80" />
                )}
              </div>
              <div className="py-4">
                <h3 className="dejavu-sans text-xl font-semibold tracking-wide text-zinc-900 line-clamp-2">
                  {featured.title}
                </h3>
                <p className="arial-caps mt-2 text-[11px] text-zinc-600">
                  {formatDateUtc(featured.createdAt)}
                </p>
              </div>
            </Link>
          </article>

          <aside className="">
            <div className="flex items-center justify-between gap-3">
              <h3 className="arial-caps text-lg font-semibold text-zinc-800">
                ბოლო სიახლეები
              </h3>
              <div className="h-px flex-1 bg-[#45556c]/40" />
            </div>

            {rest.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-600">
                სხვა სიახლეები ჯერ არ არის დამატებული.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((item) => (
                  <Link
                    key={item._id}
                    href={`/news/${item._id}`}
                    className="group w-full"
                  >
                    <div className="overflow-hidden transition-colors">
                      <div className="relative w-full bg-zinc-100 h-36 sm:h-40">
                        {item.photoUrl ? (
                          <Image
                            src={item.photoUrl}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-[1.02] transition-transform"
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#00112d] to-[#fd7209]/80" />
                        )}
                      </div>

                      <div className="py-3">
                        <p className="dejavu-sans text-sm font-semibold text-zinc-900 line-clamp-2">
                          {item.title}
                        </p>
                        <p className="arial-caps mt-2 text-[11px] text-zinc-600">
                          {formatDateUtc(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}

