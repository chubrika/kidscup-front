"use client";

import { useState, useEffect } from "react";
import type { Category, StandingRow } from "@/lib/api";
import { API_URL } from "@/lib/api";
import type { StandingsGroup } from "@/lib/api";

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
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="flex justify-center gap-2" role="tablist" aria-label="კატეგორიის ფილტრი">
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              role="tab"
              aria-selected={selectedCategoryId === cat._id}
              onClick={() => setSelectedCategoryId(cat._id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors arial-caps ${
                selectedCategoryId === cat._id
                  ? "bg-[#00306d] text-white"
                  : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        {error && (
          <p className="p-4 text-red-600 text-sm">{error}</p>
        )}
        {loading && (
          <p className="p-4 text-zinc-500 text-sm">იტვირთება...</p>
        )}
        {!loading && !error && (
          <>
            {standingsGroups.length === 0 ? (
              <p className="p-4 text-zinc-500 text-sm">ამ კატეგორიაში ცხრილი ჯერ არ არის</p>
            ) : (
              standingsGroups.map((group) => (
                <div key={group.categoryId} className="mb-6 last:mb-0">
                  {standingsGroups.length > 1 && (
                    <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-zinc-600 arial-caps">
                      {group.categoryName}
                    </h3>
                  )}
                  <table className="w-full arial-caps text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200  bg-zinc-100/80 text-zinc-700">
                        <th className="w-5 py-2.5 pl-4 text-center font-semibold">#</th>
                        <th className="w-8 py-2.5 pl-2 text-left font-semibold">გუნდი</th>
                        <th className="w-8 py-2.5 text-center font-semibold">თ</th>
                        <th className="w-8 py-2.5 text-center font-semibold">ს</th>
                        <th className="w-8 py-2.5 pr-4 text-center font-semibold">ქ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.standings.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-zinc-500">
                            ამ კატეგორიაში გუნდები ჯერ არ არის
                          </td>
                        </tr>
                      ) : (
                        group.standings.map((row, index) => {
                          return (
                            <tr
                              key={normalizeTeamId(row.teamId)}
                              className="border-b border-zinc-100 hover:bg-zinc-50/80"
                            >
                              <td className="py-2.5 pl-4 text-center text-zinc-600 font-medium">
                                {index + 1}
                              </td>
                              <td className="py-2.5 pl-2 font-medium text-zinc-900">
                                {row.teamName}
                              </td>
                              <td className="py-2.5 text-center text-zinc-700">{row.played}</td>
                              <td className="py-2.5 text-center text-zinc-700">{row.pointsDiff}</td>
                              <td className="py-2.5 pr-4 text-center font-semibold text-[#fd7209]">
                                {row.points}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </section>
  );
}
