"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Match, MatchStatsResponse } from "@/lib/api";
import { CalendarDays, MapPin, Timer } from "lucide-react";

type MatchDetailPageClientProps = {
  match: Match;
  stats: MatchStatsResponse | null;
};

function getTeamName(team: Match["homeTeam"]): string {
  if (!team) return "—";
  if (typeof team === "string") return team;
  return team.name ?? "—";
}

function getTeamId(team: Match["homeTeam"]): string | null {
  if (!team || typeof team === "string") return null;
  return team._id ?? null;
}

function getTeamLogo(team: Match["homeTeam"]): string | null {
  if (!team || typeof team === "string") return null;
  return team.logo ?? null;
}

function formatScore(match: Match): string {
  if (match.scoreHome != null && match.scoreAway != null) {
    return `${match.scoreHome} : ${match.scoreAway}`;
  }
  return "— : —";
}

function formatDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  // Avoid relying on server ICU locale data for "ka-GE".
  // We format in a stable locale and translate parts ourselves.
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tbilisi",
  }).formatToParts(d);

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const weekdayEn = part("weekday");
  const monthEn = part("month");
  const day = part("day");
  const year = part("year");

  const weekdayKa: Record<string, string> = {
    Sunday: "კვირა",
    Monday: "ორშაბათი",
    Tuesday: "სამშაბათი",
    Wednesday: "ოთხშაბათი",
    Thursday: "ხუთშაბათი",
    Friday: "პარასკევი",
    Saturday: "შაბათი",
  };

  const monthKa: Record<string, string> = {
    January: "იანვარი",
    February: "თებერვალი",
    March: "მარტი",
    April: "აპრილი",
    May: "მაისი",
    June: "ივნისი",
    July: "ივლისი",
    August: "აგვისტო",
    September: "სექტემბერი",
    October: "ოქტომბერი",
    November: "ნოემბერი",
    December: "დეკემბერი",
  };

  const w = weekdayKa[weekdayEn] ?? weekdayEn;
  const m = monthKa[monthEn] ?? monthEn;
  if (!w || !m || !day || !year) return `${day || ""} ${m || ""} ${year || ""}`.trim() || "—";

  return `${w}, ${day} ${m}, ${year}`;
}

function safeText(text: string | undefined): string {
  return text?.trim() ? text.trim() : "—";
}

export default function MatchDetailPageClient({ match, stats }: MatchDetailPageClientProps) {
  const homeId = getTeamId(match.homeTeam);
  const awayId = getTeamId(match.awayTeam);

  const homeName = getTeamName(match.homeTeam);
  const awayName = getTeamName(match.awayTeam);

  const homeLogo = getTeamLogo(match.homeTeam);
  const awayLogo = getTeamLogo(match.awayTeam);

  const categoryName =
    typeof match.ageCategory === "string"
      ? ""
      : (match.ageCategory?.name ?? "");

  const teamScores = stats?.teamScores ?? [];
  const homeScoreFromStats = homeId ? teamScores.find((s) => s.teamId === homeId)?.points : undefined;
  const awayScoreFromStats = awayId ? teamScores.find((s) => s.teamId === awayId)?.points : undefined;

  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#002554] via-[#003d82] to-[#fd7209]" />
        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs text-white/90">
                <span className="dejavu-sans">{categoryName || "მატჩი"}</span>
              </div>
              <div className="text-xs text-white/80 dejavu-sans">
                {formatDate(match.date)}
              </div>
            </div>

            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12">
              <div className="md:col-span-4">
                <TeamBlock
                  side="home"
                  teamId={homeId}
                  name={homeName}
                  logo={homeLogo}
                />
              </div>

              <div className="md:col-span-4">
                <div className="mx-auto flex w-full max-w-[240px] flex-col items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-center">
                  <p className="arial-caps text-[11px] tracking-widest text-white/80">
                    საბოლოო ანგარიში
                  </p>
                  <p className="dejavu-sans text-4xl font-semibold text-white tabular-nums">
                    {formatScore(match)}
                  </p>
                  {homeScoreFromStats != null && awayScoreFromStats != null ? (
                    <p className="text-[11px] text-white/80">
                      Team scores: <span className="tabular-nums">{homeScoreFromStats}</span> –{" "}
                      <span className="tabular-nums">{awayScoreFromStats}</span>
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="md:col-span-4">
                <TeamBlock
                  side="away"
                  teamId={awayId}
                  name={awayName}
                  logo={awayLogo}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <InfoPill
                icon={<CalendarDays className="h-4 w-4 text-white/80" aria-hidden />}
                label="თარიღი"
                value={formatDate(match.date)}
              />
              <InfoPill
                icon={<Timer className="h-4 w-4 text-white/80" aria-hidden />}
                label="დრო"
                value={safeText(match.time)}
              />
              <InfoPill
                icon={<MapPin className="h-4 w-4 text-white/80" aria-hidden />}
                label="ადგილი"
                value={safeText(match.location)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <section className="rounded-2xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-200 px-5 py-4">
                <h2 className="arial-caps text-sm font-semibold tracking-wide text-zinc-800">
                  მატჩის დეტალები
                </h2>
              </div>
              <div className="px-5 py-4">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailRow label="სტატუსი" value={match.status} />
                  <DetailRow label="კატეგორია" value={categoryName || "—"} />
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 sm:col-span-2">
                    <dt className="arial-caps text-[11px] font-semibold tracking-widest text-zinc-500">
                      მსაჯები
                    </dt>
                    {match.refereesInfo?.trim() ? (
                      <dd
                        className="mt-2 dejavu-sans text-sm text-zinc-900 prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1"
                        dangerouslySetInnerHTML={{ __html: match.refereesInfo }}
                      />
                    ) : (
                      <dd className="mt-1 dejavu-sans text-sm text-zinc-900">—</dd>
                    )}
                  </div>
                </dl>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <section className="rounded-2xl border border-zinc-200 bg-[#00112d] text-white overflow-hidden">
              <div className="border-b border-white/10 px-5 py-4">
                <h3 className="arial-caps text-sm font-semibold tracking-wide">
                  სწრაფი ბმულები
                </h3>
              </div>
              <div className="px-5 py-4 space-y-2">
                {homeId ? (
                  <Link href={`/teams/${encodeURIComponent(homeId)}`} className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 transition-colors">
                    {homeName}
                  </Link>
                ) : null}
                {awayId ? (
                  <Link href={`/teams/${encodeURIComponent(awayId)}`} className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 transition-colors">
                    {awayName}
                  </Link>
                ) : null}
                <Link href="/results" className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 transition-colors">
                  ყველა შედეგი
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}

function TeamBlock({
  side,
  teamId,
  name,
  logo,
}: {
  side: "home" | "away";
  teamId: string | null;
  name: string;
  logo: string | null;
}) {
  const align =
    side === "home"
      ? "items-start text-left"
      : "items-end text-right";

  const content = (
    <div className={`flex flex-col gap-3 ${align}`}>
      <div className="flex items-center gap-3">
        {side === "away" ? null : <TeamLogo name={name} logo={logo} />}
        <div className={`min-w-0 ${side === "away" ? "order-1" : ""}`}>
          <p className="arial-caps text-[11px] tracking-widest text-white/75">
            {side === "home" ? "მასპინძელი" : "სტუმარი"}
          </p>
          <p className="mt-1 text-xl font-semibold text-white dejavu-sans truncate max-w-[520px]">
            {name}
          </p>
        </div>
        {side === "away" ? <TeamLogo name={name} logo={logo} /> : null}
      </div>

      {teamId ? (
        <Link
          href={`/teams/${encodeURIComponent(teamId)}`}
          className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 hover:bg-white/15 transition-colors"
        >
          გუნდის გვერდი
        </Link>
      ) : null}
    </div>
  );

  return content;
}

function TeamLogo({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/25 bg-white/10 shrink-0">
      {logo ? (
        <Image
          src={logo}
          alt={name}
          fill
          className="object-cover"
          sizes="56px"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-base font-semibold text-white/80">
          {name.charAt(0)}
        </div>
      )}
    </div>
  );
}

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
      <div className="flex items-center gap-2">
        {icon}
        <p className="arial-caps text-[11px] tracking-widest text-white/75">{label}</p>
      </div>
      <p className="mt-1 text-sm text-white dejavu-sans line-clamp-2">{value}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
      <dt className="arial-caps text-[11px] font-semibold tracking-widest text-zinc-500">
        {label}
      </dt>
      <dd className={`mt-1 text-sm text-zinc-900 ${mono ? "font-mono" : "dejavu-sans"}`}>
        {value || "—"}
      </dd>
    </div>
  );
}

