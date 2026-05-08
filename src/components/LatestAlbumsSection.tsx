"use client";

import dynamic from "next/dynamic";

const LatestAlbumsSectionClient = dynamic(() => import("./LatestAlbumsSectionClient"), {
  ssr: false,
});

export function LatestAlbumsSection() {
  return <LatestAlbumsSectionClient />;
}

