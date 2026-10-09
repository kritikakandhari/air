export const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const fromISO = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const todayISO = () => toISO(new Date());
export const nightsBetween = (a: string, b: string) => Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86400000);
export const fmtShort = (s?: string | null) => (s ? fromISO(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "");
export const fmtLong = (s: string) => fromISO(s).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
export const fmtRange = (a: string, b: string) => {
  const A = fromISO(a), B = fromISO(b);
  return A.getMonth() === B.getMonth() ? `${A.getDate()}–${B.getDate()} ${B.toLocaleDateString("en-IN", { month: "short" })}`
    : `${fmtShort(a)} – ${fmtShort(b)}`;
};
export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
