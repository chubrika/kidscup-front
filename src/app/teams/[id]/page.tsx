import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMatches, getPlayers, getTeamById, type Match, type MatchStatus } from "@/lib/api";

type PageParams = { id: string };

const STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: "დაგეგმილი",
  live: "მიმდინარე",
  finished: "დასრულებული",
  postponed: "გადადებული",
  cancelled: "გაუქმებული",
};

const STATUS_ORDER: MatchStatus[] = ["live", "scheduled", "finished", "postponed", "cancelled"];

type TeamGameView = {
  match: Match;
  isHome: boolean;
  opponentName: string;
  opponentLogo?: string;
  teamScore: number | null;
  opponentScore: number | null;
};

type TeamSummary = {
  totalGames: number;
  finishedGames: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
};

function teamRefId(team: Match["homeTeam"]): string | null {
  if (!team) return null;
  if (typeof team === "string") return team;
  return team._id || null;
}

function teamRefName(team: Match["homeTeam"]): string {
  if (!team) return "Unknown Team";
  if (typeof team === "string") return team;
  return team.name || "Unknown Team";
}

function teamRefLogo(team: Match["homeTeam"]): string | undefined {
  if (!team || typeof team === "string") return undefined;
  return team.logo;
}

function parseDateTime(match: Match): number {
  const date = new Date(match.date);
  const base = Number.isNaN(date.getTime()) ? 0 : date.getTime();
  const hhmm = match.time?.slice(0, 5) ?? "00:00";
  const [hh, mm] = hhmm.split(":").map((v) => Number(v));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return base;
  return base + (hh * 60 + mm) * 60_000;
}

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("ka-GE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function formatTime(time?: string): string {
  if (!time) return "-";
  return time.slice(0, 5);
}

function buildTeamGames(teamId: string, matches: Match[]): TeamGameView[] {
  const games: TeamGameView[] = [];

  for (const match of matches) {
    const homeId = teamRefId(match.homeTeam);
    const awayId = teamRefId(match.awayTeam);
    const isHome = homeId === teamId;
    const isAway = awayId === teamId;

    if (!isHome && !isAway) continue;

    const opponent = isHome ? match.awayTeam : match.homeTeam;
    const teamScore = isHome ? match.scoreHome ?? null : match.scoreAway ?? null;
    const opponentScore = isHome ? match.scoreAway ?? null : match.scoreHome ?? null;

    games.push({
      match,
      isHome,
      opponentName: teamRefName(opponent),
      opponentLogo: teamRefLogo(opponent),
      teamScore,
      opponentScore,
    });
  }

  return games.sort((a, b) => parseDateTime(b.match) - parseDateTime(a.match));
}

function buildSummary(games: TeamGameView[]): TeamSummary {
  const summary: TeamSummary = {
    totalGames: games.length,
    finishedGames: 0,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  };

  for (const game of games) {
    if (game.match.status !== "finished") continue;
    if (game.teamScore == null || game.opponentScore == null) continue;

    summary.finishedGames += 1;
    summary.pointsFor += game.teamScore;
    summary.pointsAgainst += game.opponentScore;
    if (game.teamScore > game.opponentScore) summary.wins += 1;
    if (game.teamScore < game.opponentScore) summary.losses += 1;
  }

  return summary;
}

function average(value: number, total: number): string {
  if (!total) return "0.0";
  return (value / total).toFixed(1);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const team = await getTeamById(id);
  if (!team) return { title: "Team Not Found | Kids Cup" };

  return {
    title: `${team.name} | Kids Cup`,
    description: `${team.name} club detail page with members, stats, and match statuses.`,
  };
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;

  const [team, players, matches] = await Promise.all([getTeamById(id), getPlayers(id), getMatches()]);

  if (!team) notFound();

  const games = buildTeamGames(team._id, matches);
  const grouped = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    games: games.filter((g) => g.match.status === status),
  })).filter((g) => g.games.length > 0);

  const summary = buildSummary(games);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#002554] via-[#003d82] to-[#fd7209]" />
          <div className="relative flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/30 bg-white/10 sm:h-28 sm:w-28">
                {team.logo ? (
                  <Image
                    src={team.logo}
                    alt={team.name}
                    fill
                    sizes="(max-width: 640px) 96px, 112px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white">
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="arial-caps text-xs tracking-wider text-white/80">კლუბის პროფილი</p>
                <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">{team.name}</h1>
                <p className="mt-1 dejavu-sans text-sm text-white/90">
                  {team.city || "—"} • {team.ageCategory?.name || "—"}
                </p>
              </div>
            </div>
            <Link
              href="/teams"
              className="inline-flex w-fit items-center rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              კლუბების სია
            </Link>
          </div>
        </div>

        <div className="grid gap-4 border-t border-zinc-200 bg-zinc-50/60 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">მოთამაშეები</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{players.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">სულ თამაშები</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{summary.totalGames}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">მოგება / წაგება</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">
              {summary.wins} / {summary.losses}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">საშ. ჩაგდებული ქულა</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">
              {average(summary.pointsFor, summary.finishedGames)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 border-t border-zinc-200 p-6 sm:p-8 lg:grid-cols-12">
          <section className="lg:col-span-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="arial-caps text-lg font-semibold text-zinc-900">შემადგენლობა</h2>
              <span className="rounded-full bg-[#00306d]/10 px-3 py-1 text-xs font-semibold text-[#00306d]">
                {players.length}
              </span>
            </div>
            {players.length === 0 ? (
              <p className="text-sm text-zinc-600 dejavu-sans">გუნდის მოთამაშეები არ მოიძებნა.</p>
            ) : (
              <ul className="space-y-2">
                {players
                  .slice()
                  .sort((a, b) => (a.number ?? 999) - (b.number ?? 999))
                  .map((player) => (
                    <li key={player._id}>
                      <Link
                        href={`/players/${player._id}`}
                        className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 transition hover:bg-zinc-100"
                      >
                        <span className="truncate text-sm font-medium text-zinc-800">
                          {player.firstName} {player.lastName}
                        </span>
                        <span className="ml-3 rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-zinc-700">
                          #{player.number ?? "-"}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          <section className="lg:col-span-8">
            <h2 className="arial-caps mb-3 text-lg font-semibold text-zinc-900">თამაშები სტატუსებით</h2>
            {grouped.length === 0 ? (
              <p className="text-sm text-zinc-600 dejavu-sans">ამ კლუბისთვის თამაშები არ მოიძებნა.</p>
            ) : (
              <div className="space-y-5">
                {grouped.map((bucket) => (
                  <article key={bucket.status} className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                        {bucket.label}
                      </h3>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700">
                        {bucket.games.length}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {bucket.games.map((game) => (
                        <li key={game.match._id} className="rounded-xl border border-zinc-200 bg-white p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs text-zinc-500">
                                {formatDate(game.match.date)} • {formatTime(game.match.time)} •{" "}
                                {game.match.location || "Unknown location"}
                              </p>
                              <p className="mt-1 truncate font-semibold text-zinc-900">
                                {game.isHome ? "VS" : "AT"} {game.opponentName}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {game.opponentLogo ? (
                                <Image
                                  src={game.opponentLogo}
                                  alt={game.opponentName}
                                  width={28}
                                  height={28}
                                  className="h-7 w-7 rounded bg-zinc-100 object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="h-7 w-7 rounded bg-zinc-100" />
                              )}
                              <span className="rounded-md border border-zinc-200 px-2 py-1 text-sm font-semibold text-[#00306d] tabular-nums">
                                {game.teamScore != null && game.opponentScore != null
                                  ? `${game.teamScore} - ${game.opponentScore}`
                                  : "—"}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
