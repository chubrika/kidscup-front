import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getMatches,
  getPlayers,
  getTeamById,
  type Match,
  type MatchStatus,
  type Player,
} from "@/lib/api";

type PageParams = { id: string };

const STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: "დაგეგმილი",
  live: "მიმდინარე",
  finished: "დასრულებული",
  postponed: "გადადებული",
  cancelled: "გაუქმებული",
};

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

function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

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
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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
    const teamScore = isHome
      ? (match.scoreHome ?? null)
      : (match.scoreAway ?? null);
    const opponentScore = isHome
      ? (match.scoreAway ?? null)
      : (match.scoreHome ?? null);

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

function statusPillClasses(status: MatchStatus): string {
  switch (status) {
    case "live":
      return "text-emerald-700 arial-caps text-xs font-semibold";
    case "scheduled":
      return "text-sky-700 arial-caps text-xs font-semibold";
    case "finished":
      return "text-zinc-700 arial-caps text-xs font-semibold";
    case "postponed":
      return "text-amber-800 arial-caps text-xs font-semibold";
    case "cancelled":
      return "text-rose-700 arial-caps text-xs font-semibold";
    default:
      return "text-zinc-700 arial-caps text-xs font-semibold";
  }
}

function StatCard({
  label,
  value,
  subValue,
  className,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  className?: string;
}) {
  return (
    <div className={cn("px-2.5 py-2 sm:p-4", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60 sm:text-xs sm:tracking-wider">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold leading-tight text-white tabular-nums sm:mt-2 sm:text-2xl sm:leading-none">
        {value}
      </p>
      {subValue ? (
        <p className="mt-0.5 text-[10px] leading-snug text-white/50 dejavu-sans sm:mt-1 sm:text-xs sm:leading-normal">
          {subValue}
        </p>
      ) : null}
    </div>
  );
}

function EmptyCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-5">
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 text-sm text-zinc-600 dejavu-sans">{description}</p>
    </div>
  );
}

type RosterGroupKey = "PG" | "SG" | "SF" | "PF" | "C" | "OTHER";

const POSITION_LABELS: Record<Exclude<RosterGroupKey, "OTHER">, string> = {
  PG: "გამთამაშებელი",
  SG: "მსროლელი",
  SF: "მსუბუქი ფორვარდი",
  PF: "მძიმე ფორვარდი",
  C: "ცენტრი",
};

const POSITION_COLORS: Record<Exclude<RosterGroupKey, "OTHER">, string> = {
  PG: "#3b82f6",
  SG: "#22c55e",
  SF: "#a855f7",
  PF: "#f97316",
  C: "#ef4444",
};

const ROSTER_GROUPS: Array<{
  key: RosterGroupKey;
  title: string;
  color?: string;
}> = [
  { key: "PG", title: POSITION_LABELS.PG, color: POSITION_COLORS.PG },
  { key: "SG", title: POSITION_LABELS.SG, color: POSITION_COLORS.SG },
  { key: "SF", title: POSITION_LABELS.SF, color: POSITION_COLORS.SF },
  { key: "PF", title: POSITION_LABELS.PF, color: POSITION_COLORS.PF },
  { key: "C", title: POSITION_LABELS.C, color: POSITION_COLORS.C },
  { key: "OTHER", title: "სხვა" },
];

function normalizePos(pos?: string | null): string {
  return (pos ?? "").trim().toUpperCase();
}

function formatPosition(pos?: string | null): string {
  const p = normalizePos(pos);
  if (!p) return "—";
  return (POSITION_LABELS as Record<string, string>)[p] ?? p;
}

function positionBorderColor(pos?: string | null): string | undefined {
  const p = normalizePos(pos);
  return (POSITION_COLORS as Record<string, string>)[p] ?? undefined;
}

function rosterGroupForPosition(pos?: string | null): RosterGroupKey {
  const p = normalizePos(pos);
  if (!p) return "OTHER";
  if (p in POSITION_LABELS) return p as Exclude<RosterGroupKey, "OTHER">;
  return "OTHER";
}

function PlayerAvatar({ player }: { player: Player }) {
  if (player.photo) {
    return (
      <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-zinc-100 sm:h-14 sm:w-14">
        <Image
          src={player.photo}
          alt={`${player.firstName} ${player.lastName}`}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 sm:h-14 sm:w-14"
      aria-hidden="true"
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        className="opacity-80"
      >
        <path
          d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-4.14 0-7.5 2.52-7.5 5.625A1.875 1.875 0 0 0 6.375 21h11.25A1.875 1.875 0 0 0 19.5 19.875C19.5 16.77 16.14 14.25 12 14.25Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

function PlayerCard({ player }: { player: Player }) {
  const pos = formatPosition(player.position);
  return (
    <Link
      href={`/players/${player._id}`}
      className="group flex items-center gap-3 rounded-2xl  bg-white p-3 shadow-xs transition hover:border-zinc-300 hover:bg-zinc-50"
    >
      <div className="relative">
        <PlayerAvatar player={player} />
        <span className="absolute -bottom-1 -right-1 inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-[#0b1b36] px-2 text-xs font-semibold text-white shadow-sm tabular-nums ring-2 ring-white">
          {player.number ?? "—"}
        </span>
      </div>

      <div className="min-w-0">
        <p className="truncate dejavu-sans text-sm font-semibold text-zinc-900 group-hover:text-zinc-950">
          {player.firstName} {player.lastName}
        </p>
        <p
          className="mt-0.5 text-xs text-[#00306d] font-semibold dejavu-sans"
        >
          {pos}
        </p>
      </div>
    </Link>
  );
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

  const [team, players, matches] = await Promise.all([
    getTeamById(id),
    getPlayers(id),
    getMatches(),
  ]);

  if (!team) notFound();

  const games = buildTeamGames(team._id, matches);

  const gamesByStatus = games.reduce<Record<MatchStatus, TeamGameView[]>>(
    (acc, g) => {
      acc[g.match.status].push(g);
      return acc;
    },
    { live: [], scheduled: [], finished: [], postponed: [], cancelled: [] },
  );

  const finishedBucket = {
    status: "finished" as const,
    label: STATUS_LABELS.finished,
    games: gamesByStatus.finished,
  };

  const summary = buildSummary(games);
  const pointDiff = summary.pointsFor - summary.pointsAgainst;
  const avgFor = average(summary.pointsFor, summary.finishedGames);
  const avgAgainst = average(summary.pointsAgainst, summary.finishedGames);

  const liveGame = gamesByStatus.live[0] ?? null;
  const nextScheduled =
    gamesByStatus.scheduled
      .slice()
      .sort((a, b) => parseDateTime(a.match) - parseDateTime(b.match))
      .at(0) ?? null;
  const nextGame = liveGame ?? nextScheduled;

  const roster = players
    .slice()
    .sort((a, b) => (a.number ?? 999) - (b.number ?? 999));

  const rosterByGroup = roster.reduce<Record<RosterGroupKey, Player[]>>(
    (acc, p) => {
      acc[rosterGroupForPosition(p.position)].push(p);
      return acc;
    },
    { PG: [], SG: [], SF: [], PF: [], C: [], OTHER: [] },
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="overflow-hidden rounded-3xl">
        <header className="relative isolate overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#001a3a] via-[#003d82] to-[#fd7209]" />
          <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_top_left,rgba(255,255,255,0.6),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.35),transparent_45%)]" />
          <div className="relative px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/30 bg-white/10 ring-1 ring-white/10 sm:h-28 sm:w-28">
                  {team.logo ? (
                    <Image
                      src={team.logo}
                      alt={team.name}
                      fill
                      sizes="(max-width: 640px) 96px, 112px"
                      className="object-cover"
                      unoptimized
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white">
                      {team.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <nav className="flex items-center gap-2 text-xs text-white/75">
                    <Link className="transition hover:text-white" href="/teams">
                      კლუბები
                    </Link>
                    <span className="text-white/50">/</span>
                    <span className="truncate text-white/90">{team.name}</span>
                  </nav>
                  <h1 className="mt-2 truncate text-2xl font-semibold text-white sm:text-3xl">
                    {team.name}
                  </h1>
                  <p className="mt-1 dejavu-sans text-sm text-white/90">
                    {team.city || "—"} • {team.ageCategory?.name || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-0 overflow-hidden rounded-b-2xl border-t border-[#00306d] bg-[#00112d] lg:grid-cols-4">
          <StatCard
            className="border-b border-r border-white/10 lg:border-b-0"
            label="მოთამაშეები"
            value={players.length}
          />
          <StatCard
            className="border-b border-white/10 lg:border-r lg:border-b-0"
            label="სულ თამაშები"
            value={summary.totalGames}
            subValue={`დასრულებული: ${summary.finishedGames}`}
          />
          <StatCard
            className="border-r border-white/10"
            label="მოგება / წაგება"
            value={`${summary.wins} / ${summary.losses}`}
            subValue={`Record: ${summary.wins}-${summary.losses}`}
          />
          <StatCard
            label="საშ. ქულები"
            value={`${avgFor} / ${avgAgainst}`}
            subValue="ჩაგდებული / გაშვებული"
          />
        </section>

        <div className="grid gap-6 border-t border-zinc-200 py-6  lg:grid-cols-12">
          <main className="space-y-6 lg:col-span-4">
            <section>
              {!nextGame ? (
                <EmptyCard
                  title="მიმდინარე/დაგეგმილი თამაში არაა"
                  description="როცა მატჩი დაემატება, აქ გამოჩნდება დრო, ადგილი და მეტოქე."
                />
              ) : (
                <div className="relative overflow-hidden rounded-3xl shadow-xs">
                  <div className="relative rounded-2xl bg-white/85 p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full bg-[#fd7208]"
                          aria-hidden="true"
                        />
                        <span className="arial-caps py-1 text-xs font-semibold text-zinc-600">
                          შემდეგი თამაში
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-600">
                        {formatDate(nextGame.match.date)} •{" "}
                        {formatTime(nextGame.match.time)}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div
                        className={cn(
                          "flex items-center justify-center flex-col gap-3",
                          nextGame.isHome ? "justify-start" : "justify-end",
                        )}
                      >
                        {team.logo ? (
                          <Image
                            src={team.logo}
                            alt={team.name}
                            width={52}
                            height={52}
                            className="h-12 w-12 rounded-2xl bg-zinc-100 object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-sm font-semibold text-zinc-600">
                            {team.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div
                          className={cn(
                            "min-w-0",
                            nextGame.isHome ? "text-left" : "text-right",
                          )}
                        >
                          <p className="truncate text-sm dejavu-sans font-semibold text-zinc-700">
                            {team.name}
                          </p>
                        </div>
                      </div>

                      <div className="px-2 text-center">
                        <span className="flex items-center justify-center text-zinc-700 text-sm font-bold arial-caps">
                          VS
                        </span>
                      </div>

                      <div
                        className={cn(
                          "flex items-center justify-center flex-col gap-3",
                          nextGame.isHome ? "justify-end" : "justify-start",
                        )}
                      >
                        {nextGame.opponentLogo ? (
                          <Image
                            src={nextGame.opponentLogo}
                            alt={nextGame.opponentName}
                            width={52}
                            height={52}
                            className="h-12 w-12 rounded-2xl bg-zinc-100 object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-sm font-semibold text-zinc-600">
                            {nextGame.opponentName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div
                          className={cn(
                            "min-w-0",
                            nextGame.isHome ? "text-right" : "text-left",
                          )}
                        >
                          <p className="truncate text-sm dejavu-sans font-semibold text-zinc-700">
                            {nextGame.opponentName}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <span className="text-xs font-semibold dejavu-sans text-zinc-600">
                        {nextGame.match.location || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section>
              {finishedBucket.games.length === 0 ? (
                <EmptyCard
                  title="მატჩები არ მოიძებნა"
                  description="ამ კლუბისთვის მატჩები ჯერ არ არის დამატებული."
                />
              ) : (
                <div className="space-y-5">
                  {[finishedBucket].map((bucket) => (
                    <section
                      key={bucket.status}
                      className="rounded-2xl overflow-hidden shadow-xs"
                    >
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full py-1 text-xs font-semibold",
                              statusPillClasses(bucket.status),
                            )}
                          >
                            {bucket.label}
                          </span>
                        </div>
                      </div>

                      <ul className="divide-y divide-zinc-200">
                        {bucket.games.map((game) => (
                          <li key={game.match._id} className="p-4 bg-white rounded-xl mb-3">
                            <div className="flex gap-3 flex-row items-center justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-base font-semibold text-zinc-900">
                                    <span className="text-zinc-500">
                                      {game.isHome ? "VS" : "AT"}
                                    </span>{" "}
                                    {game.opponentName}
                                  </p>
                                </div>
                                <p className="mt-1 text-xs text-zinc-500">
                                  {formatDate(game.match.date)} 
                                </p>
                              </div>

                              <div className="flex items-center justify-between gap-3 sm:justify-end">
                                <div className="flex items-center gap-2">
                                  <span className="px-3 py-1.5 text-xl font-semibold text-black tabular-nums">
                                    {game.teamScore != null &&
                                    game.opponentScore != null
                                      ? `${game.teamScore} - ${game.opponentScore}`
                                      : "—"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </section>
          </main>

          <aside className="space-y-6 lg:col-span-8">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="arial-caps text-lg font-semibold text-zinc-900">
                  გუნდის შემადგენლობა
                </h2>
                <span className="rounded-full bg-[#00306d]/10 px-3 py-1 text-xs font-semibold text-[#00306d]">
                  {roster.length}
                </span>
              </div>

              {roster.length === 0 ? (
                <EmptyCard
                  title="მოთამაშეები არ მოიძებნა"
                  description="ამ გუნდს ჯერ არ აქვს დამატებული მოთამაშეები."
                />
              ) : (
                <div className="space-y-6">
                  {ROSTER_GROUPS.filter(
                    (g) => rosterByGroup[g.key].length > 0,
                  ).map((g) => (
                    <div key={g.key}>
                      <div className="mb-3 flex items-center gap-3 text-black">
                        <span className="inline-flex items-center pr-3 font-semibold py-0.5 text-sm text-[#9d4300] arial-caps">
                          {g.title}
                        </span>
                        <div className="h-px flex-1 bg-zinc-200/80" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {rosterByGroup[g.key].map((p) => (
                          <PlayerCard key={p._id} player={p} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
