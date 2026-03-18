import { LivePageClient } from "@/app/live/LivePageClient";

export default function LivePage() {
  return (
    <div className="mx-auto flex max-w-6xl justify-center px-4 py-10 sm:px-6">
      <LivePageClient />
    </div>
  );
}

