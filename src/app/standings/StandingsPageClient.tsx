"use client";

import { useState } from "react";
import type { Category } from "@/lib/api";
import { CategoryTabs } from "@/components/CategoryTabs";
import { StandingsTable } from "@/components/StandingsTable";

type Props = { categories: Category[] };

export function StandingsPageClient({ categories }: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?._id ?? null
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
          ცხრილები
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          აირჩიეთ ჩემპიონატი და იხილეთ გუნდების ცხრილი
        </p>
      </div>

      <CategoryTabs
        categories={categories}
        value={selectedCategoryId}
        onChange={setSelectedCategoryId}
        className="rounded-t-xl border border-b-0 border-zinc-200 bg-white shadow-sm"
      />

      <StandingsTable
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={setSelectedCategoryId}
      />
    </div>
  );
}
