export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

export function getToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem("token");
}

export async function api<T = any>(path: string, opts: { method?: string; body?: any; form?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method || "GET", headers,
      body: opts.form ?? (opts.body ? JSON.stringify(opts.body) : undefined),
    });
  } catch {
    throw new ApiError("Can't reach the server. Is the backend running?", 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    let msg = "Something went wrong. Please try again.";
    if (typeof data?.detail === "string") msg = data.detail;
    else if (Array.isArray(data?.detail)) msg = data.detail.map((d: any) => String(d.msg || "").replace(/^Value error, /, "")).join(". ");
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export type Host = { id: number; name: string; avatar_url?: string | null; is_superhost: boolean; bio?: string | null; joined_year?: number };
export type Listing = {
  id: number; title: string; city: string; state: string; country: string; property_type: string; category: string;
  price_per_night: number; rating: number; review_count: number; max_guests: number; bedrooms: number;
  images: string[]; lat: number; lng: number; host: Host; is_wishlisted: boolean; upcoming_bookings?: number;
};
export type Amenity = { id: number; name: string; icon: string };
export type ListingDetail = Listing & {
  description: string; address?: string | null; cleaning_fee: number; beds: number; bathrooms: number;
  amenities: Amenity[]; amenity_ids: number[];
};
export type Review = { id: number; rating: number; comment: string; created_at: string; user: { id: number; name: string; avatar_url?: string | null } };
export type Booking = {
  id: number; code: string; status: "confirmed" | "cancelled"; check_in: string; check_out: string; guests: number;
  nights: number; subtotal: number; cleaning_fee: number; service_fee: number; total: number; payment_method: string;
  listing: { id: number; title: string; city: string; state: string; image: string | null; host_name: string };
  guest?: { id: number; name: string };
};
export type Quote = { nights: number; price_per_night: number; subtotal: number; cleaning_fee: number; service_fee: number; total: number };
export type Meta = { categories: { key: string; label: string }[]; property_types: string[]; price_range: { min: number; max: number }; amenities: Amenity[] };
export type User = { id: number; name: string; email: string; avatar_url?: string | null; is_host: boolean; is_superhost: boolean };
