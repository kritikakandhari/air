import pytest
from fastapi.testclient import TestClient
from datetime import datetime, date, timedelta
from app.main import app
from app.database import Base, engine, SessionLocal
from app import models
from app.security import create_token

client = TestClient(app)

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Create users
    u1 = models.User(name="User One", email="u1@example.com", password_hash="hash")
    u2 = models.User(name="User Two", email="u2@example.com", password_hash="hash")
    db.add_all([u1, u2])
    db.commit()
    
    # Create listing owned by u1
    l = models.Listing(
        title="Test Listing", description="Test Description", property_type="House", category="Beach",
        city="Test", state="TS", country="India", max_guests=4,
        price_per_night=100, host_id=u1.id, bedrooms=1, beds=1, bathrooms=1
    )
    db.add(l)
    db.commit()
    
    yield db
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def token1(db):
    return create_token({"sub": "u1@example.com"})

@pytest.fixture
def token2(db):
    return create_token({"sub": "u2@example.com"})

def test_own_listing_booking_blocked(db, token1):
    # u1 owns listing 1
    res = client.post("/api/bookings", json={
        "listing_id": 1,
        "check_in": str(date.today() + timedelta(days=1)),
        "check_out": str(date.today() + timedelta(days=3)),
        "guests": 2
    }, headers={"Authorization": f"Bearer {token1}"})
    assert res.status_code == 400
    assert "own listing" in res.json()["detail"].lower()

def test_max_guests(db, token2):
    res = client.post("/api/bookings/quote", json={
        "listing_id": 1,
        "check_in": str(date.today() + timedelta(days=1)),
        "check_out": str(date.today() + timedelta(days=3)),
        "guests": 5  # max is 4
    }, headers={"Authorization": f"Bearer {token2}"})
    assert res.status_code == 400
    assert "maximum" in res.json()["detail"].lower() or "guests" in res.json()["detail"].lower()

def test_overlap_and_checkout_day_free(db, token2):
    d1 = date.today() + timedelta(days=10)
    d2 = date.today() + timedelta(days=15)
    
    # Book d1 to d2
    res = client.post("/api/bookings", json={
        "listing_id": 1,
        "check_in": str(d1),
        "check_out": str(d2),
        "guests": 2
    }, headers={"Authorization": f"Bearer {token2}"})
    assert res.status_code == 200
    booking_code = res.json()["code"]
    
    # Try overlapping exactly
    res = client.post("/api/bookings", json={
        "listing_id": 1,
        "check_in": str(d1 + timedelta(days=1)),
        "check_out": str(d2 - timedelta(days=1)),
        "guests": 2
    }, headers={"Authorization": f"Bearer {token2}"})
    assert res.status_code == 409
    
    # Try check-in ON previous check-out (should be allowed)
    res = client.post("/api/bookings", json={
        "listing_id": 1,
        "check_in": str(d2),
        "check_out": str(d2 + timedelta(days=2)),
        "guests": 2
    }, headers={"Authorization": f"Bearer {token2}"})
    assert res.status_code == 200
    
    # Cancel first booking
    res = client.post(f"/api/bookings/{booking_code}/cancel", headers={"Authorization": f"Bearer {token2}"})
    assert res.status_code == 200
    
    # Now overlapping exactly should work (freed dates)
    res = client.post("/api/bookings", json={
        "listing_id": 1,
        "check_in": str(d1 + timedelta(days=1)),
        "check_out": str(d2 - timedelta(days=1)),
        "guests": 2
    }, headers={"Authorization": f"Bearer {token2}"})
    assert res.status_code == 200

def test_review_only_after_stay(db, token2):
    d1 = date.today() + timedelta(days=20)
    d2 = date.today() + timedelta(days=22)
    
    # Book in the future
    client.post("/api/bookings", json={
        "listing_id": 1,
        "check_in": str(d1),
        "check_out": str(d2),
        "guests": 2
    }, headers={"Authorization": f"Bearer {token2}"})
    
    # Try to review
    res = client.post("/api/listings/1/reviews", json={
        "rating": 5,
        "comment": "Great!"
    }, headers={"Authorization": f"Bearer {token2}"})
    assert res.status_code == 403
    assert "completed stay" in res.json()["detail"].lower() or "past booking" in res.json()["detail"].lower()
