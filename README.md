# 🏠 Airbnb Clone — Full-Stack Project

A pixel-perfect full-stack Airbnb clone built with **Next.js 14 + FastAPI**, featuring real authentication, booking, host dashboard, wishlists, tabs for Homes / Experiences / Services, and a redesigned auth modal.

**GitHub:** https://github.com/kritikakandhari/air  
**Live Demo (Vercel):** https://air-tau-woad.vercel.app  

---

## ✨ Features

| Area | What's built |
|---|---|
| **Homepage tabs** | All / Homes / Experiences / Services — each tab shows its own content |
| **Homes** | Destination cards, property sections (Goa, Lonavala, Pune, Karjat) with unique images |
| **Experiences** | Popular Mumbai experiences, Weekend experiences carousel |
| **Services** | Services category icons (Photography, Chefs, Training, Makeup, Hair) + Photography listings |
| **Search** | Expanding search bar (Where / When / Who), category row, filters modal, infinite scroll |
| **Auth Modal** | Airbnb-style login — email + password login, Sign up, **Google one-click login** |
| **Logged-in Menu** | Wishlists, Trips, Messages, Profile, Notifications, Account settings, Become a host, Log out |
| **Listing detail** | Photo grid, host info, amenities, availability calendar, price breakdown, reviews, map |
| **Booking** | Date validation, guest limits, booking confirmation, My Trips, cancel bookings |
| **Wishlists** | Heart toggle, saved listings page |
| **Host Dashboard** | Create / edit / delete listings, reservations table, earnings |
| **Seed Data** | 33+ listings across Goa, Pune, Karjat, Lonavala, Delhi, Goa, Rishikesh, Kasol and more |

---

## 🚀 Quick Start

### Backend (runs on port 5001)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --port 5001
```
First start auto-creates & seeds `airbnb.db` with listings, hosts, reviews.  
API docs: http://localhost:5001/docs

### Frontend (runs on port 3001)
```bash
cd frontend
npm install
npm run dev
```
Opens at http://localhost:3001

---

## 🔑 Demo Accounts

| Role | Email | Password |
|---|---|---|
| Guest | `guest@example.com` | `password123` |
| Host | `host@example.com` | `password123` |
| Google Login | Click the **G** button | (auto sign-up) |

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, App Router |
| Backend | FastAPI, SQLAlchemy 2, SQLite, Pydantic |
| Auth | JWT (7-day tokens), PBKDF2 password hashing |
| Images | Local AVIF/JPG + Unsplash + AI-generated |
| Deploy | Vercel (frontend) + Render (backend) |

---

## 📁 Project Structure

```
airbnb-clone/
├── frontend/               ← Next.js app
│   ├── app/                ← Pages (home, listing, trips, wishlists, host)
│   ├── components/         ← Header, SearchBar, AuthModal, ListingCard, etc.
│   ├── context/            ← Auth, Wishlist, Toast providers
│   └── public/images/      ← Local property images
│
└── backend/                ← FastAPI app
    └── app/
        ├── main.py         ← App entry + CORS + lifespan seed
        ├── routers/        ← auth, listings, bookings, wishlist, host
        ├── models.py       ← SQLAlchemy schema
        ├── schemas.py      ← Pydantic request/response models
        ├── seed.py         ← 33+ listings, 4 hosts, guests, bookings, reviews
        └── security.py     ← JWT + password hashing
```

---

## 🌐 API Overview

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` `/api/auth/login` | Returns `{token, user}` |
| GET | `/api/listings` | Search with filters, pagination |
| GET | `/api/listings/{id}` | Listing detail |
| GET | `/api/listings/{id}/availability` | Blocked dates |
| POST | `/api/bookings` | Create booking (validates overlap) |
| GET | `/api/bookings/me` | My trips |
| POST | `/api/bookings/{id}/cancel` | Cancel booking |
| GET/POST | `/api/wishlist` | Saved listings |
| GET/POST/PUT/DELETE | `/api/host/listings` | Host CRUD |

---

## 🗄 Database Schema

```
users         → id, name, email, password_hash, avatar_url, is_host, is_superhost
listings      → id, host_id, title, city, state, price_per_night, category, lat, lng
listing_images→ id, listing_id, url, position
bookings      → id, listing_id, guest_id, check_in, check_out, total, status
reviews       → id, listing_id, user_id, rating, comment
wishlist      → user_id, listing_id
amenities     → id, name, icon  (many-to-many with listings)
```

---

## ☁️ Deployment

- **Frontend → Vercel:** auto-deploys from `main` branch, `frontend/` folder  
- **Backend → Render:** `backend/` folder, set `CORS_ORIGINS` to Vercel URL  
- SQLite resets on Render redeploy (ephemeral disk) — seed re-runs automatically  

---

## 📝 Assumptions & Notes

- Currency is **INR**, service fee is **14%** of nightly subtotal
- Payments, real messaging and real social OAuth are mocked ("coming soon")
- Google login button creates a demo account (`user@gmail.com / google123`)
- Property images are a mix of local AVIF files and Unsplash stock photos
- SQLite has no row-level locking; concurrent bookings could race (acceptable for demo)
