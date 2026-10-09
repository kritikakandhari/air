"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";
import Logo from "./Logo";
import SearchBar, { CompactSearch } from "./SearchBar";
import { useAuth, useToast } from "@/context/Providers";

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const sp = useSearchParams();
  const currentTab = sp.get("tab") || "all";
  const { user, openAuth, logout } = useAuth();
  const { toast } = useToast();
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => {
      const y = window.scrollY;
      setScrolled((s) => (s ? y > 4 : y > 40));
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
                    {[
                      { id: 'all', label: 'All', icon: '🌍' },
                      { id: 'homes', label: 'Homes', icon: '🏡' },
                      { id: 'experiences', label: 'Experiences', icon: '🎈' },
                      { id: 'services', label: 'Services', icon: '🛎️' }
                    ].map(t => {
                      const active = currentTab === t.id;
                      return (
                        <Link key={t.id} href={`/?tab=${t.id}`} className={`flex flex-col items-center gap-1 group ${active ? 'text-ink' : 'text-mute hover:text-ink'}`}>
                          <span className="text-2xl">{t.icon}</span>
                          <span className={`text-[15px] pb-1 border-b-2 ${active ? 'font-medium border-ink' : 'border-transparent'}`}>{t.label}</span>
                        </Link>
                      );
                    })}
                  </div>
              ) : <CompactSearch onOpen={() => setExpanded(true)} />}
            </div>
            <div className="md:hidden flex-1"><CompactSearch onOpen={() => setExpanded(true)} /></div>
            <nav className="flex-1 basis-0 flex items-center justify-end gap-1">
              <Link href="/host" className="hidden lg:block text-sm font-medium px-4 py-3 rounded-full hover:bg-soft">
                {user?.is_host ? "Switch to hosting" : "Become a host"}
              </Link>
              <div className="flex items-center gap-2">
                {/* Profile / Login button */}
                <button
                  onClick={() => { if (!user) { openAuth("login"); } else { toast("Account settings coming soon", "info"); } }}
                  aria-label="Account"
                  className="w-[38px] h-[38px] rounded-full border border-[#ddd] hover:shadow-card flex items-center justify-center transition-shadow bg-white"
                >
                  {user?.avatar_url
                    ? <img src={user.avatar_url} alt="" className="w-[34px] h-[34px] rounded-full bg-[#eee]" />
                    : <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: "block", height: "28px", width: "28px", fill: "#717171" }}><path d="M16 .7C7.56.7.7 7.56.7 16S7.56 31.3 16 31.3 31.3 24.44 31.3 16 24.44.7 16 .7zm0 28c-4.02 0-7.6-1.88-9.93-4.81a12.43 12.43 0 0 1 6.45-4.4A6.5 6.5 0 0 1 9.5 14a6.5 6.5 0 0 1 13 0 6.51 6.51 0 0 1-3.02 5.5 12.42 12.42 0 0 1 6.45 4.4A13.93 13.93 0 0 1 16 28.7z"></path></svg>
                  }
                </button>
                {/* Hamburger menu button */}
                <div ref={menuRef} className="relative">
                  <button
                    onClick={() => setMenu((m) => !m)}
                    aria-haspopup="menu"
                    aria-expanded={menu}
                    aria-label="Main menu"
                    className="w-[38px] h-[38px] rounded-full border border-[#ddd] hover:shadow-card flex items-center justify-center transition-shadow bg-white"
                  >
                    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: "block", fill: "none", height: "16px", width: "16px", stroke: "currentcolor", strokeWidth: 3, overflow: "visible" }}><g fill="none"><path d="M2 16h28M2 24h28M2 8h28"></path></g></svg>
                  </button>
                  {menu && (
                    <div role="menu" className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-pop py-2 z-50 animate-pop">
                      {user ? (
                        <>
                          <Link href="/wishlists" className={`${item} font-medium flex items-center gap-3`}>
                            <svg viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 28C16 28 3 19 3 11a6 6 0 0 1 13-1.27A6 6 0 0 1 29 11c0 8-13 17-13 17z"/></svg>
                            Wishlists
                          </Link>
                          <Link href="/trips" className={`${item} font-medium flex items-center gap-3`}>
                            <svg viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 3C7.163 3 0 10.163 0 19a13 13 0 0 0 13 13h6a13 13 0 0 0 13-13C32 10.163 24.837 3 16 3z"/></svg>
                            Trips
                          </Link>
                          <button className={`${item} flex items-center gap-3`} onClick={() => toast("Messages coming soon", "info")}>
                            <svg viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M26 3H6a3 3 0 0 0-3 3v16a3 3 0 0 0 3 3h14l6 6V6a3 3 0 0 0-3-3z"/></svg>
                            Messages
                          </button>
                          <button className={`${item} flex items-center gap-3`} onClick={() => toast("Profile coming soon", "info")}>
                            <svg viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="16" cy="10" r="6"/><path d="M4 28c0-7 5.373-12 12-12s12 5 12 12"/></svg>
                            Profile
                          </button>
                          <div className="h-px bg-[#ddd] my-2" />
                          <button className={`${item} flex items-center gap-3`} onClick={() => toast("Notifications coming soon", "info")}>
                            <svg viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 4a9 9 0 0 0-9 9v5l-3 4h24l-3-4v-5a9 9 0 0 0-9-9zm0 0V2m-3 25a3 3 0 0 0 6 0"/></svg>
                            Notifications
                          </button>
                          <button className={`${item} flex items-center gap-3`} onClick={() => toast("Account settings coming soon", "info")}>
                            <svg viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="16" cy="16" r="3"/><path d="M26.7 12.5l-1.4-3.4 2.1-2.9-2.6-2.6-2.9 2.1-3.4-1.4L17 1h-3l-1.5 3.3-3.4 1.4-2.9-2.1-2.6 2.6 2.1 2.9-1.4 3.4L1 14v3l3.3 1.5 1.4 3.4-2.1 2.9 2.6 2.6 2.9-2.1 3.4 1.4L14 31h3l1.5-3.3 3.4-1.4 2.9 2.1 2.6-2.6-2.1-2.9 1.4-3.4L31 17v-3l-3.3-1.5z"/></svg>
                            Account settings
                          </button>
                          <button className={`${item} flex items-center gap-3`} onClick={() => toast("Languages coming soon", "info")}>
                            <Globe size={16} />
                            Languages &amp; currency
                          </button>
                          <button className={`${item} flex items-center gap-3`} onClick={() => toast("Help Centre coming soon", "info")}>
                            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">?</span>
                            Help Centre
                          </button>
                          <div className="h-px bg-[#ddd] my-2" />
                          <div className="px-4 py-3 hover:bg-soft cursor-pointer flex justify-between items-center" onClick={() => toast("Hosting coming soon", "info")}>
                            <div>
                              <div className="font-semibold text-sm">Become a host</div>
                              <div className="text-xs text-mute mt-1">{"It's easy to start hosting and"}<br />earn extra income.</div>
                            </div>
                            <span className="text-2xl">🧍</span>
                          </div>
                          <button className={item} onClick={() => toast("Referrals coming soon", "info")}>Refer a host</button>
                          <button className={item} onClick={() => toast("Co-hosts coming soon", "info")}>Find a co-host</button>
                          <div className="h-px bg-[#ddd] my-2" />
                          <button className={item} onClick={() => { setMenu(false); logout(); }}>Log out</button>
                        </>
                      ) : (
                        <>
                          <button className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-soft" onClick={() => toast("Languages are coming soon", "info")}>
                            <Globe size={16} /> Languages &amp; currency
                          </button>
                          <button className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-soft" onClick={() => toast("Help Centre is coming soon", "info")}>
                            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">?</span> Help Centre
                          </button>
                          <div className="h-px bg-[#ddd] my-2" />
                          <div className="px-4 py-3 hover:bg-soft cursor-pointer flex justify-between items-center" onClick={() => toast("Hosting is coming soon", "info")}>
                            <div>
                              <div className="font-semibold text-sm">Become a host</div>
                              <div className="text-xs text-mute mt-1">{"It's easy to start hosting and"}<br />earn extra income.</div>
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
              </div>
            </nav>
          </div>
          {full && <div className={`pb-5 animate-fade`}><SearchBar onDone={() => setExpanded(false)} /></div>}
        </div>
      </header>
    </>
  );
}
