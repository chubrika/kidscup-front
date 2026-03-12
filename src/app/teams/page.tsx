import { getTeams } from "@/lib/api";

export default async function TeamsPage() {
  let teams: Awaited<ReturnType<typeof getTeams>> = [];
  let error: string | null = null;
  try {
    teams = await getTeams();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load teams";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900">გუნდები</h1>
      {error && (
        <p className="mt-4 text-red-600">{error}</p>
      )}
      {!error && teams.length === 0 && (
        <p className="mt-4 text-zinc-600">გუნდები ჯერ არ არის.</p>
      )}
      {!error && teams.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {teams.map((team) => (
            <li
              key={team._id}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
            >
              {team.logo && (
                <img
                  src={team.logo}
                  alt=""
                  className="mb-2 h-12 w-12 rounded object-contain"
                />
              )}
              <h2 className="font-medium text-zinc-900">{team.name}</h2>
              {team.city && (
                <p className="mt-1 text-sm text-zinc-500">{team.city}</p>
              )}
              {team.ageCategory && (
                <p className="mt-1 text-sm text-zinc-500">
                  {typeof team.ageCategory === "object"
                    ? team.ageCategory.name
                    : team.ageCategory}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
