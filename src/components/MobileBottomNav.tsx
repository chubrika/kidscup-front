"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Trophy, Users, UserRound } from "lucide-react";

const MOBILE_SUB_NAV = [
  { href: "/", label: "მთავარი", icon: Home },
  { href: "/teams", label: "გუნდები", icon: Users },
  { href: "/players", label: "მოთამაშეები", icon: UserRound },
  { href: "/standings", label: "ცხრილი", icon: Trophy },
  { href: "/calendar", label: "კალენდარი", icon: CalendarDays },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile sub navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto dejavu-sans grid h-[60px] max-w-3xl grid-cols-5 px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1">
        {MOBILE_SUB_NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 rounded-lg transition-colors ${
                  isActive
                    ? "text-[#fd7209]"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-[#002554]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-semibold leading-none pt-[4px]">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
