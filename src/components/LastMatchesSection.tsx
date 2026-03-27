"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, Match } from "@/lib/api";
import { API_URL } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";

type LastMatchesSectionProps = {
  categories: Category[];
};

const GEORGIAN_MONTHS = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი",
];

const GEORGIAN_WEEKDAYS = [
  "კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი",
];

function getTeamName(team: Match["homeTeam"]): string {
  if (!team) return "—";
  if (typeof team === "string") return team;
  return team.name ?? "—";
}

function getTeamLogo(team: Match["homeTeam"]): string | null {
  if (!team || typeof team === "string") return null;
  return team.logo ?? null;
}

function formatDateGeorgian(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  // Use UTC getters so SSR and client render the same day/month/weekday.
  const day = d.getUTCDate();
  const month = GEORGIAN_MONTHS[d.getUTCMonth()] ?? "";
  const weekday = GEORGIAN_WEEKDAYS[d.getUTCDay()] ?? "";
  return `${day} ${month}, ${weekday}`;
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

  const lastThreeMatches = useMemo(() => {
    const sorted = [...matches].sort((a, b) => {
      const ta = new Date(a.date).getTime();
      const tb = new Date(b.date).getTime();
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
      if (Number.isNaN(ta)) return 1;
      if (Number.isNaN(tb)) return -1;
      return tb - ta;
    });
    return sorted.slice(0, 3);
  }, [matches]);

  return (
    <section className="rounded-md border border-zinc-200 bg-white overflow-hidden">
      <div className="px-3 pt-3">
        <h2 className="text-sm font-semibold text-zinc-900 arial-caps">
          ბოლო თამაშები
        </h2>
      </div>
      <div className="border-b border-zinc-200 px-3 py-2">
        <div className="flex flex-wrap justify-start gap-4" role="tablist" aria-label="კატეგორიის ფილტრი">
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              role="tab"
              aria-selected={selectedCategoryId === cat._id}
              onClick={() => handleSelectCategory(cat._id)}
              className={`relative py-1 cursor-pointer text-xs font-medium transition-colors duration-200 arial-caps ${
                selectedCategoryId === cat._id ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
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
      <div className="px-3 py-3">
        {error && (
          <p className="py-2 text-[11px] text-red-600">{error}</p>
        )}
        {loading && (
          <p className="py-2 text-[11px] text-zinc-500">იტვირთება...</p>
        )}
        {!loading && !error && lastThreeMatches.length === 0 && (
          <p className="py-2 text-[11px] text-zinc-500">
            დასრულებული მატჩები არ არის
          </p>
        )}
        {!loading && !error && lastThreeMatches.length > 0 && (
          <div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {lastThreeMatches.map((m) => (
                <div
                  key={m._id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dejavu-sans"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-500">
                      {formatDateGeorgian(m.date)}
                    </span>
                  
                  </div>

                  <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-zinc-200">
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
                          <span className="flex h-full w-full items-center justify-center text-[10px] font-medium text-zinc-500">
                            {getTeamName(m.homeTeam).charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="min-w-0 truncate text-left text-[12px] font-medium text-zinc-900">
                        {getTeamName(m.homeTeam)}
                      </span>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-[#00306d] arial-caps px-2 py-0.5 text-[12px] text-white border border-[#00306d]/20 tracking-wide">
                      {formatScore(m)}
                    </span>
                    <div className="min-w-0 flex items-center justify-end gap-2">
                      <span className="min-w-0 truncate text-right text-[12px] font-medium text-zinc-900">
                        {getTeamName(m.awayTeam)}
                      </span>
                      <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-zinc-200">
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
                          <span className="flex h-full w-full items-center justify-center text-[10px] font-medium text-zinc-500">
                            {getTeamName(m.awayTeam).charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
