"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { Category, Group, Match, Season, Team } from "@/lib/api";
import { API_URL } from "@/lib/api";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

type CalendarSectionProps = {
  categories: Category[];
};

function getTeam(team: Match["homeTeam"]): Team | null {
  if (!team || typeof team === "string") return null;
  return team;
}

function getTeamName(team: Match["homeTeam"]): string {
  return getTeam(team)?.name ?? (typeof team === "string" ? team : "—");
}

function getTeamLogo(team: Match["homeTeam"]): string | undefined {
  return getTeam(team)?.logo;
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
  const day = d.getUTCDate();
  const month = GEORGIAN_MONTHS[d.getUTCMonth()] ?? "";
  const weekday = GEORGIAN_WEEKDAYS[d.getUTCDay()] ?? "";
  return `${day} ${month}, ${weekday}`;
}

function formatUpcomingTimeLabel(match: Match): string {
  const hhmm = match.time?.slice(0, 5);
  return hhmm && /^\d{2}:\d{2}$/.test(hhmm) ? hhmm : "—";
}

function matchDateKey(match: Match): string {
  const d = new Date(match.date);
  return Number.isNaN(d.getTime()) ? match.date : d.toISOString().slice(0, 10);
}

function matchDateTimeMs(match: Match): number {
  const d = new Date(match.date);
  const base = Number.isNaN(d.getTime()) ? 0 : d.getTime();
  const hhmm = match.time?.slice(0, 5) ?? "00:00";
  const [hh, mm] = hhmm.split(":").map((v) => Number(v));
  const extra = Number.isFinite(hh) && Number.isFinite(mm) ? (hh * 60 + mm) * 60_000 : 0;
  return base + extra;
}

function buildMatchesByDate(matches: Match[], limit: number): [string, Match[]][] {
  const upcoming = [...matches]
    .sort((a, b) => matchDateTimeMs(a) - matchDateTimeMs(b))
    .slice(0, limit);

  const byDate = new Map<string, Match[]>();
  for (const m of upcoming) {
    const key = matchDateKey(m);
    const list = byDate.get(key) ?? [];
    list.push(m);
    byDate.set(key, list);
  }
  return Array.from(byDate.entries());
}

function TeamChip({
  team,
  side,
}: {
  team: Match["homeTeam"];
  side: "home" | "away";
}) {
  const name = getTeamName(team);
  const logo = getTeamLogo(team);
  const isHome = side === "home";

  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 ${
        isHome ? "flex-row-reverse justify-start" : "flex-row justify-start"
      }`}
    >
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-zinc-200 sm:h-8 sm:w-8">
        {logo ? (
          <Image
            src={logo}
            alt=""
            fill
            className="object-cover"
            sizes="32px"
            unoptimized
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-zinc-500 sm:text-xs">
            {name.charAt(0)}
          </span>
        )}
      </div>
      <span
        className={`min-w-0 truncate text-wrap text-xs font-semibold text-[#00112d] dejavu-sans sm:text-sm ${
          isHome ? "text-right" : "text-left"
        }`}
      >
        {name}
      </span>
    </div>
  );
}

const MAX_MATCHES_PER_GROUP = 8;

async function fetchScheduledMatches(
  categoryId: string,
  seasonId: string | null,
  groupId: string,
  signal: AbortSignal
): Promise<Match[]> {
  const search = new URLSearchParams();
  search.set("status", "scheduled");
  search.set("ageCategory", categoryId);
  if (seasonId) search.set("seasonId", seasonId);
  search.set("groupId", groupId);

  const res = await fetch(`${API_URL}/matches?${search.toString()}`, { signal });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

function EmptyScheduledMatches({ groupName }: { groupName?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-gradient-to-b from-zinc-50/80 to-white px-6 py-10 text-center sm:py-12">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#9d4300]/10 ring-1 ring-[#9d4300]/15 sm:mb-4 sm:h-14 sm:w-14">
        <CalendarDays className="h-6 w-6 text-[#9d4300] sm:h-7 sm:w-7" />
      </div>
      <p className="text-sm font-semibold text-[#00112d] dejavu-sans sm:text-base">
        დაგეგმილი მატჩები არ არის
      </p>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-zinc-500 sm:text-sm">
        {groupName
          ? `„${groupName}"-ში ჯერ არაფერია დაგეგმილი. სცადეთ სხვა ჯგუფი ან გადაამოწმეთ მოგვიანებით.`
          : "ამ კატეგორიაში ჯერ არაფერია დაგეგმილი. გადაამოწმეთ მოგვიანებით."}
      </p>
    </div>
  );
}

function GroupCalendarBlock({
  groupName,
  matchesByDate,
}: {
  groupName?: string;
  matchesByDate: [string, Match[]][];
}) {
  const hasMatches = matchesByDate.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {!hasMatches && <EmptyScheduledMatches groupName={groupName} />}

      {matchesByDate.map(([dateKey, dayMatches]) => (
        <div
          key={dateKey}
          className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
        >
          <div className="border-b border-zinc-100 bg-zinc-50/80 px-3 py-2 sm:px-4">
            <p className="arial-caps text-[10px] font-semibold tracking-wide text-[#9d4300] sm:text-[11px]">
              {formatUpcomingDateLabel(dateKey)}
            </p>
          </div>

          <ul className="divide-y divide-zinc-100">
            {dayMatches.map((m) => (
              <li key={m._id}>
                <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
                  <span className="w-9 shrink-0 text-center text-xs font-semibold tabular-nums text-[#00112d] sm:w-10 sm:text-sm">
                    {formatUpcomingTimeLabel(m)}
                  </span>

                  <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
                    <TeamChip team={m.homeTeam} side="home" />

                    <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-500 sm:px-2 sm:text-[10px]">
                      vs
                    </span>

                    <TeamChip team={m.awayTeam} side="away" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function CalendarSection({ categories }: CalendarSectionProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?._id ?? null
  );
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [matchesByDate, setMatchesByDate] = useState<[string, Match[]][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [groups]
  );

  const activeGroup = useMemo(
    () => sortedGroups.find((g) => g._id === activeGroupId) ?? sortedGroups[0] ?? null,
    [sortedGroups, activeGroupId]
  );

  useEffect(() => {
    if (sortedGroups.length === 0) {
      setActiveGroupId(null);
      return;
    }
    const exists = activeGroupId && sortedGroups.some((g) => g._id === activeGroupId);
    if (!exists) setActiveGroupId(sortedGroups[0]._id);
  }, [sortedGroups, activeGroupId]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    if (!selectedCategoryId) {
      setSelectedSeasonId(null);
      setGroups([]);
      return () => controller.abort();
    }

    const url = `${API_URL}/seasons?ageCategory=${encodeURIComponent(selectedCategoryId)}`;
    fetch(url, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Season[]) => {
        if (cancelled) return;
        const sorted = [...data].sort((a, b) => {
          const ta = a.startDate ? Date.parse(a.startDate) : 0;
          const tb = b.startDate ? Date.parse(b.startDate) : 0;
          return tb - ta;
        });
        const active = sorted.find((s) => s.isActive) ?? sorted[0];
        setSelectedSeasonId(active?._id ?? null);
      })
      .catch(() => {
        if (!cancelled) setSelectedSeasonId(null);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedCategoryId]);

  useEffect(() => {
    let cancelled = false;

    if (!selectedCategoryId || !selectedSeasonId) {
      setGroups([]);
      return;
    }

    setGroups([]);

    const url = `${API_URL}/groups?seasonId=${encodeURIComponent(selectedSeasonId)}&ageCategory=${encodeURIComponent(selectedCategoryId)}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Group[]) => {
        if (!cancelled) setGroups(data);
      })
      .catch(() => {
        if (!cancelled) setGroups([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId, selectedSeasonId]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    if (!selectedCategoryId || !activeGroup) {
      setMatchesByDate([]);
      setLoading(false);
      setError(null);
      return () => controller.abort();
    }

    setLoading(true);
    setError(null);

    fetchScheduledMatches(
      selectedCategoryId,
      selectedSeasonId,
      activeGroup._id,
      controller.signal
    )
      .then((matches) => {
        if (!cancelled) {
          setMatchesByDate(buildMatchesByDate(matches, MAX_MATCHES_PER_GROUP));
        }
      })
      .catch((e) => {
        if (!cancelled && e.name !== "AbortError") {
          setError(e instanceof Error ? e.message : "Error");
          setMatchesByDate([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedCategoryId, selectedSeasonId, activeGroup]);

  return (
    <section>
      <div className="flex gap-3 flex-row sm:items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center sm:h-8 sm:w-8">
            <CalendarDays className="h-5 w-5 text-[#9d4300] sm:h-6 sm:w-6" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-[#00112d] arial-caps sm:text-xl md:text-lg">
            დაგეგმილი თამაშები
          </h2>
        </div>

        <div
          className="flex flex-wrap gap-1.5 sm:justify-end"
          role="tablist"
          aria-label="კატეგორიის ფილტრი"
        >
          {categories.map((cat) => {
            const selected = selectedCategoryId === cat._id;
            return (
              <button
                key={cat._id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setSelectedCategoryId(cat._id);
                  setActiveGroupId(null);
                }}
                className={`rounded-full cursor-pointer border px-2.5 py-0.5 text-[11px] font-medium arial-caps transition-colors sm:px-3 sm:py-1 sm:text-xs ${
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

      {sortedGroups.length > 1 && (
        <div className="mt-3 pb-2 sm:mt-4">
          <div
            className="flex flex-wrap justify-start gap-3"
            role="tablist"
            aria-label="ჯგუფის ფილტრი"
          >
            {sortedGroups.map((group) => (
              <button
                key={group._id}
                type="button"
                role="tab"
                aria-selected={activeGroupId === group._id}
                onClick={() => setActiveGroupId(group._id)}
                className={`relative py-1 cursor-pointer text-xs font-medium transition-colors duration-200 arial-caps ${
                  activeGroupId === group._id
                    ? "text-[#9d4300]"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {group.name}
                {activeGroupId === group._id && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-[#9d4300]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-6 sm:mt-5 sm:gap-8">
        {error && <p className="px-1 text-xs text-red-600 sm:text-sm">{error}</p>}
        {loading && (
          <p className="px-1 text-xs text-zinc-500 sm:text-sm">იტვირთება...</p>
        )}
        {!loading && !error && sortedGroups.length === 0 && (
          <p className="px-1 text-xs text-zinc-500 sm:text-sm">
            ჯგუფები არ მოიძებნა
          </p>
        )}
        {!loading && !error && activeGroup && (
          <GroupCalendarBlock
            groupName={activeGroup.name}
            matchesByDate={matchesByDate}
          />
        )}

        {!loading && (
          <div className="px-1 pt-0.5">
            <Link
              href="/calendar"
              className="inline-flex items-center dejavu-sans justify-center px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 sm:px-4 sm:py-2 sm:text-sm"
            >
              სრული კალენდარი
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
