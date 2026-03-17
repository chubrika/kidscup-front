"use client";

import { useState, useEffect } from "react";
import type { Category, StandingRow } from "@/lib/api";
import { API_URL } from "@/lib/api";
import type { StandingsGroup } from "@/lib/api";
import { ArrowRightIcon } from "lucide-react";
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
    <section className="rounded-md border border-zinc-200 bg-white overflow-hidden">
      <div className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-3 py-2">
        <div className="flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="კატეგორიის ფილტრი">
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              role="tab"
              aria-selected={selectedCategoryId === cat._id}
              onClick={() => setSelectedCategoryId(cat._id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 arial-caps ${
                selectedCategoryId === cat._id
                  ? "bg-[#00306d] text-white shadow-sm"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {cat.name}
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
                  <table className="w-full arial-caps text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50/60 text-zinc-600">
                        <th className="w-6 py-1.5 pl-3 text-center font-semibold">#</th>
                        <th className="min-w-0 py-1.5 pl-1.5 text-left font-semibold">გუნდი</th>
                        <th className="w-7 py-1.5 text-center font-semibold">თ</th>
                        <th className="w-7 py-1.5 text-center font-semibold">ს</th>
                        <th className="w-8 py-1.5 pr-3 text-center font-semibold text-[#00306d]">ქ</th>
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
                            className="border-b border-zinc-200 hover:bg-amber-100/30 transition-colors"
                          >
                            <td className="py-1.5 pl-3 text-center text-zinc-500 font-medium tabular-nums">
                              {index + 1}
                            </td>
                            <td className="py-1.5 pl-1.5 font-medium text-zinc-800 truncate max-w-[140px]">
                              {row.teamName}
                            </td>
                            <td className="py-1.5 text-center text-zinc-600 tabular-nums">{row.played}</td>
                            <td className="py-1.5 text-center text-zinc-600 tabular-nums">{row.pointsDiff}</td>
                            <td className="py-1.5 pr-3 text-center font-semibold text-[#fd7209] tabular-nums">
                              {row.points}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div className="px-3 py-1.5 flex justify-center border-t border-zinc-100">
                    <Link
                      href="/standings"
                      className="inline-flex arial-caps items-center gap-1 text-[11px] font-medium text-[#00306d] hover:text-[#002050] transition-colors"
                    >
                      სრული ცხრილი
                      <ArrowRightIcon className="h-3 w-3" />
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
