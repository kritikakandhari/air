import os, uuid, pathlib
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload
from .. import models, schemas, services
from ..database import get_db
from ..security import host_user, current_user

router = APIRouter(prefix="/api", tags=["host"])
UPLOAD_DIR = pathlib.Path(os.getenv("UPLOAD_DIR", "uploads"))
UPLOAD_DIR.mkdir(exist_ok=True)


def _owned(db: Session, listing_id: int, user: models.User) -> models.Listing:
    l = db.get(models.Listing, listing_id)
    if not l or l.host_id != user.id:
        raise HTTPException(404, "Listing not found")
    return l


def _apply(l: models.Listing, body: schemas.ListingIn, db: Session):
    data = body.model_dump(exclude={"image_urls", "amenity_ids"})
    for k, v in data.items():
        setattr(l, k, v)
    l.images = [models.ListingImage(url=u.strip(), position=i) for i, u in enumerate(body.image_urls) if u.strip()]
    l.amenities = list(db.scalars(select(models.Amenity).where(models.Amenity.id.in_(body.amenity_ids))).all())


@router.get("/host/listings")
def my_listings(db: Session = Depends(get_db), user=Depends(host_user)):
    rows = db.scalars(select(models.Listing).where(models.Listing.host_id == user.id)
                      .options(selectinload(models.Listing.images), selectinload(models.Listing.host))
                      .order_by(models.Listing.created_at.desc())).all()
    out = []
    for l in rows:
        d = services.listing_summary(l)
        d["upcoming_bookings"] = db.scalar(select(func.count()).select_from(models.Booking).where(
            models.Booking.listing_id == l.id, models.Booking.status == "confirmed",
            models.Booking.check_out >= date.today())) or 0
        out.append(d)
    return out


@router.get("/host/bookings")
def host_bookings(db: Session = Depends(get_db), user=Depends(host_user)):
    rows = db.scalars(select(models.Booking).join(models.Listing).where(models.Listing.host_id == user.id)
                      .options(selectinload(models.Booking.listing).selectinload(models.Listing.images),
                               selectinload(models.Booking.listing).selectinload(models.Listing.host),
                               selectinload(models.Booking.guest))
                      .order_by(models.Booking.check_in.desc())).all()
    return [services.booking_dict(b, with_guest=True) for b in rows]


@router.get("/host/listings/{listing_id}")
def my_listing(listing_id: int, db: Session = Depends(get_db), user=Depends(host_user)):
    return services.listing_detail(_owned(db, listing_id, user))


@router.post("/host/listings", status_code=201)
def create_listing(body: schemas.ListingIn, db: Session = Depends(get_db), user=Depends(host_user)):
    l = models.Listing(host_id=user.id)
    _apply(l, body, db)
    db.add(l); db.commit(); db.refresh(l)
    return services.listing_detail(l)


@router.put("/host/listings/{listing_id}")
def update_listing(listing_id: int, body: schemas.ListingIn, db: Session = Depends(get_db), user=Depends(host_user)):
    l = _owned(db, listing_id, user)
    _apply(l, body, db)
    db.commit(); db.refresh(l)
    return services.listing_detail(l)


@router.delete("/host/listings/{listing_id}")
def delete_listing(listing_id: int, db: Session = Depends(get_db), user=Depends(host_user)):
    l = _owned(db, listing_id, user)
    upcoming = db.scalar(select(func.count()).select_from(models.Booking).where(
        models.Booking.listing_id == l.id, models.Booking.status == "confirmed",
        models.Booking.check_out >= date.today()))
    if upcoming:
        raise HTTPException(409, f"This listing has {upcoming} upcoming reservation(s). Cancel them first.")
    db.delete(l); db.commit()
    return {"deleted": listing_id}


@router.post("/uploads", status_code=201)
async def upload_image(request: Request, file: UploadFile = File(...), user=Depends(current_user)):
    ext = pathlib.Path(file.filename or "").suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise HTTPException(422, "Upload a JPG, PNG, WEBP or GIF image")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(422, "Image must be under 5 MB")
    name = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / name).write_bytes(data)
    return {"url": f"{str(request.base_url).rstrip('/')}/uploads/{name}"}
