import { getPlayers, getTeams } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import TeamFilter from "./TeamFilter";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const selectedTeamIdRaw = sp.teamId;
  const selectedTeamId =
    typeof selectedTeamIdRaw === "string" ? selectedTeamIdRaw : undefined;

  let teams: Awaited<ReturnType<typeof getTeams>> = [];
  let players: Awaited<ReturnType<typeof getPlayers>> = [];
  let error: string | null = null;
  try {
    teams = await getTeams();
    players = await getPlayers(selectedTeamId);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load players";
  }

  const team = (p: (typeof players)[0]) =>
    typeof p.teamId === "object" && p.teamId !== null ? p.teamId : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900">მოთამაშეები</h1>
      {!error && teams.length > 0 && (
        <TeamFilter teams={teams} selectedTeamId={selectedTeamId} />
      )}
      {error && (
        <p className="mt-4 text-red-600">{error}</p>
      )}
      {!error && players.length === 0 && (
        <p className="mt-4 text-zinc-600">მოთამაშეები ჯერ არ არის.</p>
      )}
      {!error && players.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {players.map((player) => {
            const t = team(player);
            return (
              <li
                key={player._id}
                className="group relative overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm transition"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-50/70" />

                <div className="relative flex items-start justify-between gap-4 bg-gray-200">
                  <div className="min-w-0 px-4 py-2 h-[120px]">
                    <div className="flex h-full justify-between flex-col gap-1">
                      <div className="text-sm font-semibold text-zinc-900 ring-1 ring-zinc-200">
                        {player.number}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-md text-wrap font-semibold text-zinc-700 mb-2">
                          {player.firstName} {player.lastName}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-zinc-600">
                          {t?.logo ? (
                            <Image
                              src={t.logo}
                              alt={`${t.name ?? "Team"} logo`}
                              width={20}
                              height={20}
                              className="h-5 w-5 rounded-full object-contain"
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-zinc-100 ring-1 ring-zinc-200" />
                          )}
                          <span className="truncate">{t?.name ?? "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 w-[120px]">
                    {player.photo ? (
                      <Image
                        src={player.photo}
                        alt={`${player.firstName} ${player.lastName}`}
                        width={120}
                        height={120}
                        className="h-full w-full object-cover ring-1 ring-zinc-200"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center bg-zinc-100 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200">
                        —
                      </div>
                    )}
                  </div>
                </div>

                <ul className="rounded-md bg-zinc-50">
                  <li className="flex items-baseline justify-between gap-3 border-b border-zinc-200 px-4 py-2">
                    <span className="text-xs font-medium text-zinc-500">
                      პოზიცია
                    </span>
                    <span className="truncate text-sm text-zinc-900">
                      {player.position || "—"}
                    </span>
                  </li>
                  <li className="flex items-baseline justify-between gap-3 border-b border-zinc-200 px-4 py-2">
                    <span className="text-xs font-medium text-zinc-500">
                      ქალაქი
                    </span>
                    <span className="truncate text-sm text-zinc-900">
                      {t?.city || "—"}
                    </span>
                  </li>
                  <li className="flex items-baseline justify-center gap-3 p-4">
                    <button className="text-sm text-zinc-900">
                      <Link href={`/players/${player._id}`}>
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-900">
                          სრული პროფილი
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Link>
                    </button>
                  </li>
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
