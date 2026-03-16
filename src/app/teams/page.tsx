import { getTeams } from "@/lib/api";
import Image from "next/image";

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
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {teams.map((team) => (
            <li
              key={team._id}
              className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-4 "
            >
              <div className="flex flex-col w-full items-center justify-center gap-2 bg-[#225daa0d] p-4 rounded-xl">
              {team.logo && (
                <Image
                  src={team.logo}
                  alt={`${team.name} logo`}
                  width={100}
                  height={100}
                  className="mb-2 rounded object-contain rounded-full"
                />
              )}
              <span className="font-medium arial-caps text-lg text-zinc-900">{team.name}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
