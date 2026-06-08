"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import type { Category, StandingRow, StandingRowTeamRef, StandingsGroup, Team } from "@/lib/api";
import { API_URL } from "@/lib/api";
import Link from "next/link";

type EnrichedRow = StandingRow & { logo?: string };

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

async function fetchTeams(ageCategoryId: string | null): Promise<Team[]> {
  const url = ageCategoryId
    ? `${API_URL}/teams?ageCategory=${encodeURIComponent(ageCategoryId)}`
    : `${API_URL}/teams`;
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
    const team = byId.get(id);
    const populated: StandingRowTeamRef | null =
      typeof row.teamId === "object" ? row.teamId : null;
    return {
      ...row,
      teamId: id,
      teamName: row.teamName || populated?.name || team?.name || "",
      logo: team?.logo ?? populated?.logo,
    };
  });
}

export function StandingsSection({ categories }: StandingsSectionProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?._id ?? null
  );
  const [standingsGroups, setStandingsGroups] = useState<StandingsGroup[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const groupTabs = useMemo(
    () =>
      standingsGroups
        .filter((g) => g.scope !== "overall" && g.groupId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [standingsGroups]
  );

  const activeGroup = useMemo(() => {
    if (groupTabs.length > 0) {
      return groupTabs.find((g) => g.groupId === activeGroupId) ?? groupTabs[0] ?? null;
    }
    return standingsGroups[0] ?? null;
  }, [groupTabs, activeGroupId, standingsGroups]);

  const activeStandings = useMemo(
    () => (activeGroup ? enrichStandings(activeGroup.standings, teams) : []),
    [activeGroup, teams]
  );

  useEffect(() => {
    if (groupTabs.length === 0) {
      setActiveGroupId(null);
      return;
    }
    const exists = activeGroupId && groupTabs.some((g) => g.groupId === activeGroupId);
    if (!exists) setActiveGroupId(groupTabs[0].groupId ?? null);
  }, [groupTabs, activeGroupId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [groups, teamList] = await Promise.all([
        fetchStandings(selectedCategoryId),
        fetchTeams(selectedCategoryId),
      ]);
      if (!cancelled) {
        setStandingsGroups(groups);
        setTeams(teamList);
      }
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
    <section className="rounded-xl border border-zinc-200 bg-[#00112d] shadow-lg overflow-hidden">
      <div className="border-b border-white/10 px-3 py-2 flex items-center justify-between">
      <h2 className="text-md text-white dejavu-sans">ცხრილი</h2>
        <div className="flex flex-wrap justify-start gap-4" role="tablist" aria-label="კატეგორიის ფილტრი">
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              role="tab"
              aria-selected={selectedCategoryId === cat._id}
              onClick={() => {
                setSelectedCategoryId(cat._id);
                setActiveGroupId(null);
              }}
              className={`relative py-1 cursor-pointer text-xs font-medium transition-colors duration-200 arial-caps ${
                selectedCategoryId === cat._id
                  ? "text-white"
                  : "text-white/60 hover:text-white/80"
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
      {groupTabs.length > 1 && (
        <div className="border-b border-white/10 px-3 py-2">
          <div className="flex flex-wrap justify-start gap-3" role="tablist" aria-label="ჯგუფის ფილტრი">
            {groupTabs.map((group) => (
              <button
                key={group.groupId}
                type="button"
                role="tab"
                aria-selected={activeGroupId === group.groupId}
                onClick={() => setActiveGroupId(group.groupId ?? null)}
                className={`relative py-1 cursor-pointer text-xs font-medium transition-colors duration-200 arial-caps ${
                  activeGroupId === group.groupId
                    ? "text-[#fd7209]"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                {group.groupName ?? group.categoryName}
                {activeGroupId === group.groupId && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-[#fd7209]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        {error && (
          <p className="px-3 py-2.5 text-red-600 text-xs">{error}</p>
        )}
        {loading && (
          <p className="px-3 py-2.5 text-zinc-500 text-xs">იტვირთება...</p>
        )}
        {!loading && !error && (
          <>
            {!activeGroup ? (
              <p className="px-3 py-3 text-zinc-500 text-xs text-center">ამ კატეგორიაში ცხრილი ჯერ არ არის</p>
            ) : (
              <>
                <table className="w-full text-xs">
                  <thead className="dejavu-sans">
                    <tr className="border-b border-white/10 text-white">
                      <th className="w-6 py-3 pl-3 text-center font-normal">#</th>
                      <th className="min-w-0 py-3 pl-1.5 text-left font-normal">გუნდი</th>
                      <th className="w-7 py-3 text-center font-normal">თ</th>
                      <th className="w-7 py-3 text-center font-normal">ს</th>
                      <th className="w-8 py-3 pr-3 text-center font-normal">ქ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeStandings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 dejavu-sans text-center text-zinc-500 text-xs">
                          ცხრილი ცარიელია
                        </td>
                      </tr>
                    ) : (
                      activeStandings.map((row, index) => (
                        <tr
                          key={`${activeGroup.groupId ?? activeGroup.categoryId}-${normalizeTeamId(row.teamId)}`}
                          className="border-b border-white/10 hover:bg-white/5 transition-colors"
                        >
                          <td
                            className={`py-3 pl-3 text-center font-medium italic arial-caps tabular-nums ${
                              index === 0 ? "text-[#fd7209]" : "text-white/40"
                            }`}
                          >
                            {index + 1}
                          </td>
                          <td className="py-3 pl-1.5 font-medium text-white max-w-[160px]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-white/10">
                                {row.logo ? (
                                  <Image
                                    src={row.logo}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="20px"
                                    unoptimized
                                  />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center text-[9px] font-medium text-white/70">
                                    {row.teamName.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <span className="truncate dejavu-sans">{row.teamName}</span>
                            </div>
                          </td>
                          <td className="py-3 text-center text-white/40 tabular-nums">{row.played}</td>
                          <td className="py-3 text-center text-white/40 tabular-nums">{row.pointsDiff}</td>
                          <td
                            className={`py-3 pr-3 text-center font-semibold tabular-nums ${
                              index === 0 ? "text-[#fd7209]" : "text-white"
                            }`}
                          >
                            {row.points}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="px-3 py-3 flex justify-center border-t border-white/10">
                  <Link
                    href="/league"
                    className="px-4 py-2 text-white text-center bg-white/10 py-1 rounded-lg font-label text-[12px] font-normal hover:bg-white/20 transition-colors arial-caps tracking-widest"
                  >
                    სრული ცხრილი
                  </Link>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
 