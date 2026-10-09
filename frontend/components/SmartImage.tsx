"use client";
import { useState } from "react";

/** <img> with a graceful fallback so a dead photo URL never breaks the layout. */
export default function SmartImage({ src, alt, className = "", seed = "x" }: { src?: string; alt: string; className?: string; seed?: string | number }) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);  // 0 = original, 1 = placeholder, 2 = give up (grey box)
  const url = stage === 0 && src ? src : `https://picsum.photos/seed/${seed}/1200/800`;
  return <img src={url} alt={stage === 2 ? "" : alt} loading="lazy" draggable={false}
    onError={() => setStage((s) => (s === 0 && src ? 1 : 2))} className={`${className} ${stage === 2 ? "opacity-0" : ""}`} />;
}
