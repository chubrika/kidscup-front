"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import type {
  Category,
  StandingsGroup,
  StandingRow,
  StandingRowTeamRef,
  Team,
} from "@/lib/api";
import { API_URL } from "@/lib/api";
import { CategoryTabs } from "@/components/CategoryTabs";
import type { Dispatch, SetStateAction } from "react";

type StandingsTableProps = {
  categories: Category[];
  selectedCategoryId?: string | null;
  onCategoryChange?: Dispatch<SetStateAction<string | null>>;
  seasonId?: string | null;
};

type EnrichedRow = StandingRow & {
  logo?: string;
  city?: string;
  coachName?: string;
};

type ViewTab = string; // groupId or '__overall__'

function buildCategoryQuery(
  categoryId: string | null,
  basePath: string,
  seasonId?: string | null,
  extra?: Record<string, string>
): string {
  const search = new URLSearchParams();
  if (categoryId) search.set("ageCategory", categoryId);
  if (seasonId) {
    if (basePath === "/teams") search.set("season", seasonId);
    else search.set("seasonId", seasonId);
  }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) search.set(k, v);
    }
  }
  const q = search.toString();
  return q ? `${API_URL}${basePath}?${q}` : `${API_URL}${basePath}`;
}

async function fetchStandings(
  categoryId: string | null,
  seasonId?: string | null,
  extra?: Record<string, string>
): Promise<StandingsGroup[]> {
  const url = buildCategoryQuery(categoryId, "/standings", seasonId, extra);
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error("Failed to fetch standings");
  return res.json();
}

async function fetchTeams(categoryId: string | null, seasonId?: string | null): Promise<Team[]> {
  const url = buildCategoryQuery(categoryId, "/teams", seasonId);
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error("Failed to fetch teams");
  return res.json();
}

function normalizeTeamId(teamId: StandingRow["teamId"]): string {
  const raw = typeof teamId === "string" ? teamId : (teamId as { _id?: string })._id;
  return String(raw);
}

function enrichStandings(standings: StandingRow[], teams: Team[]): EnrichedRow[] {
  const byId = new Map<string, Team>();
  for (const t of teams) {
    byId.set(String(t._id), t);
    const id = (t as { id?: string }).id;
    if (id) byId.set(String(id), t);
  }
  return standings.map((row) => {
    const id = normalizeTeamId(row.teamId);
    const team = byId.get(id) ?? byId.get(String(id));
    const populated: StandingRowTeamRef | null =
      typeof row.teamId === "object" ? row.teamId : null;
    return {
      ...row,
      teamId: id,
      teamName: row.teamName || populated?.name || team?.name || "",
      logo: team?.logo ?? populated?.logo,
      city: team?.city ?? populated?.city,
      coachName: team?.coachName ?? populated?.coachName,
    };
  });
}

const OVERALL_TAB = "__overall__";

export function StandingsTable({
  categories,
  selectedCategoryId: controlledCategoryId,
  onCategoryChange,
  seasonId,
}: StandingsTableProps) {
  const [internalCategoryId, setInternalCategoryId] = useState<string | null>(
    categories[0]?._id ?? null
  );
  const isControlled = controlledCategoryId !== undefined;
  const selectedCategoryId = isControlled ? (controlledCategoryId ?? null) : internalCategoryId;
  const setSelectedCategoryId: Dispatch<SetStateAction<string | null>> = isControlled
    ? (value) => {
        const next = typeof value === "function" ? value(controlledCategoryId ?? null) : value;
        onCategoryChange?.(next);
      }
    : setInternalCategoryId;

  const [standingsGroups, setStandingsGroups] = useState<StandingsGroup[]>([]);
  const [overallGroup, setOverallGroup] = useState<StandingsGroup | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>("");

  const groupTabs = useMemo(() => {
    return standingsGroups
      .filter((g) => g.scope !== "overall" && g.groupId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [standingsGroups]);

  useEffect(() => {
    if (groupTabs.length > 0 && !activeTab) {
      setActiveTab(groupTabs[0].groupId ?? "");
    }
    if (groupTabs.length > 0 && activeTab && activeTab !== OVERALL_TAB) {
      const exists = groupTabs.some((g) => g.groupId === activeTab);
      if (!exists) setActiveTab(groupTabs[0].groupId ?? "");
    }
  }, [groupTabs, activeTab]);

  const selectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setActiveTab("");
    setLoading(true);
    setError(null);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchStandings(selectedCategoryId, seasonId),
      fetchStandings(selectedCategoryId, seasonId, { scope: "overall" }),
      fetchTeams(selectedCategoryId, seasonId),
    ])
      .then(([groups, overallArr, t]) => {
        if (!cancelled) {
          setStandingsGroups(groups);
          setOverallGroup(overallArr[0] ?? null);
          setTeams(t);
        }
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId, seasonId]);

  const activeStandings: EnrichedRow[] = useMemo(() => {
    if (activeTab === OVERALL_TAB && overallGroup) {
      return enrichStandings(overallGroup.standings, teams);
    }
    const group = groupTabs.find((g) => g.groupId === activeTab) ?? groupTabs[0];
    if (!group) {
      const legacy = standingsGroups[0];
      return legacy ? enrichStandings(legacy.standings, teams) : [];
    }
    return enrichStandings(group.standings, teams);
  }, [activeTab, groupTabs, overallGroup, standingsGroups, teams]);

  const showGroupTabs = groupTabs.length > 0;

  return (
    <section className="rounded-md border border-zinc-200 bg-white overflow-hidden">
      {!isControlled && (
        <CategoryTabs
          categories={categories}
          value={selectedCategoryId}
          onChange={selectCategory}
          className="rounded-t-xl"
        />
      )}
      {showGroupTabs && (
        <div
          className="flex flex-wrap gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2"
          role="tablist"
          aria-label="ჯგუფის ფილტრი"
        >
          {groupTabs.map((g) => (
            <button
              key={g.groupId}
              type="button"
              role="tab"
              aria-selected={activeTab === g.groupId}
              onClick={() => setActiveTab(g.groupId ?? "")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors arial-caps ${
                activeTab === g.groupId
                  ? "bg-[#00306d] text-white"
                  : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
              }`}
            >
              {g.groupName}
            </button>
          ))}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === OVERALL_TAB}
            onClick={() => setActiveTab(OVERALL_TAB)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors arial-caps ${
              activeTab === OVERALL_TAB
                ? "bg-[#9d4300] text-white"
                : "bg-white text-zinc-600 border border-dashed border-zinc-300 hover:bg-zinc-100"
            }`}
          >
            საერთო სტატისტიკა
          </button>
        </div>
      )}
      {activeTab === OVERALL_TAB && (
        <p className="px-4 py-2 text-xs text-zinc-500 dejavu-sans border-b border-zinc-100">
          საერთო სტატისტიკა — ყველა ჯგუფის დასრულებული თამაშები ერთად; არ წყვეტს ჯგუფურ ადგილებს.
        </p>
      )}
      <div className="overflow-x-auto">
        {error && (
          <p className="p-4 text-red-600 text-sm">{error}</p>
        )}
        {loading && (
          <p className="p-4 text-zinc-500 text-sm">იტვირთება...</p>
        )}
        {!loading && !error && (
          <>
            {activeStandings.length === 0 ? (
              <p className="p-6 text-zinc-500 text-sm">
                ამ ჯგუფში ცხრილი ჯერ არ არის
              </p>
            ) : (
              <table className="w-full arial-caps text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-100/80 text-zinc-700">
                    <th className="w-10 py-3 pl-4 text-center font-semibold">#</th>
                    <th className="py-3 pl-2 pr-4 text-left font-semibold min-w-[200px]">
                      გუნდი
                    </th>
                    <th className="py-3 px-2 text-left font-semibold text-zinc-600 hidden sm:table-cell">
                      ქალაქი
                    </th>
                    <th className="py-3 px-2 text-left font-semibold text-zinc-600 hidden md:table-cell">
                      მწვრთნელი
                    </th>
                    <th className="w-12 py-3 text-center font-semibold" title="შეხვედრა">
                      თ
                    </th>
                    <th className="w-12 py-3 text-center font-semibold" title="მოგება">
                      მ
                    </th>
                    <th className="w-12 py-3 text-center font-semibold" title="წაგება">
                      წ
                    </th>
                    <th className="w-12 py-3 text-center font-semibold" title="ჩაგდებული ბურთები">
                      ჩ ბ
                    </th>
                    <th className="w-12 py-3 text-center font-semibold" title="მიღებული ბურთები">
                      მ ბ
                    </th>
                    <th className="w-12 py-3 text-center font-semibold" title="სხვაობა">
                      +/-
                    </th>
                    <th className="w-14 py-3 pr-4 text-center font-semibold text-[#00306d]">
                      ქ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeStandings.map((row, index) => (
                    <tr
                      key={normalizeTeamId(row.teamId)}
                      className="group border-b border-zinc-100 hover:bg-zinc-100/80"
                    >
                      <td className="py-3 pl-4 text-center text-zinc-600 font-medium">
                        {activeTab !== OVERALL_TAB && index < 4 ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-[#00306d] text-xs font-semibold text-white">
                            {index + 1}
                          </span>
                        ) : (
                          index + 1
                        )}
                      </td>
                      <td className="py-3 pl-2 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-200">
                            {row.logo ? (
                              <Image
                                src={row.logo}
                                alt=""
                                fill
                                className="object-cover transition-transform duration-200 ease-out group-hover:scale-110"
                                sizes="36px"
                                unoptimized
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-xs font-medium text-zinc-500">
                                {row.teamName.charAt(0)}
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-zinc-900">
                            {row.teamName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-zinc-600 hidden sm:table-cell">
                        {row.city ?? "—"}
                      </td>
                      <td className="py-3 px-2 text-zinc-600 hidden md:table-cell">
                        {row.coachName ?? "—"}
                      </td>
                      <td className="py-3 text-center text-zinc-700">{row.played}</td>
                      <td className="py-3 text-center text-zinc-700">{row.won}</td>
                      <td className="py-3 text-center text-zinc-700">{row.lost}</td>
                      <td className="py-3 text-center text-zinc-700">{row.pointsFor}</td>
                      <td className="py-3 text-center text-zinc-700">
                        {row.pointsAgainst}
                      </td>
                      <td className="py-3 text-center text-zinc-700">
                        <span
                          className={
                            row.pointsDiff > 0
                              ? "text-green-600"
                              : row.pointsDiff < 0
                                ? "text-red-600"
                                : ""
                          }
                        >
                          {row.pointsDiff > 0 ? "+" : ""}
                          {row.pointsDiff}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-center font-semibold text-[#fd7209]">
                        {row.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </section>
  );
}
