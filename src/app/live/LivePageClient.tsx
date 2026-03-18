"use client";

import { useMemo } from "react";
import { useLive } from "@/components/live/LiveProvider";
import { toYouTubeEmbedUrl } from "@/lib/youtube";

function teamName(team: unknown): string {
  if (!team) return "TBD";
  if (typeof team === "string") return team;
  const anyTeam = team as { name?: unknown };
  return typeof anyTeam.name === "string" && anyTeam.name.trim() ? anyTeam.name : "TBD";
}

export function LivePageClient() {
  const { isLive, liveUrl, liveMatch } = useLive();

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
                ? `${liveMatch.scoreHome ?? 0} - ${liveMatch.scoreAway ?? 0}${liveMatch.location ? ` • ${liveMatch.location}` : ""}`
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
    </div>
  );
}

