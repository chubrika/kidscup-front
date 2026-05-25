"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Radio } from "lucide-react";
import type { Category, Match, Team } from "@/lib/api";
import { API_URL } from "@/lib/api";
import type { MatchStats } from "@/lib/liveStats";
import { useLive } from "@/components/live/LiveProvider";
import { createSocket } from "@/lib/socket";

type LiveGamesSectionProps = {
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

function teamId(team: Match["homeTeam"]): string | null {
  if (!team) return null;
  if (typeof team === "string") return team;
  return team._id ?? null;
}

function formatScoreValue(value: number | null | undefined): string {
  return value != null ? String(value) : "–";
}

function scoresForMatch(
  match: Match,
  liveMatch: Match | null,
  liveStats: MatchStats | null
): { home: number | null; away: number | null } {
  if (liveMatch?._id === match._id && liveStats) {
    const homeTeamId = teamId(match.homeTeam);
    const awayTeamId = teamId(match.awayTeam);
    const home =
      homeTeamId != null
        ? (liveStats.teamScores.find((t) => t.teamId === homeTeamId)?.points ??
          match.scoreHome ??
          null)
        : (match.scoreHome ?? null);
    const away =
      awayTeamId != null
        ? (liveStats.teamScores.find((t) => t.teamId === awayTeamId)?.points ??
          match.scoreAway ??
          null)
        : (match.scoreAway ?? null);
    return { home, away };
  }
  return {
    home: match.scoreHome ?? null,
    away: match.scoreAway ?? null,
  };
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

function LiveMatchRow({
  match,
  liveMatch,
  liveStats,
}: {
  match: Match;
  liveMatch: Match | null;
  liveStats: MatchStats | null;
}) {
  const { home, away } = scoresForMatch(match, liveMatch, liveStats);

  return (
    <li>
      <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <div className="flex w-9 shrink-0 flex-col items-center justify-center gap-0.5 sm:w-10">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-40 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="text-[8px] font-bold uppercase tracking-wide text-red-600 sm:text-[9px]">
            live
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
          <TeamChip team={match.homeTeam} side="home" />

          <span className="shrink-0 rounded-full bg-green-700 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white sm:px-2.5 sm:text-xs">
            {formatScoreValue(home)}
            <span className="mx-0.5 font-normal text-white/70">:</span>
            {formatScoreValue(away)}
          </span>

          <TeamChip team={match.awayTeam} side="away" />
        </div>
      </div>
    </li>
  );
}

async function fetchLiveMatches(signal: AbortSignal): Promise<Match[]> {
  const search = new URLSearchParams();
  search.set("status", "live");
  const res = await fetch(`${API_URL}/matches?${search.toString()}`, {
    signal,
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

function matchCategoryId(match: Match): string | null {
  const cat = match.ageCategory;
  if (!cat) return null;
  return typeof cat === "string" ? cat : cat._id ?? null;
}

export function LiveGamesSection({ categories }: LiveGamesSectionProps) {
  const { liveMatch, liveStats } = useLive();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?._id ?? null
  );
  const [allLiveMatches, setAllLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const matches = selectedCategoryId
    ? allLiveMatches.filter((m) => matchCategoryId(m) === selectedCategoryId)
    : allLiveMatches;

  const loadMatches = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLiveMatches(signal);
      if (signal.aborted) return;
      setAllLiveMatches(data);
      if (data.length > 0) {
        const idsWithLive = new Set(
          data.map(matchCategoryId).filter((id): id is string => Boolean(id))
        );
        setSelectedCategoryId((prev) => {
          if (prev && idsWithLive.has(prev)) return prev;
          const firstWithLive = categories.find((c) => idsWithLive.has(c._id));
          return firstWithLive?._id ?? prev;
        });
      }
    } catch (e) {
      if (!signal.aborted && e instanceof Error && e.name !== "AbortError") {
        setError(e.message);
        setAllLiveMatches([]);
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [categories]);

  useEffect(() => {
    const controller = new AbortController();
    void loadMatches(controller.signal);
    return () => controller.abort();
  }, [loadMatches]);

  useEffect(() => {
    const socket = createSocket();
    const onChange = () => {
      const controller = new AbortController();
      void loadMatches(controller.signal);
      return () => controller.abort();
    };
    socket.on("matches:live-changed", onChange);
    return () => {
      socket.disconnect();
    };
  }, [loadMatches]);

  const hasAnyLive = allLiveMatches.length > 0;
  const showSection = loading || hasAnyLive || error;

  if (!showSection) return null;

  return (
    <section className="mb-6 sm:mb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center sm:h-8 sm:w-8">
            <Radio className="h-5 w-5 text-red-600 sm:h-6 sm:w-6" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-[#00112d] arial-caps sm:text-xl md:text-2xl">
            მიმდინარე თამაშები
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
                onClick={() => setSelectedCategoryId(cat._id)}
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

      <div className="mt-4 sm:mt-5">
        {error && (
          <p className="px-1 text-xs text-red-600 sm:text-sm">{error}</p>
        )}
        {loading && (
          <p className="px-1 text-xs text-zinc-500 sm:text-sm">იტვირთება...</p>
        )}
        {!loading && !error && hasAnyLive && matches.length === 0 && (
          <p className="px-1 text-xs text-zinc-500 sm:text-sm">
            ამ კატეგორიაში მიმდინარე მატჩები არ არის
          </p>
        )}
        {!loading && !error && matches.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <ul className="divide-y divide-zinc-100">
              {matches.map((m) => (
                <LiveMatchRow
                  key={m._id}
                  match={m}
                  liveMatch={liveMatch}
                  liveStats={liveStats}
                />
              ))}
            </ul>
          </div>
        )}

        {!loading && matches.length > 0 && (
          <div className="px-1 pt-2">
            <Link
              href="/live"
              className="inline-flex items-center dejavu-sans justify-center px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 sm:px-4 sm:py-2 sm:text-sm"
            >
              ცოცხალი ტრანსლაცია
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
