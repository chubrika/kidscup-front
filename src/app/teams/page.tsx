import Link from "next/link";
import Image from "next/image";
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="arial-caps text-2xl font-semibold text-zinc-900">კლუბები</h1>
        <p className="mt-2 dejavu-sans text-sm text-zinc-600">
          აირჩიე გუნდი და ნახე შემადგენლობა, სეზონის სტატისტიკა და თამაშების სრული ისტორია.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && teams.length === 0 && (
        <p className="dejavu-sans text-sm text-zinc-600">კლუბები ჯერ არ არის დამატებული.</p>
      )}

      {!error && teams.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <li key={team._id}>
              <Link
                href={`/teams/${team._id}`}
                className="group block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3 border-b border-zinc-200 bg-gradient-to-r from-[#00306d] to-[#004896] p-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/10">
                    {team.logo ? (
                      <Image
                        src={team.logo}
                        alt={team.name}
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="arial-caps text-lg font-semibold text-white">
                        {team.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-white">{team.name}</h2>
                    <p className="dejavu-sans text-sm text-white/85">{team.city || "—"}</p>
                  </div>
                </div>
                <div className="space-y-2 p-4 text-sm dejavu-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">მწვრთნელი</span>
                    <span className="max-w-[65%] truncate font-medium text-zinc-900">
                      {team.coachName || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">კატეგორია</span>
                    <span className="max-w-[65%] truncate font-medium text-zinc-900">
                      {team.ageCategory?.name || "—"}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
