"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ListingForm, { fromListing, FormValues } from "@/components/ListingForm";
import { api, ListingDetail } from "@/lib/api";
import { useAuth, useToast } from "@/context/Providers";

export default function EditListing() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(); const { toast } = useToast(); const { user, loading, openAuth } = useAuth();
  const [init, setInit] = useState<FormValues | null>(null); const [err, setErr] = useState("");
  useEffect(() => { if (user?.is_host) api<ListingDetail>(`/api/host/listings/${id}`).then((l) => setInit(fromListing(l))).catch((e) => setErr(e.message)); }, [id, user]);
  if (loading) return null;
  if (!user) return <div className="detail-x py-28 text-center"><button className="btn-primary px-8 py-3.5" onClick={() => openAuth("login")}>Log in</button></div>;
  if (err) return <div className="detail-x py-28 text-center"><h1 className="text-2xl font-semibold">{err}</h1></div>;
  if (!init) return <div className="detail-x py-10"><div className="h-96 skeleton rounded-xl" /></div>;
  return (
    <div className="detail-x py-10">
      <h1 className="text-[32px] font-semibold mb-8">Edit your listing</h1>
      <ListingForm initial={init} submitLabel="Save changes" onSubmit={async (v) => {
        await api(`/api/host/listings/${id}`, { method: "PUT", body: v });
        toast("Changes saved"); router.push("/host");
      }} />
    </div>
  );
}
