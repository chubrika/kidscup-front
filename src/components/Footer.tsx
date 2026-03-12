import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-t-[3px] border-[#fd7209] bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-zinc-900"
          >
           Tbilisi Kids Cup
          </Link>
          <p className="text-sm text-zinc-600">
            © {currentYear} TbilisiKids Cup. ყველა უფლება დაცულია.
          </p>
        </div>
      </div>
    </footer>
  );
}
