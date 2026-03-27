import { getCategories } from "@/lib/api";
import LeaguePageClient from "./LeaguePageClient";

export default async function LeaguePage() {
  const categories = await getCategories().catch(() => []);
  return <LeaguePageClient categories={categories} />;
}

