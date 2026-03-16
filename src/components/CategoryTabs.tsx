"use client";

import type { Category } from "@/lib/api";

type CategoryTabsProps = {
  categories: Category[];
  value: string | null;
  onChange: (categoryId: string) => void;
  className?: string;
};

export function CategoryTabs({
  categories,
  value,
  onChange,
  className = "",
}: CategoryTabsProps) {
  if (categories.length === 0) return null;

  return (
    <div
      className={`border-b border-zinc-200 bg-zinc-50/80 ${className}`}
      role="tablist"
      aria-label="კატეგორიის ფილტრი"
    >
      <nav
        className="flex overflow-x-auto scrollbar-none -mb-px scroll-smooth"
        aria-label="კატეგორიები"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <ul className="flex min-w-min gap-1 px-2 py-2 sm:gap-0 sm:px-4 arial-caps text-sm font-medium">
          {categories.map((cat) => {
            const isSelected = value === cat._id;
            return (
              <li key={cat._id} className="flex-shrink-0">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onChange(cat._id)}
                  className={`
                    relative rounded-t-lg px-4 py-3 sm:px-5 sm:py-3.5
                    transition-all duration-200 ease-out
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00306d] focus-visible:ring-offset-2
                    ${isSelected
                      ? "text-[#00306d] bg-white shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-white/60"
                    }
                  `}
                >
                  <span className="whitespace-nowrap">{cat.name}</span>
                  {isSelected && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[3px] min-h-[3px] bg-[#00306d] rounded-t-full"
                      aria-hidden
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
