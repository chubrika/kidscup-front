import { getCategories } from "@/lib/api";
import { StandingsTable } from "@/components/StandingsTable";

export default async function StandingsPage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  try {
    categories = await getCategories();
  } catch {
    // Backend may be down
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900 arial-caps">ცხრილები</h1>
      <div className="mt-6">
        <StandingsTable categories={categories} />
      </div>
    </div>
  );
}
