"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Star } from "lucide-react";
import DateRangePicker, { Range } from "./DateRangePicker";
import GuestsPicker from "./GuestsPicker";
import { api, ListingDetail, Quote } from "@/lib/api";
import { fmtShort, inr } from "@/lib/dates";
import { useAuth } from "@/context/Providers";

type Props = { l: ListingDetail; ci: string | null; co: string | null; guests: number; booked: Range[];
  setDates: (a: string | null, b: string | null) => void; setGuests: (n: number) => void };

export default function ReserveCard({ l, ci, co, guests, booked, setDates, setGuests }: Props) {
  const router = useRouter();
  const { user, openAuth } = useAuth();
  const [pop, setPop] = useState<"dates" | "guests" | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setPop(null); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {  // server is the source of truth for price + validation (availability, guest limit)
    setQuote(null); setErr("");
    if (!ci || !co) return;
    let live = true;
    api<Quote>(`/api/listings/${l.id}/quote?check_in=${ci}&check_out=${co}&guests=${guests}`)
      .then((q) => live && setQuote(q)).catch((e) => live && setErr(e.message));
    return () => { live = false; };
  }, [l.id, ci, co, guests]);

  const reserve = () => {
    if (!ci || !co) { setPop("dates"); return; }
    const go = () => router.push(`/book/${l.id}?check_in=${ci}&check_out=${co}&guests=${guests}`);
    if (!user) openAuth("login", go); else go();
  };

  return (
    <div id="reserve" ref={ref} className="border border-[#ddd] rounded-xl shadow-card p-6 bg-white">
      <div className="flex items-baseline justify-between mb-5">
        <div><span className="text-[22px] font-semibold">{inr(l.price_per_night)}</span> <span>night</span></div>
        {l.review_count > 0 && <span className="text-sm flex items-center gap-1"><Star size={12} className="fill-ink" /><b>{l.rating.toFixed(2)}</b> · <span className="text-mute underline">{l.review_count} reviews</span></span>}
      </div>
      <div className="relative">
        <div className="border border-[#b0b0b0] rounded-lg">
          <div className="grid grid-cols-2 border-b border-[#b0b0b0]">
            <button onClick={() => setPop("dates")} className="text-left p-3 border-r border-[#b0b0b0] hover:bg-soft rounded-tl-lg"><div className="text-[10px] font-bold uppercase">Check-in</div><div className={`text-sm ${ci ? "" : "text-mute"}`}>{ci ? fmtShort(ci) : "Add date"}</div></button>
            <button onClick={() => setPop("dates")} className="text-left p-3 hover:bg-soft rounded-tr-lg"><div className="text-[10px] font-bold uppercase">Checkout</div><div className={`text-sm ${co ? "" : "text-mute"}`}>{co ? fmtShort(co) : "Add date"}</div></button>
          </div>
          <button onClick={() => setPop(pop === "guests" ? null : "guests")} className="w-full flex items-center justify-between text-left p-3 hover:bg-soft rounded-b-lg">
            <div><div className="text-[10px] font-bold uppercase">Guests</div><div className="text-sm">{guests} guest{guests > 1 ? "s" : ""}</div></div><ChevronDown size={16} />
          </button>
        </div>
        {pop === "dates" && (
          <div className="absolute right-0 top-full mt-2 z-30 bg-white rounded-3xl shadow-pop p-6 w-[min(92vw,740px)] animate-pop">
            <DateRangePicker checkIn={ci} checkOut={co} booked={booked} onChange={(a, b) => { setDates(a, b); if (b) setPop(null); }} />
            <div className="flex justify-end gap-4 mt-3 text-sm font-semibold">
              <button className="underline" onClick={() => setDates(null, null)}>Clear dates</button>
              <button className="btn-dark px-4 py-2" onClick={() => setPop(null)}>Close</button>
            </div>
          </div>
        )}
        {pop === "guests" && (
          <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white rounded-xl shadow-pop p-4 animate-pop">
            <GuestsPicker guests={guests} onChange={setGuests} max={l.max_guests} />
            <p className="text-xs text-mute mt-2">This place has a maximum of {l.max_guests} guests.</p>
          </div>
        )}
      </div>
      {err && <p role="alert" className="text-[#c13515] text-sm mt-3">{err}</p>}
      <button onClick={reserve} disabled={!!err && !!ci && !!co} className="btn-primary w-full py-3.5 mt-4 text-base">{ci && co ? "Reserve" : "Check availability"}</button>
      {quote && (
        <>
          <p className="text-center text-sm mt-3">You won't be charged yet</p>
          <div className="mt-5 space-y-3 text-base">
            <div className="flex justify-between"><span className="underline">{inr(quote.price_per_night)} × {quote.nights} night{quote.nights > 1 ? "s" : ""}</span><span>{inr(quote.subtotal)}</span></div>
            <div className="flex justify-between"><span className="underline">Cleaning fee</span><span>{inr(quote.cleaning_fee)}</span></div>
            <div className="flex justify-between"><span className="underline">Airbnb service fee</span><span>{inr(quote.service_fee)}</span></div>
          </div>
          <div className="flex justify-between font-semibold text-base border-t border-[#ddd] mt-5 pt-5"><span>Total before taxes</span><span>{inr(quote.total)}</span></div>
        </>
      )}
    </div>
  );
}
