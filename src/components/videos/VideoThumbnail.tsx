"use client";

import Image from "next/image";
import { useState } from "react";
import { youtubeThumbnailUrl } from "@/lib/youtube";

type VideoThumbnailProps = {
  youtubeId: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function VideoThumbnail({
  youtubeId,
  alt,
  className = "object-cover",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
}: VideoThumbnailProps) {
  const [quality, setQuality] = useState<"maxresdefault" | "hqdefault">("maxresdefault");

  return (
    <Image
      src={youtubeThumbnailUrl(youtubeId, quality)}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      unoptimized
      priority={priority}
      onError={() => {
        if (quality !== "hqdefault") setQuality("hqdefault");
      }}
    />
  );
}
