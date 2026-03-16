import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { LeagueMatchesSection } from "@/components/LeagueMatchesSection";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function LeagueCategoryPage({ params }: Props) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => slugify(c.name) === slug);

  if (!category) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-zinc-600 mb-4">
        <Link href="/" className="hover:text-zinc-900 underline">
          მთავარი
        </Link>
        {" / "}
        <span>{category.name}</span>
      </p>
      <h1 className="text-2xl font-bold text-zinc-900">
        ლიგა — {category.name}
      </h1>
      <div className="mt-6">
        <LeagueMatchesSection category={category} />
      </div>
    </div>
  );
}
