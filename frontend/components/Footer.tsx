import Link from "next/link";
import { Globe } from "lucide-react";

const COLS: [string, string[]][] = [
  ["Support", ["Help Centre", "AirCover", "Anti-discrimination", "Disability support", "Cancellation options", "Report neighbourhood concern"]],
  ["Hosting", ["Airbnb your home", "AirCover for Hosts", "Hosting resources", "Community forum", "Hosting responsibly"]],
  ["Airbnb", ["Newsroom", "New features", "Careers", "Investors", "Gift cards"]],
];
export default function Footer() {
  return (
    <footer className="bg-soft border-t border-[#ddd] mt-16 text-sm">
      <div className="container-x py-12 grid grid-cols-1 sm:grid-cols-3 gap-8 border-b border-[#ddd]">
        {COLS.map(([h, items]) => (
          <div key={h}><h4 className="font-semibold mb-4">{h}</h4>
            <ul className="space-y-3">{items.map((i) => <li key={i}><Link href={h === "Hosting" && i === "Airbnb your home" ? "/host" : "#"} className="hover:underline">{i}</Link></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="container-x py-6 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <span>© 2026 Airbnb clone · Demo project</span><span>·</span><Link href="#" className="hover:underline">Privacy</Link><span>·</span>
          <Link href="#" className="hover:underline">Terms</Link><span>·</span><Link href="#" className="hover:underline">Sitemap</Link>
        </div>
        <div className="flex items-center gap-6 font-medium"><span className="flex items-center gap-2"><Globe size={16} />English (IN)</span><span>₹ INR</span></div>
      </div>
    </footer>
  );
}
