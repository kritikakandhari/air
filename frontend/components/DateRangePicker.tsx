"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, fromISO, toISO, todayISO } from "@/lib/dates";

export type Range = { check_in: string; check_out: string };
type Props = {
  checkIn: string | null; checkOut: string | null;
  onChange: (checkIn: string | null, checkOut: string | null) => void;
  booked?: Range[]; months?: 1 | 2;
};
const WEEK = ["S", "M", "T", "W", "T", "F", "S"];

export default function DateRangePicker({ checkIn, checkOut, onChange, booked = [], months = 2 }: Props) {
  const today = todayISO();
  const [view, setView] = useState(() => { const d = checkIn ? fromISO(checkIn) : new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  // every night that is already taken (check_in inclusive .. check_out exclusive)
  const blocked = useMemo(() => {
    const s = new Set<string>();
    booked.forEach((r) => { for (let d = fromISO(r.check_in); toISO(d) < r.check_out; d = addDays(d, 1)) s.add(toISO(d)); });
    return s;
  }, [booked]);

  // while choosing a checkout, you can't stay past the next booked night
  const limit = useMemo(() => {
    if (!checkIn || checkOut) return null;
    const after = Array.from(blocked).filter((b) => b >= checkIn).sort();
    return after[0] ?? null;
  }, [blocked, checkIn, checkOut]);

  const choosingEnd = !!checkIn && !checkOut;
  const isDisabled = (iso: string) => {
    if (iso < today) return true;
    if (choosingEnd && iso > checkIn!) return limit !== null && iso > limit;
    return blocked.has(iso);
  };
  const pick = (iso: string) => {
    if (isDisabled(iso)) return;
    if (!choosingEnd || iso <= checkIn!) onChange(iso, null);
    else onChange(checkIn, iso);
  };

  const renderMonth = (base: Date) => {
    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    const count = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    const cells: (string | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= count; d++) cells.push(toISO(new Date(base.getFullYear(), base.getMonth(), d)));
    return (
      <div className="w-full sm:w-[330px]">
        <div className="text-center font-semibold text-base mb-4">{first.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
        <div className="grid grid-cols-7 text-center text-xs text-mute mb-1">{WEEK.map((w, i) => <div key={i} className="py-2">{w}</div>)}</div>
        <div className="grid grid-cols-7">
          {cells.map((iso, i) => {
            if (!iso) return <div key={i} />;
            const dis = isDisabled(iso), isBlocked = blocked.has(iso);
            const start = iso === checkIn, end = iso === checkOut;
            const inRange = !!checkIn && !!checkOut && iso > checkIn && iso < checkOut;
            const band = inRange ? "#F7F7F7" : start && checkOut ? "r" : end ? "l" : null;
            const style = band === "r" ? { background: "linear-gradient(to right, transparent 50%, #F7F7F7 50%)" }
              : band === "l" ? { background: "linear-gradient(to left, transparent 50%, #F7F7F7 50%)" }
              : band ? { background: band } : undefined;
            return (
              <div key={i} style={style} className="flex justify-center">
                <button type="button" disabled={dis} onClick={() => pick(iso)}
                  aria-label={iso} aria-pressed={start || end}
                  className={`w-[46px] h-[46px] rounded-full text-sm font-medium flex items-center justify-center border border-transparent
                    ${start || end ? "bg-ink text-white" : dis ? "text-[#c1c1c1] cursor-default" : "hover:border-ink"}
                    ${isBlocked && !start && !end ? "line-through" : ""} ${iso === today && !start && !end ? "underline" : ""}`}>
                  {Number(iso.slice(8))}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const canPrev = view > new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const next = new Date(view.getFullYear(), view.getMonth() + 1, 1);
  return (
    <div className="relative select-none">
      <button type="button" aria-label="Previous month" disabled={!canPrev} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
        className="absolute left-0 top-0 p-2 rounded-full hover:bg-soft disabled:opacity-20 disabled:hover:bg-transparent"><ChevronLeft size={16} /></button>
      <button type="button" aria-label="Next month" onClick={() => setView(next)}
        className="absolute right-0 top-0 p-2 rounded-full hover:bg-soft"><ChevronRight size={16} /></button>
      <div className="flex gap-8 justify-center">
        {renderMonth(view)}
        {months === 2 && <div className="hidden md:block">{renderMonth(next)}</div>}
      </div>
    </div>
  );
}
