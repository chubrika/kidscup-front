"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { Category, Match, Team } from "@/lib/api";
import { API_URL } from "@/lib/api";
import { CategoryTabs } from "@/components/CategoryTabs";
import { MapPin } from "lucide-react";

type CalendarClientProps = {
  categories: Category[];
};

type GroupBlock = {
  groupKey: string;
  groupName: string;
  matches: Match[];
};

type DateGroup = {
  dateKey: string;
  label: string;
  groups: GroupBlock[];
  matchCount: number;
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

const UNGROUPED_KEY = "__ungrouped__";
const UNGROUPED_LABEL = "სხვა ჯგუფი";

function getTeam(team: Match["homeTeam"]): Team | null {
  if (!team || typeof team === "string") return null;
  return team;
}

function getTeamName(team: Match["homeTeam"]): string {
  if (!team) return "უცნობი გუნდი";
  if (typeof team === "string") return team;
  return team.name ?? "უცნობი გუნდი";
}

function getTeamLogo(team: Match["homeTeam"]): string | undefined {
  return getTeam(team)?.logo;
}

function getGroupInfo(match: Match): { key: string; name: string } {
  const g = match.group;
  if (!g) return { key: UNGROUPED_KEY, name: UNGROUPED_LABEL };
  if (typeof g === "string") return { key: g, name: UNGROUPED_LABEL };
  const key = g._id ?? g.name ?? UNGROUPED_KEY;
  const name = g.name?.trim() || UNGROUPED_LABEL;
  return { key, name };
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

function sortMatches(a: Match, b: Match): number {
  return formatTime(a).localeCompare(formatTime(b));
}

function groupByDateThenGroup(matches: Match[]): DateGroup[] {
  const byDate = new Map<string, Match[]>();

  for (const m of matches) {
    const d = new Date(m.date);
    const key = Number.isNaN(d.getTime()) ? m.date : d.toISOString().slice(0, 10);
    const arr = byDate.get(key) ?? [];
    arr.push(m);
    byDate.set(key, arr);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, dayMatches]) => {
      const byGroup = new Map<string, GroupBlock>();

      for (const match of dayMatches) {
        const { key, name } = getGroupInfo(match);
        const existing = byGroup.get(key);
        if (existing) {
          existing.matches.push(match);
        } else {
          byGroup.set(key, { groupKey: key, groupName: name, matches: [match] });
        }
      }

      const groups = Array.from(byGroup.values())
        .map((g) => ({
          ...g,
          matches: [...g.matches].sort(sortMatches),
        }))
        .sort((a, b) => {
          if (a.groupKey === UNGROUPED_KEY) return 1;
          if (b.groupKey === UNGROUPED_KEY) return -1;
          return a.groupName.localeCompare(b.groupName, "ka");
        });

      return {
        dateKey,
        label: formatDateLabel(dateKey),
        groups,
        matchCount: dayMatches.length,
      };
    });
}

function TeamLogo({
  name,
  logo,
  size = "md",
}: {
  name: string;
  logo?: string;
  size?: "sm" | "md";
}) {
  const box =
    size === "sm"
      ? "h-5 w-5 rounded-[4px] sm:h-6 sm:w-6"
      : "h-7 w-7 rounded-full sm:h-8 sm:w-8";
  const initial = size === "sm" ? "text-[9px]" : "text-[10px] sm:text-xs";

  return (
    <div className={`relative shrink-0 overflow-hidden bg-zinc-200 ${box}`}>
      {logo ? (
        <Image
          src={logo}
          alt=""
          fill
          className="object-cover"
          sizes={size === "sm" ? "20px" : "32px"}
          unoptimized
        />
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center font-semibold text-zinc-500 ${initial}`}
        >
          {name.charAt(0)}
        </span>
      )}
    </div>
  );
}

/** Flashscore-style row: crest left, name right */
function TeamLine({ team }: { team: Match["homeTeam"] }) {
  const name = getTeamName(team);
  const logo = getTeamLogo(team);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <TeamLogo name={name} logo={logo} size="sm" />
      <span className="min-w-0 truncate text-[13px] font-medium leading-tight text-zinc-900">
        {name}
      </span>
    </div>
  );
}

function TeamRow({
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
        isHome ? "justify-end" : "justify-start"
      }`}
    >
      {isHome ? (
        <>
          <span className="min-w-0 truncate text-right text-xs font-semibold text-wrap text-zinc-900 sm:text-sm">
            {name}
          </span>
          <TeamLogo name={name} logo={logo} />
        </>
      ) : (
        <>
          <TeamLogo name={name} logo={logo} />
          <span className="min-w-0 truncate text-left text-xs font-semibold text-zinc-900 sm:text-sm">
            {name}
          </span>
        </>
      )}
    </div>
  );
}

function MatchRow({ match }: { match: Match }) {
  const time = formatTime(match);

  return (
    <li className="px-3 py-3 sm:px-4 sm:py-3.5">
      {/* Mobile: time | stacked teams | location — one row */}
      <div className="flex items-center gap-3 sm:hidden">
        <span className="w-10 shrink-0 text-center text-xs font-semibold tabular-nums text-zinc-900">
          {time}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <TeamLine team={match.homeTeam} />
          <TeamLine team={match.awayTeam} />
        </div>

        {match.location && (
          <p className="flex max-w-[150px] shrink-0 items-center gap-1 text-[11px] text-zinc-500">
            <MapPin className="h-3 w-3 shrink-0 text-zinc-400" aria-hidden="true" />
            <span className="truncate text-wrap">{match.location}</span>
          </p>
        )}
      </div>

      {/* Desktop: horizontal home vs away */}
      <div className="hidden items-center gap-3 sm:flex">
        <span className="w-10 shrink-0 text-center text-sm font-semibold tabular-nums text-zinc-900">
          {time}
        </span>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamRow team={match.homeTeam} side="home" />
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
            vs
          </span>
          <TeamRow team={match.awayTeam} side="away" />
        </div>

        {match.location && (
          <p className="flex max-w-[140px] shrink-0 items-center gap-1 text-xs text-zinc-500 lg:max-w-[160px]">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
            <span className="truncate">{match.location}</span>
          </p>
        )}
      </div>
    </li>
  );
}

export function CalendarClient({ categories }: CalendarClientProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?._id ?? null
  );
  const [matches, setMatches] = useState<Match[]>([]);
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
          setMatches(data);
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

  const grouped = useMemo(() => groupByDateThenGroup(matches), [matches]);

  const hasCategories = categories.length > 0;

  return (
    <section className="overflow-hidden rounded-md bg-white">
      {hasCategories && (
        <CategoryTabs
          categories={categories}
          value={selectedCategoryId}
          onChange={setSelectedCategoryId}
          className="rounded-t-xl"
        />
      )}

      <div className="space-y-4 sm:p-6">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {loading && !error && (
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded-full bg-zinc-200" />
            <div className="space-y-2">
              <div className="h-20 animate-pulse rounded-lg bg-zinc-100 sm:h-16" />
              <div className="h-20 animate-pulse rounded-lg bg-zinc-100 sm:h-16" />
            </div>
          </div>
        )}

        {!loading && !error && grouped.length === 0 && (
          <p className="text-sm text-zinc-600">ამ კატეგორიაში დაგეგმილი მატჩები ჯერ არ არის.</p>
        )}

        {!loading && !error && grouped.length > 0 && (
          <div className="space-y-5 sm:space-y-6">
            {grouped.map((dateGroup) => (
              <div key={dateGroup.dateKey} className="space-y-3">
                <div className="flex items-baseline justify-between gap-2 px-0.5">
                  <h2 className="text-sm font-semibold text-zinc-900 arial-caps sm:text-base">
                    {dateGroup.label}
                  </h2>
                  <span className="text-xs text-zinc-500">
                    {dateGroup.matchCount} თამაში
                  </span>
                </div>

                <div className="space-y-4">
                  {dateGroup.groups.map((groupBlock) => (
                    <div key={`${dateGroup.dateKey}-${groupBlock.groupKey}`} className="space-y-2">
                      <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-[#9d4300] arial-caps sm:text-sm">
                        {groupBlock.groupName}
                      </h3>

                      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                        <ul className="divide-y divide-zinc-100">
                          {groupBlock.matches.map((match) => (
                            <MatchRow key={match._id} match={match} />
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
