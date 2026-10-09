from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from .. import models, schemas, services
from ..database import get_db
from ..security import current_user

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.post("", status_code=201)
def create_booking(body: schemas.BookingIn, db: Session = Depends(get_db), user=Depends(current_user)):
    listing = db.get(models.Listing, body.listing_id)
    if not listing:
        raise HTTPException(404, "Listing not found")
    services.validate_stay(db, listing, body.check_in, body.check_out, body.guests, user)  # incl. overlap check
    q = services.compute_quote(listing, body.check_in, body.check_out)
    b = models.Booking(code=services.new_code(), listing_id=listing.id, guest_id=user.id,
                       check_in=body.check_in, check_out=body.check_out, guests=body.guests,
                       nights=q["nights"], subtotal=q["subtotal"], cleaning_fee=q["cleaning_fee"],
                       service_fee=q["service_fee"], total=q["total"], payment_method=body.payment_method)
    db.add(b); db.commit(); db.refresh(b)
    return services.booking_dict(b)


@router.get("/me")
def my_trips(db: Session = Depends(get_db), user=Depends(current_user)):
    rows = db.scalars(select(models.Booking).where(models.Booking.guest_id == user.id)
                      .options(selectinload(models.Booking.listing).selectinload(models.Listing.images),
                               selectinload(models.Booking.listing).selectinload(models.Listing.host))
                      .order_by(models.Booking.check_in.desc())).all()
    return [services.booking_dict(b) for b in rows]


@router.post("/{booking_id}/cancel")
def cancel(booking_id: int, db: Session = Depends(get_db), user=Depends(current_user)):
    b = db.get(models.Booking, booking_id)
    if not b or b.guest_id != user.id:
        raise HTTPException(404, "Booking not found")
    if b.status == "cancelled":
        raise HTTPException(409, "This trip is already cancelled")
    if b.check_out < date.today():
        raise HTTPException(422, "Past trips can't be cancelled")
    b.status = "cancelled"  # dates are freed because availability only counts confirmed bookings
    db.commit()
    return services.booking_dict(b)
