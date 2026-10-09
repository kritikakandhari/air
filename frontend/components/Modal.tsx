"use client";
import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ title, onClose, children, footer, wide = false, sheet = false, hideHeader = false }:
  { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean; sheet?: boolean; hideHeader?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 animate-fade" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}
        className={`bg-white w-full ${wide ? "sm:max-w-3xl" : "sm:max-w-[568px]"} ${sheet ? "" : "sm:rounded-3xl"} rounded-t-3xl shadow-pop max-h-[92vh] flex flex-col animate-pop relative`}>
        {!hideHeader && (
          <div className="flex items-center justify-between px-6 h-16 border-b border-[#ebebeb] shrink-0">
            <button onClick={onClose} aria-label="Close" className="p-2 -ml-2 rounded-full hover:bg-soft"><X size={16} /></button>
            <h2 className="font-semibold text-base">{title}</h2>
            <span className="w-8" />
          </div>
        )}
        <div className="overflow-y-auto flex-1">{children}</div>
        {footer && <div className="border-t border-[#ebebeb] px-6 py-4 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
