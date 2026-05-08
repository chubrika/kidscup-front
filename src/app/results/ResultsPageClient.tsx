"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, Match } from "@/lib/api";
import { API_URL } from "@/lib/api";
import Image from "next/image";
import { useRouter } from "next/navigation";

type ResultsPageClientProps = {
  categories: Category[];
  initialCategoryId: string | null;
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

function formatMatchDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ka-GE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tbilisi",
  });
}

export default function ResultsPageClient({
  categories,
  initialCategoryId,
}: ResultsPageClientProps) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialCategoryId ?? categories[0]?._id ?? null
  );
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const search = new URLSearchParams();
    search.set("status", "finished");
    if (selectedCategoryId) search.set("ageCategory", selectedCategoryId);
    const url = `${API_URL}/matches?${search.toString()}`;

    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: Match[]) => {
        if (!cancelled) setMatches(data);
      })
      .catch((e) => {
        if (!cancelled && e?.name !== "AbortError") {
          setError(e instanceof Error ? e.message : "Error");
          setMatches([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedCategoryId]);

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const ta = new Date(a.date).getTime();
      const tb = new Date(b.date).getTime();
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
      if (Number.isNaN(ta)) return 1;
      if (Number.isNaN(tb)) return -1;
      return tb - ta;
    });
  }, [matches]);

  const selectedCategoryName = useMemo(() => {
    return categories.find((c) => c._id === selectedCategoryId)?.name ?? "ყველა";
  }, [categories, selectedCategoryId]);

  return (
    <div className="bg-sky min-h-[calc(100vh-20rem)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="arial-caps text-3xl font-semibold tracking-tight text-[#00112d]">
              სრული შედეგები
            </h1>
            <p className="mt-1 arial-caps text-sm text-zinc-500">{selectedCategoryName}</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          <div className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const active = cat._id === selectedCategoryId;
                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat._id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "bg-[#00306d] text-white"
                        : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            {error && <p className="px-4 py-3 text-red-600 text-sm">{error}</p>}
            {loading && <p className="px-4 py-3 text-zinc-500 text-sm">იტვირთება...</p>}
            {!loading && !error && sortedMatches.length === 0 && (
              <p className="px-4 py-6 text-zinc-500 text-sm text-center">
                დასრულებული მატჩები არ არის
              </p>
            )}

            {!loading && !error && sortedMatches.length > 0 && (
              <table className="w-full dejavu-sans text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-700">
                    <th className="py-3 pl-4 text-left font-normal">თარიღი</th>
                    <th className="py-3 text-left font-normal">გუნდი</th>
                    <th className="w-[110px] py-3 text-center font-normal">ანგარიში</th>
                    <th className="py-3 pr-4 text-right font-normal">გუნდი</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMatches.map((m) => (
                    <tr
                      key={m._id}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(`/matches/${encodeURIComponent(m._id)}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/matches/${encodeURIComponent(m._id)}`);
                        }
                      }}
                      className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9d4300]/60 focus-visible:ring-offset-2"
                    >
                      <td className="py-3 pl-4 text-zinc-600 whitespace-nowrap">
                        {formatMatchDate(m.date)}
                      </td>

                      <td className="py-3 text-zinc-900">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-zinc-100">
                            {getTeamLogo(m.homeTeam) ? (
                              <Image
                                src={getTeamLogo(m.homeTeam)!}
                                alt={getTeamName(m.homeTeam)}
                                fill
                                className="object-cover"
                                sizes="28px"
                                unoptimized
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[11px] font-medium text-zinc-600">
                                {getTeamName(m.homeTeam).charAt(0)}
                              </span>
                            )}
                          </div>
                          <span className="truncate max-w-[260px]">{getTeamName(m.homeTeam)}</span>
                        </div>
                      </td>

                      <td className="py-3 text-center font-semibold text-zinc-900 tabular-nums">
                        <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 border border-zinc-200">
                          {formatScore(m)}
                        </span>
                      </td>

                      <td className="py-3 pr-4 text-zinc-900">
                        <div className="flex items-center justify-end gap-2 min-w-0">
                          <span className="truncate max-w-[260px] text-right">
                            {getTeamName(m.awayTeam)}
                          </span>
                          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-zinc-100">
                            {getTeamLogo(m.awayTeam) ? (
                              <Image
                                src={getTeamLogo(m.awayTeam)!}
                                alt={getTeamName(m.awayTeam)}
                                fill
                                className="object-cover"
                                sizes="28px"
                                unoptimized
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[11px] font-medium text-zinc-600">
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
        </div>
      </div>
    </div>
  );
}

