"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import SmartImage from "./SmartImage";
import { useAuth } from "@/context/Providers";
import { inr } from "@/lib/dates";
import type { Listing } from "@/lib/api";

export function HeartButton({ id, className = "" }: { id: number; className?: string }) {
  const { wishlist, toggleWishlist } = useAuth();
  const saved = wishlist.has(id);
  return (
    <button aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} aria-pressed={saved}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(id); }}
      className={`p-1 transition-transform active:scale-90 hover:scale-110 ${className}`}>
      <Heart size={24} strokeWidth={1.6} className={saved ? "fill-rausch text-rausch" : "fill-black/50 text-white"} />
    </button>
  );
}

export default function ListingCard({ l, query = "", nights = 0 }: { l: Listing; query?: string; nights?: number }) {
  const [i, setI] = useState(0);
  const imgs = l.images.slice(0, 5);
  const go = (e: React.MouseEvent, d: number) => { e.preventDefault(); e.stopPropagation(); setI((x) => (x + d + imgs.length) % imgs.length); };
  const arrow = "absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md items-center justify-center hidden group-hover:flex hover:scale-105 hover:bg-white";
  return (
    <Link href={`/listings/${l.id}${query}`} className="group block">
      <div className="relative aspect-[20/19] rounded-xl overflow-hidden bg-[#f0f0f0]">
        <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
          {imgs.map((src, k) => (
            <div key={k} className="w-full h-full shrink-0"><SmartImage src={k === 0 || Math.abs(k - i) <= 1 ? src : undefined} seed={`${l.id}-${k}`} alt={`${l.title} photo ${k + 1}`} className="w-full h-full object-cover" /></div>
          ))}
        </div>
        {l.rating >= 4.8 && <span className="absolute top-3 left-3 bg-white rounded-full px-3 py-1 text-xs font-semibold shadow-sm">Guest favourite</span>}
        <HeartButton id={l.id} className="absolute top-3 right-3" />
        {imgs.length > 1 && (
          <>
            {i > 0 && <button aria-label="Previous photo" onClick={(e) => go(e, -1)} className={`${arrow} left-2`}><ChevronLeft size={16} /></button>}
            {i < imgs.length - 1 && <button aria-label="Next photo" onClick={(e) => go(e, 1)} className={`${arrow} right-2`}><ChevronRight size={16} /></button>}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {imgs.map((_, k) => <span key={k} className={`w-1.5 h-1.5 rounded-full ${k === i ? "bg-white" : "bg-white/60"}`} />)}
            </div>
          </>
        )}
      </div>
      <div className="pt-3">
        <h3 className="font-semibold text-[15px] truncate">{l.title}</h3>
        <p className="text-mute text-[15px] mt-0.5">
          {nights > 0 ? <>{inr(l.price_per_night * nights)} for {nights} night{nights > 1 ? "s" : ""}</> : <>{inr(l.price_per_night * 2)} for 2 nights</>}
          {l.review_count > 0 && <> • ★ {l.rating.toFixed(2)}</>}
        </p>
      </div>
    </Link>
  );
}

export function CardSkeleton() {
  return <div><div className="aspect-[20/19] rounded-xl skeleton" /><div className="h-4 w-2/3 rounded skeleton mt-3" /><div className="h-4 w-1/2 rounded skeleton mt-2" /><div className="h-4 w-1/3 rounded skeleton mt-2" /></div>;
}
