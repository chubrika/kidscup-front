import { getCategories } from "@/lib/api";
import { CalendarClient } from "./CalendarClient";

export default async function CalendarPage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  try {
    categories = await getCategories();
  } catch {
    // Backend may be down
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900 arial-caps">
        კალენდარი
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dejavu-sans">
        იხილეთ დაგეგმილი მატჩები ასაკობრივი კატეგორიების მიხედვით.
      </p>
      <div className="mt-6">
        <CalendarClient categories={categories} />
      </div>
    </div>
  );
}
