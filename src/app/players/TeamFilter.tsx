"use client";

import type { Team } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

type Props = {
  teams: Team[];
  selectedTeamId?: string;
};

export default function TeamFilter({ teams, selectedTeamId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTeamId = selectedTeamId ?? "";

  const options = useMemo(
    () =>
      teams
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((t) => ({ value: t._id, label: t.name })),
    [teams],
  );

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <div className="min-w-[220px]">
        <select
          id="teamId"
          value={currentTeamId}
          onChange={(e) => {
            const next = new URLSearchParams(searchParams.toString());
            const value = e.target.value;

            if (!value) next.delete("teamId");
            else next.set("teamId", value);

            const qs = next.toString();
            router.push(qs ? `/players?${qs}` : "/players");
          }}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-400"
        >
          <option value="">ყველა კლუბი</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

