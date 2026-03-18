import type { Metadata } from "next";
import type React from "react";
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";

export const metadata: Metadata = {
  title: "კონტაქტი | Kids Cup",
  description: "Kids Cup - საკონტაქტო ინფორმაცია",
};

const CONTACT = {
  phoneDisplay: "+995 555 94 44 99",
  phoneHref: "+995555944499",
  emailDisplay: "info@kidscup.ge",
  emailHref: "info@kidscup.ge",
  addressDisplay: "თბილისი, საქართველო",
  facebookUrl: "https://www.facebook.com/profile.php?id=61588340670695",
  youtubeUrl: "https://www.youtube.com/",
  instagramUrl: "https://www.instagram.com/",
} as const;

function InfoCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:bg-zinc-50">
      <div className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-[#00306d]/10 text-[#00306d]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="arial-caps text-[11px] font-semibold tracking-wide text-zinc-500">
          {label}
        </p>
        <p className="mt-1 dejavu-sans text-sm font-semibold text-zinc-900">
          {value}
        </p>
      </div>
    </div>
  );

  if (!href) return content;
  const isExternal = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      className="block focus:outline-none"
      aria-label={label}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
    >
      {content}
    </a>
  );
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00306d] via-[#00306d] to-[#fd7209]" />
          <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,white,transparent_55%),radial-gradient(circle_at_80%_60%,white,transparent_50%)]" />
          <div className="relative px-6 py-8 sm:px-10 sm:py-10">
            <p className="arial-caps text-[11px] font-semibold tracking-wider text-white/80">
              Kids Cup
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white arial-caps">
              კონტაქტი
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/90 dejavu-sans">
              Kids Cup არის ბავშვთა საკალათბურთო ჩემპიონატი და სპორტული პლატფორმა,
              რომელიც აერთიანებს გუნდებს, მწვრთნელებსა და დამწყებ კალათბურთელებს ერთ სივრცეში —
              შედეგები, ცხრილები, კალენდარი, სიახლეები და მედია.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-zinc-200 bg-zinc-50/50 p-6 sm:grid-cols-3 sm:p-8">
          <InfoCard
            icon={<Phone className="h-5 w-5" />}
            label="ტელეფონი"
            value={CONTACT.phoneDisplay}
            href={`tel:${CONTACT.phoneHref}`}
          />
          <InfoCard
            icon={<Mail className="h-5 w-5" />}
            label="ელ-ფოსტა"
            value={CONTACT.emailDisplay}
            href={`mailto:${CONTACT.emailHref}`}
          />
          <InfoCard
            icon={<MapPin className="h-5 w-5" />}
            label="მისამართი"
            value={CONTACT.addressDisplay}
          />
        </div>

        <div className="border-t border-zinc-200 bg-white p-6 sm:p-8">
          <h2 className="arial-caps text-sm font-semibold tracking-wide text-zinc-800">
            სოციალური ქსელები
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InfoCard
              icon={<Facebook className="h-5 w-5" />}
              label="Facebook"
              value="Tbilisi Kid’s Cup"
              href={CONTACT.facebookUrl}
            />
            <InfoCard
              icon={<Youtube className="h-5 w-5" />}
              label="YouTube"
              value="Kids Cup"
              href={CONTACT.youtubeUrl}
            />
            <InfoCard
              icon={<Instagram className="h-5 w-5" />}
              label="Instagram"
              value="@kidscup"
              href={CONTACT.instagramUrl}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

