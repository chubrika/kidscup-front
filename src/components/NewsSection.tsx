"use client";

import dynamic from "next/dynamic";
import type { News } from "@/lib/api";

type NewsSectionProps = {
  news: News[];
};

const NewsSectionClient = dynamic(() => import("./NewsSectionClient"), {
  ssr: false,
});

export function NewsSection({ news }: NewsSectionProps) {
  return <NewsSectionClient news={news} />;
}
