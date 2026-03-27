import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMatches, getMatchStats, getPlayerById, type Player } from "@/lib/api";
import Image from "next/image";

type PageParams = { id: string };

type AggregatedStats = {
  games: number;
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  fouls: number;
};

function getTeamName(teamRef: Player["teamId"]): string {
  if (!teamRef) return "Unknown Team";
  if (typeof teamRef === "string") return teamRef;
  return teamRef.name || "Unknown Team";
}

function getTeamHref(teamRef: Player["teamId"]): string {
  if (!teamRef) return "/teams";
  if (typeof teamRef === "string") return "/teams";
  const id = (teamRef as { _id?: string })._id;
  return id ? `/teams/${id}` : "/teams";
}

function getAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const m = now.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

function formatHeight(height?: number): string {
  if (!height || Number.isNaN(height)) return "-";
  return `${height} cm`;
}

function safeName(player: Player): string {
  return `${player.firstName ?? ""} ${player.lastName ?? ""}`.trim() || "Unknown Player";
}

function initials(player: Player): string {
  const first = (player.firstName ?? "").trim().charAt(0).toUpperCase();
  const last = (player.lastName ?? "").trim().charAt(0).toUpperCase();
  return `${first}${last}` || "P";
}

function emptyStats(): AggregatedStats {
  return {
    games: 0,
    points: 0,
    assists: 0,
    rebounds: 0,
    steals: 0,
    blocks: 0,
    fouls: 0,
  };
}

function average(total: number, games: number): string {
  if (!games) return "0.0";
  return (total / games).toFixed(1);
}

async function getPlayerAggregatedStats(playerId: string): Promise<AggregatedStats> {
  const matches = await getMatches();
  if (!matches.length) return emptyStats();

  const statsByMatch = await Promise.all(
    matches.map(async (match) => {
      try {
        return await getMatchStats(match._id);
      } catch {
        return null;
      }
    }),
  );

  const totals = emptyStats();
  for (const stats of statsByMatch) {
    if (!stats) continue;
    const line = stats.playerStats.find((row) => row.playerId === playerId);
    if (!line) continue;

    totals.games += 1;
    totals.points += line.points;
    totals.assists += line.assists;
    totals.rebounds += line.rebounds;
    totals.steals += line.steals;
    totals.blocks += line.blocks;
    totals.fouls += line.fouls;
  }
  return totals;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const player = await getPlayerById(id);
  if (!player) return { title: "Player Not Found | Kids Cup" };
  return {
    title: `${safeName(player)} | Kids Cup`,
    description: `${safeName(player)} profile, team info, and match stats.`,
  };
}

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;
  const player = await getPlayerById(id);

  if (!player) {
    notFound();
  }

  const [stats, age] = await Promise.all([getPlayerAggregatedStats(player._id), getAge(player.birthDate)]);
  const playerName = safeName(player);
  const teamName = getTeamName(player.teamId);
  const ppg = average(stats.points, stats.games);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#002554] via-[#003d82] to-[#fd7209]" />
          <div className="relative flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/30 bg-white/10 sm:h-28 sm:w-28">
                {player.photo ? (
                  <Image src={player.photo} alt={playerName} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white">
                    {initials(player)}
                  </div>
                )}
              </div>
              <div>
                <p className="arial-caps text-xs tracking-wider text-white/80">მოთამაშის პროფილი</p>
                <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">{playerName}</h1>
                <p className="mt-1 text-sm text-white/90">#{player.number} • {teamName}</p>
              </div>
            </div>
            <Link
              href={getTeamHref(player.teamId)}
              className="inline-flex w-fit dejavu-sans items-center rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              კლუბზე დაბრუნება
            </Link>
          </div>
        </div>

        <div className="grid gap-4 border-t border-zinc-200 dejavu-sans bg-zinc-50/60 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">ასაკი</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{age ?? "-"}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">სიმაღლე</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{formatHeight(player.height)}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">გუნდი</p>
            <p className="mt-2 truncate text-xl font-semibold text-zinc-900">{teamName}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">თამაშები</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{stats.games}</p>
          </div>
        </div>

        {/* <div className="border-t border-zinc-200 p-6 sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 arial-caps">სტატისტიკა</h2>
            <span className="rounded-full bg-[#00306d]/10 px-3 py-1 text-xs font-semibold text-[#00306d]">
              {ppg} PPG
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 dejavu-sans">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">ქულა</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">{stats.points}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">ასისტი</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">{stats.assists}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">მოხსნა</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">{stats.rebounds}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">ჩაჭრა</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">{stats.steals}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">ბლოკი</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">{stats.blocks}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">ჯარიმა</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">{stats.fouls}</p>
            </div>
          </div>
        </div> */}
      </section>
    </div>
  );
}
