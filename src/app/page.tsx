import { getCategories } from "@/lib/api";
import { StandingsSection } from "@/components/StandingsSection";

export default async function Home() {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  try {
    categories = await getCategories();
  } catch {
    // Backend may be down
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left section: Standings */}
        <aside className="lg:col-span-3 xl:col-span-3">
          <StandingsSection categories={categories} />
        </aside>

        {/* Right section: placeholder for future content */}
        <main className="lg:col-span-9 xl:col-span-9">
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 dejavu-sans">
              მთავარი
            </h2>
            <p className="mt-3 text-zinc-600">
              კონტენტი მალე დაემატება.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
