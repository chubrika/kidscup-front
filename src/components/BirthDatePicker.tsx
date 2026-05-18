"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, isValid, parse } from "date-fns";
import { ka } from "date-fns/locale";
import { Calendar, ChevronDown, X } from "lucide-react";

type BirthDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  hasError?: boolean;
  placeholder?: string;
};

const ISO_DATE = "yyyy-MM-dd";
const DISPLAY_DATE = "dd.MM.yyyy";
const MIN_BIRTH_YEAR = 1995;

function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, ISO_DATE, new Date());
  return isValid(parsed) ? parsed : undefined;
}

function toIsoDate(date: Date | undefined): string {
  if (!date || !isValid(date)) return "";
  return format(date, ISO_DATE);
}

export function BirthDatePicker({
  value,
  onChange,
  className = "",
  hasError = false,
  placeholder = "აირჩიეთ თარიღი",
}: BirthDatePickerProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value);
  const today = new Date();
  const displayValue = selected ? format(selected, DISPLAY_DATE, { locale: ka }) : "";

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const triggerClassName = hasError
    ? "border-red-500/90 hover:border-red-500 focus:border-red-500 focus:ring-red-100"
    : "border-[#e8e2da] hover:border-[#d9d0c6] focus:border-[#fd7209] focus:ring-[#fd7209]/15";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
        className={`mt-2 flex w-full items-center gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm shadow-sm outline-none transition focus:ring-4 ${triggerClassName} ${
          displayValue ? "text-zinc-900" : "text-zinc-400"
        }`}
      >
        <Calendar className="h-4 w-4 shrink-0 text-[#fd7209]" aria-hidden />
        <span className="min-w-0 flex-1 truncate dejavu-sans">{displayValue || placeholder}</span>
        {value ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="თარიღის გასუფთავება"
            className="rounded-md p-0.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
            onClick={(event) => {
              event.stopPropagation();
              onChange("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onChange("");
              }
            }}
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-zinc-400 transition ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        )}
      </button>

      {open && (
        <div
          id={listboxId}
          role="dialog"
          aria-label="დაბადების თარიღის არჩევა"
          className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[min(100%,20rem)] rounded-2xl border border-zinc-200/90 bg-white p-3 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.35)]"
        >
          <DayPicker
            mode="single"
            locale={ka}
            weekStartsOn={1}
            selected={selected}
            defaultMonth={selected ?? new Date(today.getFullYear() - 12, today.getMonth(), 1)}
            onSelect={(date) => {
              onChange(toIsoDate(date));
              setOpen(false);
            }}
            captionLayout="dropdown"
            startMonth={new Date(MIN_BIRTH_YEAR, 0, 1)}
            endMonth={today}
            disabled={{ after: today }}
            classNames={{
              root: "relative",
              months: "flex flex-col",
              month: "space-y-3",
              month_caption: "relative flex items-center justify-center px-8",
              caption_label: "hidden",
              dropdowns: "flex items-center gap-2 dejavu-sans text-sm font-medium text-zinc-800",
              dropdown:
                "rounded-lg border border-[#e8e2da] bg-[#faf9f7] px-2 py-1.5 text-sm outline-none focus:border-[#fd7209] focus:ring-2 focus:ring-[#fd7209]/15",
              nav: "absolute inset-x-0 top-0 flex items-center justify-between",
              button_previous:
                "inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-[#fd7209]",
              button_next:
                "inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-[#fd7209]",
              month_grid: "w-full border-collapse",
              weekdays: "mb-1",
              weekday:
                "dejavu-sans pb-1 text-center text-[11px] font-medium uppercase tracking-wide text-zinc-400",
              week: "mt-0.5",
              day: "p-0 text-center",
              day_button:
                "mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm text-zinc-800 transition hover:bg-[#fd7209]/10 hover:text-[#fd7209] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd7209]/25",
              selected:
                "[&>button]:bg-[#fd7209] [&>button]:font-semibold [&>button]:text-white [&>button]:hover:bg-[#fd7209] [&>button]:hover:text-white",
              today: "[&>button]:ring-1 [&>button]:ring-[#fd7209]/30",
              outside: "[&>button]:text-zinc-300",
              disabled:
                "[&>button]:cursor-not-allowed [&>button]:text-zinc-300 [&>button]:hover:bg-transparent",
            }}
          />
        </div>
      )}
    </div>
  );
}