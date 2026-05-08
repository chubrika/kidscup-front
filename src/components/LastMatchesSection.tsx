"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, Match } from "@/lib/api";
import { API_URL } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

type LastMatchesSectionProps = {
  categories: Category[];
};

function getTeamName(team: Match["homeTeam"]): string {
  if (!team) return "—";
  if (typeof team === "string") return team;
  return team.name ?? "—";
}

function getTeamLogo(team: Match["homeTeam"]): string | null {
  if (!team || typeof team === "string") return null;
  return team.logo ?? null;
}

function formatScore(match: Match): string {
  if (match.scoreHome != null && match.scoreAway != null) {
    return `${match.scoreHome} – ${match.scoreAway}`;
  }
  return "–";
}

export function LastMatchesSection({ categories }: LastMatchesSectionProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?._id ?? null
  );
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handleSelectCategory(categoryId: string) {
    setLoading(true);
    setError(null);
    setSelectedCategoryId(categoryId);
  }

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const search = new URLSearchParams();
    search.set("status", "finished");
    if (selectedCategoryId) search.set("ageCategory", selectedCategoryId);
    const url = `${API_URL}/matches?${search.toString()}`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: Match[]) => {
        if (!cancelled) setMatches(data);
      })
      .catch((e) => {
        if (!cancelled && e.name !== "AbortError") setError(e instanceof Error ? e.message : "Error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedCategoryId]);

  const lastMatches = useMemo(() => {
    const sorted = [...matches].sort((a, b) => {
      const ta = new Date(a.date).getTime();
      const tb = new Date(b.date).getTime();
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
      if (Number.isNaN(ta)) return 1;
      if (Number.isNaN(tb)) return -1;
      return tb - ta;
    });
    return sorted.slice(0, 6);
  }, [matches]);

  return (
    <section className="rounded-xl border border-zinc-200 bg-[#00112d] shadow-lg overflow-hidden">
      <div className="px-3 pt-3 flex items-center justify-between gap-3">
        <h2 className="text-md text-white dejavu-sans">
          ბოლო თამაშები
        </h2>
        <Link
          href={selectedCategoryId ? `/results?ageCategory=${encodeURIComponent(selectedCategoryId)}` : "/results"}
          className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90 transition-colors hover:bg-white/15"
        >
          სრული შედეგები
        </Link>
      </div>
      <div className="border-b border-white/10 px-3 py-2">
        <div className="flex flex-wrap justify-start gap-4" role="tablist" aria-label="კატეგორიის ფილტრი">
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              role="tab"
              aria-selected={selectedCategoryId === cat._id}
              onClick={() => handleSelectCategory(cat._id)}
              className={`relative py-1 cursor-pointer text-xs font-medium transition-colors duration-200 arial-caps ${selectedCategoryId === cat._id ? "text-white" : "text-white/60 hover:text-white/80"}`}
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
        {!loading && !error && lastMatches.length === 0 && (
          <p className="px-3 py-3 text-zinc-500 text-xs text-center">
            დასრულებული მატჩები არ არის
          </p>
        )}
        {!loading && !error && lastMatches.length > 0 && (
          <table className="w-full dejavu-sans text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white">
                <th className="py-3 pl-3 text-left font-normal">გუნდი</th>
                <th className="w-[96px] py-3 text-center font-normal">ანგარიში</th>
                <th className="py-3 pr-3 text-right font-normal">გუნდი</th>
              </tr>
            </thead>
            <tbody>
              {lastMatches.map((m) => (
                <tr
                  key={m._id}
                  className="border-b border-white/10 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 pl-3 text-white">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-white/10">
                        {getTeamLogo(m.homeTeam) ? (
                          <Image
                            src={getTeamLogo(m.homeTeam)!}
                            alt={getTeamName(m.homeTeam)}
                            fill
                            className="object-cover"
                            sizes="24px"
                            unoptimized
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[10px] font-medium text-white/70">
                            {getTeamName(m.homeTeam).charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="truncate max-w-[220px]">{getTeamName(m.homeTeam)}</span>
                    </div>
                  </td>

                  <td className="py-3 text-center font-semibold text-white tabular-nums">
                    <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 border border-white/10">
                      {formatScore(m)}
                    </span>
                  </td>

                  <td className="py-3 pr-3 text-white">
                    <div className="flex items-center justify-end gap-2 min-w-0">
                      <span className="truncate max-w-[220px] text-right">
                        {getTeamName(m.awayTeam)}
                      </span>
                      <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-white/10">
                        {getTeamLogo(m.awayTeam) ? (
                          <Image
                            src={getTeamLogo(m.awayTeam)!}
                            alt={getTeamName(m.awayTeam)}
                            fill
                            className="object-cover"
                            sizes="24px"
                            unoptimized
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[10px] font-medium text-white/70">
                            {getTeamName(m.awayTeam).charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
