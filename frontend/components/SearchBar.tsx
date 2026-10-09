"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, X } from "lucide-react";
import DateRangePicker from "./DateRangePicker";
import GuestsPicker from "./GuestsPicker";
import { fmtShort } from "@/lib/dates";

const SUGGESTED = [
  ["Goa", "Beaches and nightlife"], ["Manali", "Mountain getaways"], ["Jaipur", "Palaces and heritage"],
  ["Udaipur", "Lakes and havelis"], ["Kerala", "Backwaters and hills"], ["Mumbai", "Big-city energy"],
];
type Seg = "where" | "in" | "out" | "who" | null;

export function CompactSearch({ onOpen }: { onOpen: () => void }) {
  const sp = useSearchParams();
  const q = sp.get("q"), ci = sp.get("check_in"), co = sp.get("check_out"), g = Number(sp.get("guests") || 0);
  return (
    <button onClick={onOpen} aria-label="Start your search"
      className="flex items-center border border-[#ddd] rounded-full shadow-search hover:shadow-card transition-shadow pl-5 pr-2 py-2 text-sm font-medium">
      <span className="px-3 truncate max-w-[140px]">{q || "Anywhere"}</span>
      <span className="h-6 w-px bg-[#ddd]" />
      <span className="px-3 hidden sm:inline">{ci && co ? `${fmtShort(ci)} – ${fmtShort(co)}` : "Any week"}</span>
      <span className="h-6 w-px bg-[#ddd] hidden sm:block" />
      <span className={`px-3 hidden sm:inline ${g ? "" : "text-mute font-normal"}`}>{g ? `${g} guest${g > 1 ? "s" : ""}` : "Add guests"}</span>
      <span className="w-8 h-8 rounded-full bg-rausch text-white flex items-center justify-center ml-1"><Search size={14} strokeWidth={3} /></span>
    </button>
  );
}

export default function SearchBar({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") || "");
  const [ci, setCi] = useState<string | null>(sp.get("check_in"));
  const [co, setCo] = useState<string | null>(sp.get("check_out"));
  const [guests, setGuests] = useState(Number(sp.get("guests") || 0));
  const [seg, setSeg] = useState<Seg>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setSeg(null); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const submit = () => {
    const p = new URLSearchParams(sp.toString());
    const set = (k: string, v?: string | null) => (v ? p.set(k, v) : p.delete(k));
    set("q", q.trim()); set("check_in", ci); set("check_out", co); set("guests", guests > 1 ? String(guests) : null);
    p.delete("page");
    setSeg(null); onDone?.();
    router.push(`/?${p.toString()}`);
  };
  const cell = (s: Seg) => `relative flex-1 text-left px-6 py-3 rounded-full cursor-pointer ${seg === s ? "bg-white shadow-card" : "hover:bg-[#ebebeb]"}`;

  return (
    <div ref={ref} className="relative w-full max-w-[850px] mx-auto">
      <div className={`flex flex-col md:flex-row items-stretch md:items-center border border-[#ddd] rounded-3xl md:rounded-full shadow-search ${seg ? "bg-[#ebebeb]" : "bg-white"}`}>
        <div className={cell("where")} onClick={() => setSeg("where")} style={{ flex: 1.4 }}>
          <label htmlFor="where" className="block text-xs font-semibold">Where</label>
          <input id="where" value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setSeg("where")} autoComplete="off"
            onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Search destinations"
            className="w-full bg-transparent outline-none text-sm placeholder:text-mute truncate" />
          {q && seg === "where" && <button aria-label="Clear" onClick={(e) => { e.stopPropagation(); setQ(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-[#ddd]"><X size={12} /></button>}
        </div>
        <span className="hidden md:block h-8 w-px bg-[#ddd]" />
        <div className={cell("in")} onClick={() => setSeg("in")}>
          <div className="text-xs font-semibold">When</div>
          <div className={`text-sm ${ci || co ? "" : "text-mute"}`}>{ci && co ? `${fmtShort(ci)} - ${fmtShort(co)}` : "Add dates"}</div>
        </div>
        <span className="hidden md:block h-8 w-px bg-[#ddd]" />
        <div className={`${cell("who")} flex items-center`} onClick={() => setSeg("who")} style={{ flex: 1.2 }}>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold">Who</div>
            <div className={`text-sm truncate ${guests ? "" : "text-mute"}`}>{guests ? `${guests} guest${guests > 1 ? "s" : ""}` : "Add guests"}</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); submit(); }} aria-label="Search"
            className="btn-primary !rounded-full h-12 flex items-center gap-2 px-4 shrink-0"><Search size={16} strokeWidth={3} />{seg && <span className="text-base">Search</span>}</button>
        </div>
      </div>

      {seg === "where" && (
        <div className="md:absolute left-0 top-full mt-3 w-full md:w-[420px] bg-white rounded-3xl shadow-pop p-6 z-50 animate-pop">
          <div className="text-xs font-semibold mb-3">Suggested destinations</div>
          {SUGGESTED.map(([name, sub]) => (
            <button key={name} onClick={() => { setQ(name); setSeg("in"); }} className="flex items-center gap-4 w-full p-2 rounded-xl hover:bg-soft text-left">
              <span className="w-12 h-12 rounded-lg bg-[#f0f0f0] flex items-center justify-center"><MapPin size={20} strokeWidth={1.5} /></span>
              <span><span className="block font-medium">{name}, India</span><span className="block text-mute text-sm">{sub}</span></span>
            </button>
          ))}
        </div>
      )}
      {(seg === "in" || seg === "out") && (
        <div className="md:absolute left-1/2 md:-translate-x-1/2 top-full mt-3 bg-white rounded-3xl shadow-pop p-6 pt-5 z-50 animate-pop max-w-full overflow-x-auto">
          <DateRangePicker checkIn={ci} checkOut={co} onChange={(a, b) => { setCi(a); setCo(b); setSeg(b ? "who" : "out"); }} />
          {(ci || co) && <div className="text-right mt-2"><button className="underline font-semibold text-sm" onClick={() => { setCi(null); setCo(null); setSeg("in"); }}>Clear dates</button></div>}
        </div>
      )}
      {seg === "who" && (
        <div className="md:absolute right-0 top-full mt-3 w-full md:w-[380px] bg-white rounded-3xl shadow-pop px-6 py-2 z-50 animate-pop">
          <GuestsPicker guests={Math.max(guests, 1)} onChange={setGuests} />
        </div>
      )}
    </div>
  );
}
