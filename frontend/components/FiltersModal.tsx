"use client";
import { useEffect, useState } from "react";
import Modal from "./Modal";
import { AmenityIcon } from "@/lib/icons";
import { api, Meta } from "@/lib/api";
import { inr } from "@/lib/dates";

export type Filters = { min_price: number | null; max_price: number | null; property_type: string[]; bedrooms: number; amenities: number[] };
export const EMPTY_FILTERS: Filters = { min_price: null, max_price: null, property_type: [], bedrooms: 0, amenities: [] };

export default function FiltersModal({ meta, initial, baseQuery, onApply, onClose }:
  { meta: Meta; initial: Filters; baseQuery: string; onApply: (f: Filters) => void; onClose: () => void }) {
  const [f, setF] = useState<Filters>(initial);
  const [count, setCount] = useState<number | null>(null);
  const lo = Math.floor(meta.price_range.min / 500) * 500, hi = Math.ceil(meta.price_range.max / 500) * 500;
  const min = f.min_price ?? lo, max = f.max_price ?? hi;

  useEffect(() => {  // live "Show N places" count
    const p = new URLSearchParams(baseQuery);
    ["min_price", "max_price", "property_type", "bedrooms", "amenities"].forEach((k) => p.delete(k));
    if (f.min_price !== null) p.set("min_price", String(f.min_price));
    if (f.max_price !== null) p.set("max_price", String(f.max_price));
    if (f.property_type.length) p.set("property_type", f.property_type.join(","));
    if (f.bedrooms) p.set("bedrooms", String(f.bedrooms));
    if (f.amenities.length) p.set("amenities", f.amenities.join(","));
    p.set("page_size", "1");
    const t = setTimeout(() => api<{ total: number }>(`/api/listings?${p}`).then((r) => setCount(r.total)).catch(() => setCount(null)), 250);
    return () => clearTimeout(t);
  }, [f, baseQuery]);

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="py-8 border-b border-[#ebebeb] last:border-0"><h3 className="text-[22px] font-semibold mb-5">{title}</h3>{children}</section>;
  const pill = (on: boolean) => `px-5 py-2.5 rounded-full border text-sm ${on ? "bg-ink text-white border-ink" : "border-[#ddd] hover:border-ink"}`;

  return (
    <Modal title="Filters" onClose={onClose} wide
      footer={<div className="flex items-center justify-between">
        <button className="underline font-semibold" onClick={() => setF(EMPTY_FILTERS)}>Clear all</button>
        <button className="btn-dark px-6 py-3.5" onClick={() => onApply(f)}>{count === null ? "Show places" : `Show ${count} place${count === 1 ? "" : "s"}`}</button>
      </div>}>
      <div className="px-6">
        <Section title="Price range">
          <p className="text-mute mb-4">Nightly prices before fees and taxes</p>
          <input type="range" aria-label="Minimum price" min={lo} max={hi} step={500} value={min} onChange={(e) => setF({ ...f, min_price: Math.min(Number(e.target.value), max - 500) })} className="w-full accent-ink" />
          <input type="range" aria-label="Maximum price" min={lo} max={hi} step={500} value={max} onChange={(e) => setF({ ...f, max_price: Math.max(Number(e.target.value), min + 500) })} className="w-full accent-ink" />
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="border border-[#b0b0b0] rounded-xl px-4 py-2 w-40"><div className="text-xs text-mute">Minimum</div><div className="text-base">{inr(min)}</div></div>
            <span>–</span>
            <div className="border border-[#b0b0b0] rounded-xl px-4 py-2 w-40"><div className="text-xs text-mute">Maximum</div><div className="text-base">{inr(max)}{max >= hi ? "+" : ""}</div></div>
          </div>
        </Section>
        <Section title="Type of place">
          <div className="flex flex-wrap gap-3">{meta.property_types.map((t) => <button key={t} onClick={() => setF({ ...f, property_type: toggle(f.property_type, t) })} className={pill(f.property_type.includes(t))}>{t}</button>)}</div>
        </Section>
        <Section title="Rooms and beds">
          <div className="text-base mb-3">Bedrooms</div>
          <div className="flex gap-3 flex-wrap">{[0, 1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setF({ ...f, bedrooms: n })} className={pill(f.bedrooms === n)}>{n === 0 ? "Any" : n === 5 ? "5+" : n}</button>)}</div>
        </Section>
        <Section title="Amenities">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {meta.amenities.map((a) => {
              const on = f.amenities.includes(a.id);
              return (
                <label key={a.id} className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer ${on ? "border-ink bg-soft" : "border-[#ddd] hover:border-ink"}`}>
                  <input type="checkbox" className="accent-ink w-4 h-4" checked={on} onChange={() => setF({ ...f, amenities: toggle(f.amenities, a.id) })} />
                  <AmenityIcon name={a.icon} size={20} /><span>{a.name}</span>
                </label>
              );
            })}
          </div>
        </Section>
      </div>
    </Modal>
  );
}
