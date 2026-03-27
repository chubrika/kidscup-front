"use client";

import { useState, useEffect } from "react";
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
};

type EnrichedRow = StandingRow & {
  logo?: string;
  city?: string;
  coachName?: string;
};

function buildCategoryQuery(categoryId: string | null, basePath: string): string {
  if (!categoryId) return `${API_URL}${basePath}`;
  const encoded = encodeURIComponent(categoryId);
  return `${API_URL}${basePath}?ageCategory=${encoded}`;
}

async function fetchStandings(categoryId: string | null): Promise<StandingsGroup[]> {
  const url = buildCategoryQuery(categoryId, "/standings");
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error("Failed to fetch standings");
  return res.json();
}

async function fetchTeams(categoryId: string | null): Promise<Team[]> {
  const url = buildCategoryQuery(categoryId, "/teams");
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

export function StandingsTable({
  categories,
  selectedCategoryId: controlledCategoryId,
  onCategoryChange,
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
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setLoading(true);
    setError(null);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchStandings(selectedCategoryId),
      fetchTeams(selectedCategoryId),
    ])
      .then(([s, t]) => {
        if (!cancelled) {
          setStandingsGroups(s);
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
  }, [selectedCategoryId]);

  const allRows: EnrichedRow[] = standingsGroups.flatMap((g) =>
    enrichStandings(g.standings, teams)
  );

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
      <div className="overflow-x-auto">
        {error && (
          <p className="p-4 text-red-600 text-sm">{error}</p>
        )}
        {loading && (
          <p className="p-4 text-zinc-500 text-sm">იტვირთება...</p>
        )}
        {!loading && !error && (
          <>
            {allRows.length === 0 ? (
              <p className="p-6 text-zinc-500 text-sm">
                ამ კატეგორიაში ცხრილი ჯერ არ არის
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
                  {allRows.map((row, index) => (
                    <tr
                      key={normalizeTeamId(row.teamId)}
                      className="group border-b border-zinc-100 hover:bg-zinc-100/80"
                    >
                      <td className="py-3 pl-4 text-center text-zinc-600 font-medium">
                        {index + 1}
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
