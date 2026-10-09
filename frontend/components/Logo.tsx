export default function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <span className="flex items-center gap-1 text-rausch">
      <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M16 3c-2.2 0-3.4 1.6-4.6 4L5.6 19.5C4.2 22.4 3.6 24 3.6 25.4c0 2.2 1.7 3.6 3.8 3.6 2.2 0 4.6-1.6 8.6-5.6 4 4 6.4 5.6 8.6 5.6 2.1 0 3.8-1.4 3.8-3.6 0-1.4-.6-3-2-5.9L20.6 7C19.4 4.6 18.2 3 16 3Z" />
        <path d="M16 19.5c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3Z" />
      </svg>
      {withText && <span className="hidden lg:inline text-[26px] font-extrabold tracking-tight leading-none -mt-0.5" style={{ letterSpacing: "-0.04em" }}>airbnb</span>}
    </span>
  );
}
