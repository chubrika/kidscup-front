"use client";

import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import type { Player } from "@/lib/api";
import { formatBirthDateDisplay, getPositionLabel } from "@/app/register-team/utils";

type AddedPlayersListProps = {
  players: Player[];
  editingPlayerId: string | null;
  onEdit: (player: Player) => void;
  onDelete: (playerId: string) => void;
};

export function AddedPlayersList({
  players,
  editingPlayerId,
  onEdit,
  onDelete,
}: AddedPlayersListProps) {
  return (
    <div className="mt-8 rounded-2xl border border-[#e8e2da]/90 bg-[#f8fafc] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="arial-caps text-base font-semibold text-zinc-900">დამატებული მოთამაშეები</h3>
        {players.length > 0 && (
          <span className="rounded-full bg-[#e8f2fc] px-3 py-1 text-sm font-medium text-[#fd7209] dejavu-sans">
            {players.length} მოთამაშე
          </span>
        )}
      </div>

      {players.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#e8e2da] bg-white/70 px-4 py-8 text-center text-sm text-zinc-500 dejavu-sans">
          მოთამაშეები ჯერ არ არის დამატებული.
        </p>
      ) : (
        <div className="space-y-3">
          {players.map((player) => (
            <article
              key={player._id}
              className={`flex items-center gap-4 rounded-2xl border bg-white p-3.5 shadow-sm transition ${
                editingPlayerId === player._id
                  ? "border-[#fd7209]/40 ring-2 ring-[#fd7209]/15"
                  : "border-[#e8e2da]"
              }`}
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#e8e2da] bg-[#eef4fc]">
                {player.photo ? (
                  <Image
                    src={player.photo}
                    alt={`${player.firstName} ${player.lastName}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400 dejavu-sans">
                    ფოტო
                  </span>
                )}
                <span className="absolute right-1 top-1 rounded-md bg-[#fd7209] px-1.5 py-0.5 text-[11px] font-bold text-white">
                  #{player.number}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="truncate text-base font-semibold text-zinc-900 dejavu-sans">
                  {player.firstName} {player.lastName}
                </h4>
                <p className="mt-1 text-sm text-zinc-500 dejavu-sans">
                  {getPositionLabel(player.position)} | {formatBirthDateDisplay(player.birthDate)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(player)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#4a5d73] transition hover:bg-[#eef4fc] hover:text-[#00306d]"
                  aria-label="მოთამაშის რედაქტირება"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(player._id)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="მოთამაშის წაშლა"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
