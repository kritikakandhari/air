"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CategoryBar from "@/components/CategoryBar";
import ListingCard, { CardSkeleton } from "@/components/ListingCard";
import FiltersModal, { EMPTY_FILTERS, Filters } from "@/components/FiltersModal";
import { api, Listing, Meta } from "@/lib/api";
import { nightsBetween } from "@/lib/dates";
import { SearchX } from "lucide-react";

const PAGE_SIZE = 12;

function Explore() {
  const sp = useSearchParams();
  const router = useRouter();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [items, setItems] = useState<Listing[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const reqId = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);

  // everything except pagination lives in the URL, so searches are shareable and survive refresh
  const baseQuery = useMemo(() => {
    const p = new URLSearchParams(sp.toString()); p.delete("page"); return p.toString();
  }, [sp]);
  const category = sp.get("category");
  const q = sp.get("q"), ci = sp.get("check_in"), co = sp.get("check_out");
  const nights = ci && co ? nightsBetween(ci, co) : 0;
  const filters: Filters = {
    min_price: sp.get("min_price") ? Number(sp.get("min_price")) : null, max_price: sp.get("max_price") ? Number(sp.get("max_price")) : null,
    property_type: (sp.get("property_type") || "").split(",").filter(Boolean), bedrooms: Number(sp.get("bedrooms") || 0),
    amenities: (sp.get("amenities") || "").split(",").filter(Boolean).map(Number),
  };
  const filterCount = (filters.min_price !== null || filters.max_price !== null ? 1 : 0) + (filters.property_type.length ? 1 : 0) + (filters.bedrooms ? 1 : 0) + filters.amenities.length;

  useEffect(() => { api<Meta>("/api/listings/meta").then(setMeta).catch(() => {}); }, []);

  const load = useCallback(async (pg: number, reset: boolean) => {
    const id = ++reqId.current;
    setLoading(true); setError("");
    try {
      const r = await api<{ items: Listing[]; total: number; has_more: boolean }>(`/api/listings?${baseQuery}&page=${pg}&page_size=${PAGE_SIZE}`);
      if (id !== reqId.current) return; // a newer search superseded this one
      setItems((prev) => (reset ? r.items : [...prev, ...r.items]));
      setTotal(r.total); setHasMore(r.has_more); setPage(pg);
    } catch (e: any) { if (id === reqId.current) setError(e.message); }
    finally { if (id === reqId.current) setLoading(false); }
  }, [baseQuery]);

  useEffect(() => { setItems([]); setTotal(null); load(1, true); }, [load]);

  useEffect(() => {  // infinite scroll
    const el = sentinel.current; if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting && hasMore && !loading) load(page + 1, false); }, { rootMargin: "600px" });
    io.observe(el); return () => io.disconnect();
  }, [hasMore, loading, page, load]);

  const update = (mut: (p: URLSearchParams) => void) => { const p = new URLSearchParams(sp.toString()); mut(p); router.push(`/?${p.toString()}`); };
  const applyFilters = (f: Filters) => {
    update((p) => {
      ["min_price", "max_price", "property_type", "bedrooms", "amenities"].forEach((k) => p.delete(k));
      if (f.min_price !== null) p.set("min_price", String(f.min_price));
      if (f.max_price !== null) p.set("max_price", String(f.max_price));
      if (f.property_type.length) p.set("property_type", f.property_type.join(","));
      if (f.bedrooms) p.set("bedrooms", String(f.bedrooms));
      if (f.amenities.length) p.set("amenities", f.amenities.join(","));
    });
    setShowFilters(false);
  };
  const searching = !!(q || ci || sp.get("guests") || filterCount || category);
  const cardQuery = ci && co ? `?check_in=${ci}&check_out=${co}&guests=${sp.get("guests") || 1}` : sp.get("guests") ? `?guests=${sp.get("guests")}` : "";

  return (
    <>
      <div className="container-x pt-6">
        {searching && total !== null && !error && (
          <h1 className="text-base font-semibold mb-4">{total} {total === 1 ? "stay" : "stays"}{q ? ` in "${q}"` : ""}{nights ? ` - ${nights} night${nights > 1 ? "s" : ""}` : ""}</h1>
        )}
        {error && <div role="alert" className="py-20 text-center"><p className="text-lg font-semibold">We couldn't load stays</p><p className="text-mute mt-1">{error}</p><button className="btn-dark px-5 py-3 mt-5" onClick={() => load(1, true)}>Try again</button></div>}
        {!error && total === 0 && !loading && (
          <div className="py-24 text-center max-w-md mx-auto">
            <SearchX size={40} strokeWidth={1.3} className="mx-auto mb-4" />
            <h2 className="text-2xl font-semibold">No exact matches</h2>
            <p className="text-mute mt-2">Try changing or removing some of your filters or adjusting your search area.</p>
            <button className="btn-ghost px-5 py-3 mt-6" onClick={() => router.push("/")}>Remove all filters</button>
          </div>
        )}
        {searching || items.length === 0 ? (
          <div className="grid gap-x-6 gap-y-10 grid-cols-1 min-[550px]:grid-cols-2 min-[950px]:grid-cols-3 min-[1128px]:grid-cols-4 min-[1440px]:grid-cols-5 min-[1760px]:grid-cols-6">
            {items.map((l) => <ListingCard key={l.id} l={l} query={cardQuery} nights={nights} />)}
            {loading && Array.from({ length: items.length ? 4 : 12 }).map((_, i) => <CardSkeleton key={`s${i}`} />)}
          </div>
        ) : (
          <div className="space-y-14 pb-12 mt-4">
            <Section title="Popular homes in North Goa" subtitle="Indian coast with beach shacks" items={items.filter(l => l.city.includes("Goa") || l.city === "Candolim" || l.city === "Calangute" || l.city === "Mapusa" || l.city === "Assagao" || l.city === "Vagator")} loading={loading} />
            <Section title="Available in Lonavala this weekend" subtitle="Hill town near Mumbai with ancient caves" items={items.filter(l => l.city === "Lonavala" || l.state === "Maharashtra")} loading={loading} />
            <Section title="Stay in Pune" subtitle="Maharashtra's university and culture hub" items={items.filter(l => l.city === "Pune" || (l.state === "Maharashtra" && l.city != "Lonavala"))} loading={loading} />
            <Section title="Available in Karjat this weekend" subtitle="Hill town near Mumbai with treks" items={items.filter(l => l.city === "Karjat" || l.category === "camping" || l.category === "treehouses")} loading={loading} />
            
            <div className="relative">
              <h2 className="text-[22px] font-semibold mb-4">Explore experiences nearby</h2>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-4">
                {[{title:"Guided tours", img:"https://images.unsplash.com/photo-1533105079780-92b9be482077?w=300&h=200&fit=crop"},{title:"Landmarks", img:"https://images.unsplash.com/photo-1548013146-72479768bada?w=300&h=200&fit=crop"},{title:"Food tours", img:"https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop"},{title:"Outdoors", img:"https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=300&h=200&fit=crop"},{title:"Cooking", img:"https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300&h=200&fit=crop"},{title:"Art & culture", img:"https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=300&h=200&fit=crop"}].map((x,i) => (
                  <div key={i} className="min-w-[140px] md:min-w-[180px] snap-start">
                    <img src={x.img} alt={x.title} className="w-full aspect-[4/3] object-cover rounded-xl mb-2" />
                    <div className="text-sm font-medium">{x.title}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <h2 className="text-[22px] font-semibold mb-4">Popular experiences in Mumbai</h2>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-4">
                {[{title:"Dharavi Slum Tour with First and Third gen Locals", p:"1,391", img:"https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=300&h=400&fit=crop"},{title:"Mumbai Street Food and Colorful Market Tour", p:"1,500", img:"https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=400&fit=crop"},{title:"Explore Hidden Gems of Mumbai in Air Con", p:"2,800", img:"https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300&h=400&fit=crop"},{title:"Mumbai Sightseeing. More Than Just A City Tour", p:"2,000", img:"https://images.unsplash.com/photo-1506461883276-594540eb36b6?w=300&h=400&fit=crop"}].map((x,i) => (
                  <div key={i} className="min-w-[160px] md:min-w-[200px] snap-start group cursor-pointer relative">
                    <img src={x.img} alt={x.title} className="w-full aspect-[3/4] object-cover rounded-xl mb-2" />
                    <div className="absolute top-3 left-3 bg-white/90 px-2 py-0.5 rounded-full text-xs font-bold shadow">Trending</div>
                    <div className="text-sm font-medium truncate">{x.title}</div>
                    <div className="text-sm">From ₹{x.p} / person</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <h2 className="text-[22px] font-semibold mb-4">Find services near you</h2>
              <div className="flex gap-8 overflow-x-auto hide-scrollbar snap-x pb-4">
                {[{title:"Photographer", i:"📷"},{title:"Chefs", i:"🧑‍🍳"},{title:"Training", i:"🏋️"},{title:"Makeup", i:"💄"},{title:"Hair", i:"💇"}].map((x,i) => (
                  <div key={i} className="min-w-[80px] flex flex-col items-center gap-2 snap-start">
                    <div className="w-16 h-16 rounded-full bg-[#f0f0f0] flex items-center justify-center text-3xl shadow-sm">{x.i}</div>
                    <div className="text-xs font-medium">{x.title}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-[22px] font-semibold flex items-center gap-2">
                  Capture memories nearby <button className="w-6 h-6 rounded-full border border-[#ddd] flex items-center justify-center hover:shadow-md"><ChevronRight size={14}/></button>
                </h2>
                <div className="hidden md:flex gap-2">
                  <button className="w-8 h-8 rounded-full border border-[#ddd] flex items-center justify-center hover:shadow-md text-mute"><ChevronLeft size={16}/></button>
                  <button className="w-8 h-8 rounded-full border border-[#ddd] flex items-center justify-center hover:shadow-md"><ChevronRight size={16}/></button>
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-4">
                {[{title:"Taj Mahal Photoshoots", p:"4,500", img:"https://images.unsplash.com/photo-1548013146-72479768bada?w=300&h=200&fit=crop"},{title:"Cinematic Videography", p:"8,000", img:"https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300&h=200&fit=crop"},{title:"Couple portraits", p:"3,500", img:"https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=300&h=200&fit=crop"}].map((x,i) => (
                  <div key={i} className="min-w-[200px] md:min-w-[280px] snap-start group cursor-pointer relative">
                    <img src={x.img} alt={x.title} className="w-full aspect-[4/3] object-cover rounded-xl mb-2" />
                    <div className="text-sm font-medium truncate">{x.title}</div>
                    <div className="text-sm">From ₹{x.p} / group</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
        <div ref={sentinel} className="h-10" />
        {searching && !loading && !hasMore && items.length > 0 && <p className="text-center text-mute text-sm pb-4">You've seen all {total} stays</p>}
      </div>

      {!searching && (
        <div className="bg-[#f7f7f7] border-t border-[#ddd] py-12 px-6 md:px-10 mt-12">
          <div className="container-x">
            <h2 className="text-[22px] font-semibold mb-6">Inspiration for future getaways</h2>
            <div className="flex gap-6 border-b border-[#ddd] mb-8 overflow-x-auto hide-scrollbar text-sm font-medium text-mute pb-2">
              <button className="text-ink border-b-2 border-ink pb-2 -mb-[9px]">Popular</button>
              <button className="hover:border-b-2 hover:border-[#ddd] pb-2 -mb-[9px]">Arts & culture</button>
              <button className="hover:border-b-2 hover:border-[#ddd] pb-2 -mb-[9px]">Outdoors</button>
              <button className="hover:border-b-2 hover:border-[#ddd] pb-2 -mb-[9px]">Mountains</button>
              <button className="hover:border-b-2 hover:border-[#ddd] pb-2 -mb-[9px]">Beach</button>
              <button className="hover:border-b-2 hover:border-[#ddd] pb-2 -mb-[9px]">Unique stays</button>
              <button className="hover:border-b-2 hover:border-[#ddd] pb-2 -mb-[9px]">Categories</button>
              <button className="hover:border-b-2 hover:border-[#ddd] pb-2 -mb-[9px]">Things to do</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-y-6 gap-x-4">
              {[{n:"Canmore",t:"Apartment rentals"},{n:"Benalmádena",t:"Beach house rentals"},{n:"Marbella",t:"Villa rentals"},{n:"Mijas",t:"House rentals"},{n:"Prescott",t:"Cabin rentals"},{n:"Scottsdale",t:"Mansion rentals"},{n:"Tucson",t:"Pet-friendly rentals"},{n:"Jasper",t:"Cabin rentals"},{n:"Mountain View",t:"Pet-friendly rentals"},{n:"Devonport",t:"Cottage rentals"},{n:"Mallacoota",t:"Pet-friendly rentals"},{n:"Ibiza",t:"Holiday rentals"}].map((l,i) => (
                <div key={i} className="text-[15px] cursor-pointer group">
                  <div className="font-medium group-hover:underline">{l.n}</div>
                  <div className="text-mute">{l.t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showFilters && meta && <FiltersModal meta={meta} initial={filters} baseQuery={baseQuery} onApply={applyFilters} onClose={() => setShowFilters(false)} />}
    </>
  );
}

import { ChevronLeft, ChevronRight } from "lucide-react";

function Section({ title, subtitle, items, loading }: { title: string, subtitle?: string, items: Listing[], loading: boolean }) {
  if (!items.length && !loading) return null;
  return (
    <div className="relative">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-[22px] font-semibold flex items-center gap-2">
            {title} <button className="w-6 h-6 rounded-full border border-[#ddd] flex items-center justify-center hover:shadow-md"><ChevronRight size={14}/></button>
          </h2>
          {subtitle && <p className="text-mute text-[15px]">{subtitle}</p>}
        </div>
        <div className="hidden md:flex gap-2">
          <button className="w-8 h-8 rounded-full border border-[#ddd] flex items-center justify-center hover:shadow-md text-mute"><ChevronLeft size={16}/></button>
          <button className="w-8 h-8 rounded-full border border-[#ddd] flex items-center justify-center hover:shadow-md"><ChevronRight size={16}/></button>
        </div>
      </div>
      <div className="flex gap-6 overflow-x-auto snap-x hide-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
        {items.map((l, idx) => (
          <div key={`${l.id}-${idx}`} className="min-w-[280px] max-w-[280px] md:min-w-[19%] md:max-w-[19%] snap-start shrink-0 flex-1">
            <ListingCard l={l} />
          </div>
        ))}
        {loading && !items.length && Array.from({ length: 5 }).map((_, i) => (
          <div key={`s${i}`} className="min-w-[280px] max-w-[280px] md:min-w-[19%] md:max-w-[19%] snap-start shrink-0 flex-1">
            <CardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return <Suspense><Explore /></Suspense>;
}
