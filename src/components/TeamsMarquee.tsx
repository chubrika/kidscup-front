"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Team } from "@/lib/api";

interface TeamsMarqueeProps {
  teams: Team[];
}

export function TeamsMarquee({ teams }: TeamsMarqueeProps) {
  if (!teams.length) return null;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Duplicate teams for seamless infinite scroll (only used when overflow exists)
  const doubled = useMemo(() => [...teams, ...teams], [teams]);

  useEffect(() => {
    const containerEl = containerRef.current;
    const contentEl = contentRef.current;
    if (!containerEl || !contentEl) return;

    const measure = () => {
      const containerWidth = containerEl.getBoundingClientRect().width;
      // scrollWidth is more reliable than clientWidth for max-content rows
      const contentWidth = contentEl.scrollWidth;
      setShouldAnimate(contentWidth > containerWidth + 1);
    };

    measure();

    // Keep it responsive (e.g. window resize / font loading changes)
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measure());
      ro.observe(containerEl);
      ro.observe(contentEl);
    } else {
      const onResize = () => measure();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    return () => ro?.disconnect();
  }, [teams.length]);

  const items = shouldAnimate ? doubled : teams;

  return (
    <div
      ref={containerRef}
      className="w-full bg-sky overflow-hidden border-b border-gray-200 bg-white py-3"
    >
      <div
        ref={contentRef}
        className={`${shouldAnimate ? "teams-marquee" : ""} flex justify-center items-center gap-4 md:gap-8`}
      >
        {items.map((team, i) => (
          <Link
            key={`${team._id}-${i}`}
            href={`/teams/${team._id}`}
            className="flex shrink-0 flex-row items-center gap-3 md:flex-col"
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-100 transition-transform hover:scale-105">
              {team.logo ? (
                <Image
                  src={team.logo}
                  alt={team.name}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-xs font-bold dejavu-sans text-blue-700">
                  {team.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span className="dejavu-sans max-w-[120px] truncate text-center text-[14px] font-medium text-gray-700 hover:text-blue-700">
              {team.name}
            </span>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .teams-marquee {
          animation: marquee 30s linear infinite;
          width: max-content;
        }
        .teams-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
