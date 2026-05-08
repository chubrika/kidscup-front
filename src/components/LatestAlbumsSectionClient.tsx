"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { API_URL, type Season } from "@/lib/api";

type AlbumLite = {
  _id: string;
  title: string;
  createdAt?: string;
  seasonId: string;
  seasonName: string;
  thumbUrl: string | null;
  photosCount: number;
};

function albumTime(a: AlbumLite) {
  const t = a.createdAt ? Date.parse(a.createdAt) : 0;
  return Number.isFinite(t) ? t : 0;
}

export default function LatestAlbumsSectionClient() {
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState<AlbumLite[]>([]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    fetch(`${API_URL}/seasons`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch seasons");
        return r.json();
      })
      .then((seasons: Season[]) => {
        if (cancelled) return;
        const flattened: AlbumLite[] = (seasons ?? []).flatMap((s) => {
          const seasonName = s.name ?? "";
          const seasonId = s._id ?? "";
          const albums = s.albums ?? [];
          return albums.map((a) => {
            const photos = a.photos ?? [];
            const last = photos.length ? photos[photos.length - 1] : null;
            return {
              _id: a._id,
              title: a.title,
              createdAt: a.createdAt,
              seasonId,
              seasonName,
              thumbUrl: last?.url ?? null,
              photosCount: photos.length,
            };
          });
        });

        const sorted = flattened.sort((a, b) => albumTime(b) - albumTime(a));
        setAlbums(sorted.slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) setAlbums([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const hasAlbums = albums.length > 0;
  const title = useMemo(() => "ფოტოები", []);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <h3 className="arial-caps text-lg font-semibold text-zinc-800">{title}</h3>
        <div className="h-px flex-1 bg-[#45556c]/40" />
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-zinc-600">იტვირთება...</p>
      ) : !hasAlbums ? (
        <p className="mt-3 text-sm text-zinc-600">ალბომები ჯერ არ არის.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <Link
              key={a._id}
              href={`/media?tab=photo&seasonId=${encodeURIComponent(a.seasonId)}&albumId=${encodeURIComponent(a._id)}`}
              className="group w-full"
            >
              <div className="overflow-hidden transition-colors">
                <div className="relative w-full bg-zinc-100 h-36 sm:h-40">
                  {a.thumbUrl ? (
                    <Image
                      src={a.thumbUrl}
                      alt={a.title}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00112d] to-[#fd7209]/80" />
                  )}

                  <div className="absolute bottom-2 left-2 rounded-md bg-[#fd7208] px-2 py-1 text-white backdrop-blur-sm">
                    <Camera className="block h-4 w-4" aria-hidden="true" />
                  </div>
                </div>

                <div className="py-3">
                  <p className="dejavu-sans text-sm font-semibold text-zinc-900 line-clamp-2">
                    {a.title}
                  </p>
                  <p className="arial-caps mt-2 text-[11px] text-zinc-600 line-clamp-1">
                    {a.seasonName} • {a.photosCount} ფოტო
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

