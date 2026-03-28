"use client";

import Link from "next/link";
import { useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import useSWR from "swr";
import { LiveBadge } from "@/components/live/LiveBadge";
import { MenuIcon, XIcon } from "lucide-react";
import type { Category } from "@/lib/api";
import {
  getPublicConfigUrl,
  type PublicAppConfig,
} from "@/lib/publicConfig";

const MAIN_NAV = [
  // { href: "/", label: "მთავარი" },
  { href: "/news", label: "სიახლეები" },
  { href: "/media", label: "მედია" },
  { href: "/teams", label: "კლუბები" },
  { href: "/league", label: "ჩემპიონატები" },
  { href: "/contact", label: "კონტაქტი" }
] as const;

const MOBILE_NAV = [
  { href: "/news", label: "სიახლეები" },
  { href: "/media", label: "მედია" },
  { href: "/league", label: "ჩემპიონატები" },
  { href: "/contact", label: "კონტაქტი" }
];

type HeaderProps = {
  categories?: Category[];
};

async function publicConfigFetcher(url: string): Promise<PublicAppConfig> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to load config");
  }
  return res.json();
}

function RegisterTeamButtonLink({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <Link href="/register-team" className={className}>
      {children}
    </Link>
  );
}

function RegisterTeamButtonSkeleton({ className }: { className: string }) {
  return (
    <div
      className={`rounded-lg bg-zinc-200/80 animate-pulse ${className}`}
      aria-hidden
    />
  );
}

export function Header(_props: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const { data: config, isLoading, error } = useSWR(
    getPublicConfigUrl(),
    publicConfigFetcher,
    { revalidateOnFocus: true },
  );

  const showRegister = Boolean(config?.team_registration_enabled);
  const registerLoading = isLoading && !error;

  useEffect(() => {
    queueMicrotask(() => {
      setMobileMenuOpen(false);
    });
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-white flex items-center justify-center h-[60px] pt-[4px] pb-[4px]"
          >
            <Image src="/kidsCupLogo.png" alt="KidsCup" width={60} height={60} className="h-full w-auto" unoptimized />
          </Link>

          {registerLoading ? (
            <RegisterTeamButtonSkeleton className="md:hidden h-9 w-[148px]" />
          ) : showRegister ? (
            <RegisterTeamButtonLink className="md:hidden bg-[#fd7208] text-[#592300] px-3 py-2 rounded-lg font-label font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-secondary/20 whitespace-nowrap">
              <span className="flex items-center justify-center dejavu-sans">
                გუნდის რეგისტრაცია
              </span>
            </RegisterTeamButtonLink>
          ) : null}

          <div className="md:flex flex-shrink-0">
            <LiveBadge />
          </div>
        </div>
        <nav className="hidden items-center h-full gap-6 text-[16px] font-medium text-white dejavu-sans md:flex">
          {MAIN_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-slate-600 relative hover:text-[#fd7209] h-[30px] flex items-center justify-center transition-all duration-300`}
            >
              {label}
              {pathname === href && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] min-h-[1px] bg-[#fd7209] rounded-t-full" />
              )}
            </Link>
          ))}
          {registerLoading ? (
            <RegisterTeamButtonSkeleton className="hidden md:block h-10 w-[180px]" />
          ) : showRegister ? (
            <RegisterTeamButtonLink className="hidden md:flex bg-[#fd7208] text-[#592300] px-6 py-2.5 dejavu-sans rounded-lg font-label font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-secondary/20 items-center justify-center">
              <span className="flex items-center justify-center">
                გუნდის რეგისტრაცია
              </span>
            </RegisterTeamButtonLink>
          ) : null}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:text-[#fd7209]  transition-all duration-300"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? (
              <XIcon className="h-6 w-6 text-slate-600" />
            ) : (
              <MenuIcon className="h-6 w-6 text-slate-600" />
            )}
          </button>
        </div>
      </div>
      <>
        <button
          type="button"
          className={`fixed inset-0 z-40 transition-opacity duration-300 md:hidden ${
            mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          aria-label="Close menu overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
        <div
          id="mobile-nav"
          className={`absolute left-0 right-0 top-16 z-50 border-b border-zinc-200 bg-white md:hidden transition-all duration-300 ease-out origin-top ${
            mobileMenuOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-3 pointer-events-none"
          }`}
        >
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 shadow-lg">
            <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
              {MOBILE_NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded arial-caps px-2 py-2 hover:bg-white/10 text-slate-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </>
    </header>
  );
}
