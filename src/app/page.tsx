import { getCategories, getNews, getTeams, Team } from "@/lib/api";
import { fetchPublicConfig } from "@/lib/publicConfig";
import { CalendarSection } from "@/components/CalendarSection";
import { LiveGamesSection } from "@/components/LiveGamesSection";
import { LastMatchesSection } from "@/components/LastMatchesSection";
import { NewsSection } from "@/components/NewsSection";
import { RegisterSection } from "@/components/RegisterSection";
import { StandingsSection } from "@/components/StandingsSection";
import { LatestAlbumsSection } from "@/components/LatestAlbumsSection";
import { TeamsMarquee } from "@/components/TeamsMarquee";

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

  let teams: Team[] = [];
  try {
    teams = await getTeams();
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
    <div className="">
      <TeamsMarquee teams={teams} />
      {/* Calendar (left) + Standings (right) */}
      <div className="mx-auto max-w-6xl pt-8">
        <div className="grid grid-cols-1 gap-6 px-4 pb-8 pt-0 sm:px-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <LiveGamesSection categories={categories} />
            <CalendarSection categories={categories} />
          </div>
          <div className="lg:col-span-4">
            <StandingsSection categories={categories} />
          </div>
        </div>
        {teamRegistrationEnabled ? <RegisterSection /> : null}
      </div>

      {/* News */}
      <div className="bg-sky">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:flex-nowrap">
            <div className="order-2 w-full min-w-0 lg:order-1 lg:flex-[2]">
              <NewsSection news={news} />
              <LatestAlbumsSection />
            </div>
            <div className="order-1 w-full min-w-0 lg:order-2 lg:flex-1">
              <LastMatchesSection categories={categories} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
