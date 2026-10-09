"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { BadgeCheck, CalendarX, DoorOpen, Heart, MapPin, Medal, Share, Star } from "lucide-react";
import Gallery from "@/components/Gallery";
import ReserveCard from "@/components/ReserveCard";
import DateRangePicker, { Range } from "@/components/DateRangePicker";
import Modal from "@/components/Modal";
import ReviewModal from "@/components/ReviewModal";
import { AmenityIcon } from "@/lib/icons";
import { api, ListingDetail, Review } from "@/lib/api";
import { fmtRange, nightsBetween } from "@/lib/dates";
import { useAuth, useToast } from "@/context/Providers";

function Stars({ n }: { n: number }) { return <span className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={12} className={i <= n ? "fill-ink" : "fill-transparent"} />)}</span>; }

function Detail() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const { user, openAuth, wishlist, toggleWishlist } = useAuth();
  const { toast } = useToast();
  const [l, setL] = useState<ListingDetail | null>(null);
  const [notFound, setNotFound] = useState("");
  const [booked, setBooked] = useState<Range[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ci, setCi] = useState<string | null>(sp.get("check_in"));
  const [co, setCo] = useState<string | null>(sp.get("check_out"));
  const [guests, setGuests] = useState(Number(sp.get("guests") || 1));
  const [allAmenities, setAllAmenities] = useState(false);
  const [more, setMore] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const loadReviews = useCallback(() => {
    api<Review[]>(`/api/listings/${id}/reviews`).then(setReviews).catch(() => {});
    api<ListingDetail>(`/api/listings/${id}`).then(setL).catch(() => {});
  }, [id]);
  useEffect(() => {
    api<ListingDetail>(`/api/listings/${id}`).then(setL).catch((e) => setNotFound(e.message));
    api<{ booked: Range[] }>(`/api/listings/${id}/availability`).then((r) => setBooked(r.booked)).catch(() => {});
    api<Review[]>(`/api/listings/${id}/reviews`).then(setReviews).catch(() => {});
  }, [id]);
  useEffect(() => { if (l && guests > l.max_guests) setGuests(l.max_guests); }, [l, guests]);

  if (notFound) return <div className="detail-x py-32 text-center"><h1 className="text-2xl font-semibold">This listing isn't available</h1><p className="text-mute mt-2">{notFound}</p></div>;
  if (!l) return <div className="detail-x py-10"><div className="h-8 w-2/3 skeleton rounded" /><div className="h-[400px] skeleton rounded-xl mt-6" /></div>;

  const saved = wishlist.has(l.id);
  const nights = ci && co ? nightsBetween(ci, co) : 0;
  const share = async () => { try { await navigator.clipboard.writeText(window.location.href); toast("Link copied to clipboard"); } catch { toast("Couldn't copy the link", "error"); } };
  const setDates = (a: string | null, b: string | null) => { setCi(a); setCo(b); };
  const shownReviews = showAllReviews ? reviews : reviews.slice(0, 6);
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${l.lng - 0.06}%2C${l.lat - 0.04}%2C${l.lng + 0.06}%2C${l.lat + 0.04}&layer=mapnik&marker=${l.lat}%2C${l.lng}`;
  const divider = <hr className="border-[#ddd] my-8" />;

  return (
    <div className="detail-x pt-6 pb-24 lg:pb-10">
      <h1 className="text-[26px] font-semibold leading-tight">{l.title}</h1>
      <div className="flex items-center justify-between mt-2 mb-6 text-sm">
        <div className="flex items-center gap-2 flex-wrap font-medium">
          {l.review_count > 0 && <><Star size={14} className="fill-ink" /><span>{l.rating.toFixed(2)}</span><span>·</span><a href="#reviews" className="underline">{l.review_count} reviews</a><span>·</span></>}
          {l.host.is_superhost && <><span className="flex items-center gap-1"><Medal size={14} />Superhost</span><span>·</span></>}
          <span className="underline">{l.city}, {l.state}, {l.country}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={share} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-soft underline font-medium"><Share size={16} />Share</button>
          <button onClick={() => toggleWishlist(l.id)} aria-pressed={saved} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-soft underline font-medium">
            <Heart size={16} className={saved ? "fill-rausch text-rausch" : ""} />{saved ? "Saved" : "Save"}</button>
        </div>
      </div>

      <Gallery images={l.images} title={l.title} id={l.id} />

      <div className="grid lg:grid-cols-[1fr_380px] gap-x-24 mt-8">
        <div>
          <h2 className="text-[22px] font-semibold">{l.property_type} hosted by {l.host.name}</h2>
          <p className="text-mute mt-1">{l.max_guests} guests · {l.bedrooms || 1} bedroom{l.bedrooms > 1 ? "s" : ""} · {l.beds} bed{l.beds > 1 ? "s" : ""} · {l.bathrooms} bathroom{l.bathrooms > 1 ? "s" : ""}</p>
          {divider}
          <div className="flex items-center gap-4">
            <img src={l.host.avatar_url || ""} alt="" className="w-12 h-12 rounded-full bg-[#eee]" />
            <div><div className="font-semibold">Hosted by {l.host.name}</div><div className="text-mute text-sm">{l.host.is_superhost ? "Superhost · " : ""}Hosting since {l.host.joined_year}</div></div>
          </div>
          {divider}
          <div className="space-y-6">
            {[[DoorOpen, "Self check-in", "Check yourself in with the lockbox."], [MapPin, "Great location", "Recent guests gave the location a 5-star rating."], [CalendarX, "Free cancellation", "Cancel any time before check-in for a full refund."]].map(([I, t, d]: any) => (
              <div key={t} className="flex gap-4"><I size={24} strokeWidth={1.5} /><div><div className="font-semibold">{t}</div><div className="text-mute text-sm">{d}</div></div></div>
            ))}
          </div>
          {divider}
          <p className={`whitespace-pre-line text-base leading-6 ${more ? "" : "line-clamp-5"}`}>{l.description}</p>
          <button onClick={() => setMore(!more)} className="font-semibold underline mt-3">{more ? "Show less" : "Show more"}</button>
          {divider}
          <h2 className="text-[22px] font-semibold mb-6">What this place offers</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {l.amenities.slice(0, 8).map((a) => <div key={a.id} className="flex items-center gap-4 text-base"><AmenityIcon name={a.icon} />{a.name}</div>)}
          </div>
          {l.amenities.length > 8 && <button onClick={() => setAllAmenities(true)} className="btn-ghost px-6 py-3.5 mt-8">Show all {l.amenities.length} amenities</button>}
          {divider}
          <h2 className="text-[22px] font-semibold">{nights ? `${nights} night${nights > 1 ? "s" : ""} in ${l.city}` : "Select check-in date"}</h2>
          <p className="text-mute text-sm mt-1 mb-6">{ci && co ? fmtRange(ci, co) : "Add your travel dates for exact pricing. Crossed-out dates are already booked."}</p>
          <DateRangePicker checkIn={ci} checkOut={co} booked={booked} onChange={setDates} />
          {(ci || co) && <div className="text-right"><button className="underline font-semibold text-sm" onClick={() => setDates(null, null)}>Clear dates</button></div>}
        </div>
        <aside className="hidden lg:block"><div className="sticky top-28 mt-1"><ReserveCard l={l} ci={ci} co={co} guests={guests} booked={booked} setDates={setDates} setGuests={setGuests} /></div></aside>
      </div>
      <div className="lg:hidden mt-8"><ReserveCard l={l} ci={ci} co={co} guests={guests} booked={booked} setDates={setDates} setGuests={setGuests} /></div>

      {divider}
      <section id="reviews">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
          <h2 className="text-[22px] font-semibold flex items-center gap-2">{l.review_count > 0 ? <><Star size={20} className="fill-ink" />{l.rating.toFixed(2)} · {l.review_count} reviews</> : "No reviews yet"}</h2>
          <button className="btn-ghost px-5 py-2.5" onClick={() => (user ? setReviewing(true) : openAuth("login", () => setReviewing(true)))}>Write a review</button>
        </div>
        <div className="grid md:grid-cols-2 gap-x-24 gap-y-8">
          {shownReviews.map((r) => (
            <article key={r.id}>
              <div className="flex items-center gap-3 mb-3"><img src={r.user.avatar_url || ""} alt="" className="w-10 h-10 rounded-full bg-[#eee]" />
                <div><div className="font-semibold">{r.user.name}</div><div className="text-mute text-sm">{new Date(r.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div></div></div>
              <Stars n={r.rating} /><p className="mt-2 text-base leading-6">{r.comment}</p>
            </article>
          ))}
        </div>
        {reviews.length > 6 && !showAllReviews && <button className="btn-ghost px-6 py-3.5 mt-8" onClick={() => setShowAllReviews(true)}>Show all {reviews.length} reviews</button>}
      </section>
      {divider}
      <section>
        <h2 className="text-[22px] font-semibold mb-2">Where you'll be</h2>
        <p className="text-mute mb-5">{l.city}, {l.state}, {l.country}</p>
        <iframe title={`Map of ${l.city}`} src={mapSrc} className="w-full h-[380px] md:h-[480px] rounded-xl border-0" loading="lazy" />
      </section>
      {divider}
      <section className="max-w-xl">
        <div className="flex items-center gap-4 mb-5"><img src={l.host.avatar_url || ""} alt="" className="w-16 h-16 rounded-full bg-[#eee]" />
          <div><h2 className="text-[22px] font-semibold">Hosted by {l.host.name}</h2><div className="text-mute">{l.host.is_superhost ? "Superhost · " : ""}Hosting since {l.host.joined_year}</div></div></div>
        {l.host.is_superhost && <p className="flex items-center gap-2 font-medium mb-3"><BadgeCheck size={18} />{l.host.name.split(" ")[0]} is a Superhost</p>}
        <p>{l.host.bio}</p>
        <button className="btn-dark px-6 py-3.5 mt-6" onClick={() => toast("Messaging is coming soon", "info")}>Message host</button>
      </section>

      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#ddd] px-4 py-3 flex items-center justify-between z-40">
        <div><div><b className="text-base">₹{l.price_per_night.toLocaleString("en-IN")}</b> night</div>{ci && co && <div className="text-xs underline">{fmtRange(ci, co)}</div>}</div>
        <a href="#reserve" className="btn-primary px-6 py-3">Reserve</a>
      </div>

      {allAmenities && (
        <Modal title="What this place offers" onClose={() => setAllAmenities(false)}>
          <div className="p-6 divide-y divide-[#ebebeb]">{l.amenities.map((a) => <div key={a.id} className="flex items-center gap-4 py-4 text-base"><AmenityIcon name={a.icon} />{a.name}</div>)}</div>
        </Modal>
      )}
      {reviewing && <ReviewModal listingId={l.id} title={l.title} onClose={() => setReviewing(false)} onDone={loadReviews} />}
    </div>
  );
}

export default function Page() { return <Suspense><Detail /></Suspense>; }
