import Image from "next/image";

export default function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-rausch">
      <Image src="/airbnb-logo-real.png" alt="Airbnb" width={withText ? 120 : 36} height={36} className="object-contain" />
    </span>
  );
}
