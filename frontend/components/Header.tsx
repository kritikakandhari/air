"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Menu, UserCircle2 } from "lucide-react";
import Logo from "./Logo";
import SearchBar, { CompactSearch } from "./SearchBar";
import { useAuth, useToast } from "@/context/Providers";

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { user, openAuth, logout } = useAuth();
  const { toast } = useToast();
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => {
      const y = window.scrollY;
      setScrolled((s) => (s ? y > 4 : y > 40));  // hysteresis stops flicker at the threshold
      if (y > 40) setExpanded(false);
    };
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { setExpanded(false); setMenu(false); }, [pathname]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const full = isHome ? !scrolled || expanded : expanded;
  const item = "block w-full text-left px-4 py-3 text-sm hover:bg-soft";

  return (
    <>
      {expanded && !isHome && <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setExpanded(false)} />}
      {expanded && isHome && scrolled && <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setExpanded(false)} />}
      <header className="sticky top-0 z-50 bg-white shadow-header">
        <div className="container-x">
          <div className="h-20 flex items-center justify-between gap-4">
            <Link href="/" aria-label="Airbnb home" className="flex-1 basis-0"><Logo /></Link>
            <div className="hidden md:flex justify-center">
              {full ? (
                <div className="flex gap-8 items-center pt-2">
                  <button className="flex flex-col items-center gap-1 group text-ink hover:text-ink">
                    <span className="text-2xl">🌍</span>
                    <span className="text-[15px] font-medium border-b-2 border-ink pb-1">All</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 group text-mute hover:text-ink">
                    <span className="text-2xl">🏡</span>
                    <span className="text-[15px] border-b-2 border-transparent pb-1">Homes</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 group text-mute hover:text-ink">
                    <span className="text-2xl">🎈</span>
                    <span className="text-[15px] border-b-2 border-transparent pb-1">Experiences</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 group text-mute hover:text-ink">
                    <span className="text-2xl">🛎️</span>
                    <span className="text-[15px] border-b-2 border-transparent pb-1">Services</span>
                  </button>
                </div>
              ) : <CompactSearch onOpen={() => setExpanded(true)} />}
            </div>
            <div className="md:hidden flex-1"><CompactSearch onOpen={() => setExpanded(true)} /></div>
            <nav className="flex-1 basis-0 flex items-center justify-end gap-1">
              <Link href={user?.is_host ? "/host" : "/host"} className="hidden lg:block text-sm font-medium px-4 py-3 rounded-full hover:bg-soft">
                {user?.is_host ? "Switch to hosting" : "Become a host"}</Link>
              <button onClick={() => toast("Language and region settings are coming soon", "info")} aria-label="Language and region" className="p-3 rounded-full hover:bg-soft hidden sm:block"><Globe size={16} /></button>
              <div ref={menuRef} className="relative">
                <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="Account menu"
                  className="flex items-center gap-3 border border-[#ddd] rounded-full pl-3 pr-2 py-1.5 hover:shadow-card transition-shadow">
                  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', fill: 'none', height: '16px', width: '16px', stroke: 'currentcolor', strokeWidth: 3, overflow: 'visible' }}><g fill="none"><path d="M2 16h28M2 24h28M2 8h28"></path></g></svg>
                  {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full bg-[#eee]" /> : <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', height: '32px', width: '32px', fill: '#717171' }}><path d="M16 .7C7.56.7.7 7.56.7 16S7.56 31.3 16 31.3 31.3 24.44 31.3 16 24.44.7 16 .7zm0 28c-4.02 0-7.6-1.88-9.93-4.81a12.43 12.43 0 0 1 6.45-4.4A6.5 6.5 0 0 1 9.5 14a6.5 6.5 0 0 1 13 0 6.51 6.51 0 0 1-3.02 5.5 12.42 12.42 0 0 1 6.45 4.4A13.93 13.93 0 0 1 16 28.7z"></path></svg>}
                </button>
                {menu && (
                  <div role="menu" className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-pop py-2 z-50 animate-pop">
                    {user ? (
                      <>
                        <div className="px-4 py-2 text-sm text-mute truncate">{user.name}</div>
                        <Link href="/trips" className={`${item} font-medium`}>Trips</Link>
                        <Link href="/wishlists" className={`${item} font-medium`}>Wishlists</Link>
                        <div className="h-px bg-[#ddd] my-2" />
                        <Link href="/host" className={item}>{user.is_host ? "Host dashboard" : "Airbnb your home"}</Link>
                        <button className={item} onClick={() => toast("Account settings are coming soon", "info")}>Account</button>
                        <button className={item} onClick={() => toast("Messages are coming soon", "info")}>Messages</button>
                        <div className="h-px bg-[#ddd] my-2" />
                        <button className={item} onClick={() => { setMenu(false); logout(); }}>Log out</button>
                      </>
                    ) : (
                      <>
                        <button className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-soft" onClick={() => toast("Languages are coming soon", "info")}>
                          <Globe size={16} /> Languages & currency
                        </button>
                        <button className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-soft" onClick={() => toast("Help Centre is coming soon", "info")}>
                          <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">?</span> Help Centre
                        </button>
                        <div className="h-px bg-[#ddd] my-2" />
                        <div className="px-4 py-3 hover:bg-soft cursor-pointer flex justify-between items-center" onClick={() => toast("Hosting is coming soon", "info")}>
                          <div>
                             <div className="font-semibold text-sm">Become a host</div>
                             <div className="text-xs text-mute mt-1">It's easy to start hosting and<br/>earn extra income.</div>
                          </div>
                          <span className="text-2xl">🧍</span>
                        </div>
                        <button className={`${item}`} onClick={() => toast("Referrals coming soon", "info")}>Refer a host</button>
                        <button className={`${item}`} onClick={() => toast("Co-hosts coming soon", "info")}>Find a co-host</button>
                        <div className="h-px bg-[#ddd] my-2" />
                        <button className={item} onClick={() => { setMenu(false); openAuth("login"); }}>Log in or sign up</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </nav>
          </div>
          {full && <div className={`pb-5 ${expanded && !isHome ? "" : ""} animate-fade`}><SearchBar onDone={() => setExpanded(false)} /></div>}
        </div>
      </header>
    </>
  );
}
