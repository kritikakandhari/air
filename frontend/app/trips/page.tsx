"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Luggage } from "lucide-react";
import SmartImage from "@/components/SmartImage";
import Modal from "@/components/Modal";
import ReviewModal from "@/components/ReviewModal";
import { api, Booking } from "@/lib/api";
import { fmtRange, inr, todayISO } from "@/lib/dates";
import { useAuth, useToast } from "@/context/Providers";

type Tab = "upcoming" | "past" | "cancelled";

function Trips() {
  const { user, loading: authLoading, openAuth } = useAuth();
  const { toast } = useToast();
  const confirmed = useSearchParams().get("confirmed");
  const [trips, setTrips] = useState<Booking[] | null>(null);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [reviewing, setReviewing] = useState<Booking | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(() => { api<Booking[]>("/api/bookings/me").then(setTrips).catch((e) => setErr(e.message)); }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  if (authLoading) return <div className="detail-x py-10"><div className="h-10 w-48 skeleton rounded" /></div>;
  if (!user) return (
    <div className="detail-x py-28 text-center"><Luggage size={40} strokeWidth={1.3} className="mx-auto mb-4" /><h1 className="text-2xl font-semibold">Log in to see your trips</h1>
      <p className="text-mute mt-2">Your reservations will show up here.</p><button className="btn-primary px-8 py-3.5 mt-6" onClick={() => openAuth("login")}>Log in</button></div>
  );

  const today = todayISO();
  const groups: Record<Tab, Booking[]> = {
    upcoming: (trips ?? []).filter((b) => b.status === "confirmed" && b.check_out >= today).reverse(),
    past: (trips ?? []).filter((b) => b.status === "confirmed" && b.check_out < today),
    cancelled: (trips ?? []).filter((b) => b.status === "cancelled"),
  };
  const doCancel = async () => {
    if (!cancelling) return;
    try { await api(`/api/bookings/${cancelling.id}/cancel`, { method: "POST" }); toast("Your reservation was cancelled. The dates are open again."); setCancelling(null); load(); }
    catch (e: any) { toast(e.message, "error"); setCancelling(null); }
  };

  return (
    <div className="detail-x py-10">
      <h1 className="text-[32px] font-semibold mb-6">Trips</h1>
      {confirmed && <div className="flex items-center gap-3 bg-[#f0faf4] border border-[#bde5cb] rounded-xl p-4 mb-6"><CheckCircle2 className="text-[#1a7f4b]" /><span>Your trip is booked. Confirmation code <b>{confirmed}</b>.</span></div>}
      <div className="flex gap-2 border-b border-[#ddd] mb-8" role="tablist">
        {(["upcoming", "past", "cancelled"] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`px-4 py-3 capitalize font-medium border-b-2 -mb-px ${tab === t ? "border-ink" : "border-transparent text-mute hover:text-ink"}`}>{t} ({groups[t].length})</button>
        ))}
      </div>
      {err && <p role="alert" className="text-[#c13515]">{err}</p>}
      {trips === null && !err && <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-40 skeleton rounded-xl" />)}</div>}
      {trips && groups[tab].length === 0 && (
        <div className="py-16 text-center border border-dashed border-[#ddd] rounded-2xl">
          <h2 className="text-xl font-semibold">{tab === "upcoming" ? "No trips booked… yet!" : `No ${tab} trips`}</h2>
          <p className="text-mute mt-2">Time to dust off your bags and start planning your next adventure.</p>
          <Link href="/" className="btn-dark inline-block px-6 py-3 mt-6">Start searching</Link>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        {groups[tab].map((b) => (
          <article key={b.id} className={`border rounded-2xl overflow-hidden flex flex-col sm:flex-row ${b.code === confirmed ? "border-ink shadow-card" : "border-[#ddd]"}`}>
            <Link href={`/listings/${b.listing.id}`} className="sm:w-44 h-44 sm:h-auto shrink-0"><SmartImage src={b.listing.image ?? undefined} seed={b.listing.id} alt={b.listing.title} className="w-full h-full object-cover" /></Link>
            <div className="p-5 flex-1 min-w-0 flex flex-col">
              <div className="text-xs text-mute">Confirmation {b.code}</div>
              <Link href={`/listings/${b.listing.id}`} className="font-semibold text-lg hover:underline truncate">{b.listing.title}</Link>
              <div className="text-mute">{b.listing.city}, {b.listing.state} · Hosted by {b.listing.host_name}</div>
              <div className="mt-2 font-medium">{fmtRange(b.check_in, b.check_out)} · {b.nights} night{b.nights > 1 ? "s" : ""} · {b.guests} guest{b.guests > 1 ? "s" : ""}</div>
              <div className="text-mute">Total {inr(b.total)}</div>
              <div className="mt-auto pt-4 flex gap-3">
                {tab === "upcoming" && <button className="btn-ghost px-4 py-2" onClick={() => setCancelling(b)}>Cancel</button>}
                {tab === "past" && <button className="btn-ghost px-4 py-2" onClick={() => setReviewing(b)}>Write a review</button>}
                <Link href={`/listings/${b.listing.id}`} className="btn-ghost px-4 py-2">View listing</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      {cancelling && (
        <Modal title="Cancel reservation" onClose={() => setCancelling(null)}
          footer={<div className="flex justify-between"><button className="underline font-semibold" onClick={() => setCancelling(null)}>Keep reservation</button><button className="btn-dark px-6 py-3" onClick={doCancel}>Cancel reservation</button></div>}>
          <div className="p-6"><p className="text-lg font-semibold">Cancel your stay at {cancelling.listing.title}?</p><p className="text-mute mt-2">{fmtRange(cancelling.check_in, cancelling.check_out)}. You'll get a full refund of {inr(cancelling.total)}.</p></div>
        </Modal>
      )}
      {reviewing && <ReviewModal listingId={reviewing.listing.id} title={reviewing.listing.title} onClose={() => setReviewing(null)} onDone={() => {}} />}
    </div>
  );
}
export default function Page() { return <Suspense><Trips /></Suspense>; }
