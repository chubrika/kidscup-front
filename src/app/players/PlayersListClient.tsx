"use client";

import { useState } from "react";
import Image from "next/image";

const POSITION_LABELS: Record<string, string> = {
  PG: "გამთამაშებელი",
  SG: "მსროლელი",
  SF: "მსუბუქი ფორვარდი",
  PF: "მძიმე ფორვარდი",
  C: "ცენტრი",
};

const POSITION_COLORS: Record<string, string> = {
  PG: "#3b82f6", // blue-500
  SG: "#22c55e", // green-500
  SF: "#a855f7", // purple-500
  PF: "#f97316", // orange-500
  C: "#ef4444", // red-500
};

function formatPosition(position?: string | null) {
  if (!position) return "—";
  return POSITION_LABELS[position] ?? position;
}

function positionBorderColor(position?: string | null) {
  if (!position) return undefined;
  return POSITION_COLORS[position] ?? undefined;
}

type Player = {
  _id: string;
  number?: number | string;
  firstName?: string;
  lastName?: string;
  position?: string | null;
  photo?: string | null;
  birthDate?: string | null;
  teamId?: string | Team | null;
};

type Team = {
  name?: string;
  city?: string;
  logo?: string; 
  coachName?: string;
  ageCategory?: { _id: string; name?: string };
  createdAt?: string;
};

function getTeam(p: Player): Team | null {
  return typeof p.teamId === "object" && p.teamId !== null ? p.teamId : null;
}

const TABS: { id: string; label: string }[] = [
  { id: "ALL", label: "ყველა" },
  { id: "PG", label: POSITION_LABELS.PG },
  { id: "SG", label: POSITION_LABELS.SG },
  { id: "SF", label: POSITION_LABELS.SF },
  { id: "PF", label: POSITION_LABELS.PF },
  { id: "C", label: POSITION_LABELS.C },
];

export default function PlayersListClient({ players }: { players: Player[] }) {
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const renderPlayerCard = (player: Player) => {
    const t = getTeam(player);

    return (
      <li
        key={player._id}
        className="group relative overflow-hidden rounded-md border border-zinc-200 transition"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-50/70" />

        <div className="relative flex items-start justify-between overflow-hidden gap-4 bg-gray-200">
          <div className="min-w-0 px-4 py-2 h-[120px]">
            <div className="flex h-full justify-between flex-col gap-1">
              <div className="text-sm font-semibold text-zinc-900 ring-1 ring-zinc-200 px-2">
                {player.number}
              </div>

              <div className="truncate arial-caps text-sm font-semibold text-zinc-700 mb-2 text-wrap">
                {player.firstName} {player.lastName}
              </div>
            </div>
          </div>

          <div className="shrink-0 w-[120px]">
            <Image
              src={player.photo || "/avatar.png"}
              alt={`${player.firstName} ${player.lastName}`}
              width={120}
              height={120}
              className="h-full w-full object-cover ring-1 ring-zinc-200"
            />
          </div>
        </div>

        <ul className="rounded-md bg-zinc-50 dejavu-sans">
          <li className="flex justify-between border-b border-zinc-200 px-4 py-2">
            <span className="text-xs font-semibold text-zinc-700">გუნდი</span>
            <span className="text-sm font-semibold text-zinc-900">{t?.name ?? "—"}</span>
          </li>

          <li className="flex justify-between border-b border-zinc-200 px-4 py-2">
            <span className="text-xs font-semibold text-zinc-700">პოზიცია</span>
            <span
              className="inline-flex items-center rounded-full font-semibold py-0.5 text-xs text-black"
              style={{
                color: positionBorderColor(player.position),
                paddingLeft: 8,
              }}
            >
              {formatPosition(player.position)}
            </span>
          </li>

          <li className="flex justify-between border-b border-zinc-200 px-4 py-2">
            <span className="text-xs font-semibold text-zinc-700">ქალაქი</span>
            <span className="text-sm text-zinc-900">{t?.city || "—"}</span>
          </li>

          <li className="flex justify-between px-4 py-2">
            <span className="text-xs font-semibold text-zinc-700">
              დაბ. თარიღი
            </span>
            <span className="text-sm text-zinc-900">
              {player.birthDate
                ? new Date(player.birthDate).toLocaleDateString("ka-GE")
                : "—"}
            </span>
          </li>
        </ul>
      </li>
    );
  };

  const renderAllGrouped = () => {
    return (
      <div className="mt-6 space-y-8">
        {Object.keys(POSITION_LABELS).map((positionKey) => {
          const playersForPosition = players.filter(
            (player) => player.position === positionKey
          );

          if (playersForPosition.length === 0) return null;

          return (
            <section key={positionKey}>
              <div className="mb-3 font-semibold arial-caps flex items-center gap-2 text-black">
                <span
                  className="inline-flex items-center font-semibold px-2 py-0.5 text-md text-black"
                  style={{
                    borderLeftWidth: 4,
                    borderLeftStyle: "solid",
                    borderLeftColor: positionBorderColor(positionKey),
                    paddingLeft: 8,
                  }}
                >
                  {formatPosition(positionKey)}
                </span>
              </div>

              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {playersForPosition.map(renderPlayerCard)}
              </ul>
            </section>
          );
        })}
      </div>
    );
  };

  const renderSinglePosition = (positionKey: string) => {
    const playersForPosition = players.filter(
      (player) => player.position === positionKey
    );

    if (playersForPosition.length === 0) {
      return (
        <p className="mt-6 text-sm text-zinc-600">
          ამ პოზიციაზე მოთამაშე არ არის.
        </p>
      );
    }

    return (
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {playersForPosition.map(renderPlayerCard)}
      </ul>
    );
  };

  return (
    <div className="mt-6">
      <div className="rounded-md bg-white p-1  flex flex-wrap gap-1.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative inline-flex items-center rounded-md  arial-caps cursor-pointer px-4 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/60 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-50 ${
                isActive
                  ? "bg-[#00306d] text-white shadow-sm"
                  : "bg-transparent text-zinc-600 hover:bg-white/80 hover:text-zinc-900"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "ALL"
        ? renderAllGrouped()
        : renderSinglePosition(activeTab)}
    </div>
  );
}