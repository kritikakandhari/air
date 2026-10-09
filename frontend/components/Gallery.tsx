"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Grip, X } from "lucide-react";
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
        <button onClick={() => setOpen(0)} className="absolute bottom-4 right-4 bg-white border border-ink rounded-lg px-4 py-1.5 text-sm font-semibold flex items-center gap-2 hover:bg-soft">
          <Grip size={14} />Show all photos
        </button>
      </div>
      {open !== null && (
        <div className="fixed inset-0 z-[95] bg-black flex flex-col animate-fade" role="dialog" aria-modal="true" aria-label="Photo viewer">
          <div className="flex items-center justify-between px-6 h-16 text-white">
            <button aria-label="Close" onClick={() => setOpen(null)} className="p-2 rounded-full hover:bg-white/15"><X size={20} /></button>
            <span className="text-sm">{open + 1} / {images.length}</span><span className="w-9" />
          </div>
          <div className="flex-1 flex items-center justify-center gap-4 px-4 min-h-0">
            <button aria-label="Previous photo" onClick={() => setOpen((open - 1 + images.length) % images.length)} className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shrink-0"><ChevronLeft /></button>
            <SmartImage src={images[open]} seed={`${id}-${open}`} alt={`${title} photo ${open + 1}`} className="max-h-full max-w-full object-contain rounded-lg" />
            <button aria-label="Next photo" onClick={() => setOpen((open + 1) % images.length)} className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shrink-0"><ChevronRight /></button>
          </div>
          <div className="flex gap-2 justify-center p-4 overflow-x-auto no-scrollbar">
            {images.map((s, i) => <button key={i} onClick={() => setOpen(i)} aria-label={`Photo ${i + 1}`} className={`w-16 h-12 rounded overflow-hidden shrink-0 ${i === open ? "ring-2 ring-white" : "opacity-60"}`}><SmartImage src={s} seed={`${id}-${i}`} alt="" className="w-full h-full object-cover" /></button>)}
          </div>
        </div>
      )}
    </>
  );
}
