"""SQLAlchemy models — the database schema.

users ─┬─< listings ─┬─< listing_images
       │             ├─< bookings >─ users (guest)
       │             ├─< reviews   >─ users
       │             ├─>< amenities   (listing_amenities)
       │             └─< wishlist  >─ users
"""
from datetime import datetime, date
from sqlalchemy import (String, Integer, Float, Boolean, ForeignKey, Date, DateTime, Text, Table, Column,
                        UniqueConstraint, CheckConstraint, Index)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

listing_amenities = Table(
    "listing_amenities", Base.metadata,
    Column("listing_id", ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True),
    Column("amenity_id", ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    avatar_url: Mapped[str | None] = mapped_column(String(300), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_host: Mapped[bool] = mapped_column(Boolean, default=False)
    is_superhost: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    listings: Mapped[list["Listing"]] = relationship(back_populates="host")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="guest")
    wishlist: Mapped[list["Wishlist"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Amenity(Base):
    __tablename__ = "amenities"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60), unique=True)
    icon: Mapped[str] = mapped_column(String(40), default="sparkles")


class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = (
        CheckConstraint("price_per_night > 0", name="ck_price_positive"),
        CheckConstraint("max_guests > 0", name="ck_guests_positive"),
        Index("ix_listings_city", "city"),
        Index("ix_listings_category", "category"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(150))
    description: Mapped[str] = mapped_column(Text)
    property_type: Mapped[str] = mapped_column(String(40))
    category: Mapped[str] = mapped_column(String(40))
    city: Mapped[str] = mapped_column(String(80))
    state: Mapped[str] = mapped_column(String(80))
    country: Mapped[str] = mapped_column(String(80), default="India")
    address: Mapped[str | None] = mapped_column(String(200), nullable=True)
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lng: Mapped[float] = mapped_column(Float, default=0.0)
    price_per_night: Mapped[int] = mapped_column(Integer)
    cleaning_fee: Mapped[int] = mapped_column(Integer, default=0)
    max_guests: Mapped[int] = mapped_column(Integer, default=2)
    bedrooms: Mapped[int] = mapped_column(Integer, default=1)
    beds: Mapped[int] = mapped_column(Integer, default=1)
    bathrooms: Mapped[int] = mapped_column(Integer, default=1)
    rating_avg: Mapped[float] = mapped_column(Float, default=0.0)  # denormalised aggregate
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    host: Mapped[User] = relationship(back_populates="listings")
    images: Mapped[list["ListingImage"]] = relationship(back_populates="listing", cascade="all, delete-orphan",
                                                         order_by="ListingImage.position")
    amenities: Mapped[list[Amenity]] = relationship(secondary=listing_amenities)
    bookings: Mapped[list["Booking"]] = relationship(back_populates="listing", cascade="all, delete-orphan")
    reviews: Mapped[list["Review"]] = relationship(back_populates="listing", cascade="all, delete-orphan")


class ListingImage(Base):
    __tablename__ = "listing_images"
    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(String(500))
    position: Mapped[int] = mapped_column(Integer, default=0)
    listing: Mapped[Listing] = relationship(back_populates="images")


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("check_out > check_in", name="ck_dates_order"),
        Index("ix_bookings_listing_dates", "listing_id", "check_in", "check_out"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(12), unique=True)  # confirmation code e.g. HM4K9X2PQA
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"))
    guest_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    check_in: Mapped[date] = mapped_column(Date)
    check_out: Mapped[date] = mapped_column(Date)
    guests: Mapped[int] = mapped_column(Integer, default=1)
    nights: Mapped[int] = mapped_column(Integer)
    subtotal: Mapped[int] = mapped_column(Integer)
    cleaning_fee: Mapped[int] = mapped_column(Integer, default=0)
    service_fee: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="confirmed")  # confirmed | cancelled
    payment_method: Mapped[str] = mapped_column(String(20), default="card")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    listing: Mapped[Listing] = relationship(back_populates="bookings")
    guest: Mapped[User] = relationship(back_populates="bookings")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("listing_id", "user_id", name="uq_review_once"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_rating_range"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    listing: Mapped[Listing] = relationship(back_populates="reviews")
    user: Mapped[User] = relationship()


class Wishlist(Base):
    __tablename__ = "wishlist"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user: Mapped[User] = relationship(back_populates="wishlist")
