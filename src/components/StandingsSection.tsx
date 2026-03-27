"use client";

import { useState, useEffect } from "react";
import type { Category, StandingRow } from "@/lib/api";
import { API_URL } from "@/lib/api";
import type { StandingsGroup } from "@/lib/api";
import Link from "next/link";

type StandingsSectionProps = {
  categories: Category[];
};

async function fetchStandings(ageCategoryId: string | null): Promise<StandingsGroup[]> {
  const url = ageCategoryId
    ? `${API_URL}/standings?ageCategory=${encodeURIComponent(ageCategoryId)}`
    : `${API_URL}/standings`;
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error("Failed to fetch standings");
  return res.json();
}

function normalizeTeamId(teamId: StandingRow["teamId"]): string {
  const raw = typeof teamId === "string" ? teamId : (teamId as { _id?: string })._id;
  return String(raw);
}

export function StandingsSection({ categories }: StandingsSectionProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?._id ?? null
  );
  const [standingsGroups, setStandingsGroups] = useState<StandingsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await fetchStandings(selectedCategoryId);
      if (!cancelled) setStandingsGroups(data);
    };
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });
    load()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedCategoryId]);

  return (
    <section className="rounded-xl border border-zinc-200 bg-[#00112d] shadow-lg overflow-hidden">
      <div className="px-3 pt-3">
        <h2 className="text-md text-white dejavu-sans">ცხრილი</h2>
      </div>
      <div className="border-b border-white/10
       px-3 py-2">
        <div className="flex flex-wrap justify-start gap-4" role="tablist" aria-label="კატეგორიის ფილტრი">
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              role="tab"
              aria-selected={selectedCategoryId === cat._id}
              onClick={() => setSelectedCategoryId(cat._id)}
              className={`relative py-1 cursor-pointer text-xs font-medium transition-colors duration-200 arial-caps ${
                selectedCategoryId === cat._id
                  ? "text-white"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              {cat.name}
              {selectedCategoryId === cat._id && (
                <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-[#fd7209]" />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        {error && (
          <p className="px-3 py-2.5 text-red-600 text-xs">{error}</p>
        )}
        {loading && (
          <p className="px-3 py-2.5 text-zinc-500 text-xs">იტვირთება...</p>
        )}
        {!loading && !error && (
          <>
            {standingsGroups.length === 0 ? (
              <p className="px-3 py-3 text-zinc-500 text-xs text-center">ამ კატეგორიაში ცხრილი ჯერ არ არის</p>
            ) : (
              standingsGroups.map((group) => (
                <div key={group.categoryId} className="mb-0 last:mb-0">
                  {standingsGroups.length > 1 && (
                    <h3 className="px-3 pt-2.5 pb-1 text-xs font-semibold text-zinc-500 arial-caps tracking-wide">
                      {group.categoryName}
                    </h3>
                  )}
                  <table className="w-full dejavu-sans text-xs">
                    <thead>
                      <tr className="border-b border-white/10  text-white">
                        <th className="w-6 py-3 pl-3 text-center font-normal">#</th>
                        <th className="min-w-0 py-3 pl-1.5 text-left font-normal">გუნდი</th>
                        <th className="w-7 py-3 text-center font-normal">თ</th>
                        <th className="w-7 py-3 text-center font-normal">ს</th>
                        <th className="w-8 py-3 pr-3 text-center font-normal">ქ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.standings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-zinc-500 text-xs">
                            ამ კატეგორიაში გუნდები ჯერ არ არის
                          </td>
                        </tr>
                      ) : (
                        group.standings.map((row, index) => (
                          <tr
                            key={normalizeTeamId(row.teamId)}
                            className="border-b border-white/10 hover:bg-white/5 transition-colors"
                          >
                            <td
                              className={`py-3 pl-3 text-center font-medium italic arial-caps tabular-nums ${
                                index === 0 ? "text-[#fd7209]" : "text-white/40"
                              }`}
                            >
                              {index + 1}
                            </td>
                            <td className="py-3 pl-1.5 font-medium text-white truncate max-w-[140px]">
                              {row.teamName}
                            </td>
                            <td className="py-3 text-center text-white/40 tabular-nums">{row.played}</td>
                            <td className="py-3 text-center text-white/40 tabular-nums">{row.pointsDiff}</td>
                            <td className={`py-3 pr-3 text-center font-semibold tabular-nums ${
                                index === 0 ? "text-[#fd7209]" : "text-white"
                              }`}>
                              {row.points}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div className="px-3 py-3 flex justify-center border-t border-white/10">
                    <Link
                      href="/league"
                      className="px-4 py-2 text-white text-center bg-white/10 py-1 rounded-lg font-label text-[12px] font-normal hover:bg-white/20 transition-colors arial-caps tracking-widest"
                    >
                      სრული ცხრილი
                    </Link>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </section>
  );
}
 