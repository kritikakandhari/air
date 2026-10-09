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
              {full ? <div className="font-medium text-base border-b-2 border-ink pb-1">Stays</div> : <CompactSearch onOpen={() => setExpanded(true)} />}
            </div>
            <div className="md:hidden flex-1"><CompactSearch onOpen={() => setExpanded(true)} /></div>
            <nav className="flex-1 basis-0 flex items-center justify-end gap-1">
              <Link href={user?.is_host ? "/host" : "/host"} className="hidden lg:block text-sm font-medium px-4 py-3 rounded-full hover:bg-soft">
                {user?.is_host ? "Switch to hosting" : "Airbnb your home"}</Link>
              <button onClick={() => toast("Language and region settings are coming soon", "info")} aria-label="Language and region" className="p-3 rounded-full hover:bg-soft hidden sm:block"><Globe size={16} /></button>
              <div ref={menuRef} className="relative">
                <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="Account menu"
                  className="flex items-center gap-3 border border-[#ddd] rounded-full pl-3 pr-2 py-1.5 hover:shadow-card transition-shadow">
                  <Menu size={16} />
                  {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full bg-[#eee]" /> : <UserCircle2 size={32} className="text-[#717171]" strokeWidth={1.2} />}
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
                        <button className={`${item} font-semibold`} onClick={() => { setMenu(false); openAuth("signup"); }}>Sign up</button>
                        <button className={item} onClick={() => { setMenu(false); openAuth("login"); }}>Log in</button>
                        <div className="h-px bg-[#ddd] my-2" />
                        <Link href="/host" className={item}>Airbnb your home</Link>
                        <button className={item} onClick={() => toast("Help Centre is coming soon", "info")}>Help Centre</button>
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
