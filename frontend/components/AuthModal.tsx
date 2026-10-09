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
    <Modal title={m === "login" ? "Log in" : "Sign up"} onClose={() => { closeAuth(); setMode(null); setErr(""); }}>
      <form onSubmit={submit} className="p-6">
        <h3 className="text-[22px] font-semibold mb-5">Welcome to Airbnb</h3>
        <div className="space-y-3">
          {m === "signup" && <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />}
          <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            autoComplete={m === "login" ? "current-password" : "new-password"} />
        </div>
        {err && <p role="alert" className="text-[#c13515] text-sm mt-3">{err}</p>}
        <button disabled={busy} className="btn-primary w-full py-3.5 mt-5 text-base">{busy ? "Please wait…" : m === "login" ? "Log in" : "Agree and continue"}</button>
        <p className="text-center text-sm mt-4">
          {m === "login" ? "New here? " : "Already have an account? "}
          <button type="button" className="underline font-semibold" onClick={() => { setMode(m === "login" ? "signup" : "login"); setErr(""); }}>
            {m === "login" ? "Sign up" : "Log in"}</button>
        </p>
        <div className="flex items-center gap-3 my-5 text-xs text-mute"><span className="flex-1 h-px bg-[#ddd]" />or<span className="flex-1 h-px bg-[#ddd]" /></div>
        {["Continue with Google", "Continue with Apple", "Continue with phone"].map((t) => (
          <button type="button" key={t} onClick={() => toast("Coming soon. Use email for this demo.", "info")}
            className="w-full border border-ink rounded-lg py-3 font-semibold mb-3 hover:bg-soft">{t}</button>
        ))}
        <div className="mt-4 rounded-xl bg-soft p-4 text-sm">
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
