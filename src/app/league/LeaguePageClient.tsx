"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, Season } from "@/lib/api";
import { API_URL } from "@/lib/api";
import { StandingsTable } from "@/components/StandingsTable";
import { ChevronRight } from "lucide-react";

type LeaguePageClientProps = {
  categories: Category[];
};

export default function LeaguePageClient({ categories }: LeaguePageClientProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?._id ?? null
  );
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((c) => c._id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!cancelled) setSeasonsLoading(true);
    });

    const url = selectedCategoryId
      ? `${API_URL}/seasons?ageCategory=${encodeURIComponent(selectedCategoryId)}`
      : `${API_URL}/seasons`;

    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch seasons");
        return r.json();
      })
      .then((data: Season[]) => {
        if (cancelled) return;
        const sorted = [...data].sort((a, b) => {
          const ta = a.startDate ? Date.parse(a.startDate) : 0;
          const tb = b.startDate ? Date.parse(b.startDate) : 0;
          return tb - ta;
        });
        setSeasons(sorted);
        setSelectedSeasonId(sorted[0]?._id ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setSeasons([]);
          setSelectedSeasonId(null);
        }
      })
      .finally(() => {
        if (!cancelled) setSeasonsLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedCategoryId]);

  return (
    <div className="bg-sky min-h-[calc(100vh-20rem)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="rounded-2xl bg-[#e8ecf5] p-4">
              <p className="arial-caps text-[11px] font-semibold tracking-widest text-[#9d4300]">
                ასაკობრივი კატეგორია
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {categories.map((cat) => {
                  const selected = cat._id === selectedCategoryId;
                  return (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat._id)}
                      className={`group cursor-pointer flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left arial-caps transition-all duration-200 ${selected
                          ? "border-zinc-200 bg-white text-[#00112d]"
                          : "border-transparent bg-white/60 text-zinc-700 hover:bg-white"
                        }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={`h-6 w-[2px] rounded-full transition-colors duration-200 ${selected ? "bg-[#9d4300]" : "bg-transparent group-hover:bg-zinc-300"
                            }`}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 truncate font-medium">{cat.name}</span>
                      </span>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-all duration-200 ${selected ? "translate-x-0.5 rotate-0 text-[#9d4300]" : "text-zinc-400"
                          }`}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="arial-caps text-3xl font-semibold tracking-tight text-[#00112d]">
                  ცხრილი
                </h1>
                <p className="mt-1 arial-caps text-sm text-zinc-500">
                  {selectedCategory?.name ?? "—"} - <span className="dejavu-sans">{selectedSeasonId ? seasons.find((s) => s._id === selectedSeasonId)?.name : "—"}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="min-w-[200px]">
                  <select
                    value={selectedSeasonId ?? ""}
                    onChange={(e) => setSelectedSeasonId(e.target.value || null)}
                    disabled={seasonsLoading || seasons.length === 0}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dejavu-sans text-zinc-800 outline-none focus:border-[#9d4300]"
                  >
                    {seasonsLoading && <option value="">იტვირთება...</option>}
                    {!seasonsLoading && seasons.length === 0 && <option value="">სეზონები არ არის</option>}
                    {seasons.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <StandingsTable
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onCategoryChange={setSelectedCategoryId}
                seasonId={selectedSeasonId}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

