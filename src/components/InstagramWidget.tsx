"use client";

import { Instagram } from "lucide-react";
import { getInstagramVideos, INSTAGRAM_PROFILE_URL, INSTAGRAM_USERNAME } from "@/lib/instagram";

export async function InstagramWidget() {
  const videos = await getInstagramVideos();
  if (videos.length === 0) return null;

  return (
    <section className="px-4 pb-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <a
          href={INSTAGRAM_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 text-[#00112d] transition-colors hover:text-[#00306d]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[2px]">
            <span className="flex h-full w-full items-center justify-center rounded-full bg-white">
              <Instagram className="h-5 w-5" aria-hidden="true" />
            </span>
          </span>
          <span className="dejavu-sans text-base font-semibold sm:text-lg">
            @{INSTAGRAM_USERNAME}
          </span>
        </a>
        <div className="h-px flex-1 bg-[#45556c]/40" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {videos.map((video) => (
          <a
            key={video.id}
            href={video.permalink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={video.caption || "Open this post on Instagram"}
            className="group relative block aspect-[9/16] overflow-hidden rounded-xl bg-zinc-900"
          >
            {video.mediaUrl ? (
              <video
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                poster={video.thumbnailUrl}
                src={video.mediaUrl}
                muted
                playsInline
                preload="none"
              />
            ) : (
              <img
                src={video.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            )}

            <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-black/55 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {video.caption ? (
                <p className="dejavu-sans line-clamp-2 text-sm leading-snug text-white">
                  {video.caption}
                </p>
              ) : null}
              <span className="mt-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#00112d]">
                <Instagram className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
