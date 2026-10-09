"""Business logic shared by routers: pricing, availability, serialisers."""
import secrets
from datetime import date
from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from . import models

SERVICE_FEE_RATE = 0.14
MAX_NIGHTS = 90

CATEGORIES = [
    ("trending", "Trending"), ("amazing-views", "Amazing views"), ("beachfront", "Beachfront"),
    ("cabins", "Cabins"), ("amazing-pools", "Amazing pools"), ("countryside", "Countryside"),
    ("castles", "Castles"), ("camping", "Camping"), ("farms", "Farms"), ("design", "Design"),
    ("tiny-homes", "Tiny homes"), ("lakefront", "Lakefront"), ("mansions", "Mansions"),
    ("islands", "Islands"), ("treehouses", "Treehouses"), ("rooms", "Rooms"),
]


def compute_quote(listing: models.Listing, check_in: date, check_out: date) -> dict:
    nights = (check_out - check_in).days
    subtotal = nights * listing.price_per_night
    cleaning = listing.cleaning_fee
    service = round(subtotal * SERVICE_FEE_RATE)
    return {"nights": nights, "price_per_night": listing.price_per_night, "subtotal": subtotal,
            "cleaning_fee": cleaning, "service_fee": service, "total": subtotal + cleaning + service}


def has_overlap(db: Session, listing_id: int, check_in: date, check_out: date) -> bool:
    """Two stays overlap when existing.check_in < new.check_out AND existing.check_out > new.check_in.
    Checkout day is free for the next guest's check-in."""
    q = select(func.count()).select_from(models.Booking).where(
        models.Booking.listing_id == listing_id, models.Booking.status == "confirmed",
        models.Booking.check_in < check_out, models.Booking.check_out > check_in)
    return (db.scalar(q) or 0) > 0


def validate_stay(db: Session, listing, check_in: date, check_out: date, guests: int, user=None):
    if check_in < date.today():
        raise HTTPException(422, "Check-in can't be in the past")
    if check_out <= check_in:
        raise HTTPException(422, "Checkout must be after check-in")
    if (check_out - check_in).days > MAX_NIGHTS:
        raise HTTPException(422, f"Stays are limited to {MAX_NIGHTS} nights")
    if guests > listing.max_guests:
        raise HTTPException(422, f"This place has a maximum of {listing.max_guests} guests")
    if user is not None and listing.host_id == user.id:
        raise HTTPException(403, "You can't book your own listing")
    if has_overlap(db, listing.id, check_in, check_out):
        raise HTTPException(409, "Those dates aren't available. Try different dates.")


def new_code() -> str:
    return "HM" + "".join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(8))


def recompute_rating(db: Session, listing: models.Listing):
    avg, cnt = db.execute(select(func.avg(models.Review.rating), func.count(models.Review.id))
                          .where(models.Review.listing_id == listing.id)).one()
    listing.rating_avg = round(float(avg), 2) if avg else 0.0
    listing.review_count = cnt or 0


# ---------- serialisers ----------
def host_dict(h: models.User) -> dict:
    return {"id": h.id, "name": h.name, "avatar_url": h.avatar_url, "is_superhost": h.is_superhost,
            "bio": h.bio, "joined_year": h.created_at.year}


def listing_summary(l: models.Listing, wished: set[int] | None = None) -> dict:
    return {"id": l.id, "title": l.title, "city": l.city, "state": l.state, "country": l.country,
            "property_type": l.property_type, "category": l.category, "price_per_night": l.price_per_night,
            "rating": l.rating_avg, "review_count": l.review_count, "max_guests": l.max_guests,
            "bedrooms": l.bedrooms, "images": [i.url for i in l.images], "lat": l.lat, "lng": l.lng,
            "host": {"id": l.host.id, "name": l.host.name, "is_superhost": l.host.is_superhost},
            "is_wishlisted": l.id in (wished or set())}


def listing_detail(l: models.Listing, wished: set[int] | None = None) -> dict:
    d = listing_summary(l, wished)
    d.update({"description": l.description, "address": l.address, "cleaning_fee": l.cleaning_fee,
              "beds": l.beds, "bathrooms": l.bathrooms, "host": host_dict(l.host),
              "amenity_ids": [a.id for a in l.amenities],
              "amenities": [{"id": a.id, "name": a.name, "icon": a.icon} for a in l.amenities]})
    return d


def booking_dict(b: models.Booking, with_guest: bool = False) -> dict:
    l = b.listing
    d = {"id": b.id, "code": b.code, "status": b.status, "check_in": b.check_in.isoformat(),
         "check_out": b.check_out.isoformat(), "guests": b.guests, "nights": b.nights,
         "subtotal": b.subtotal, "cleaning_fee": b.cleaning_fee, "service_fee": b.service_fee,
         "total": b.total, "payment_method": b.payment_method, "created_at": b.created_at.isoformat(),
         "listing": {"id": l.id, "title": l.title, "city": l.city, "state": l.state,
                     "image": l.images[0].url if l.images else None, "host_name": l.host.name}}
    if with_guest:
        d["guest"] = {"id": b.guest.id, "name": b.guest.name}
    return d


def review_dict(r: models.Review) -> dict:
    return {"id": r.id, "rating": r.rating, "comment": r.comment, "created_at": r.created_at.isoformat(),
            "user": {"id": r.user.id, "name": r.user.name, "avatar_url": r.user.avatar_url}}
