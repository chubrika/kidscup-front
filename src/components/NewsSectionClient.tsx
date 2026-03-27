"use client";

import { useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { News } from "@/lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import type { SwiperOptions } from "swiper/types";
import { Autoplay } from "swiper/modules";

type NewsSectionClientProps = {
  news: News[];
};

const SWIPER_CONFIG: SwiperOptions = {
  modules: [Autoplay],
  loop: true,
  spaceBetween: 12,
  slidesPerView: 1.4,
  autoplay: { delay: 4500, disableOnInteraction: false },
  pagination: false,
  breakpoints: {
    640: { slidesPerView: 1.4 },
    1024: { slidesPerView: 2.2 },
  },
};

function formatDateUtc(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy}`;
}

export default function NewsSectionClient({ news }: NewsSectionClientProps) {
  const swiperRef = useRef<SwiperInstance | null>(null);

  const latestFive = useMemo(() => {
    const sorted = [...news].sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bTime - aTime;
    });
    return sorted.slice(0, 5);
  }, [news]);

  return (
    <section className="rounded-md overflow-hidden">
      <div className="py-3 flex items-center justify-between gap-3">
        <h2 className="dejavu-sans text-2xl font-semibold tracking-wide text-zinc-800">
          სიახლეები
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous news"
            onClick={() => swiperRef.current?.slidePrev()}
            className="inline-flex cursor-pointer h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next news"
            onClick={() => swiperRef.current?.slideNext()}
            className="inline-flex cursor-pointer h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {latestFive.length === 0 ? (
        <p className="text-sm text-zinc-600">სიახლეები ჯერ არ არის დამატებული.</p>
      ) : (
        <Swiper
          {...SWIPER_CONFIG}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          className="!pb-9"
        >
          {latestFive.map((item, idx) => (
            <SwiperSlide key={item._id} className="h-auto">
              <article className="h-full rounded-xl border border-zinc-200 overflow-hidden bg-white">
                <Link href={`/news/${item._id}`} className="block h-full">
                  <div className="relative h-72 md:h-100 w-full bg-zinc-100">
                    {item.photoUrl ? (
                      <Image
                        src={item.photoUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 520px, (min-width: 640px) 70vw, 100vw"
                        priority={idx === 0}
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#00112d] to-[#fd7209]/80" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#00112d]/90 via-[#00306d]/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="mt-1 text-lg font-semibold text-white dejavu-sans line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="arial-caps mt-2 text-[11px] text-white/80">
                        {formatDateUtc(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
}

