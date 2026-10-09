"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Grip, X, Heart, Share } from "lucide-react";
import SmartImage from "./SmartImage";

export default function Gallery({ images, title, id }: { images: string[]; title: string; id: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const shown = images.slice(0, 5);
  useEffect(() => {
    if (open === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : (o - 1 + images.length) % images.length));
    };
    document.addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open, images.length]);

  return (
    <>
      <div className="relative">
        <div className="grid gap-2 rounded-xl overflow-hidden md:grid-cols-4 md:grid-rows-2 md:h-[400px] lg:h-[440px] h-[280px]">
          {shown.map((src, i) => (
            <button key={i} onClick={() => setOpen(i)} aria-label={`Open photo ${i + 1}`}
              className={`relative overflow-hidden bg-[#f0f0f0] group ${i === 0 ? "md:col-span-2 md:row-span-2" : "hidden md:block"}`}>
              <SmartImage src={src} seed={`${id}-${i}`} alt={`${title} photo ${i + 1}`} className="w-full h-full object-cover group-hover:brightness-90 transition" />
            </button>
          ))}
        </div>
        <button onClick={() => setOpen(0)} className="hidden md:flex absolute bottom-6 right-6 bg-white px-4 py-1.5 rounded-lg border border-ink text-sm font-semibold gap-2 items-center hover:bg-soft hover:scale-105 transition shadow-sm">
          <Grip size={16} />Show all photos
        </button>
      </div>
      {open !== null && (
        <div className="fixed inset-0 z-[95] bg-white flex flex-col animate-fade overflow-y-auto" role="dialog" aria-modal="true" aria-label="Photo tour">
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 h-16 border-b border-[#ddd]">
            <button aria-label="Close" onClick={() => setOpen(null)} className="p-2 rounded-full hover:bg-soft"><ChevronLeft size={20} /></button>
            <div className="flex gap-4">
               <button className="flex items-center gap-2 underline text-sm font-medium hover:bg-soft px-3 py-1.5 rounded-lg"><Share size={16} /> Share</button>
               <button className="flex items-center gap-2 underline text-sm font-medium hover:bg-soft px-3 py-1.5 rounded-lg"><Heart size={16}/> Save</button>
            </div>
          </div>
          <div className="max-w-5xl mx-auto w-full pt-8 pb-24 px-6 md:px-12">
            <h2 className="text-[26px] font-semibold mb-8">Photo tour</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-16">
              {["Living room", "Full kitchen", "Dining area", "Bedroom 1", "Bedroom 2", "Full bathroom 1", "Full bathroom 2", "Gym", "Pool"].map((cat, i) => (
                <a key={i} href={`#photo-${i}`} className="flex flex-col gap-2 group/thumb">
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-transparent group-hover/thumb:border-[#222]">
                     <SmartImage src={images[i % images.length]} seed={`${id}-${i}`} alt="" className="w-full h-full object-cover group-hover/thumb:brightness-90 transition" />
                  </div>
                  <div className="text-sm font-medium text-[#222]">{cat}</div>
                </a>
              ))}
            </div>
            
            <div className="space-y-16">
              {images.map((src, i) => (
                <div key={i} id={`photo-${i}`} className="grid lg:grid-cols-[1fr_3fr] gap-8 scroll-mt-24">
                  <div>
                    <h3 className="text-2xl font-semibold mb-1">{["Living room", "Full kitchen", "Dining area", "Bedroom 1", "Bedroom 2", "Full bathroom 1", "Full bathroom 2", "Gym", "Pool"][i % 9]}</h3>
                    {i === 0 && <p className="text-mute text-sm">Sofa bed &middot; Air conditioning &middot; Sound system &middot; TV</p>}
                  </div>
                  <div className="w-full relative">
                    <SmartImage src={src} seed={`${id}-${i}`} alt="" className="w-full aspect-[4/3] object-cover rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
