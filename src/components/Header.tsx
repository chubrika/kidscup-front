"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import type { Category } from "@/lib/api";
import { slugify } from "@/lib/utils";

type HeaderProps = {
  categories: Category[];
};

export function Header({ categories }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-[#00306d] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-white"
        >
          KidsCup
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-white">
          <Link
            href="/"
            className="transition-colors text-white"
          >
            მთავარი
          </Link>
          <Link
            href="/teams"
            className="transition-colors text-white"
          >
            გუნდები
          </Link>
          <Link
            href="/players"
            className="transition-colors text-white"
          >
            მოთამაშეები
          </Link>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-1 transition-colors text-white focus:outline-none  outline-none rounded"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              ჩემპიონატები
              <svg
                className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdownOpen && (
              <div
                className="absolute left-0 top-full mt-1 min-w-[180px] rounded-md border border-zinc-200 bg-white py-1 shadow-lg text-black"
                role="menu"
              >
                {categories.length === 0 ? (
                  <div className="px-3 py-2 text-black text-sm">No categories</div>
                ) : (
                  categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/league/${slugify(cat.name)}`}
                      className="block px-3 py-2 text-black hover:bg-zinc-100"
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
