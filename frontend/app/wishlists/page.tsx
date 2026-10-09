"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { api, Listing } from "@/lib/api";
import { useAuth } from "@/context/Providers";

export default function Wishlists() {
  const { user, loading, openAuth, wishlist } = useAuth();
  const [items, setItems] = useState<Listing[] | null>(null);
  useEffect(() => { if (user) api<Listing[]>("/api/wishlist").then(setItems).catch(() => setItems([])); }, [user]);

  if (loading) return <div className="container-x py-10"><div className="h-10 w-48 skeleton rounded" /></div>;
  if (!user) return (
    <div className="container-x py-28 text-center"><Heart size={40} strokeWidth={1.3} className="mx-auto mb-4" /><h1 className="text-2xl font-semibold">Log in to see your wishlists</h1>
      <p className="text-mute mt-2">You can create, view or edit wishlists once you've logged in.</p><button className="btn-primary px-8 py-3.5 mt-6" onClick={() => openAuth("login")}>Log in</button></div>
  );
  const shown = (items ?? []).filter((l) => wishlist.has(l.id));  // un-hearting removes the card instantly
  return (
    <div className="container-x py-10">
      <h1 className="text-[32px] font-semibold mb-8">Wishlists</h1>
      {items && shown.length === 0 && (
        <div className="py-20 text-center"><h2 className="text-xl font-semibold">Create your first wishlist</h2><p className="text-mute mt-2">As you search, tap the heart icon to save your favourite places.</p>
          <Link href="/" className="btn-dark inline-block px-6 py-3 mt-6">Start exploring</Link></div>
      )}
      <div className="grid gap-x-6 gap-y-10 grid-cols-1 min-[550px]:grid-cols-2 min-[950px]:grid-cols-3 min-[1128px]:grid-cols-4">
        {shown.map((l) => <ListingCard key={l.id} l={{ ...l, is_wishlisted: true }} />)}
        {items === null && [1, 2, 3, 4].map((i) => <div key={i} className="aspect-[20/19] rounded-xl skeleton" />)}
      </div>
    </div>
  );
}
