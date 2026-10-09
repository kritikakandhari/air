"use client";
import { useRouter } from "next/navigation";
import ListingForm, { BLANK } from "@/components/ListingForm";
import { api } from "@/lib/api";
import { useAuth, useToast } from "@/context/Providers";

export default function NewListing() {
  const router = useRouter(); const { toast } = useToast(); const { user, loading, openAuth } = useAuth();
  if (loading) return null;
  if (!user?.is_host) return <div className="detail-x py-28 text-center"><h1 className="text-2xl font-semibold">Become a host to create a listing</h1>
    <button className="btn-primary px-8 py-3.5 mt-6" onClick={() => (user ? router.push("/host") : openAuth("login"))}>{user ? "Go to hosting" : "Log in"}</button></div>;
  return (
    <div className="detail-x py-10">
      <h1 className="text-[32px] font-semibold mb-8">Create your listing</h1>
      <ListingForm initial={BLANK} submitLabel="Publish listing" onSubmit={async (v) => {
        const l = await api<{ id: number }>("/api/host/listings", { method: "POST", body: v });
        toast("Your listing is live!"); router.push(`/listings/${l.id}`);
      }} />
    </div>
  );
}
