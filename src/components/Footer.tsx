import Link from "next/link";
import type React from "react";
import { Facebook, Instagram, Mail, Phone, Youtube } from "lucide-react";

const MAIN_NAV = [
  { href: "/", label: "მთავარი" },
  { href: "/news", label: "სიახლეები" },
  { href: "/photo", label: "ფოტო" },
  { href: "/video", label: "ვიდეო" },
] as const;

const SUB_NAV = [
  { href: "/teams", label: "კლუბები" },
  { href: "/players", label: "მოთამაშეები" },
  { href: "/standings", label: "ცხრილები" },
  { href: "/calendar", label: "კალენდარი" },
  { href: "/contact", label: "კონტაქტი" },
] as const;

const CONTACT = {
  phoneDisplay: "+995 555 94 44 99",
  phoneHref: "+995555944499",
  emailDisplay: "info@kidscup.ge",
  emailHref: "info@kidscup.ge",
} as const;

function SocialLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  const isExternal = /^https?:\/\//i.test(href);

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-[#002554] transition-colors hover:border-[#fd7209] hover:bg-[#fd7209]/10 hover:text-[#fd7209] focus:outline-none focus:ring-2 focus:ring-[#fd7209] focus:ring-offset-2"
    >
      {icon}
    </a>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-t-[3px] border-[#fd7209] bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-zinc-900"
            >
              Tbilisi Kids Cup
            </Link>

            <p className="text-sm leading-6 text-zinc-600 dejavu-sans">
              Kids Cup არის ბავშვთა სპორტული პლატფორმა — შედეგები, ცხრილები,
              კალენდარი, სიახლეები და მედია ერთ სივრცეში.
            </p>

            <div>
              <p className="arial-caps text-[11px] font-semibold tracking-wide text-zinc-500">
                სოციალური ქსელები
              </p>
              <div className="mt-3 flex items-center gap-3">
                <SocialLink
                  href="https://www.facebook.com/profile.php?id=61588340670695"
                  label="Facebook"
                  icon={<Facebook className="h-5 w-5" />}
                />
                <SocialLink
                  href="https://www.youtube.com/"
                  label="YouTube"
                  icon={<Youtube className="h-5 w-5" />}
                />
                <SocialLink
                  href="https://www.instagram.com/"
                  label="Instagram"
                  icon={<Instagram className="h-5 w-5" />}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="arial-caps text-[11px] font-semibold tracking-wide text-zinc-500">
              მთავარი
            </p>
            <ul className="mt-4 dejavu-sans grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-1 sm:gap-x-0">
              {MAIN_NAV.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="transition-colors text-zinc-600 hover:text-zinc-900"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="arial-caps text-[11px] font-semibold tracking-wide text-zinc-500">
              ნავიგაცია
            </p>
            <ul className="mt-4 dejavu-sans grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-1 sm:gap-x-0">
              {SUB_NAV.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="transition-colors text-zinc-600 hover:text-zinc-900"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <p className="arial-caps text-[11px] font-semibold tracking-wide text-zinc-500">
              კონტაქტი
            </p>

            <div className="space-y-3 text-sm">
              <a
                href={`tel:${CONTACT.phoneHref}`}
                className="flex items-center gap-3 rounded-md text-zinc-700 transition-colors hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#fd7209] focus:ring-offset-2"
              >
                <span className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-[#002554]/5 text-[#002554]">
                  <Phone className="h-4 w-4" />
                </span>
                <span className="dejavu-sans font-semibold text-zinc-900">
                  {CONTACT.phoneDisplay}
                </span>
              </a>

              <a
                href={`mailto:${CONTACT.emailHref}`}
                className="flex items-center gap-3 rounded-md text-zinc-700 transition-colors hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#fd7209] focus:ring-offset-2"
              >
                <span className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-[#002554]/5 text-[#002554]">
                  <Mail className="h-4 w-4" />
                </span>
                <span className="dejavu-sans font-semibold text-zinc-900">
                  {CONTACT.emailDisplay}
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-200 pt-6">
          <p className="text-sm text-zinc-600 dejavu-sans">
            © {currentYear} TbilisiKids Cup. ყველა უფლება დაცულია.
          </p>
        </div>
      </div>
    </footer>
  );
}
