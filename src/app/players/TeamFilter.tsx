"use client";

import type { Team } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

type Props = {
  teams: Team[];
  selectedTeamId?: string;
};

export default function TeamFilter({ teams, selectedTeamId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = useMemo(
    () =>
      teams
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((t) => ({ value: t._id, label: t.name, logo: t.logo })),
    [teams]
  );

  const selected =
    options.find((o) => o.value === selectedTeamId)?.label || "ყველა კლუბი";

  function selectTeam(value: string) {
    const next = new URLSearchParams(searchParams.toString());

    if (!value) next.delete("teamId");
    else next.set("teamId", value);

    const qs = next.toString();
    router.push(qs ? `/players?${qs}` : "/players");

    setOpen(false);
  }

  // click outside handler
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative mt-4 w-[260px]">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm hover:border-zinc-400"
      >
        <span className="arial-caps">{selected}</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
          <div
            onClick={() => selectTeam("")}
            className="cursor-pointer arial-caps px-4 py-2 text-sm hover:bg-zinc-100"
          >
            ყველა კლუბი
          </div>

          {options.map((o) => (
            <div
              key={o.value}
              onClick={() => selectTeam(o.value)}
              className="cursor-pointer flex items-center gap-2 arial-caps px-4 py-2 text-sm hover:bg-zinc-100"
            >
              {o.logo && <Image src={o.logo} alt={o.label} width={20} height={20} className="rounded-full" unoptimized />}
              <span className="text-md font-medium">{o.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}