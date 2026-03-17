"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, Match } from "@/lib/api";
import { API_URL } from "@/lib/api";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

type LastMatchesSectionProps = {
  categories: Category[];
};

type GroupByDate = { dateKey: string; dateLabel: string; matches: Match[] };

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

function formatDateGeorgian(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = GEORGIAN_MONTHS[d.getMonth()] ?? "";
  const weekday = GEORGIAN_WEEKDAYS[d.getDay()] ?? "";
  return `${day} ${month}, ${weekday}`;
}

function formatScore(match: Match): string {
  if (match.scoreHome != null && match.scoreAway != null) {
    return `${match.scoreHome} – ${match.scoreAway}`;
  }
  return "–";
}

function groupMatchesByDate(matches: Match[], formatDateFn: (s: string) => string): GroupByDate[] {
  const byDate = new Map<string, Match[]>();
  for (const m of matches) {
    const d = new Date(m.date);
    const key = Number.isNaN(d.getTime()) ? m.date : d.toISOString().slice(0, 10);
    const list = byDate.get(key) ?? [];
    list.push(m);
    byDate.set(key, list);
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, list]) => ({
      dateKey,
      dateLabel: formatDateFn(dateKey),
      matches: list,
    }));
}

export function LastMatchesSection({ categories }: LastMatchesSectionProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const categoryId = categories[0]?._id ?? null;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const search = new URLSearchParams();
    search.set("status", "finished");
    if (categoryId) search.set("ageCategory", categoryId);
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
  }, [categoryId]);

  const groupedByDate = useMemo(
    () => groupMatchesByDate(matches, formatDateGeorgian),
    [matches]
  );

  return (
    <section className="rounded-md border border-zinc-200 bg-white overflow-hidden">
      <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-2">
        <h2 className="text-sm font-semibold text-zinc-900 arial-caps">
          ბოლო მატჩები
        </h2>
      </div>
      <div className="overflow-x-auto">
        {error && (
          <p className="px-3 py-2 text-[11px] text-red-600">{error}</p>
        )}
        {loading && (
          <p className="px-3 py-2 text-[11px] text-zinc-500">იტვირთება...</p>
        )}
        {!loading && !error && groupedByDate.length === 0 && (
          <p className="px-3 py-2 text-[11px] text-zinc-500">
            დასრულებული მატჩები არ არის
          </p>
        )}
        {!loading && !error && groupedByDate.length > 0 && (
          <div className="pb-2">
            {groupedByDate.map((group) => (
              <div key={group.dateKey} className="pt-3 first:pt-2">
                <div className="flex justify-center mb-2">
                  <span className="inline-flex items-center px-3 py-1 text-[12px] text-zinc-500 tracking-wide dejavu-sans">
                    {group.dateLabel}
                  </span>
                </div>
                <ul className="divide-y divide-zinc-200 border-t border-b border-zinc-200">
                  {group.matches.map((m) => (
                    <li
                      key={m._id}
                      className="px-3 py-1.5 hover:bg-zinc-50/80 arial-caps text-[11px]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate min-w-0 text-left text-[#00306d]">
                          {getTeamName(m.homeTeam)}
                        </span>
                        <span className="flex-shrink-0 bg-[#00306d] font-inherit text-sm items-center justify-center rounded-full border border-zinc-200 px-2 py-1 text-[11px] text-white tracking-wide">
                          {formatScore(m)}
                        </span>
                        <span className="font-medium text-sm truncate min-w-0 text-right text-[#00306d]">
                          {getTeamName(m.awayTeam)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <Link href="/results" className="flex justify-center items-center w-full pt-2">
              <span className="inline-flex items-center px-3 py-1 text-[12px] text-[#00306d] tracking-wide arial-caps">
                ყველა შედეგი
              </span>
              <ArrowRightIcon className="w-3.5 h-3.5 text-[#00306d]" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
