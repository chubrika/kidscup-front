"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useEffect, useMemo, useState } from "react";
import { API_URL, type Season } from "@/lib/api";

const TABS = [
  { key: "photo", label: "ფოტო" },
  { key: "video", label: "ვიდეო" },
] as const;

export default function MediaPage() {
  return (
    <Suspense fallback={<MediaPageSkeleton />}>
      <MediaPageInner />
    </Suspense>
  );
}

function MediaPageInner() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "video" ? "video" : "photo";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="rounded-md border border-zinc-200 bg-white overflow-hidden">
        <div className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-4 py-3">
          <h1 className="arial-caps text-sm font-semibold tracking-wide text-zinc-800">მედია</h1>
        </div>

        <div className="border-b border-zinc-200 px-4 py-3">
          <div className="inline-flex rounded-md border border-zinc-200 p-1">
            {TABS.map(({ key, label }) => {
              const isActive = tab === key;
              return (
                <Link
                  key={key}
                  href={key === "photo" ? "/media?tab=photo" : "/media?tab=video"}
                  className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-[#00306d] text-white" : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {tab === "photo" ? (
            <SeasonPhotosTab />
          ) : (
            <p className="text-sm text-zinc-600">ვიდეო კონტენტი აქ გამოჩნდება.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function SeasonPhotosTab() {
  const searchParams = useSearchParams();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const requestedSeasonId = searchParams.get("seasonId") ?? "";
  const requestedAlbumId = searchParams.get("albumId") ?? "";

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
      .then((data: Season[]) => {
        if (cancelled) return;
        const sorted = [...(data ?? [])].sort((a, b) => {
          const ta = a.startDate ? Date.parse(a.startDate) : 0;
          const tb = b.startDate ? Date.parse(b.startDate) : 0;
          return tb - ta;
        });
        setSeasons(sorted);
        // If URL requests a season/album (from Home "latest albums"), honor it.
        const requestedSeason =
          (requestedSeasonId && sorted.find((s) => s._id === requestedSeasonId)) || null;
        const seasonId = requestedSeason?._id ?? sorted[0]?._id ?? "";
        setSelectedSeasonId(seasonId);

        const requestedAlbum =
          requestedAlbumId && requestedSeason
            ? requestedSeason.albums?.find((a) => a._id === requestedAlbumId) ?? null
            : null;
        setSelectedAlbumId(requestedAlbum?._id ?? "");
      })
      .catch(() => {
        if (!cancelled) {
          setSeasons([]);
          setSelectedSeasonId("");
          setSelectedAlbumId("");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [requestedSeasonId, requestedAlbumId]);

  useEffect(() => {
    if (!activePhotoUrl) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActivePhotoUrl(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePhotoUrl]);

  const selectedSeason = useMemo(
    () => seasons.find((s) => s._id === selectedSeasonId) ?? null,
    [seasons, selectedSeasonId]
  );

  const albums = useMemo(() => selectedSeason?.albums ?? [], [selectedSeason]);
  const selectedAlbum = useMemo(
    () => albums.find((a) => a._id === selectedAlbumId) ?? null,
    [albums, selectedAlbumId]
  );
  const photos = selectedAlbum?.photos ?? [];

  if (loading) {
    return <p className="text-sm text-zinc-600">იტვირთება...</p>;
  }

  if (!seasons.length) {
    return <p className="text-sm text-zinc-600">სეზონები ვერ ჩაიტვირთა.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-900">სეზონი</p>
          <p className="text-xs text-zinc-500">აირჩიე სეზონი და ნახე ატვირთული ფოტოები</p>
        </div>

        <select
          className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00306d]/30 sm:w-[320px]"
          value={selectedSeasonId}
          onChange={(e) => {
            const nextSeasonId = e.target.value;
            setSelectedSeasonId(nextSeasonId);
            // Default UI: always show albums grid after season change
            setSelectedAlbumId("");
          }}
        >
          {seasons.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {albums.length ? (
        <div className="space-y-4">
          {/* Albums list (hidden when an album is selected) */}
          {!selectedAlbumId ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((a) => {
                const albumPhotos = a.photos ?? [];
                const last = albumPhotos.length ? albumPhotos[albumPhotos.length - 1] : null;
                const thumbUrl = last?.url ?? "";
                return (
                  <button
                    key={a._id}
                    type="button"
                    onClick={() => setSelectedAlbumId(a._id)}
                    className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-[#00306d]/30"
                  >
                    <div className="relative aspect-[4/3] w-full bg-zinc-100">
                      {thumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
                          No cover
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-zinc-900 line-clamp-1">{a.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">{albumPhotos.length} ფოტო</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Album photos */}
          {selectedAlbumId ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {selectedAlbum?.title ?? "ალბომი"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {photos.length ? `${photos.length} ფოტო` : "ფოტოები არ არის"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAlbumId("")}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
                >
                  უკან
                </button>
              </div>

              {photos.length ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {photos.map((p) => (
                    <button
                      key={p.key || p.url}
                      type="button"
                      onClick={() => setActivePhotoUrl(p.url)}
                      className="group overflow-hidden rounded-xl cursor-pointer border border-zinc-200 bg-white shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-[#00306d]/30"
                    >
                      <div className="relative aspect-[4/3] w-full bg-zinc-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.url}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-600">ამ ალბომში ფოტოები ჯერ არ არის.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-600">აირჩიე ალბომი რომ ნახო ფოტოები.</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-zinc-600">ამ სეზონზე ალბომები ჯერ არ არის.</p>
      )}

      {activePhotoUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            // close on backdrop click
            if (e.target === e.currentTarget) setActivePhotoUrl(null);
          }}
        >
          <div className="relative w-full max-w-5xl">
            <button
              type="button"
              onClick={() => setActivePhotoUrl(null)}
              aria-label="Close"
              className="absolute -top-3 -right-3 grid h-10 w-10 place-items-center rounded-full bg-white text-zinc-800 shadow-md hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            <div className="overflow-hidden rounded-xl bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhotoUrl}
                alt=""
                className="max-h-[85vh] w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function MediaPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="rounded-md border border-zinc-200 bg-white overflow-hidden">
        <div className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-4 py-3">
          <h1 className="arial-caps text-sm font-semibold tracking-wide text-zinc-800">მედია</h1>
        </div>
        <div className="p-6">
          <p className="text-sm text-zinc-600">იტვირთება...</p>
        </div>
      </section>
    </div>
  );
}
