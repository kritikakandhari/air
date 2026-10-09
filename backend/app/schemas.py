"""Pydantic request bodies (validation lives here)."""
from __future__ import annotations
import re
from datetime import date; from typing import Optional
from pydantic import BaseModel, Field, field_validator

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class SignupIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str
    password: str = Field(min_length=6, max_length=128)

    @field_validator("email")
    @classmethod
    def _email(cls, v: str):
        v = v.strip().lower()
        if not _EMAIL.match(v):
            raise ValueError("Enter a valid email address")
        return v


class LoginIn(BaseModel):
    email: str
    password: str


class BookingIn(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests: int = Field(ge=1, le=20)
    payment_method: str = Field(default="card", pattern="^(card|upi|netbanking)$")


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3, max_length=1000)


class ListingIn(BaseModel):
    title: str = Field(min_length=5, max_length=150)
    description: str = Field(min_length=20, max_length=5000)
    property_type: str = Field(min_length=2, max_length=40)
    category: str = Field(min_length=2, max_length=40)
    city: str = Field(min_length=2, max_length=80)
    state: str = Field(min_length=2, max_length=80)
    country: str = "India"
    address: Optional[str] = None
    lat: float = Field(default=20.5937, ge=-90, le=90)
    lng: float = Field(default=78.9629, ge=-180, le=180)
    price_per_night: int = Field(gt=0, le=1_000_000)
    cleaning_fee: int = Field(default=0, ge=0, le=100_000)
    max_guests: int = Field(ge=1, le=20)
    bedrooms: int = Field(ge=0, le=20)
    beds: int = Field(ge=1, le=40)
    bathrooms: int = Field(ge=1, le=20)
    image_urls: list[str] = Field(min_length=1, max_length=15)
    amenity_ids: list[int] = []
