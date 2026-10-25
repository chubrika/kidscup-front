type SectionSkeletonProps = {
  variant:
    | "calendar"
    | "matches"
    | "standings"
    | "last-matches"
    | "albums"
    | "league"
    | "table"
    | "results"
    | "videos"
    | "photos";
};

function Bone({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span
      className={`block animate-pulse rounded-md ${dark ? "bg-white/15" : "bg-zinc-200"} ${className}`}
    />
  );
}

function Frame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className} aria-busy="true" aria-live="polite">
      <span className="sr-only">იტვირთება</span>
      {children}
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <Frame className="flex flex-col gap-3">
      <Bone className="h-4 w-28" />
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 bg-zinc-50/80 px-3 py-2.5 sm:px-4">
          <Bone className="h-3 w-36" />
        </div>
        <ul className="divide-y divide-zinc-100">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index} className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
              <Bone className="h-4 w-9 shrink-0 sm:w-10" />
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Bone className="ml-auto h-3 w-20 sm:w-28" />
                <Bone className="h-7 w-7 shrink-0 !rounded-full sm:h-8 sm:w-8" />
                <Bone className="h-4 w-8 shrink-0 !rounded-full" />
                <Bone className="h-7 w-7 shrink-0 !rounded-full sm:h-8 sm:w-8" />
                <Bone className="h-3 w-20 sm:w-28" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

function MatchRowsSkeleton() {
  return (
    <Frame className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <ul className="divide-y divide-zinc-100">
        {Array.from({ length: 3 }, (_, index) => (
          <li key={index} className="flex items-center gap-3 px-3 py-3 sm:px-4">
            <Bone className="h-8 w-8 shrink-0 !rounded-full" />
            <Bone className="h-3 w-24" />
            <Bone className="mx-auto h-4 w-10 !rounded-full" />
            <Bone className="ml-auto h-3 w-24" />
            <Bone className="h-8 w-8 shrink-0 !rounded-full" />
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function DarkRowsSkeleton({ rows, withScore }: { rows: number; withScore?: boolean }) {
  return (
    <Frame>
      <ul>
        {Array.from({ length: rows }, (_, index) => (
          <li key={index} className="flex items-center gap-3 border-b border-white/10 px-3 py-3">
            <Bone dark className="h-3 w-4" />
            <Bone dark className="h-5 w-5 shrink-0 !rounded-full" />
            <Bone dark className="h-3 flex-1" />
            {withScore ? <Bone dark className="h-3 w-6" /> : <Bone dark className="h-3 w-8" />}
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function AlbumsSkeleton() {
  return (
    <Frame className="-mx-4 mt-4 flex gap-4 overflow-hidden px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Bone key={index} className="h-36 w-[260px] shrink-0 rounded-lg sm:h-40 sm:w-full" />
      ))}
    </Frame>
  );
}

function LeagueSkeleton() {
  return (
    <Frame className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <Bone className="h-3 w-24" />
            <Bone className="h-3 w-12" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <Bone className="h-4 w-24" />
            <Bone className="h-5 w-12 rounded" />
            <Bone className="h-4 w-24" />
          </div>
        </div>
      ))}
    </Frame>
  );
}

function TableSkeleton() {
  return (
    <Frame className="space-y-3 p-4">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Bone className="h-3 w-4" />
          <Bone className="h-6 w-6 shrink-0 !rounded-full" />
          <Bone className="h-3 flex-1" />
          <Bone className="h-3 w-8" />
          <Bone className="h-3 w-8" />
          <Bone className="h-3 w-8" />
        </div>
      ))}
    </Frame>
  );
}

function ResultsSkeleton() {
  return (
    <Frame className="space-y-3 px-4 py-4">
      <Bone className="h-4 w-28" />
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 border-b border-zinc-100 pb-3">
          <Bone className="h-3 w-16" />
          <Bone className="h-3 flex-1" />
          <Bone className="h-4 w-12" />
          <Bone className="h-3 flex-1" />
        </div>
      ))}
    </Frame>
  );
}

function VideosSkeleton() {
  return (
    <Frame className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Bone className="aspect-video w-full rounded-lg" />
          <Bone className="h-3 w-3/4" />
          <Bone className="h-3 w-1/2" />
        </div>
      ))}
    </Frame>
  );
}

function PhotosSkeleton() {
  return (
    <Frame className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Bone className="h-4 w-24" />
        <Bone className="h-10 w-full sm:w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Bone key={index} className="aspect-[4/3] w-full rounded-md" />
        ))}
      </div>
    </Frame>
  );
}

export function SectionSkeleton({ variant }: SectionSkeletonProps) {
  switch (variant) {
    case "calendar":
      return <CalendarSkeleton />;
    case "matches":
      return <MatchRowsSkeleton />;
    case "standings":
      return <DarkRowsSkeleton rows={6} />;
    case "last-matches":
      return <DarkRowsSkeleton rows={4} withScore />;
    case "albums":
      return <AlbumsSkeleton />;
    case "league":
      return <LeagueSkeleton />;
    case "table":
      return <TableSkeleton />;
    case "results":
      return <ResultsSkeleton />;
    case "videos":
      return <VideosSkeleton />;
    case "photos":
      return <PhotosSkeleton />;
  }
}
