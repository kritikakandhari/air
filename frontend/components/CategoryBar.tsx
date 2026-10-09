"use client";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { CategoryIcon } from "@/lib/icons";

export default function CategoryBar({ categories, active, onSelect, onFilters, filterCount }:
  { categories: { key: string; label: string }[]; active: string | null; onSelect: (k: string | null) => void; onFilters: () => void; filterCount: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 400, behavior: "smooth" });
  return (
    <div className="sticky top-20 z-30 bg-white">
      <div className="container-x flex items-center gap-4 h-[78px]">
        <button aria-label="Scroll left" onClick={() => scroll(-1)} className="hidden md:flex w-8 h-8 shrink-0 rounded-full border border-[#ddd] items-center justify-center hover:shadow-card hover:scale-105"><ChevronLeft size={14} /></button>
        <div ref={ref} className="flex-1 flex gap-8 overflow-x-auto no-scrollbar" role="tablist" aria-label="Property categories">
          {categories.map((c) => {
            const on = active === c.key;
            return (
              <button key={c.key} role="tab" aria-selected={on} onClick={() => onSelect(on ? null : c.key)}
                className={`flex flex-col items-center gap-2 pt-2 pb-2 shrink-0 border-b-2 text-xs font-medium transition-colors ${on ? "border-ink text-ink" : "border-transparent text-mute hover:text-ink hover:border-[#ddd]"}`}>
                <CategoryIcon name={c.key} size={26} />
                <span className="whitespace-nowrap">{c.label}</span>
              </button>
            );
          })}
        </div>
        <button aria-label="Scroll right" onClick={() => scroll(1)} className="hidden md:flex w-8 h-8 shrink-0 rounded-full border border-[#ddd] items-center justify-center hover:shadow-card hover:scale-105"><ChevronRight size={14} /></button>
        <button onClick={onFilters} className="flex items-center gap-2 border border-[#ddd] rounded-xl px-4 py-3 text-xs font-semibold hover:border-ink hover:bg-soft shrink-0">
          <SlidersHorizontal size={14} />Filters{filterCount > 0 && <span className="bg-ink text-white rounded-full w-5 h-5 text-[11px] flex items-center justify-center">{filterCount}</span>}
        </button>
      </div>
      <div className="h-px bg-[#ebebeb]" />
    </div>
  );
}
