import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchById, getMatchStats } from "@/lib/api";
import MatchDetailPageClient from "@/components/matches/MatchDetailPageClient";

type PageParams = { id: string };

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;

  const match = await getMatchById(id);
  if (!match) notFound();
 console.log("match id", match);
  const stats = await getMatchStats(match._id).catch(() => null);

  return (
    <div className="bg-sky min-h-[calc(100vh-20rem)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="mb-4 text-sm text-zinc-500">
          <Link href="/results" className="hover:text-zinc-700 underline">
            სრული შედეგები
          </Link>
          {" / "}
          <span className="text-zinc-700">მატჩი</span>
        </p>

        <MatchDetailPageClient match={match} stats={stats} />
      </div>
    </div>
  );
}

