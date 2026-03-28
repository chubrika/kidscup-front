"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, Match } from "@/lib/api";
import { API_URL } from "@/lib/api";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

type CalendarSectionProps = {
  categories: Category[];
};

function getTeamName(team: Match["homeTeam"]): string {
  if (!team) return "—";
  if (typeof team === "string") return team;
  return team.name ?? "—";
}

const GEORGIAN_MONTHS = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი",
];

const GEORGIAN_WEEKDAYS = [
  "კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი",
];

function formatUpcomingDateLabel(isoDateKey: string): string {
  const d = new Date(isoDateKey);
  if (Number.isNaN(d.getTime())) return isoDateKey;
  // Use UTC getters so SSR and client render the same label.
  const day = d.getUTCDate();
  const month = GEORGIAN_MONTHS[d.getUTCMonth()] ?? "";
  const weekday = GEORGIAN_WEEKDAYS[d.getUTCDay()] ?? "";
  return `${day} ${month}, ${weekday}`;
}

function formatUpcomingTimeLabel(match: Match): string {
  // Avoid locale/timezone differences between SSR and client hydration.
  // Prefer explicit HH:MM from the API; otherwise render a stable placeholder.
  const hhmm = match.time?.slice(0, 5);
  return hhmm && /^\d{2}:\d{2}$/.test(hhmm) ? hhmm : "—";
}

function matchDateTimeMs(match: Match): number {
  const d = new Date(match.date);
  const base = Number.isNaN(d.getTime()) ? 0 : d.getTime();
  const hhmm = match.time?.slice(0, 5) ?? "00:00";
  const [hh, mm] = hhmm.split(":").map((v) => Number(v));
  const extra = Number.isFinite(hh) && Number.isFinite(mm) ? (hh * 60 + mm) * 60_000 : 0;
  return base + extra;
}

export function CalendarSection({ categories }: CalendarSectionProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?._id ?? null
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

  const lastThree = useMemo(
    () => [...matches].sort((a, b) => matchDateTimeMs(b) - matchDateTimeMs(a)).slice(0, 3),
    [matches]
  );

  return (
    <section>
   <div className="flex justify-between items-center">
   <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center">
          <CalendarDays className="h-5 w-5 md:h-7 md:w-7 text-[#9d4300]" />
        </span>
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-[#00112d] dejavu-sans">
          დაგეგმილი თამაშები
        </h2>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="კატეგორიის ფილტრი">
        {categories.map((cat) => {
          const selected = selectedCategoryId === cat._id;
          return (
            <button
              key={cat._id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setSelectedCategoryId(cat._id)}
              className={`rounded-full cursor-pointer border px-3 py-1 text-xs font-medium arial-caps transition-colors ${
                selected
                  ? "border-[#00112d] bg-[#00112d] text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
   </div>

      <div className="mt-5 flex flex-col gap-4">
        {error && <p className="px-1 text-sm text-red-600">{error}</p>}
        {loading && <p className="px-1 text-sm text-zinc-500">იტვირთება...</p>}
        {!loading && !error && lastThree.length === 0 && (
          <p className="px-1 text-sm text-zinc-500">დასრულებული მატჩები არ არის</p>
        )}

        {!loading &&
          !error &&
          lastThree.map((m) => {
            const dateKey = (() => {
              const d = new Date(m.date);
              return Number.isNaN(d.getTime()) ? m.date : d.toISOString().slice(0, 10);
            })();
            const timeLabel = formatUpcomingTimeLabel(m);

            return (
              <div
                key={m._id}
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm"
              >
                <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[220px_1fr_170px]">
                  <div className="min-w-0">
                    <p className="arial-caps text-[11px] font-semibold tracking-widest text-[#9d4300]">
                      {formatUpcomingDateLabel(dateKey)}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-[#00112d]">
                      {timeLabel}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-6">
                    <div className="min-w-0 text-center">
                      <p className="text-lg font-semibold text-[#00112d] dejavu-sans truncate">
                        {getTeamName(m.homeTeam)}
                      </p>
                    </div>

                    <div className="flex h-8 w-12 items-center justify-center rounded-full bg-zinc-200 text-[12px] font-semibold text-zinc-600">
                      VS
                    </div>

                    <div className="min-w-0 text-center">
                      <p className="text-lg font-semibold text-[#00112d] dejavu-sans truncate">
                        {getTeamName(m.awayTeam)}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}

        {!loading && (
          <div className="px-1 pt-1">
            <Link
              href="/calendar"
              className="inline-flex items-center dejavu-sans justify-center px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              სრული კალენდარი
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
