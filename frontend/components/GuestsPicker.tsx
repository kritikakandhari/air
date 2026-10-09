"use client";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export default function GuestsPicker({ guests, onChange, max = 16 }: { guests: number; onChange: (n: number) => void; max?: number }) {
  const [children, setChildren] = useState(0);
  const adults = Math.max(1, guests - children);
  const set = (a: number, c: number) => { setChildren(c); onChange(a + c); };
  const Row = ({ label, sub, value, min, onMinus, onPlus }: { label: string; sub: string; value: number; min: number; onMinus: () => void; onPlus: () => void }) => (
    <div className="flex items-center justify-between py-4">
      <div><div className="font-medium text-base">{label}</div><div className="text-mute text-sm">{sub}</div></div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`Fewer ${label}`} disabled={value <= min} onClick={onMinus}
          className="w-8 h-8 rounded-full border border-[#b0b0b0] flex items-center justify-center disabled:opacity-30 hover:border-ink"><Minus size={14} /></button>
        <span className="w-5 text-center">{value}</span>
        <button type="button" aria-label={`More ${label}`} disabled={guests >= max} onClick={onPlus}
          className="w-8 h-8 rounded-full border border-[#b0b0b0] flex items-center justify-center disabled:opacity-30 hover:border-ink"><Plus size={14} /></button>
      </div>
    </div>
  );
  return (
    <div className="divide-y divide-[#ebebeb]">
      <Row label="Adults" sub="Ages 13 or above" value={adults} min={1} onMinus={() => set(adults - 1, children)} onPlus={() => set(adults + 1, children)} />
      <Row label="Children" sub="Ages 2–12" value={children} min={0} onMinus={() => set(adults, children - 1)} onPlus={() => set(adults, children + 1)} />
    </div>
  );
}
