import { getCategories, getMatches, getNews } from "@/lib/api";
import { StandingsSection } from "@/components/StandingsSection";
import { CalendarSection } from "@/components/CalendarSection";
import { LastMatchesSection } from "@/components/LastMatchesSection";
import Image from "next/image";
import Link from "next/link";

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

  const sortedNews = [...news].sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    return bTime - aTime;
  });
  const featured = sortedNews.slice(0, 2);
  const latest = sortedNews.slice(2, 12);

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("ka-GE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  };

  let matches: Awaited<ReturnType<typeof getMatches>> = [];
  try {
    matches = await getMatches({ status: "finished", ageCategory: categories[0]?._id ?? null });
  } catch {
    // Backend may be down
  }

  const getTeam = (team: (typeof matches)[number]["homeTeam"]): { name?: string; logo?: string } =>
    typeof team === "string" ? { name: team, logo: undefined } : { name: team.name, logo: team.logo };

  const matchTime = (m: (typeof matches)[number]) => {
    const d = new Date(m.date);
    const base = Number.isNaN(d.getTime()) ? 0 : d.getTime();
    const hhmm = m.time?.slice(0, 5) ?? "00:00";
    const [hh, mm] = hhmm.split(":").map((v) => Number(v));
    const extra = Number.isFinite(hh) && Number.isFinite(mm) ? (hh * 60 + mm) * 60_000 : 0;
    return base + extra;
  };

  const lastThreeMatches = [...matches]
    .sort((a, b) => matchTime(b) - matchTime(a))
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left section: Standings */}
        <aside className="lg:col-span-4 xl:col-span-4 flex flex-col gap-6">
          <StandingsSection categories={categories} />
          <CalendarSection categories={categories} />
          <LastMatchesSection categories={categories} />
        </aside>

        {/* Right section: News */}
        <main className="lg:col-span-8 xl:col-span-8">
          <section className="mb-6 rounded-md border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-4 py-3">
              <h2 className="arial-caps text-sm font-semibold tracking-wide text-zinc-800">
                ბოლო მატჩები
              </h2>
            </div>

            {lastThreeMatches.length === 0 ? (
              <div className="p-6">
                <p className="text-sm text-zinc-600">დასრულებული მატჩები არ არის.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {lastThreeMatches.map((m) => {
                  const home = getTeam(m.homeTeam);
                  const away = getTeam(m.awayTeam);
                  const score =
                    m.scoreHome != null && m.scoreAway != null ? `${m.scoreHome} – ${m.scoreAway}` : "–";
                  return (
                    <article
                      key={m._id}
                      className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
                    >
                      <p className="arial-caps text-[11px] text-zinc-500 tabular-nums">
                        {formatDate(m.date)}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          {home.logo ? (
                            <Image
                              src={home.logo}
                              alt=""
                              width={28}
                              height={28}
                              className="h-7 w-7 rounded bg-zinc-100 object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="h-7 w-7 rounded bg-zinc-100" />
                          )}
                          <span className="min-w-0 truncate font-semibold text-[#00306d] dejavu-sans">
                            {home.name ?? "—"}
                          </span>
                        </div>
                        <span className="flex-none rounded-full bg-[#00306d] border border-zinc-200 px-2 py-1 text-sm font-semibold text-white tabular-nums">
                          {score}
                        </span>
                        <div className="flex min-w-0 items-center justify-end gap-2">
                          <span className="min-w-0 truncate text-right font-semibold text-[#00306d] dejavu-sans">
                            {away.name ?? "—"}
                          </span>
                          {away.logo ? (
                            <Image
                              src={away.logo}
                              alt=""
                              width={28}
                              height={28}
                              className="h-7 w-7 rounded bg-zinc-100 object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="h-7 w-7 rounded bg-zinc-100" />
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-md border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-4 py-3">
              <h2 className="arial-caps text-sm font-semibold tracking-wide text-zinc-800">
                სიახლეები
              </h2>
            </div>

            {sortedNews.length === 0 ? (
              <div className="p-6">
                <p className="text-sm text-zinc-600">
                  სიახლეები ჯერ არ არის დამატებული.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 p-4 lg:grid-cols-12">
                {/* Featured */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  {featured.map((item, idx) => (
                    <article
                      key={item._id}
                      className="rounded-md border border-zinc-200 overflow-hidden bg-white"
                    >
                      <Link href={`/news/${item._id}`} className="block">
                        <div className="relative h-56 w-full bg-zinc-100">
                          {item.photoUrl ? (
                            <Image
                              src={item.photoUrl}
                              alt={item.title}
                              fill
                              className="object-cover"
                              sizes="(min-width: 1024px) 560px, 100vw"
                              priority={idx === 0}
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#00306d] to-[#fd7209]/80" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <p className="arial-caps text-[11px] text-white/80">
                              {formatDate(item.createdAt)}
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-white dejavu-sans">
                              {item.title}
                            </h3>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>

                {/* Latest list */}
                <div className="lg:col-span-5">
                  <div className="flex flex-col gap-3">
                    {latest.map((item) => (
                      <article
                        key={item._id}
                        className="rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
                      >
                        <Link href={`/news/${item._id}`} className="flex gap-3 p-3">
                          <div className="relative h-16 w-20 flex-none overflow-hidden rounded bg-zinc-100">
                            {item.photoUrl ? (
                              <Image
                                src={item.photoUrl}
                                alt={item.title}
                                fill
                                className="object-cover"
                                sizes="80px"
                                unoptimized
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-[#00306d] to-[#fd7209]/80" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="arial-caps text-[11px] text-zinc-500 tabular-nums">
                              {formatDate(item.createdAt)}
                            </p>
                            <h4 className="mt-0.5 text-[12px] text-wrap font-semibold text-zinc-800 dejavu-sans">
                              {item.title}
                            </h4>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
