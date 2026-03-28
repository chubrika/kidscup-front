import { getCategories, getNews } from "@/lib/api";
import { fetchPublicConfig } from "@/lib/publicConfig";
import { CalendarSection } from "@/components/CalendarSection";
import { LastMatchesSection } from "@/components/LastMatchesSection";
import { NewsSection } from "@/components/NewsSection";
import { RegisterSection } from "@/components/RegisterSection";
import { StandingsSection } from "@/components/StandingsSection";

export default async function Home() {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  try {
    categories = await getCategories();
  } catch {
    // Backend may be down
  }

  let news: Awaited<ReturnType<typeof getNews>> = [];
  try {
    news = await getNews();
  } catch {
    // Backend may be down
  }

  let teamRegistrationEnabled = false;
  try {
    const publicConfig = await fetchPublicConfig({
      next: { revalidate: 60 },
    });
    teamRegistrationEnabled = publicConfig.team_registration_enabled;
  } catch {
    // Same as Header: hide registration CTAs if config cannot be loaded
  }

  return (
    <div className="mx-auto bg-white max-w-6xl">
      {/* Last matches */}
      <div className="px-4 py-8 sm:px-6">
        <LastMatchesSection categories={categories} />
      </div>

      {/* News */}
      <div className="px-4 py-8 sm:px-6 bg-[#f1f3f8]">
        <NewsSection news={news} />
      </div>

      {/* Calendar (left) + Standings (right) */}
      <div className="grid grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <CalendarSection categories={categories} />
        </div>
        <div className="lg:col-span-4">
          <StandingsSection categories={categories} />
        </div>
      </div>

      {teamRegistrationEnabled ? <RegisterSection /> : null}
    </div>
  );
}
