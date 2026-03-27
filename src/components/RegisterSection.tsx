import Link from "next/link";

type RegisterSectionProps = {
  href?: string;
};

export function RegisterSection({ href = "/register-team" }: RegisterSectionProps) {
  return (
    <section className="px-4 py-10 sm:px-6">
      <div className="rounded-2xl bg-[#fd7208] px-6 py-8 shadow-[0_18px_45px_-25px_rgba(0,0,0,0.45)] sm:px-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h2 className="dejavu-sans text-2xl font-semibold tracking-tight text-white sm:text-3xl">
             მზად ხართ თასის მოსაგებად?
            </h2>
            <p className="mt-2 dejavu-sans text-sm leading-relaxed text-white/80">
            ტურნირზე განაცხადების მიღება 5 აპრილს მთავრდება. შემოუერთდით ახალგაზრდული სპორტსმენების ტურნირზე.            </p>
          </div>

          <div className="flex sm:justify-end">
            <Link
              href={href}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#00112d] px-8 text-sm font-semibold text-white shadow-[0_10px_25px_-15px_rgba(0,0,0,0.65)] transition hover:bg-[#00112d]/90 active:scale-[0.98]"
            >
              გუნდის რეგისტრაცია
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

