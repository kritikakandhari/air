from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from .. import models, services
from ..database import get_db
from ..security import current_user

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])


@router.get("")
def get_wishlist(db: Session = Depends(get_db), user=Depends(current_user)):
    rows = db.scalars(select(models.Listing).join(models.Wishlist, models.Wishlist.listing_id == models.Listing.id)
                      .where(models.Wishlist.user_id == user.id).order_by(models.Wishlist.created_at.desc())
                      .options(selectinload(models.Listing.images), selectinload(models.Listing.host))).all()
    ids = {l.id for l in rows}
    return [services.listing_summary(l, ids) for l in rows]


@router.post("/{listing_id}", status_code=201)
def add(listing_id: int, db: Session = Depends(get_db), user=Depends(current_user)):
    if not db.get(models.Listing, listing_id):
        raise HTTPException(404, "Listing not found")
    if not db.get(models.Wishlist, (user.id, listing_id)):
        db.add(models.Wishlist(user_id=user.id, listing_id=listing_id)); db.commit()
    return {"listing_id": listing_id, "saved": True}


@router.delete("/{listing_id}")
def remove(listing_id: int, db: Session = Depends(get_db), user=Depends(current_user)):
    w = db.get(models.Wishlist, (user.id, listing_id))
    if w:
        db.delete(w); db.commit()
    return {"listing_id": listing_id, "saved": False}
