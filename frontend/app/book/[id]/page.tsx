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

  const discount = quote ? Math.floor(quote.subtotal * 0.1) : 0;
  const taxes = quote ? Math.floor((quote.subtotal - discount) * 0.05) : 0;
  const finalTotal = quote ? quote.subtotal - discount + taxes : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-10"><button aria-label="Back" onClick={() => router.back()} className="w-8 h-8 flex justify-center items-center rounded-full bg-[#f0f0f0] hover:bg-[#e0e0e0]"><ChevronLeft size={16} /></button><h1 className="text-[32px] font-semibold">Confirm and pay</h1></div>
      <div className="grid lg:grid-cols-[1fr_400px] gap-x-24 gap-y-10">
        <div className="space-y-6">
          {!user ? (
            <>
              <div className="border border-[#ddd] rounded-2xl p-6 flex justify-between items-center shadow-sm">
                <span className="text-lg font-medium">1. Log in or sign up</span>
                <button className="btn-primary px-8 py-3 text-[15px]" onClick={() => openAuth("login")}>Continue</button>
              </div>
              <div className="border border-[#ddd] rounded-2xl p-6 text-[#717171] text-lg">2. Add a payment method</div>
              <div className="border border-[#ddd] rounded-2xl p-6 text-[#717171] text-lg">3. Proceed to payment</div>
            </>
          ) : (
            <>
              <div className="border border-[#ddd] rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-medium mb-6">1. Log in or sign up <span className="text-sm font-normal text-mute ml-2">(Logged in as {user.name})</span></h2>
              </div>
              <div className="border border-[#ddd] rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-medium mb-6">2. Add a payment method</h2>
                <div className="space-y-3">
                  <label className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer ${pay === "card" ? "border-ink bg-soft" : "border-[#ddd]"}`}><span className="flex items-center gap-3"><CreditCard size={22} strokeWidth={1.5} />Credit or debit card</span><input type="radio" name="pay" className="accent-ink w-5 h-5" checked={pay === "card"} onChange={() => setPay("card")} /></label>
                  <label className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer ${pay === "upi" ? "border-ink bg-soft" : "border-[#ddd]"}`}><span className="flex items-center gap-3"><Smartphone size={22} strokeWidth={1.5} />UPI</span><input type="radio" name="pay" className="accent-ink w-5 h-5" checked={pay === "upi"} onChange={() => setPay("upi")} /></label>
                </div>
                {pay === "card" && (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <input className="input col-span-2" placeholder="Card number" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
                    <input className="input" placeholder="MM/YY" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} />
                    <input className="input" placeholder="CVV" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} />
                    <input className="input col-span-2" placeholder="Postal code" value={card.zip} onChange={(e) => setCard({ ...card, zip: e.target.value })} />
                  </div>
                )}
                {pay === "upi" && <input className="input mt-5" placeholder="UPI ID" value={upi} onChange={(e) => setUpi(e.target.value)} />}
              </div>
              <div className="border border-[#ddd] rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-medium mb-6">3. Proceed to payment</h2>
                {(fieldErr || err) && <p role="alert" className="text-[#c13515] mb-3">{fieldErr || err}</p>}
                <button onClick={confirm} disabled={busy || !quote} className="btn-primary w-full py-4 text-base font-semibold">{busy ? "Confirming…" : "Confirm and pay"}</button>
              </div>
            </>
          )}
        </div>
        <aside>
          {l && (
            <div>
              <div className="border border-[#ddd] rounded-2xl p-6 shadow-sm bg-white mb-4">
                <div className="flex gap-4 pb-6 border-b border-[#ddd]">
                  <SmartImage src={l.images[0]} seed={l.id} alt="" className="w-[120px] h-[100px] rounded-lg object-cover" />
                  <div className="min-w-0">
                    <div className="font-semibold text-[15px] line-clamp-3 leading-snug text-[#222]">{l.title}</div>
                    {l.review_count > 0 && <div className="text-[13px] flex items-center gap-1 mt-1 font-medium"><Star size={11} className="fill-ink" />{l.rating.toFixed(2)} ({l.review_count})</div>}
                  </div>
                </div>
                
                <div className="py-6 border-b border-[#ddd]">
                  <div className="font-semibold text-[15px]">Free cancellation</div>
                  <div className="text-[15px] text-[#222] mt-1">Cancel before 15 October for a full refund.</div>
                  <button className="underline text-[15px] font-semibold mt-1">Full policy</button>
                </div>

                <div className="py-6 border-b border-[#ddd] space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-[15px]">Dates</div>
                      <div className="text-[15px] text-[#222] mt-1">{fmtLong(ci).split(',')[0]} - {fmtLong(co).split(',')[0]} {ci.split('-')[0]}</div>
                    </div>
                    <button className="font-semibold text-sm px-3 py-1 bg-[#f0f0f0] rounded-lg hover:bg-[#e0e0e0]">Change</button>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-[15px]">Guests</div>
                      <div className="text-[15px] text-[#222] mt-1">{guests} adult{guests > 1 ? "s" : ""}</div>
                    </div>
                    <button className="font-semibold text-sm px-3 py-1 bg-[#f0f0f0] rounded-lg hover:bg-[#e0e0e0]">Change</button>
                  </div>
                </div>

                <div className="pt-6">
                  <h2 className="text-[22px] font-semibold mb-6">Price details</h2>
                  {quote ? (
                    <div className="space-y-4 text-[15px] text-[#222]">
                      <div className="flex justify-between"><span>{quote.nights} nights x {inr(quote.price_per_night)}</span><span>{inr(quote.subtotal)}</span></div>
                      <div className="flex justify-between text-green-700"><span>Last-minute discount</span><span>-{inr(discount)}</span></div>
                      <div className="flex justify-between"><span>Taxes</span><span>{inr(taxes)}</span></div>
                      <div className="flex justify-between font-bold border-t border-[#ddd] pt-5 mt-5 text-[15px]"><span>Total INR</span><span>{inr(finalTotal)}</span></div>
                      <button className="underline font-semibold text-[15px] mt-2">Price breakdown</button>
                    </div>
                  ) : <div className="h-24 skeleton rounded" />}
                </div>
              </div>
              
              {quote && (
                <div className="bg-[#e7f5e8] rounded-xl p-4 flex items-center justify-center gap-2 text-green-800 font-medium text-[15px]">
                  <span>🏷️</span> {inr(discount)} discount applied
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
export default function Page() { return <Suspense><Checkout /></Suspense>; }
