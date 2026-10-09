"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import Modal from "./Modal";
import { api } from "@/lib/api";
import { useToast } from "@/context/Providers";

export default function ReviewModal({ listingId, title, onClose, onDone }: { listingId: number; title: string; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [rating, setRating] = useState(5); const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const submit = async () => {
    setBusy(true); setErr("");
    try { await api(`/api/listings/${listingId}/reviews`, { method: "POST", body: { rating, comment } }); toast("Thanks! Your review is posted."); onDone(); onClose(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <Modal title="Write a review" onClose={onClose} footer={<button disabled={busy || comment.trim().length < 3} onClick={submit} className="btn-dark w-full py-3.5 disabled:opacity-40">{busy ? "Posting…" : "Post review"}</button>}>
      <div className="p-6">
        <p className="font-semibold text-lg mb-1">How was your stay?</p><p className="text-mute mb-4">{title}</p>
        <div className="flex gap-1 mb-5" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)}>
              <Star size={34} strokeWidth={1.3} className={n <= (hover || rating) ? "fill-ink" : "fill-transparent"} /></button>
          ))}
        </div>
        <textarea className="input min-h-[140px]" placeholder="Tell future guests what you loved" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
        {err && <p role="alert" className="text-[#c13515] text-sm mt-3">{err}</p>}
      </div>
    </Modal>
  );
}
