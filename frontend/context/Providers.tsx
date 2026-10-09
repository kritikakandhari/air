"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { api, User } from "@/lib/api";
import { CheckCircle2, XCircle, X } from "lucide-react";

/* ---------------- Toasts ---------------- */
type Toast = { id: number; text: string; kind: "success" | "error" | "info" };
const ToastCtx = createContext<{ toast: (text: string, kind?: Toast["kind"]) => void }>({ toast: () => {} });
export const useToast = () => useContext(ToastCtx);

/* ---------------- Auth ---------------- */
type AuthState = {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void; becomeHost: () => Promise<void>;
  openAuth: (mode?: "login" | "signup", onSuccess?: () => void) => void;
  authModal: { mode: "login" | "signup"; onSuccess?: () => void } | null; closeAuth: () => void;
  wishlist: Set<number>; toggleWishlist: (id: number) => Promise<void>;
};
const AuthCtx = createContext<AuthState>(null as unknown as AuthState);
export const useAuth = () => useContext(AuthCtx);

export default function Providers({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const [authModal, setAuthModal] = useState<AuthState["authModal"]>(null);

  const toast = useCallback((text: string, kind: Toast["kind"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const loadWishlist = useCallback(async () => {
    try { const items = await api<{ id: number }[]>("/api/wishlist"); setWishlist(new Set(items.map((i) => i.id))); }
    catch { setWishlist(new Set()); }
  }, []);

  useEffect(() => {
    (async () => {
      if (localStorage.getItem("token")) {
        try { setUser(await api<User>("/api/auth/me")); await loadWishlist(); }
        catch { localStorage.removeItem("token"); }
      }
      setLoading(false);
    })();
  }, [loadWishlist]);

  const finish = async (res: { token: string; user: User }) => {
    localStorage.setItem("token", res.token); setUser(res.user); await loadWishlist();
  };

  const value = useMemo<AuthState>(() => ({
    user, loading, wishlist, authModal,
    login: async (email, password) => finish(await api("/api/auth/login", { method: "POST", body: { email, password } })),
    signup: async (name, email, password) => finish(await api("/api/auth/signup", { method: "POST", body: { name, email, password } })),
    logout: () => { localStorage.removeItem("token"); setUser(null); setWishlist(new Set()); toast("You've been logged out", "info"); },
    becomeHost: async () => { setUser(await api<User>("/api/auth/become-host", { method: "POST" })); },
    openAuth: (mode = "login", onSuccess) => setAuthModal({ mode, onSuccess }),
    closeAuth: () => setAuthModal(null),
    toggleWishlist: async (id) => {
      if (!user) { setAuthModal({ mode: "login", onSuccess: () => { api(`/api/wishlist/${id}`, { method: "POST" }).then(loadWishlist); } }); return; }
      const saved = wishlist.has(id);
      setWishlist((w) => { const n = new Set(w); saved ? n.delete(id) : n.add(id); return n; }); // optimistic
      try {
        await api(`/api/wishlist/${id}`, { method: saved ? "DELETE" : "POST" });
        toast(saved ? "Removed from wishlist" : "Saved to wishlist", "success");
      } catch (e: any) { toast(e.message, "error"); loadWishlist(); }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, loading, wishlist, authModal, toast, loadWishlist]);

  return (
    <AuthCtx.Provider value={value}>
      <ToastCtx.Provider value={{ toast }}>
        {children}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center w-[calc(100%-32px)] max-w-md pointer-events-none" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto animate-pop bg-ink text-white rounded-xl px-4 py-3 shadow-pop flex items-center gap-3 w-full">
              {t.kind === "error" ? <XCircle size={20} className="text-[#ff7a8e] shrink-0" /> : <CheckCircle2 size={20} className="text-[#6ee7a0] shrink-0" />}
              <span className="flex-1 text-sm">{t.text}</span>
              <button aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}><X size={16} /></button>
            </div>
          ))}
        </div>
      </ToastCtx.Provider>
    </AuthCtx.Provider>
  );
}
