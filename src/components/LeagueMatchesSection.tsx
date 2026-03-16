"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { Category, Match, Season } from "@/lib/api";
import { API_URL } from "@/lib/api";
import { ChevronDownIcon } from "lucide-react";

type LeagueMatchesSectionProps = {
  category: Category;
};

const GEORGIAN_MONTHS = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი",
];

function getTeamName(team: Match["homeTeam"]): string {
  if (!team) return "—";
  if (typeof team === "string") return team;
  return team.name ?? "—";
}

function formatDateGeorgian(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = GEORGIAN_MONTHS[d.getMonth()] ?? "";
  return `${day} ${month}`;
}

function formatTime(match: Match): string {
  if (match.time) return match.time.slice(0, 5);
  const d = new Date(match.date);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" });
  }
  return "—";
}

function formatScore(match: Match): string {
  if (match.scoreHome != null && match.scoreAway != null) {
    return `${match.scoreHome} – ${match.scoreAway}`;
  }
  return "–";
}

function formatStatus(status: Match["status"]): string {
  const map: Record<Match["status"], string> = {
    scheduled: "დაგეგმილი",
    live: "პირდაპირ",
    finished: "დასრულებული",
    postponed: "გადავადებული",
    cancelled: "გაუქმებული",
  };
  return map[status] ?? status;
}

export function LeagueMatchesSection({ category }: LeagueMatchesSectionProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const url = `${API_URL}/seasons?ageCategory=${encodeURIComponent(category._id)}`;
    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch seasons");
        return res.json();
      })
      .then((data: Season[]) => {
        if (!cancelled) {
          setSeasons(data);
          if (data.length > 0) {
            setSelectedSeasonId((prev) => (prev === null ? data[0]._id : prev));
          }
        }
      })
      .catch((e) => {
        if (!cancelled && e.name !== "AbortError") setSeasons([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSeasons(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [category._id]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const search = new URLSearchParams();
    search.set("ageCategory", category._id);
    if (selectedSeasonId) search.set("seasonId", selectedSeasonId);
    const url = `${API_URL}/matches?${search.toString()}`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch matches");
        return res.json();
      })
      .then((data: Match[]) => {
        if (!cancelled) setMatches(data);
      })
      .catch(() => {
        if (!cancelled) setMatches([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMatches(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [category._id, selectedSeasonId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedSeason = useMemo(
    () => seasons.find((s) => s._id === selectedSeasonId),
    [seasons, selectedSeasonId]
  );

  const displayLabel = selectedSeason?.name ?? "ყველა სეზონი";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dejavu-sans">
          მატჩები
        </h2>
        <div className="flex justify-end" ref={dropdownRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              disabled={loadingSeasons}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#00306d]/20 disabled:opacity-60 arial-caps"
            >
              <span>{loadingSeasons ? "იტვირთება..." : displayLabel}</span>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 z-10 mt-1 w-56 origin-top-right rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSeasonId(null);
                    setDropdownOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm arial-caps ${
                    selectedSeasonId === null
                      ? "bg-[#00306d]/10 text-[#00306d] font-medium"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  ყველა სეზონი
                </button>
                {seasons.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => {
                      setSelectedSeasonId(s._id);
                      setDropdownOpen(false);
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm arial-caps ${
                      selectedSeasonId === s._id
                        ? "bg-[#00306d]/10 text-[#00306d] font-medium"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {loadingMatches ? (
        <p className="py-8 text-center text-zinc-500 arial-caps">იტვირთება...</p>
      ) : matches.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 py-8 text-center text-zinc-600 arial-caps">
          მატჩები არ მოიძებნა
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => (
            <article
              key={m._id}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                  <span className="text-[11px] text-zinc-500 dejavu-sans">
                    {formatDateGeorgian(m.date)}
                  </span>
                  {m.time && (
                    <span className="text-[11px] text-zinc-500 dejavu-sans">
                      {formatTime(m)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-medium text-zinc-900 arial-caps">
                    {getTeamName(m.homeTeam)}
                  </span>
                  <span className="flex-shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dejavu-sans">
                    {m.status === "finished"
                      ? formatScore(m)
                      : formatStatus(m.status)}
                  </span>
                  <span className="min-w-0 truncate text-right text-sm font-medium text-zinc-900 arial-caps">
                    {getTeamName(m.awayTeam)}
                  </span>
                </div>
                {m.location && (
                  <p className="text-[11px] text-zinc-500 arial-caps">
                    {m.location}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
