"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/api";
import { slugify } from "@/lib/utils";
import Image from "next/image";
import { LiveBadge } from "@/components/live/LiveBadge";
import { PlusIcon } from "lucide-react";

const MAIN_NAV = [
  { href: "/", label: "მთავარი" },
  { href: "/news", label: "სიახლეები" },
  { href: "/photo", label: "ფოტო" },
  { href: "/video", label: "ვიდეო" },
] as const;

const SUB_NAV = [
  { href: "/teams", label: "კლუბები" },
  { href: "/players", label: "მოთამაშეები" },
  { href: "/standings", label: "ცხრილები" },
  { href: "/calendar", label: "კალენდარი" },
  { href: "/contact", label: "კონტაქტი" },
] as const;

const MOBILE_NAV = [
  { href: "/news", label: "სიახლეები" },
  { href: "/photo", label: "ფოტო" },
  { href: "/video", label: "ვიდეო" },
  { href: "/contact", label: "კონტაქტი" }
];

type HeaderProps = {
  categories: Category[];
};

export function Header({ categories }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setMobileMenuOpen(false);
      setMobileCategoriesOpen(false);
      setDropdownOpen(false);
    });
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-[#002554] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-white flex items-center justify-center h-[60px] pt-[4px] pb-[4px]"
          >
            <Image src="/kidsCupLogo.png" alt="KidsCup" width={60} height={60} className="h-full w-auto" />
          </Link>

          <Link href="/register-team" className="text-white dejavu-sans text-sm rounded-md px-2 py-1 border-2 transition-colors border-white/20 hover:text-white hover:border-[#fd7209]">
            <span className="flex items-center justify-center">
              <PlusIcon className="h-4 w-4 mr-1" />
              გუნდის რეგისტრაცია
            </span>
          </Link>
        </div>
        <nav className="hidden items-center h-full gap-6 text-md font-medium text-white arial-caps md:flex">
          {MAIN_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex relative h-full items-center justify-center transition-colors`}
            >
              {label}
              {pathname === href && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] min-h-[3px] bg-[#fd7209] rounded-t-full" />
              )}
            </Link>
          ))}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex cursor-pointer items-center gap-1 transition-colors text-white focus:outline-none  outline-none rounded"
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
                className="absolute left-0 top-[40px] mt-1 min-w-[130px] rounded-md border border-zinc-200 bg-white py-1 shadow-lg text-black"
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

        <div className="flex items-center gap-2 md:hidden">
          <LiveBadge />
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-white"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Subheader navigation */}
      <div className="hidden border-t border-white/20  md:block dejavu-sans">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-md font-medium text-white sm:px-6">
          <div className="flex items-center gap-8 md:gap-10">
            {SUB_NAV.map(({ href, label }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`transition-colors ${isActive ? "text-[#fd7209]" : "text-white/90 hover:text-white"}`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="flex-shrink-0">
            <LiveBadge />
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Close menu overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            id="mobile-nav"
            className="absolute left-0 right-0 top-16 z-50 border-b border-zinc-200 bg-[#00306d] md:hidden"
          >
            <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
              <div className="flex flex-col gap-1 text-sm font-medium text-white">
                {MOBILE_NAV.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded arial-caps px-2 py-2 hover:bg-white/10"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}

                <button
                  type="button"
                  className="flex items-center justify-between rounded px-2 py-2 hover:bg-white/10"
                  aria-expanded={mobileCategoriesOpen}
                  onClick={() => setMobileCategoriesOpen((v) => !v)}
                >
                  <span className="arial-caps">ჩემპიონატები</span>
                  <svg
                    className={`h-4 w-4 transition-transform ${mobileCategoriesOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {mobileCategoriesOpen && (
                  <div className="ml-2 border-l border-white/20 pl-2">
                    {categories.length === 0 ? (
                      <div className="px-2 py-2 text-white/80">No categories</div>
                    ) : (
                      categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/league/${slugify(cat.name)}`}
                          className="block rounded px-2 py-2 hover:bg-white/10"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {cat.name}
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
