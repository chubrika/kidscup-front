import { getCategories } from "@/lib/api";
import ResultsPageClient from "./ResultsPageClient";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResultsPage({ searchParams }: PageProps) {
  const categories = await getCategories().catch(() => []);
  const sp = (await searchParams) ?? {};

  const ageCategoryParam = sp.ageCategory;
  const ageCategory =
    typeof ageCategoryParam === "string" ? ageCategoryParam : null;

  return <ResultsPageClient categories={categories} initialCategoryId={ageCategory} />;
}

