"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TABS = [
  { key: "photo", label: "ფოტო" },
  { key: "video", label: "ვიდეო" },
] as const;

export default function MediaPage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "video" ? "video" : "photo";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="rounded-md border border-zinc-200 bg-white overflow-hidden">
        <div className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-4 py-3">
          <h1 className="arial-caps text-sm font-semibold tracking-wide text-zinc-800">მედია</h1>
        </div>

        <div className="border-b border-zinc-200 px-4 py-3">
          <div className="inline-flex rounded-md border border-zinc-200 p-1">
            {TABS.map(({ key, label }) => {
              const isActive = tab === key;
              return (
                <Link
                  key={key}
                  href={key === "photo" ? "/media?tab=photo" : "/media?tab=video"}
                  className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-[#00306d] text-white" : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {tab === "photo" ? (
            <p className="text-sm text-zinc-600">ფოტო კონტენტი აქ გამოჩნდება.</p>
          ) : (
            <p className="text-sm text-zinc-600">ვიდეო კონტენტი აქ გამოჩნდება.</p>
          )}
        </div>
      </section>
    </div>
  );
}
