import { getPlayers, getTeams } from "@/lib/api";
import TeamFilter from "./TeamFilter";
import PlayersListClient from "./PlayersListClient";

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900 arial-caps">მოთამაშეები</h1>
      {!error && teams.length > 0 && (
        <TeamFilter teams={teams} selectedTeamId={selectedTeamId} />
      )}
      {error && (
        <p className="mt-4 text-red-600">{error}</p>
      )}
      {!error && players.length === 0 && (
        <p className="mt-4 text-zinc-600">მოთამაშეები ჯერ არ არის.</p>
      )}
      {!error && players.length > 0 && <PlayersListClient players={players} />}
    </div>
  );
}
