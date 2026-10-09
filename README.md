# Airbnb Clone — SDE Fullstack Assignment

A full-stack Airbnb-style marketplace: browse and search stays, view listings, book date ranges with availability
protection, manage trips and wishlists, and host your own listings (full CRUD).

**Stack:** Next.js 14 (App Router, TypeScript, Tailwind) · FastAPI · SQLAlchemy 2 · SQLite · JWT auth

## Quick start

### 1. Backend (http://localhost:8000)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
On first start the SQLite file `airbnb.db` is created and **seeded** (28 listings, 4 hosts, 11 guests, bookings, reviews).
Interactive API docs: http://localhost:8000/docs

### 2. Frontend (http://localhost:3000)
```bash
cd frontend
cp .env.local.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

### Demo accounts (password `password123`)
| Role | Email |
|---|---|
| Guest (has past + upcoming trips) | `guest@example.com` |
| Host (owns listings + reservations) | `host@example.com` |

## Features (mapped to the brief)
| Area | What's implemented |
|---|---|
| Home & search | Listing grid, expanding search bar (where / dates / guests), category row, filters modal (price, type, bedrooms, amenities, live result count), infinite scroll, search state in the URL |
| Listing detail | Photo grid + fullscreen viewer, host info, amenities modal, availability calendar (booked nights crossed out), live price breakdown, reviews, OpenStreetMap map |
| Booking | Server-side validation (past dates, max guests, own listing, overlap), mocked card/UPI/net-banking checkout, confirmation code, **My Trips** (upcoming / past / cancelled), cancel frees the dates |
| Host | Create / edit / delete listings (URL or file upload), dashboard with listings, reservations table, earnings. Delete is blocked while upcoming reservations exist |
| Airbnb feel | Sticky header + collapsing search pill, card photo carousels, heart wishlist, toasts, modals, skeleton loaders, guest-vs-host roles, review after a completed stay |
| Placeholders | Messaging, social login, language/currency, help centre → "Coming soon" toasts |

## Architecture
```
frontend/ (Next.js)                         backend/ (FastAPI)
  app/            routes (pages)              app/main.py        app + CORS + startup seed
  components/     UI building blocks          app/routers/       auth · listings · bookings · wishlist · host
  context/        auth, wishlist, toasts      app/services.py    pricing, availability, serialisers
  lib/            api client, date helpers    app/schemas.py     request validation (pydantic)
                                              app/models.py      SQLAlchemy schema
                                              app/security.py    PBKDF2 hashing, JWT, auth dependencies
                                              app/seed.py        sample data
```
Design decisions:
- **Availability** lives in one place (`services.has_overlap`): `existing.check_in < new.check_out AND existing.check_out > new.check_in`
  on *confirmed* bookings. Checkout day is free for the next check-in. Search, quote and booking all use it, and cancelling simply sets `status='cancelled'`.
- **The server owns pricing.** The UI asks `/quote`; booking recomputes and stores the amounts, so the UI can't send a fake total.
- **Auth** is JWT (7 days) in `localStorage`. A user can be both guest and host (`is_host`), like Airbnb.
- Filters/search/category are URL params, so results are shareable and survive refresh.

## Database schema
```
users(id, name, email*, password_hash, avatar_url, bio, is_host, is_superhost, created_at)
listings(id, host_id→users, title, description, property_type, category, city, state, country, address, lat, lng,
         price_per_night, cleaning_fee, max_guests, bedrooms, beds, bathrooms, rating_avg, review_count, created_at)
listing_images(id, listing_id→listings, url, position)
amenities(id, name*, icon)            listing_amenities(listing_id→listings, amenity_id→amenities)   -- many-to-many
bookings(id, code*, listing_id→listings, guest_id→users, check_in, check_out, guests, nights, subtotal, cleaning_fee,
         service_fee, total, status[confirmed|cancelled], payment_method, created_at)   CHECK(check_out > check_in)
reviews(id, listing_id→listings, user_id→users, rating 1-5, comment, created_at)         UNIQUE(listing_id, user_id)
wishlist(user_id→users, listing_id→listings, created_at)                                 PK(user_id, listing_id)
```
Indexes: `listings(city)`, `listings(category)`, `bookings(listing_id, check_in, check_out)`. Foreign keys cascade on delete (SQLite `PRAGMA foreign_keys=ON`).
`rating_avg` / `review_count` are denormalised and recomputed whenever a review is added.

## API overview
| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/signup` · `/api/auth/login` | returns `{token, user}` |
| GET | `/api/auth/me` · POST `/api/auth/become-host` | |
| GET | `/api/listings` | `q, check_in, check_out, guests, min_price, max_price, category, property_type, amenities, bedrooms, sort, page, page_size` |
| GET | `/api/listings/meta` | categories, amenities, property types, price range |
| GET | `/api/listings/{id}` · `/availability` · `/quote` · `/reviews` | |
| POST | `/api/listings/{id}/reviews` | only after a completed stay, once per listing |
| POST | `/api/bookings` · GET `/api/bookings/me` · POST `/api/bookings/{id}/cancel` | 409 on overlapping dates |
| GET/POST/DELETE | `/api/wishlist` · `/api/wishlist/{listing_id}` | |
| GET/POST | `/api/host/listings` · PUT/DELETE `/api/host/listings/{id}` · GET `/api/host/bookings` | host only |
| POST | `/api/uploads` | image upload (≤5 MB) |

## Deployment
- **Backend → Render:** new Web Service from `backend/` (see `render.yaml`). Set `CORS_ORIGINS` to your Vercel URL.
  On Render's free tier the disk is ephemeral, so SQLite resets on redeploy and the seed runs again. That's fine for a demo.
- **Frontend → Vercel:** import `frontend/`, set `NEXT_PUBLIC_API_URL` to the Render URL.

## Assumptions
- Currency is INR, service fee is 14% of the nightly subtotal, max stay is 90 nights.
- Payments, messaging and social login are mocked. Listing photos are Unsplash stock images, and a broken URL falls back to a placeholder.
- Two bookings submitted at the exact same instant could race on SQLite; a production DB would add a row lock or exclusion constraint.
