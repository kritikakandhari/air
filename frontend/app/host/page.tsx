"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Home, Pencil, Plus, Trash2 } from "lucide-react";
import SmartImage from "@/components/SmartImage";
import Modal from "@/components/Modal";
import { api, Booking, Listing } from "@/lib/api";
import { fmtRange, inr, todayISO } from "@/lib/dates";
import { useAuth, useToast } from "@/context/Providers";

export default function HostDashboard() {
  const { user, loading, openAuth, becomeHost } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"listings" | "reservations">("listings");
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [deleting, setDeleting] = useState<Listing | null>(null);

  const load = useCallback(() => {
    api<Listing[]>("/api/host/listings").then(setListings).catch(() => setListings([]));
    api<Booking[]>("/api/host/bookings").then(setBookings).catch(() => setBookings([]));
  }, []);
  useEffect(() => { if (user?.is_host) load(); }, [user, load]);

  if (loading) return null;
  if (!user) return (
    <div className="detail-x py-28 text-center"><Home size={40} strokeWidth={1.3} className="mx-auto mb-4" /><h1 className="text-[32px] font-semibold">It's easy to get started on Airbnb</h1>
      <p className="text-mute mt-2">Log in to list your place and start earning.</p><button className="btn-primary px-8 py-3.5 mt-6" onClick={() => openAuth("login")}>Log in</button></div>
  );
  if (!user.is_host) return (
    <div className="detail-x py-28 text-center max-w-2xl"><Home size={40} strokeWidth={1.3} className="mx-auto mb-4" /><h1 className="text-[32px] font-semibold">Airbnb it. You could earn from your place.</h1>
      <p className="text-mute mt-3">Switch to hosting to create listings, manage reservations and get paid.</p>
      <button className="btn-primary px-8 py-3.5 mt-6" onClick={async () => { await becomeHost(); toast("You're now a host. Create your first listing!"); }}>Get started</button></div>
  );

  const today = todayISO();
  const upcoming = (bookings ?? []).filter((b) => b.status === "confirmed" && b.check_out >= today);
  const earned = (bookings ?? []).filter((b) => b.status === "confirmed").reduce((s, b) => s + b.subtotal + b.cleaning_fee, 0);
  const remove = async () => {
    if (!deleting) return;
    try { await api(`/api/host/listings/${deleting.id}`, { method: "DELETE" }); toast("Listing deleted"); load(); }
    catch (e: any) { toast(e.message, "error"); }
    setDeleting(null);
  };

  return (
    <div className="detail-x py-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <h1 className="text-[32px] font-semibold">Welcome back, {user.name.split(" ")[0]}</h1>
        <Link href="/host/new" className="btn-dark px-5 py-3 flex items-center gap-2"><Plus size={16} />Create listing</Link>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {[["Listings", listings?.length ?? "–"], ["Upcoming reservations", bookings ? upcoming.length : "–"], ["Total earnings", bookings ? inr(earned) : "–"]].map(([k, val]) => (
          <div key={k as string} className="border border-[#ddd] rounded-2xl p-5"><div className="text-mute text-sm">{k}</div><div className="text-[28px] font-semibold mt-1">{val}</div></div>
        ))}
      </div>
      <div className="flex gap-2 border-b border-[#ddd] mb-8" role="tablist">
        {(["listings", "reservations"] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-4 py-3 capitalize font-medium border-b-2 -mb-px ${tab === t ? "border-ink" : "border-transparent text-mute hover:text-ink"}`}>{t}</button>)}
      </div>

      {tab === "listings" && (
        <>
          {listings === null && <div className="h-40 skeleton rounded-xl" />}
          {listings?.length === 0 && <div className="py-16 text-center border border-dashed border-[#ddd] rounded-2xl"><h2 className="text-xl font-semibold">No listings yet</h2><p className="text-mute mt-2">Create your first listing to start getting bookings.</p><Link href="/host/new" className="btn-dark inline-block px-6 py-3 mt-6">Create listing</Link></div>}
          <div className="space-y-4">
            {listings?.map((l) => (
              <article key={l.id} className="border border-[#ddd] rounded-2xl overflow-hidden flex flex-col sm:flex-row">
                <Link href={`/listings/${l.id}`} className="sm:w-56 h-40 sm:h-auto shrink-0"><SmartImage src={l.images[0]} seed={l.id} alt={l.title} className="w-full h-full object-cover" /></Link>
                <div className="p-5 flex-1 min-w-0">
                  <Link href={`/listings/${l.id}`} className="font-semibold text-lg hover:underline block truncate">{l.title}</Link>
                  <div className="text-mute">{l.city}, {l.state} · {l.property_type}</div>
                  <div className="mt-2">{inr(l.price_per_night)} night · {l.upcoming_bookings} upcoming reservation{l.upcoming_bookings === 1 ? "" : "s"}</div>
                </div>
                <div className="p-5 flex sm:flex-col gap-3 justify-center">
                  <Link href={`/host/${l.id}/edit`} className="btn-ghost px-4 py-2 flex items-center gap-2"><Pencil size={14} />Edit</Link>
                  <button onClick={() => setDeleting(l)} className="btn-ghost px-4 py-2 flex items-center gap-2 text-[#c13515] !border-[#c13515]"><Trash2 size={14} />Delete</button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {tab === "reservations" && (
        <>
          {bookings === null && <div className="h-40 skeleton rounded-xl" />}
          {bookings?.length === 0 && <p className="text-mute py-10 text-center">No reservations yet.</p>}
          {!!bookings?.length && (
            <div className="overflow-x-auto border border-[#ddd] rounded-2xl">
              <table className="w-full text-left text-sm min-w-[720px]">
                <thead className="bg-soft text-mute"><tr>{["Guest", "Listing", "Dates", "Guests", "Total", "Status"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-t border-[#ebebeb]">
                      <td className="px-4 py-3 font-medium">{b.guest?.name}<div className="text-xs text-mute font-normal">{b.code}</div></td>
                      <td className="px-4 py-3 max-w-[220px] truncate">{b.listing.title}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{fmtRange(b.check_in, b.check_out)}</td>
                      <td className="px-4 py-3">{b.guests}</td>
                      <td className="px-4 py-3">{inr(b.total)}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${b.status === "confirmed" ? (b.check_out < today ? "bg-soft" : "bg-[#e6f6ec] text-[#1a7f4b]") : "bg-[#fdeaea] text-[#c13515]"}`}>{b.status === "confirmed" && b.check_out < today ? "completed" : b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {deleting && (
        <Modal title="Delete listing" onClose={() => setDeleting(null)}
          footer={<div className="flex justify-between"><button className="underline font-semibold" onClick={() => setDeleting(null)}>Keep listing</button><button className="btn-dark px-6 py-3" onClick={remove}>Delete listing</button></div>}>
          <div className="p-6"><p className="text-lg font-semibold">Delete “{deleting.title}”?</p><p className="text-mute mt-2">This removes the listing, its photos and past reservations. This can't be undone.</p></div>
        </Modal>
      )}
    </div>
  );
}
