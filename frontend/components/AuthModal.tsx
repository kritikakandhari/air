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
    <Modal title="" onClose={() => { closeAuth(); setMode(null); setErr(""); }}>
      <form onSubmit={submit} className="p-6">
        <div className="flex flex-col items-center mb-6 mt-4">
          <span className="text-rausch">
            <svg viewBox="0 0 32 32" width="36" height="36" fill="currentColor" aria-hidden>
              <path d="M16 3c-2.2 0-3.4 1.6-4.6 4L5.6 19.5C4.2 22.4 3.6 24 3.6 25.4c0 2.2 1.7 3.6 3.8 3.6 2.2 0 4.6-1.6 8.6-5.6 4 4 6.4 5.6 8.6 5.6 2.1 0 3.8-1.4 3.8-3.6 0-1.4-.6-3-2-5.9L20.6 7C19.4 4.6 18.2 3 16 3Z" />
              <path d="M16 19.5c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3Z" fill="white" />
            </svg>
          </span>
          <h3 className="text-xl font-semibold mt-4 text-[#222]">Log in or sign up</h3>
        </div>
        <div className="space-y-3">
          <input className="input" type="text" placeholder="Phone number or email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        {err && <p role="alert" className="text-[#c13515] text-sm mt-3">{err}</p>}
        <button disabled={busy} type="button" onClick={submit} className="btn-primary w-full py-3.5 mt-4 text-base font-semibold">{busy ? "Please wait…" : "Continue"}</button>
        <div className="flex items-center gap-4 my-5 text-xs text-mute"><span className="flex-1 h-px bg-[#ddd]" />or<span className="flex-1 h-px bg-[#ddd]" /></div>
        <div className="flex justify-center gap-4 mb-2">
          <button type="button" onClick={() => toast("Google coming soon", "info")} className="w-[50px] h-[50px] rounded-full border border-[#ddd] flex items-center justify-center hover:shadow-md transition bg-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          </button>
          <button type="button" onClick={() => toast("Apple coming soon", "info")} className="w-[50px] h-[50px] rounded-full border border-[#ddd] flex items-center justify-center hover:shadow-md transition bg-white">
            <svg viewBox="0 0 384 512" width="20px" height="20px" fill="currentColor">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
          </button>
        </div>
        <div className="mt-6 rounded-xl bg-soft p-4 text-sm">
          <div className="font-semibold mb-2">Demo accounts (password: password123)</div>
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => demo("guest@example.com")} className="border border-[#ddd] bg-white rounded-full px-3 py-1.5 hover:border-ink">Guest: guest@example.com</button>
            <button type="button" onClick={() => demo("host@example.com")} className="border border-[#ddd] bg-white rounded-full px-3 py-1.5 hover:border-ink">Host: host@example.com</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
