"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { BadgeCheck, CalendarX, DoorOpen, Heart, MapPin, Medal, Share, Star, ChevronLeft, ChevronRight } from "lucide-react";
import Gallery from "@/components/Gallery";
import ReserveCard from "@/components/ReserveCard";
import DateRangePicker, { Range } from "@/components/DateRangePicker";
import Modal from "@/components/Modal";
import ReviewModal from "@/components/ReviewModal";
import { AmenityIcon } from "@/lib/icons";
import { api, ListingDetail, Review } from "@/lib/api";
import { fmtRange, nightsBetween, inr } from "@/lib/dates";
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
    <>
      <div className="sticky top-20 bg-white z-40 border-b border-[#ddd] hidden md:block">
        <div className="container-x flex justify-between h-20 items-center">
          <div className="flex gap-6 text-sm font-semibold">
            <a href="#" className="hover:underline">Photos</a>
            <a href="#amenities" className="hover:underline">Amenities</a>
            <a href="#reviews" className="hover:underline">Reviews</a>
            <a href="#location" className="hover:underline">Location</a>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="font-bold text-[15px]">{inr(l.price_per_night * (nights || 1))} <span className="text-sm font-normal text-mute">{nights ? `for ${nights} nights` : "night"}</span></div>
              <div className="text-[13px] flex items-center justify-end gap-1 font-medium mt-0.5"><Star size={10} className="fill-ink"/> {l.rating > 0 ? l.rating.toFixed(2) : "5.0"} · {l.review_count || 4} reviews</div>
            </div>
            <a href="#reserve" className="bg-rausch text-white px-6 py-3.5 rounded-lg font-semibold hover:bg-[#d90b50]">Reserve</a>
          </div>
        </div>
      </div>
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
          <h2 className="text-[26px] font-semibold">Entire {l.property_type.toLowerCase()} in {l.city}, {l.country}</h2>
          <p className="text-[#222] mt-1 text-[15px]">{l.max_guests} guests &middot; {l.bedrooms || 1} bedroom{l.bedrooms > 1 ? "s" : ""} &middot; {l.beds} bed{l.beds > 1 ? "s" : ""} &middot; {l.bathrooms} bathroom{l.bathrooms > 1 ? "s" : ""}</p>
          <div className="flex items-center gap-2 font-medium text-[15px] mt-1">
             <Star size={14} className="fill-current" /> {l.rating > 0 ? l.rating.toFixed(2) : "5.0"} <span className="underline">{l.review_count || 4} reviews</span>
          </div>
          {divider}
          <div className="flex items-center gap-4">
            <div className="relative">
               <img src={l.host.avatar_url || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop"} alt="" className="w-[50px] h-[50px] rounded-full bg-[#eee] object-cover" />
               {l.host.is_superhost && <div className="absolute -bottom-1 -right-1 bg-rausch text-white rounded-full p-0.5"><Medal size={12}/></div>}
            </div>
            <div>
               <div className="font-semibold text-base">Hosted by {l.host.name || "Bhavesh"}</div>
               <div className="text-mute text-sm">{l.host.is_superhost ? "Superhost · " : ""}Hosting since {l.host.joined_year || "2018"}</div>
            </div>
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
          <div className="flex justify-between items-end mb-6">
             <h2 className="text-[22px] font-semibold">Where you'll sleep</h2>
             <div className="flex items-center gap-4">
               <span className="text-sm font-medium">1 / {Math.max(2, l.bedrooms)}</span>
               <div className="flex items-center gap-2">
                 <button className="w-8 h-8 rounded-full border border-[#ddd] flex items-center justify-center hover:shadow-md text-mute"><ChevronLeft size={16}/></button>
                 <button className="w-8 h-8 rounded-full border border-[#ddd] flex items-center justify-center hover:shadow-md"><ChevronRight size={16}/></button>
               </div>
             </div>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6 lg:mx-0 lg:px-0 snap-x">
            {Array.from({ length: Math.max(2, l.bedrooms) }).map((_, i) => (
              <div key={i} className="min-w-[280px] max-w-[280px] shrink-0 snap-start">
                <img src={l.images[(i + 1) % l.images.length]} className="w-full aspect-[4/3] object-cover rounded-xl mb-4" alt={`Bedroom ${i + 1}`} />
                <div className="font-semibold text-[15px]">Bedroom {i + 1}</div>
                <div className="text-mute text-sm mt-0.5">1 queen bed</div>
              </div>
            ))}
          </div>
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
        <aside className="hidden lg:block">
          <div className="sticky top-28 mt-1">
            <div className="border border-[#ddd] rounded-xl p-6 flex items-start gap-4 mb-6 shadow-sm">
              <span className="text-green-600 mt-1"><BadgeCheck size={28} /></span>
              <div>
                <div className="font-semibold text-base text-[#222]">Lower price.</div>
                <div className="text-[15px] text-mute mt-1">Your dates are ₹2,886 less than the avg. nightly rate over the last 60 days.</div>
              </div>
            </div>
            <ReserveCard l={l} ci={ci} co={co} guests={guests} booked={booked} setDates={setDates} setGuests={setGuests} />
            <div className="text-center mt-6">
               <button className="flex items-center justify-center gap-2 mx-auto text-mute text-sm underline hover:text-ink font-medium"><span className="text-lg mb-1">🏁</span> Report this listing</button>
            </div>
          </div>
        </aside>
      </div>
      <div className="lg:hidden mt-8">
        <ReserveCard l={l} ci={ci} co={co} guests={guests} booked={booked} setDates={setDates} setGuests={setGuests} />
      </div>

      {divider}
      <section id="reviews">
        <div className="mb-8">
          <h2 className="text-[26px] font-semibold flex items-center gap-2">{l.review_count > 0 ? <><Star size={24} className="fill-ink" />{l.rating.toFixed(1)} · {l.review_count} reviews</> : "No reviews yet"}</h2>
          <button className="underline text-sm font-medium mt-1 text-mute">How reviews work</button>
        </div>
        {l.review_count > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
              <div>
                <div className="text-[13px] font-medium mb-1">Overall rating</div>
                <div className="flex flex-col gap-0.5">
                  {[5,4,3,2,1].map(n => (
                    <div key={n} className="flex items-center gap-2">
                      <span className="text-xs w-2 text-right">{n}</span>
                      <div className="h-1 bg-[#ddd] rounded-full flex-1 overflow-hidden">
                        <div className="h-full bg-[#222]" style={{ width: n === 5 ? "95%" : n === 4 ? "5%" : "0%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {[["Cleanliness", "5.0", "✨"], ["Accuracy", "5.0", "✔️"], ["Check-in", "5.0", "🔑"], ["Communication", "5.0", "💬"], ["Location", "4.8", "🗺️"], ["Value", "5.0", "🏷️"]].map(([lbl, val, icon]) => (
                <div key={lbl} className="flex flex-col pt-1 border-l border-[#ddd] pl-4 md:border-l-0 md:pl-0">
                  <div className="text-[13px] font-medium">{lbl}</div>
                  <div className="text-[15px] font-semibold mt-1">{val}</div>
                  <div className="text-2xl mt-auto pt-2">{icon}</div>
                </div>
              ))}
            </div>
            <div className="mb-10">
              <h3 className="text-lg font-semibold mb-4">Guests mention</h3>
              <div className="flex gap-3 flex-wrap">
                <div className="px-4 py-1.5 rounded-full border border-[#ddd] flex items-center gap-2 text-sm font-medium shadow-sm"><span className="text-base">🛋️</span> Comfort 4</div>
                <div className="px-4 py-1.5 rounded-full border border-[#ddd] flex items-center gap-2 text-sm font-medium shadow-sm"><span className="text-base">🧹</span> Cleanliness 4</div>
                <div className="px-4 py-1.5 rounded-full border border-[#ddd] flex items-center gap-2 text-sm font-medium shadow-sm bg-soft"><span className="text-base">🎁</span> Hospitality 3</div>
              </div>
            </div>
          </>
        )}
        <div className="flex items-center justify-between mb-6">
           <div />
           <button className="bg-[#f0f0f0] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#e0e0e0] text-sm" onClick={() => (user ? setReviewing(true) : openAuth("login", () => setReviewing(true)))}>Write a review</button>
        </div>
        <div className="grid md:grid-cols-2 gap-x-24 gap-y-8">
          {shownReviews.map((r) => (
            <article key={r.id}>
              <div className="flex items-center gap-3 mb-3">
                <img src={r.user.avatar_url || ""} alt="" className="w-11 h-11 rounded-full bg-[#eee]" />
                <div>
                  <div className="font-semibold text-base">{r.user.name.split(" ")[0]}</div>
                  <div className="text-mute text-sm">{r.user.name.length % 5 + 2} years on Airbnb</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs mb-2">
                <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} size={10} className={i <= r.rating ? "fill-ink" : "fill-transparent text-[#ddd]"} />)}</div>
                <span>·</span>
                <span className="font-medium">{r.id % 12 + 2} {r.id % 12 + 2 === 1 ? "day" : "days"} ago</span>
              </div>
              <p className="mt-2 text-base leading-6 line-clamp-3">{r.comment}</p>
              {r.comment.length > 100 && <button className="underline font-medium text-[15px] mt-1">Show more</button>}
            </article>
          ))}
        </div>
        {reviews.length > 6 && !showAllReviews && <button className="btn-ghost px-6 py-3.5 mt-8" onClick={() => setShowAllReviews(true)}>Show all {reviews.length} reviews</button>}
      </section>
      {divider}
      <section>
        <h2 className="text-[22px] font-semibold mb-2">Where you'll be</h2>
        <p className="text-mute mb-5">{l.city}, {l.state}, {l.country}</p>
        <div className="w-full h-[380px] md:h-[480px] rounded-xl bg-[#e5e5e5] border border-[#ddd]"></div>
      </section>
      {divider}
      <section className="grid md:grid-cols-2 gap-12 max-w-5xl">
        <div>
          <h2 className="text-[22px] font-semibold mb-6">Meet your host</h2>
          <div className="bg-white rounded-3xl shadow-[0_6px_16px_rgba(0,0,0,0.12)] p-6 flex flex-col items-center max-w-sm mb-8 border border-[#ddd]">
            <div className="flex w-full items-center justify-around">
               <div className="flex flex-col items-center">
                 <div className="relative">
                   <img src={l.host.avatar_url || ""} alt="" className="w-24 h-24 rounded-full bg-[#eee] mb-2 object-cover" />
                   {l.host.is_superhost && <div className="absolute bottom-2 right-0 bg-rausch text-white p-1 rounded-full border-2 border-white"><BadgeCheck size={14} /></div>}
                 </div>
                 <h3 className="text-2xl font-semibold mt-2">{l.host.name.split(" ")[0]}</h3>
                 <div className="text-mute text-sm">Host</div>
               </div>
               <div className="flex flex-col gap-4">
                 <div>
                   <div className="font-semibold text-xl">{l.review_count || 4}</div>
                   <div className="text-[11px] font-semibold">Reviews</div>
                 </div>
                 <hr className="w-full border-[#ddd]"/>
                 <div>
                   <div className="font-semibold text-xl flex items-center">{l.rating > 0 ? l.rating.toFixed(1) : "5.0"}<Star size={14} className="fill-ink ml-1"/></div>
                   <div className="text-[11px] font-semibold">Rating</div>
                 </div>
               </div>
            </div>
          </div>
          <div className="space-y-4 mb-6">
            <div className="flex gap-4 text-base items-start">
              <span className="text-2xl leading-none">🎓</span>
              <div>Where I went to school: Navy children school and Kc college-BOM</div>
            </div>
            <div className="flex gap-4 text-base items-start">
              <span className="text-2xl leading-none">💼</span>
              <div>My work: Hospitality founder</div>
            </div>
          </div>
          <p className="text-base leading-6">{l.host.bio}</p>
        </div>
        <div className="pt-14">
          <div className="mb-8">
            <h3 className="font-semibold text-base mb-4">Co-Hosts</h3>
            <div className="flex items-center gap-3">
              <img src="https://api.dicebear.com/7.x/initials/svg?seed=Yuvraj" className="w-10 h-10 rounded-full" alt="Yuvraj" />
              <div className="text-sm font-medium">Yuvraj</div>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold text-base mb-3">Host details</h3>
            <div className="text-base space-y-1">
              <div>Response rate: 100%</div>
              <div>Responds within an hour</div>
            </div>
          </div>
          <button className="bg-[#f0f0f0] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#e0e0e0] mb-8" onClick={() => toast("Messaging is coming soon", "info")}>Message host</button>
          <hr className="border-[#ddd] mb-6 max-w-sm"/>
          <div className="flex gap-4 items-center text-xs text-mute max-w-sm">
             <span className="text-2xl">🛡️</span>
             To help protect your payment, always use Airbnb to send money and communicate with hosts.
          </div>
        </div>
      </section>
      
      {divider}
      <section className="pb-12">
        <h2 className="text-[22px] font-semibold mb-6">Explore other options in and around {l.city}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 mb-10">
          {[
            {n:"Panaji",t:"Holiday rentals"}, {n:"Baga",t:"Holiday rentals"}, {n:"Dona Paula",t:"Holiday rentals"},
            {n:"Anjuna",t:"Holiday rentals"}, {n:"Pune",t:"Holiday rentals"}, {n:"Mumbai",t:"Holiday rentals"},
            {n:"Lonavala",t:"Holiday rentals"}, {n:"Mahabaleshwar",t:"Holiday rentals"}
          ].map((x,i) => (
            <div key={i} className="text-[15px] cursor-pointer group">
              <div className="font-medium group-hover:underline">{x.n}</div>
              <div className="text-mute">{x.t}</div>
            </div>
          ))}
        </div>
        <div className="text-[13px] flex items-center gap-2">
           <span className="text-mute">Airbnb &gt; India &gt; Goa &gt; </span>
           <span className="font-medium text-[#222]">{l.city}</span>
        </div>
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
    </>
  );
}

export default function Page() { return <Suspense><Detail /></Suspense>; }
