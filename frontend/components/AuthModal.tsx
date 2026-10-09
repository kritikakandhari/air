"use client";
import { FormEvent, useState } from "react";
import Modal from "./Modal";
import { useAuth, useToast } from "@/context/Providers";

export default function AuthModal() {
  const { authModal, closeAuth, login, signup } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup" | null>(null);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  if (!authModal) return null;
  const m = mode ?? authModal.mode;

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      if (m === "login") await login(email, password); else await signup(name, email, password);
      toast(m === "login" ? "Welcome back!" : "Welcome to Airbnb! Your account is ready.");
      const cb = authModal.onSuccess; closeAuth(); setMode(null); cb?.();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  const demo = (em: string) => { setEmail(em); setPassword("password123"); setMode("login"); setErr(""); };

  return (
    <Modal title="Log in or sign up" hideHeader={true} onClose={() => { closeAuth(); setMode(null); setErr(""); }}>
      <div className="p-6 relative">
        <button onClick={() => { closeAuth(); setMode(null); setErr(""); }} className="absolute top-4 right-4 p-2 rounded-full hover:bg-soft">
          <svg viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden><path d="m6 6 20 20M26 6 6 26"></path></svg>
        </button>
        <div className="flex flex-col items-center mb-6 mt-2">
          <span className="text-rausch">
            <svg viewBox="0 0 32 32" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M16 3c-2.2 0-3.4 1.6-4.6 4L5.6 19.5C4.2 22.4 3.6 24 3.6 25.4c0 2.2 1.7 3.6 3.8 3.6 2.2 0 4.6-1.6 8.6-5.6 4 4 6.4 5.6 8.6 5.6 2.1 0 3.8-1.4 3.8-3.6 0-1.4-.6-3-2-5.9L20.6 7C19.4 4.6 18.2 3 16 3Z" />
              <path d="M16 19.5c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3Z" />
            </svg>
          </span>
          <h3 className="text-[22px] font-semibold mt-4 text-[#222]">Log in or sign up</h3>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="border border-[#b0b0b0] rounded-lg overflow-hidden flex flex-col focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
            {m === "signup" && (
              <input className="w-full px-4 py-3 border-b border-[#b0b0b0] outline-none text-base" type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            )}
            <input className={`w-full px-4 py-3 outline-none text-base ${m === "signup" ? "border-b border-[#b0b0b0]" : "border-b border-[#b0b0b0]"}`} type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <input className="w-full px-4 py-3 outline-none text-base" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          {err && <p role="alert" className="text-[#c13515] text-sm font-medium">{err}</p>}
          <button disabled={busy} type="submit" className="btn-primary w-full py-3.5 text-base font-semibold">{busy ? "Please wait..." : "Continue"}</button>
          
          <div className="text-center mt-3 text-sm text-[#222]">
            {m === "login" ? (
              <span>{"Don't have an account? "} <button type="button" onClick={() => { setMode("signup"); setErr(""); }} className="font-semibold underline hover:text-black">Sign up</button></span>
            ) : (
              <span>{"Already have an account? "} <button type="button" onClick={() => { setMode("login"); setErr(""); }} className="font-semibold underline hover:text-black">Log in</button></span>
            )}
          </div>
        </form>
        
        <div className="flex items-center gap-4 my-6 text-[13px] text-mute"><span className="flex-1 h-px bg-[#ddd]" />or<span className="flex-1 h-px bg-[#ddd]" /></div>
        
        <div className="flex justify-center gap-4 mb-2">
          <button type="button" onClick={() => toast("Google coming soon", "info")} className="w-[58px] h-[58px] rounded-xl border border-[#222] flex items-center justify-center hover:bg-soft transition bg-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="22px" height="22px">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          </button>
          <button type="button" onClick={() => toast("Apple coming soon", "info")} className="w-[58px] h-[58px] rounded-xl border border-[#222] flex items-center justify-center hover:bg-soft transition bg-white">
            <svg viewBox="0 0 384 512" width="24px" height="24px" fill="currentColor">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
          </button>
        </div>
      </div>
    </Modal>
  );
}
