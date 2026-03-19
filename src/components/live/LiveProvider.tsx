"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_URL, type Match } from "@/lib/api";
import type { MatchStats } from "@/lib/liveStats";
import { createSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export type LiveState = {
  isLive: boolean;
  liveUrl: string;
  liveMatch: Match | null;
  liveStats: MatchStats | null;
};

type LiveContextValue = LiveState & {
  setLiveState: React.Dispatch<React.SetStateAction<LiveState>>;
};

const LiveContext = createContext<LiveContextValue | null>(null);

function readManualLiveUrl(): string | null {
  // 1) Env override (recommended for dev/testing)
  const envUrl =
    typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_LIVE_URL as string | undefined) : undefined;
  if (typeof envUrl === "string" && envUrl.trim()) return envUrl.trim();

  // 2) Query-string override (handy for quick testing)
  if (typeof window !== "undefined") {
    const qsUrl = new URLSearchParams(window.location.search).get("liveUrl");
    if (qsUrl && qsUrl.trim()) return qsUrl.trim();
  }

  return null;
}

function pickStreamUrlFromMatch(m: Match): string | null {
  // Backend schema can evolve; try a few common field names.
  const anyMatch = m as unknown as Record<string, unknown>;
  const candidate =
    (typeof anyMatch.liveUrl === "string" && anyMatch.liveUrl) ||
    (typeof anyMatch.youtubeUrl === "string" && anyMatch.youtubeUrl) ||
    (typeof anyMatch.streamUrl === "string" && anyMatch.streamUrl) ||
    null;
  return candidate;
}

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const [state, setLiveState] = useState<LiveState>({
    isLive: false,
    liveUrl: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    liveMatch: null,
    liveStats: null,
  });

  useEffect(() => {
    let cancelled = false;
    let socket: Socket | null = null;
    let joinedMatchId: string | null = null;

    async function fetchStats(matchId: string): Promise<MatchStats | null> {
      try {
        const res = await fetch(`${API_URL}/matches/${encodeURIComponent(matchId)}/stats`, {
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        if (!res.ok) return null;
        return (await res.json()) as MatchStats;
      } catch {
        return null;
      }
    }

    async function refresh() {
      try {
        const manualUrl = readManualLiveUrl();
        if (manualUrl) {
          setLiveState({ isLive: true, liveUrl: manualUrl, liveMatch: null, liveStats: null });
          return;
        }

        const res = await fetch(`${API_URL}/matches?status=live`, {
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch live matches");

        const matches = (await res.json()) as Match[];
        if (cancelled) return;

        const isLive = matches.length > 0;
        const liveUrl = matches.map(pickStreamUrlFromMatch).find(Boolean) ?? "";
        const liveMatch = matches[0] ?? null;
        const matchId = liveMatch?._id ?? null;

        const liveStats = matchId ? await fetchStats(matchId) : null;

        setLiveState((prev) => ({
          isLive,
          // If backend doesn’t provide a URL yet, keep last known URL (so UI stays usable).
          liveUrl: liveUrl || prev.liveUrl,
          liveMatch,
          liveStats,
        }));

        if (matchId) {
          if (!socket) {
            socket = createSocket();
            socket.on("connect", () => {
              socket?.emit("match:join", { matchId });
              joinedMatchId = matchId;
            });
            socket.on("match:update", (payload: { matchId: string; stats: MatchStats }) => {
              if (payload.matchId !== matchId) return;
              setLiveState((prev) => ({ ...prev, liveStats: payload.stats }));
            });
          } else if (joinedMatchId !== matchId && socket.connected) {
            if (joinedMatchId) socket.emit("match:leave", { matchId: joinedMatchId });
            socket.emit("match:join", { matchId });
            joinedMatchId = matchId;
          }
        }
      } catch {
        if (cancelled) return;
        // If the API is unavailable, fail "closed" (hide badge / show offline message).
        setLiveState((prev) => ({ ...prev, isLive: false, liveMatch: null, liveStats: null }));
      }
    }

    refresh();
    const id = window.setInterval(refresh, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      if (socket && joinedMatchId) socket.emit("match:leave", { matchId: joinedMatchId });
      socket?.disconnect();
      socket = null;
    };
  }, []);

  const value = useMemo<LiveContextValue>(() => ({ ...state, setLiveState }), [state]);

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive() {
  const ctx = useContext(LiveContext);
  if (!ctx) {
    throw new Error("useLive must be used within <LiveProvider />");
  }
  return ctx;
}

