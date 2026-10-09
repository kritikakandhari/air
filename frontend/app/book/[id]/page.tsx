"use client";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CreditCard, Landmark, Smartphone, Star } from "lucide-react";
import SmartImage from "@/components/SmartImage";
import { api, ListingDetail, Quote, Booking } from "@/lib/api";
import { fmtLong, inr } from "@/lib/dates";
import { useAuth, useToast } from "@/context/Providers";

type Pay = "card" | "upi" | "netbanking";

function Checkout() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const { user, loading, openAuth } = useAuth();
  const { toast } = useToast();
  const ci = sp.get("check_in"), co = sp.get("check_out"), guests = Number(sp.get("guests") || 1);
  const [l, setL] = useState<ListingDetail | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState<Pay>("card");
  const [card, setCard] = useState({ number: "", exp: "", cvv: "", zip: "" });
  const [upi, setUpi] = useState("");
  const [fieldErr, setFieldErr] = useState("");

  useEffect(() => {
    api<ListingDetail>(`/api/listings/${id}`).then(setL).catch((e) => setErr(e.message));
  }, [id]);
  useEffect(() => {
    if (!user || !ci || !co) return;
    api<Quote>(`/api/listings/${id}/quote?check_in=${ci}&check_out=${co}&guests=${guests}`).then(setQuote).catch((e) => setErr(e.message));
  }, [id, ci, co, guests, user]);

  if (!ci || !co) return <div className="py-32 text-center"><h1 className="text-2xl font-semibold">Pick your dates first</h1><Link href={`/listings/${id}`} className="btn-dark inline-block px-6 py-3 mt-6">Back to listing</Link></div>;
  if (!loading && !user) return (
    <div className="py-32 text-center"><h1 className="text-2xl font-semibold">Log in to finish booking</h1><p className="text-mute mt-2">Your dates are saved. Log in and we'll pick up where you left off.</p>
      <button className="btn-primary px-8 py-3.5 mt-6" onClick={() => openAuth("login")}>Log in</button></div>
  );

  const validate = () => {
    if (pay === "card") {
      if (card.number.replace(/\s/g, "").length < 16) return "Enter a valid 16-digit card number";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.exp)) return "Enter the expiry as MM/YY";
      if (card.cvv.length < 3) return "Enter the 3-digit CVV";
      if (card.zip.length < 4) return "Enter your postal code";
    }
    if (pay === "upi" && !/^[\w.\-]{2,}@[\w]{2,}$/.test(upi)) return "Enter a valid UPI ID, e.g. name@bank";
    return "";
  };
  const confirm = async () => {
    const v = validate(); setFieldErr(v); if (v) return;
    setBusy(true); setErr("");
    try {
      const b = await api<Booking>("/api/bookings", { method: "POST", body: { listing_id: Number(id), check_in: ci, check_out: co, guests, payment_method: pay } });
      toast(`Reservation confirmed! Code ${b.code}`);
      router.push(`/trips?confirmed=${b.code}`);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };
  const opt = (k: Pay, label: string, I: any) => (
    <label className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer ${pay === k ? "border-ink bg-soft" : "border-[#ddd]"}`}>
      <span className="flex items-center gap-3"><I size={22} strokeWidth={1.5} />{label}</span>
      <input type="radio" name="pay" className="accent-ink w-5 h-5" checked={pay === k} onChange={() => setPay(k)} />
    </label>
  );

  return (
    <div className="detail-x py-10">
      <div className="flex items-center gap-4 mb-10"><button aria-label="Back" onClick={() => router.back()} className="p-2 rounded-full hover:bg-soft"><ChevronLeft /></button><h1 className="text-[32px] font-semibold">Request to book</h1></div>
      <div className="grid lg:grid-cols-[1fr_440px] gap-x-24 gap-y-10">
        <div className="space-y-8">
          <section>
            <h2 className="text-[22px] font-semibold mb-4">Your trip</h2>
            <div className="flex justify-between py-3"><div><div className="font-semibold">Dates</div><div className="text-mute">{fmtLong(ci)} → {fmtLong(co)}</div></div>
              <Link href={`/listings/${id}?check_in=${ci}&check_out=${co}&guests=${guests}`} className="underline font-semibold">Edit</Link></div>
            <div className="flex justify-between py-3"><div><div className="font-semibold">Guests</div><div className="text-mute">{guests} guest{guests > 1 ? "s" : ""}</div></div>
              <Link href={`/listings/${id}?check_in=${ci}&check_out=${co}&guests=${guests}`} className="underline font-semibold">Edit</Link></div>
          </section>
          <hr className="border-[#ddd]" />
          <section>
            <h2 className="text-[22px] font-semibold mb-4">Pay with</h2>
            <p className="text-mute text-sm mb-4">This is a demo checkout. No real payment is taken.</p>
            <div className="space-y-3">{opt("card", "Credit or debit card", CreditCard)}{opt("upi", "UPI", Smartphone)}{opt("netbanking", "Net banking", Landmark)}</div>
            {pay === "card" && (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <input className="input col-span-2" inputMode="numeric" placeholder="Card number (any 16 digits)" maxLength={19} value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim() })} />
                <input className="input" placeholder="MM/YY" maxLength={5} value={card.exp}
                  onChange={(e) => { let v = e.target.value.replace(/[^\d]/g, ""); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2, 4); setCard({ ...card, exp: v }); }} />
                <input className="input" inputMode="numeric" placeholder="CVV" maxLength={3} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "") })} />
                <input className="input col-span-2" placeholder="Postal code" maxLength={8} value={card.zip} onChange={(e) => setCard({ ...card, zip: e.target.value })} />
              </div>
            )}
            {pay === "upi" && <input className="input mt-5" placeholder="UPI ID (name@bank)" value={upi} onChange={(e) => setUpi(e.target.value)} />}
            {pay === "netbanking" && <p className="mt-5 text-mute">You'll be redirected to your bank in a real checkout. Here we'll just confirm the booking.</p>}
          </section>
          <hr className="border-[#ddd]" />
          <section><h2 className="text-[22px] font-semibold mb-2">Cancellation policy</h2><p className="text-mute">Free cancellation before check-in. After that, the first night is non-refundable.</p></section>
          <hr className="border-[#ddd]" />
          <section>
            <p className="text-xs text-mute mb-4">By selecting the button below, I agree to the House Rules, Ground rules for guests and the Cancellation Policy.</p>
            {(fieldErr || err) && <p role="alert" className="text-[#c13515] mb-3">{fieldErr || err}</p>}
            <button onClick={confirm} disabled={busy || !quote} className="btn-primary px-10 py-4 text-base">{busy ? "Confirming…" : "Confirm and pay"}</button>
          </section>
        </div>
        <aside>
          {l && (
            <div className="sticky top-28 border border-[#ddd] rounded-xl p-6">
              <div className="flex gap-4 pb-6 border-b border-[#ddd]">
                <SmartImage src={l.images[0]} seed={l.id} alt="" className="w-28 h-24 rounded-lg object-cover" />
                <div className="min-w-0"><div className="text-xs text-mute">{l.property_type}</div><div className="font-medium line-clamp-2">{l.title}</div>
                  {l.review_count > 0 && <div className="text-xs flex items-center gap-1 mt-1"><Star size={11} className="fill-ink" />{l.rating.toFixed(2)} ({l.review_count})</div>}</div>
              </div>
              <h2 className="text-[22px] font-semibold my-5">Price details</h2>
              {quote ? (
                <div className="space-y-3 text-base">
                  <div className="flex justify-between"><span>{inr(quote.price_per_night)} × {quote.nights} night{quote.nights > 1 ? "s" : ""}</span><span>{inr(quote.subtotal)}</span></div>
                  <div className="flex justify-between"><span>Cleaning fee</span><span>{inr(quote.cleaning_fee)}</span></div>
                  <div className="flex justify-between"><span>Airbnb service fee</span><span>{inr(quote.service_fee)}</span></div>
                  <div className="flex justify-between font-semibold border-t border-[#ddd] pt-4 mt-4"><span>Total (INR)</span><span>{inr(quote.total)}</span></div>
                </div>
              ) : err ? <p className="text-[#c13515]">{err}</p> : <div className="h-24 skeleton rounded" />}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
export default function Page() { return <Suspense><Checkout /></Suspense>; }
