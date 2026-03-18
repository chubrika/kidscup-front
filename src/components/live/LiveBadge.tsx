"use client";

import Link from "next/link";
import { useLive } from "@/components/live/LiveProvider";

export function LiveBadge() {
  const { isLive } = useLive();

  if (!isLive) return null;

  return (
    <Link
      href="/live"
      className="group inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-white/15 transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      aria-label="Watch live match"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-25 motion-reduce:hidden" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]" />
      </span>
      <span className="tracking-wide">LIVE</span>
    </Link>
  );
}

