"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, Match } from "@/lib/api";
import { API_URL } from "@/lib/api";
import { CategoryTabs } from "@/components/CategoryTabs";

type CalendarClientProps = {
  categories: Category[];
};

type MatchWithTeams = Match & {
  homeTeamName?: string;
  awayTeamName?: string;
};

type GroupedMatches = {
  dateKey: string;
  label: string;
  matches: MatchWithTeams[];
};

const GEORGIAN_MONTHS = [
  "იანვარი",
  "თებერვალი",
  "მარტი",
  "აპრილი",
  "მაისი",
  "ივნისი",
  "ივლისი",
  "აგვისტო",
  "სექტემბერი",
  "ოქტომბერი",
  "ნოემბერი",
  "დეკემბერი",
];

const GEORGIAN_WEEKDAYS = [
  "კვირა",
  "ორშაბათი",
  "სამშაბათი",
  "ოთხშაბათი",
  "ხუთშაბათი",
  "პარასკევი",
  "შაბათი",
];

function getTeamName(team: Match["homeTeam"]): string {
  if (!team) return "უცნობი გუნდი";
  if (typeof team === "string") return team;
  return team.name ?? "უცნობი გუნდი";
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const monthName = GEORGIAN_MONTHS[d.getMonth()] ?? "";
  const weekdayName = GEORGIAN_WEEKDAYS[d.getDay()] ?? "";
  return `${day} ${monthName}, ${weekdayName}`;
}

function formatTime(match: Match): string {
  if (match.time) return match.time.slice(0, 5);
  const d = new Date(match.date);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleTimeString("ka-GE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return "—";
}

function groupByDate(matches: MatchWithTeams[]): GroupedMatches[] {
  const byDate = new Map<string, MatchWithTeams[]>();

  for (const m of matches) {
    const d = new Date(m.date);
    const key = Number.isNaN(d.getTime())
      ? m.date
      : d.toISOString().slice(0, 10);
    const arr = byDate.get(key) ?? [];
    arr.push(m);
    byDate.set(key, arr);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, list]) => ({
      dateKey,
      label: formatDateLabel(dateKey),
      matches: [...list].sort((a, b) =>
        formatTime(a).localeCompare(formatTime(b))
      ),
    }));
}

export function CalendarClient({ categories }: CalendarClientProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?._id ?? null
  );
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const search = new URLSearchParams();
        search.set("status", "scheduled");
        if (selectedCategoryId) {
          search.set("ageCategory", selectedCategoryId);
        }

        const url = `${API_URL}/matches?${search.toString()}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error("შედეგების მიღება ვერ მოხერხდა");
        }
        const data = (await res.json()) as Match[];

        if (!cancelled) {
          const enriched: MatchWithTeams[] = data.map((m) => {
            const homeTeamName = getTeamName(m.homeTeam);
            const awayTeamName = getTeamName(m.awayTeam);
            return { ...m, homeTeamName, awayTeamName };
          });
          setMatches(enriched);
        }
      } catch (e) {
        if (!cancelled) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          setError(
            e instanceof Error ? e.message : "დაგეგმილი მატჩების ჩატვირთვა ვერ მოხერხდა"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedCategoryId]);

  const grouped = useMemo(() => groupByDate(matches), [matches]);

  const hasCategories = categories.length > 0;

  return (
    <section className="rounded-md bg-white overflow-hidden">
      {hasCategories && (
        <CategoryTabs
          categories={categories}
          value={selectedCategoryId}
          onChange={setSelectedCategoryId}
          className="rounded-t-xl"
        />
      )}

      <div className="p-4 sm:p-6 space-y-4">
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {loading && !error && (
          <div className="space-y-3">
            <div className="h-4 w-32 rounded-full bg-zinc-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-zinc-100 animate-pulse" />
              <div className="h-16 rounded-lg bg-zinc-100 animate-pulse" />
            </div>
          </div>
        )}

        {!loading && !error && grouped.length === 0 && (
          <p className="text-sm text-zinc-600">
            ამ კატეგორიაში დაგეგმილი მატჩები ჯერ არ არის.
          </p>
        )}

        {!loading && !error && grouped.length > 0 && (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.dateKey} className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-sm font-semibold text-zinc-900 arial-caps">
                    {group.label}
                  </h2>
                  <span className="text-xs text-zinc-500">
                    {group.matches.length} თამაში
                  </span>
                </div>

                <ul className="space-y-3">
                  {group.matches.map((match) => (
                    <li
                      key={match._id}
                      className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50/60 hover:bg-white transition"
                    >
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-zinc-50/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
                        <div className="flex items-center gap-3 text-sm text-zinc-700">
                          <div className="flex flex-col items-center justify-center rounded-md bg-white px-2 py-1.5 shadow-sm border border-zinc-200 min-w-[64px]">
                            <span className="text-[11px] uppercase tracking-wide text-zinc-500">
                              დრო
                            </span>
                            <span className="text-sm font-semibold text-zinc-900">
                              {formatTime(match)}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-zinc-900">
                              <span>{match.homeTeamName}</span>
                              <span className="text-[11px] font-normal text-zinc-400">
                                vs
                              </span>
                              <span>{match.awayTeamName}</span>
                            </div>
                            {match.location && (
                              <p className="text-xs text-zinc-500 mt-0.5">
                                {match.location}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs sm:text-sm">
                          {match.ageCategory && typeof match.ageCategory !== "string" && (
                            <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700">
                              {match.ageCategory.name}
                            </span>
                          )}
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide
                            bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            დაგეგმილი
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

