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
      <CategoryBar categories={meta?.categories ?? []} active={category} filterCount={filterCount}
        onSelect={(k) => update((p) => (k ? p.set("category", k) : p.delete("category")))} onFilters={() => meta && setShowFilters(true)} />
      <div className="container-x pt-6">
        {searching && total !== null && !error && (
          <h1 className="text-base font-semibold mb-4">{total} {total === 1 ? "stay" : "stays"}{q ? ` in “${q}”` : ""}{nights ? ` · ${nights} night${nights > 1 ? "s" : ""}` : ""}</h1>
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
        <div className="grid gap-x-6 gap-y-10 grid-cols-1 min-[550px]:grid-cols-2 min-[950px]:grid-cols-3 min-[1128px]:grid-cols-4 min-[1440px]:grid-cols-5 min-[1760px]:grid-cols-6">
          {items.map((l) => <ListingCard key={l.id} l={l} query={cardQuery} nights={nights} />)}
          {loading && Array.from({ length: items.length ? 4 : 12 }).map((_, i) => <CardSkeleton key={`s${i}`} />)}
        </div>
        <div ref={sentinel} className="h-10" />
        {!loading && !hasMore && items.length > 0 && <p className="text-center text-mute text-sm pb-4">You've seen all {total} stays</p>}
      </div>
      {showFilters && meta && <FiltersModal meta={meta} initial={filters} baseQuery={baseQuery} onApply={applyFilters} onClose={() => setShowFilters(false)} />}
    </>
  );
}

export default function Home() {
  return <Suspense><Explore /></Suspense>;
}
