"use client";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { api, ListingDetail, Meta } from "@/lib/api";
import { AmenityIcon } from "@/lib/icons";
import { useToast } from "@/context/Providers";

export type FormValues = {
  title: string; description: string; property_type: string; category: string; city: string; state: string; country: string;
  address: string; lat: number; lng: number; price_per_night: number; cleaning_fee: number; max_guests: number;
  bedrooms: number; beds: number; bathrooms: number; image_urls: string[]; amenity_ids: number[];
};
export const BLANK: FormValues = {
  title: "", description: "", property_type: "Apartment", category: "trending", city: "", state: "", country: "India", address: "",
  lat: 20.5937, lng: 78.9629, price_per_night: 3000, cleaning_fee: 500, max_guests: 2, bedrooms: 1, beds: 1, bathrooms: 1, image_urls: [], amenity_ids: [1],
};
export const fromListing = (l: ListingDetail): FormValues => ({
  title: l.title, description: l.description, property_type: l.property_type, category: l.category, city: l.city, state: l.state,
  country: l.country, address: l.address ?? "", lat: l.lat, lng: l.lng, price_per_night: l.price_per_night, cleaning_fee: l.cleaning_fee,
  max_guests: l.max_guests, bedrooms: l.bedrooms, beds: l.beds, bathrooms: l.bathrooms, image_urls: l.images, amenity_ids: l.amenity_ids,
});
const SAMPLE = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80",
];

export default function ListingForm({ initial, submitLabel, onSubmit }: { initial: FormValues; submitLabel: string; onSubmit: (v: FormValues) => Promise<void> }) {
  const { toast } = useToast();
  const [v, setV] = useState<FormValues>(initial);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { api<Meta>("/api/listings/meta").then(setMeta).catch(() => {}); }, []);
  const set = <K extends keyof FormValues>(k: K, val: FormValues[K]) => setV((x) => ({ ...x, [k]: val }));
  const num = (k: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never);

  const addUrl = () => { const u = url.trim(); if (!/^https?:\/\//.test(u)) { toast("Enter a valid image URL starting with http", "error"); return; } set("image_urls", [...v.image_urls, u]); setUrl(""); };
  const upload = async (f?: File) => {
    if (!f) return;
    const fd = new FormData(); fd.append("file", f);
    try { const r = await api<{ url: string }>("/api/uploads", { method: "POST", form: fd }); set("image_urls", [...v.image_urls, r.url]); toast("Photo uploaded"); }
    catch (e: any) { toast(e.message, "error"); }
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!v.image_urls.length) { setErr("Add at least one photo"); return; }
    setBusy(true);
    try { await onSubmit(v); } catch (e: any) { setErr(e.message); setBusy(false); }
  };
  const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block"><span className="block text-sm font-medium mb-1.5">{t}</span>{children}</label>;
  const H = ({ children }: { children: React.ReactNode }) => <h2 className="text-[22px] font-semibold mb-5">{children}</h2>;

  return (
    <form onSubmit={submit} className="space-y-10 max-w-3xl">
      <section><H>Tell guests about your place</H>
        <div className="space-y-4">
          <L t="Title"><input className="input" required minLength={5} maxLength={150} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Sea-facing villa with private pool" /></L>
          <L t="Description"><textarea className="input min-h-[140px]" required minLength={20} value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="What makes your place special?" /></L>
          <div className="grid sm:grid-cols-2 gap-4">
            <L t="Property type"><input className="input" list="ptypes" required value={v.property_type} onChange={(e) => set("property_type", e.target.value)} />
              <datalist id="ptypes">{(meta?.property_types ?? []).map((t) => <option key={t} value={t} />)}</datalist></L>
            <L t="Category"><select className="input" value={v.category} onChange={(e) => set("category", e.target.value)}>{(meta?.categories ?? [{ key: v.category, label: v.category }]).map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></L>
          </div>
        </div>
      </section>
      <section><H>Where's your place located?</H>
        <div className="grid sm:grid-cols-2 gap-4">
          <L t="City"><input className="input" required value={v.city} onChange={(e) => set("city", e.target.value)} /></L>
          <L t="State"><input className="input" required value={v.state} onChange={(e) => set("state", e.target.value)} /></L>
          <L t="Country"><input className="input" required value={v.country} onChange={(e) => set("country", e.target.value)} /></L>
          <L t="Street address (optional)"><input className="input" value={v.address} onChange={(e) => set("address", e.target.value)} /></L>
          <L t="Latitude"><input className="input" type="number" step="any" min={-90} max={90} value={v.lat} onChange={num("lat")} /></L>
          <L t="Longitude"><input className="input" type="number" step="any" min={-180} max={180} value={v.lng} onChange={num("lng")} /></L>
        </div>
      </section>
      <section><H>Space and pricing</H>
        <div className="grid sm:grid-cols-3 gap-4">
          <L t="Guests"><input className="input" type="number" min={1} max={20} required value={v.max_guests} onChange={num("max_guests")} /></L>
          <L t="Bedrooms"><input className="input" type="number" min={0} max={20} required value={v.bedrooms} onChange={num("bedrooms")} /></L>
          <L t="Beds"><input className="input" type="number" min={1} max={40} required value={v.beds} onChange={num("beds")} /></L>
          <L t="Bathrooms"><input className="input" type="number" min={1} max={20} required value={v.bathrooms} onChange={num("bathrooms")} /></L>
          <L t="Price per night (₹)"><input className="input" type="number" min={1} required value={v.price_per_night} onChange={num("price_per_night")} /></L>
          <L t="Cleaning fee (₹)"><input className="input" type="number" min={0} value={v.cleaning_fee} onChange={num("cleaning_fee")} /></L>
        </div>
      </section>
      <section><H>Amenities</H>
        <div className="grid sm:grid-cols-2 gap-3">
          {(meta?.amenities ?? []).map((a) => {
            const on = v.amenity_ids.includes(a.id);
            return <label key={a.id} className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer ${on ? "border-ink bg-soft" : "border-[#ddd] hover:border-ink"}`}>
              <input type="checkbox" className="accent-ink w-4 h-4" checked={on} onChange={() => set("amenity_ids", on ? v.amenity_ids.filter((x) => x !== a.id) : [...v.amenity_ids, a.id])} />
              <AmenityIcon name={a.icon} size={20} />{a.name}</label>;
          })}
        </div>
      </section>
      <section><H>Add some photos</H>
        <div className="flex gap-2 mb-3">
          <input className="input" placeholder="Paste an image URL" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }} />
          <button type="button" onClick={addUrl} className="btn-ghost px-4 shrink-0 flex items-center gap-2"><ImagePlus size={16} />Add</button>
        </div>
        <div className="flex gap-3 flex-wrap mb-4">
          <button type="button" onClick={() => file.current?.click()} className="btn-ghost px-4 py-2 flex items-center gap-2"><Upload size={16} />Upload from device</button>
          <button type="button" onClick={() => set("image_urls", [...v.image_urls, ...SAMPLE])} className="underline text-sm font-semibold">Use sample photos</button>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {v.image_urls.map((u, i) => (
            <div key={u + i} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#f0f0f0]">
              <img src={u} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && <span className="absolute top-2 left-2 bg-white text-xs font-semibold rounded-md px-2 py-1">Cover photo</span>}
              <button type="button" aria-label="Remove photo" onClick={() => set("image_urls", v.image_urls.filter((_, k) => k !== i))} className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:scale-105"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </section>
      {err && <p role="alert" className="text-[#c13515]">{err}</p>}
      <button disabled={busy} className="btn-primary px-8 py-3.5 text-base">{busy ? "Saving…" : submitLabel}</button>
    </form>
  );
}
