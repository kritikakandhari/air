from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, selectinload
from .. import models, schemas, services
from ..database import get_db
from ..security import optional_user, current_user

router = APIRouter(prefix="/api/listings", tags=["listings"])


def _wished(user) -> set[int]:
    return {w.listing_id for w in user.wishlist} if user else set()


def _load(db: Session, listing_id: int) -> models.Listing:
    l = db.get(models.Listing, listing_id)
    if not l:
        raise HTTPException(404, "Listing not found")
    return l


@router.get("/meta")
def meta(db: Session = Depends(get_db)):
    lo, hi = db.execute(select(func.min(models.Listing.price_per_night), func.max(models.Listing.price_per_night))).one()
    types = db.scalars(select(models.Listing.property_type).distinct().order_by(models.Listing.property_type)).all()
    amenities = db.scalars(select(models.Amenity).order_by(models.Amenity.id)).all()
    return {"categories": [{"key": k, "label": v} for k, v in services.CATEGORIES],
            "property_types": types, "price_range": {"min": lo or 0, "max": hi or 0},
            "amenities": [{"id": a.id, "name": a.name, "icon": a.icon} for a in amenities]}


@router.get("")
def search_listings(
    q: Optional[str] = None, check_in: Optional[date] = None, check_out: Optional[date] = None,
    guests: int = Query(1, ge=1), min_price: Optional[int] = None, max_price: Optional[int] = None,
    category: Optional[str] = None, property_type: Optional[str] = None, amenities: Optional[str] = None,
    bedrooms: int = Query(0, ge=0), sort: str = "recommended",
    page: int = Query(1, ge=1), page_size: int = Query(12, ge=1, le=48),
    db: Session = Depends(get_db), user=Depends(optional_user),
):
    stmt = select(models.Listing).where(models.Listing.max_guests >= guests)
    if q and q.strip():
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(models.Listing.city.ilike(like), models.Listing.state.ilike(like),
                              models.Listing.country.ilike(like), models.Listing.title.ilike(like)))
    if category:
        stmt = stmt.where(models.Listing.category == category)
    if min_price is not None:
        stmt = stmt.where(models.Listing.price_per_night >= min_price)
    if max_price is not None:
        stmt = stmt.where(models.Listing.price_per_night <= max_price)
    if property_type:
        stmt = stmt.where(models.Listing.property_type.in_([t for t in property_type.split(",") if t]))
    if bedrooms:
        stmt = stmt.where(models.Listing.bedrooms >= bedrooms)
    for aid in [int(a) for a in (amenities or "").split(",") if a.strip().isdigit()]:
        stmt = stmt.where(models.Listing.amenities.any(models.Amenity.id == aid))
    if check_in and check_out:
        if check_out <= check_in:
            raise HTTPException(422, "Checkout must be after check-in")
        clash = select(models.Booking.id).where(
            models.Booking.listing_id == models.Listing.id, models.Booking.status == "confirmed",
            models.Booking.check_in < check_out, models.Booking.check_out > check_in).exists()
        stmt = stmt.where(~clash)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    order = {"price_asc": [models.Listing.price_per_night.asc()],
             "price_desc": [models.Listing.price_per_night.desc()],
             "rating": [models.Listing.rating_avg.desc(), models.Listing.review_count.desc()]
             }.get(sort, [models.Listing.id.asc()])
    rows = db.scalars(stmt.order_by(*order, models.Listing.id)
                      .options(selectinload(models.Listing.images), selectinload(models.Listing.host))
                      .offset((page - 1) * page_size).limit(page_size)).all()
    wished = _wished(user)
    return {"items": [services.listing_summary(l, wished) for l in rows], "total": total, "page": page,
            "pages": max(1, -(-total // page_size)), "has_more": page * page_size < total}


@router.get("/{listing_id}")
def listing_detail(listing_id: int, db: Session = Depends(get_db), user=Depends(optional_user)):
    return services.listing_detail(_load(db, listing_id), _wished(user))


@router.get("/{listing_id}/availability")
def availability(listing_id: int, db: Session = Depends(get_db)):
    """Booked ranges (check_in inclusive, check_out exclusive) so the calendar can block them."""
    _load(db, listing_id)
    rows = db.scalars(select(models.Booking).where(
        models.Booking.listing_id == listing_id, models.Booking.status == "confirmed",
        models.Booking.check_out >= date.today()).order_by(models.Booking.check_in)).all()
    return {"booked": [{"check_in": b.check_in.isoformat(), "check_out": b.check_out.isoformat()} for b in rows]}


@router.get("/{listing_id}/quote")
def quote(listing_id: int, check_in: date, check_out: date, guests: int = 1,
          db: Session = Depends(get_db), user=Depends(optional_user)):
    l = _load(db, listing_id)
    services.validate_stay(db, l, check_in, check_out, guests, user)
    return services.compute_quote(l, check_in, check_out)


@router.get("/{listing_id}/reviews")
def list_reviews(listing_id: int, db: Session = Depends(get_db)):
    _load(db, listing_id)
    rows = db.scalars(select(models.Review).where(models.Review.listing_id == listing_id)
                      .order_by(models.Review.created_at.desc())).all()
    return [services.review_dict(r) for r in rows]


@router.post("/{listing_id}/reviews", status_code=201)
def add_review(listing_id: int, body: schemas.ReviewIn, db: Session = Depends(get_db),
               user: models.User = Depends(current_user)):
    l = _load(db, listing_id)
    done = db.scalar(select(func.count()).select_from(models.Booking).where(
        models.Booking.listing_id == listing_id, models.Booking.guest_id == user.id,
        models.Booking.status == "confirmed", models.Booking.check_out < date.today()))
    if not done:
        raise HTTPException(403, "You can review a place after you've stayed there")
    if db.scalar(select(models.Review.id).where(models.Review.listing_id == listing_id,
                                                models.Review.user_id == user.id)):
        raise HTTPException(409, "You've already reviewed this place")
    r = models.Review(listing_id=listing_id, user_id=user.id, rating=body.rating, comment=body.comment.strip())
    db.add(r); db.flush()
    services.recompute_rating(db, l)
    db.commit(); db.refresh(r)
    return services.review_dict(r)
