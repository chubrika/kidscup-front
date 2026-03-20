"use client";

import { useMemo } from "react";
import { useLive } from "@/components/live/LiveProvider";
import { toYouTubeEmbedUrl } from "@/lib/youtube";
import type { Match } from "@/lib/api";

function teamName(team: unknown): string {
  if (!team) return "TBD";
  if (typeof team === "string") return team;
  const anyTeam = team as { name?: unknown };
  return typeof anyTeam.name === "string" && anyTeam.name.trim() ? anyTeam.name : "TBD";
}

function teamId(team: Match["homeTeam"] | Match["awayTeam"] | null | undefined): string | null {
  if (!team) return null;
  if (typeof team === "string") return team;
  return typeof team._id === "string" && team._id ? team._id : null;
}

export function LivePageClient() {
  const { isLive, liveUrl, liveMatch, liveStats } = useLive();

  const homeTeamId = teamId(liveMatch?.homeTeam);
  const awayTeamId = teamId(liveMatch?.awayTeam);

  const embedUrl = useMemo(() => (isLive ? toYouTubeEmbedUrl(liveUrl) : null), [isLive, liveUrl]);

  if (!isLive) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-zinc-700">No live match right now</p>
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-zinc-700">Live stream link is unavailable.</p>
      </div>
    );
  }

  const src = `${embedUrl}?autoplay=1&mute=1&playsinline=1`;

  const homeScore = homeTeamId ? liveStats?.teamScores.find((t) => t.teamId === homeTeamId)?.points ?? 0 : 0;
  const awayScore = awayTeamId ? liveStats?.teamScores.find((t) => t.teamId === awayTeamId)?.points ?? 0 : 0;

  return (
    <div className="w-full max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="aspect-video w-full bg-black">
          <iframe
            className="h-full w-full"
            src={src}
            title="Kidscup Live Match"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>

        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {liveMatch ? `${teamName(liveMatch.homeTeam)} vs ${teamName(liveMatch.awayTeam)}` : "Kidscup Live"}
            </p>
            <p className="mt-1 text-sm text-zinc-700">
              {liveMatch
                ? `${homeScore} - ${awayScore}${liveMatch.location ? ` • ${liveMatch.location}` : ""}`
                : "Streaming now"}
            </p>
          </div>

          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center justify-center dejavu-sans rounded-lg bg-[#ff0033] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#cc0029] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00306d]/40"
          >
            უყურე YouTube-ზე
          </a>
        </div>
      </div>

      {liveStats ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <p className="text-sm font-semibold text-zinc-900">Live გუნდის ქულები</p>
            <p className="mt-1 text-xs text-zinc-500">მონაცემები ახლდება რეალურ დროში</p>
          </div>
          <div className="px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {teamName(liveMatch?.homeTeam)}
                </p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{homeScore}</p>
              </div>
              <div className="h-px w-full bg-zinc-200 sm:hidden" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {teamName(liveMatch?.awayTeam)}
                </p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{awayScore}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

