"""Seed data: hosts, guests, 28 listings with photos, amenities, bookings and reviews."""
import random
import os
from datetime import date, timedelta
from sqlalchemy.orm import Session
from . import models
from .security import hash_password
from .services import compute_quote, new_code, recompute_rating

U = "https://images.unsplash.com/{}?auto=format&fit=crop&w=1200&q=80"
HOUSES = ["photo-1564013799919-ab600027ffc6", "photo-1568605114967-8130f3a36994", "photo-1512917774080-9991f1c4c750",
          "photo-1600596542815-ffad4c1539a9", "photo-1600585154340-be6161a56a0c", "photo-1613490493576-7fde63acd811",
          "photo-1580587771525-78b9dba3b914", "photo-1523217582562-09d0def993a6", "photo-1518780664697-55e3ad937233",
          "photo-1600607687939-ce8a6c25118c", "photo-1600566753190-17f0baa2a6c3", "photo-1576941089067-2de3c901e126"]
INTERIORS = ["photo-1502672260266-1c1ef2d93688", "photo-1505691938895-1758d7feb511", "photo-1522708323590-d24dbb6b0267",
             "photo-1493809842364-78817add7ffb", "photo-1540518614846-7eded433c457", "photo-1631049307264-da0ec9d70304",
             "photo-1616594039964-ae9021a400a0", "photo-1615874959474-d609969a20ed", "photo-1556911220-bff31c812dba",
             "photo-1484154218962-a197022b5858"]
CABINS = ["photo-1449158743715-0a90ebb6d2d8", "photo-1510798831971-661eb04b3739", "photo-1587061949409-02df41d5e562",
          "photo-1475855581690-80accde3ae2b", "photo-1542718610-a1d656d1884c"]
BEACH = ["photo-1499793983690-e29da59ef1c2", "photo-1507525428034-b723cf961d3e", "photo-1544984243-ec57ea16fe25",
         "photo-1571896349842-33c89424de2d", "photo-1566073771259-6a8506099945"]
POOLS = {"H": HOUSES, "I": INTERIORS, "C": CABINS, "B": BEACH}

AMENITIES = [("Wifi", "wifi"), ("Kitchen", "utensils"), ("Free parking", "car"), ("Pool", "waves"),
             ("Air conditioning", "snowflake"), ("Washer", "shirt"), ("TV", "tv"), ("Hot tub", "bath"),
             ("Gym", "dumbbell"), ("BBQ grill", "flame"), ("Beach access", "umbrella"), ("Mountain view", "mountain"),
             ("Lake access", "sailboat"), ("Fireplace", "heater"), ("Dedicated workspace", "laptop"),
             ("Pets allowed", "paw-print"), ("Breakfast", "coffee"), ("Smoke alarm", "bell"),
             ("Garden view", "trees"), ("Balcony", "door-open")]

# title, city, state, lat, lng, type, category, price, guests, bedrooms, baths, pool
LISTINGS = [
    ("Flat in Candolim", "Candolim", "Goa", 15.518, 73.762, "Flat", "amazing-pools", 10439, 4, 2, 2, "H"),
    ("Flat in North Goa", "North Goa", "Goa", 15.010, 74.023, "Flat", "beachfront", 11499, 4, 2, 2, "H"),
    ("Flat in Calangute", "Calangute", "Goa", 15.533, 73.762, "Flat", "cabins", 8000, 4, 2, 2, "H"),
    ("Flat in Mapusa", "Mapusa", "Goa", 15.593, 73.815, "Flat", "castles", 15300, 4, 2, 2, "H"),
    ("Home in Assagao", "Assagao", "Goa", 15.589, 73.774, "Home", "lakefront", 17186, 4, 2, 2, "H"),
    ("Apartment in Vagator", "Vagator", "Goa", 15.603, 73.733, "Apartment", "countryside", 17000, 4, 2, 2, "I"),
    ("Apartment in Candolim", "Candolim", "Goa", 15.518, 73.763, "Apartment", "trending", 12967, 4, 2, 2, "I"),
    ("Designer studio near Hauz Khas", "New Delhi", "Delhi", 28.5494, 77.2001, "Apartment", "design", 4300, 2, 1, 1, "I"),
    ("Riverside camp with starlit tents", "Leh", "Ladakh", 34.1526, 77.577, "Tent", "camping", 3800, 4, 2, 1, "C"),
    ("Mountain-view stay above the Ganges", "Rishikesh", "Uttarakhand", 30.0869, 78.2676, "Guesthouse", "amazing-views", 3200, 3, 1, 1, "C"),
    ("Treehouse in a Coorg coffee estate", "Madikeri", "Karnataka", 12.4244, 75.7382, "Treehouse", "treehouses", 6900, 2, 1, 1, "C"),
    ("Farm stay among mango orchards", "Alibaug", "Maharashtra", 18.6414, 72.8722, "Farm stay", "farms", 5100, 6, 3, 2, "H"),
    ("Luxury Penthouse in KP", "Pune", "Maharashtra", 18.5362, 73.8969, "Apartment", "trending", 14500, 6, 3, 3, "I"),
    ("Cozy Studio in Baner", "Pune", "Maharashtra", 18.5590, 73.7868, "Apartment", "design", 3500, 2, 1, 1, "I"),
    ("Villa with Pool in Koregaon Park", "Pune", "Maharashtra", 18.5362, 73.8969, "Villa", "amazing-pools", 22000, 8, 4, 4, "H"),
    ("Palace wing with city views", "Jaipur", "Rajasthan", 26.9124, 75.7873, "Palace", "castles", 18500, 6, 3, 3, "H"),
    ("Tiny home among the Nilgiri pines", "Ooty", "Tamil Nadu", 11.4102, 76.695, "Tiny home", "tiny-homes", 3600, 2, 1, 1, "C"),
    ("Lakeside mansion with a private garden", "Nainital", "Uttarakhand", 29.3919, 79.4542, "Mansion", "mansions", 16500, 10, 5, 5, "H"),
    ("Island hut a short walk from the beach", "Havelock Island", "Andaman and Nicobar Islands", 11.9748, 92.9886, "Hut", "islands", 7400, 3, 1, 1, "B"),
    ("Cliffside villa overlooking the sea", "Varkala", "Kerala", 8.7379, 76.7163, "Villa", "amazing-views", 8800, 5, 2, 2, "B"),
    ("Hillside chalet by the Parvati river", "Kasol", "Himachal Pradesh", 32.01, 77.314, "Chalet", "cabins", 4200, 4, 2, 1, "C"),
    ("Boutique room in French Quarter", "Puducherry", "Puducherry", 11.934, 79.8306, "Boutique hotel", "design", 5600, 2, 1, 1, "I"),
    ("Garden apartment in Indiranagar", "Bengaluru", "Karnataka", 12.9784, 77.6408, "Apartment", "trending", 4900, 3, 1, 1, "I"),
    ("Desert camp near the Sam dunes", "Jaisalmer", "Rajasthan", 26.9157, 70.9083, "Camp", "camping", 4500, 4, 2, 1, "C"),
    ("Beach house with hammocks", "Gokarna", "Karnataka", 14.5479, 74.3188, "Beach house", "beachfront", 5800, 6, 3, 2, "B"),
    ("Riverside villa with infinity pool", "Dehradun", "Uttarakhand", 30.3165, 78.0322, "Villa", "amazing-pools", 9800, 8, 4, 4, "H"),
    ("Quiet room in a heritage Kolkata home", "Kolkata", "West Bengal", 22.5726, 88.3639, "Room", "rooms", 2400, 2, 1, 1, "I"),
    ("Hilltop cottage with tea garden views", "Darjeeling", "West Bengal", 27.036, 88.2627, "Cottage", "countryside", 5300, 4, 2, 2, "C"),
    ("Penthouse with skyline views", "Hyderabad", "Telangana", 17.4239, 78.4738, "Apartment", "amazing-views", 7200, 4, 2, 2, "I"),
    ("Floating houseboat on Dal Lake", "Srinagar", "Jammu & Kashmir", 34.0837, 74.7973, "Houseboat", "lakefront", 6600, 4, 2, 1, "B"),
    ("Mansion with a private cinema room", "Lonavala", "Maharashtra", 18.7546, 73.4062, "Mansion", "mansions", 21000, 12, 6, 6, "H"),
    ("Eco Retreat", "Karjat", "Maharashtra", 18.9102, 73.3239, "Farm stay", "farms", 4500, 4, 2, 2, "H"),
    ("Riverfront Villa", "Karjat", "Maharashtra", 18.9220, 73.3320, "Villa", "amazing-views", 9800, 8, 4, 4, "H"),
    ("Boutique Heritage Home in Camp", "Pune", "Maharashtra", 18.5156, 73.8778, "Home", "mansions", 6000, 4, 2, 2, "H"),
    ("Modern Loft in Viman Nagar", "Pune", "Maharashtra", 18.5665, 73.9122, "Loft", "design", 4200, 3, 1, 1, "I"),
    ("Rustic Cabin in the Woods", "Karjat", "Maharashtra", 18.9100, 73.3300, "Cabin", "cabins", 3800, 2, 1, 1, "H"),
    ("Luxury Farmhouse with Pool", "Karjat", "Maharashtra", 18.9300, 73.3400, "Farm stay", "amazing-pools", 15000, 10, 4, 4, "H"),
    ("Hilltop Villa with Infinity Pool", "Lonavala", "Maharashtra", 18.7500, 73.4000, "Villa", "amazing-pools", 18000, 8, 4, 4, "H"),
    ("Cozy Cottage near Tiger Point", "Lonavala", "Maharashtra", 18.7400, 73.4100, "Cottage", "countryside", 5000, 4, 2, 2, "H"),
    ("Mountain View Retreat", "Lonavala", "Maharashtra", 18.7600, 73.4200, "Home", "amazing-views", 7500, 6, 3, 3, "H"),
]

CAT_BLURB = {
    "amazing-pools": "Take a morning dip in your own pool, then settle into a lounger with a book.",
    "beachfront": "Hear the waves from your bed and walk straight onto the sand.",
    "cabins": "Cosy wooden interiors, crisp mountain air and a deck made for slow evenings.",
    "castles": "Carved arches, courtyards and a sense of history in every room.",
    "lakefront": "Water on every side, with sunrise views from the deck.",
    "countryside": "Rolling green views, birdsong and the kind of quiet you rarely find in the city.",
    "trending": "A stylish base in the middle of everything, close to cafes, galleries and nightlife.",
    "design": "Thoughtfully designed with local art, warm light and handmade details.",
    "camping": "Sleep under a sky full of stars with comfortable beds and hot meals on request.",
    "amazing-views": "Wake up to a view that makes you forget your phone.",
    "treehouses": "Perched among the canopy, a private hideaway for two.",
    "farms": "Fresh produce, open fields and room for the whole family to roam.",
    "tiny-homes": "Small footprint, big comforts: a clever home with everything you need.",
    "mansions": "Space for everyone, with sprawling lounges, lawns and plenty of room to celebrate.",
    "islands": "Turquoise water, coconut palms and a pace of life that slows right down.",
    "rooms": "A comfortable private room in a welcoming home, close to local favourites.",
}
COMMENTS = [
    "Absolutely loved our stay. The place was exactly as pictured and the host was incredibly responsive.",
    "Spotless, comfortable and in a great location. We'd happily come back.",
    "The views were even better in person. Perfect for a weekend away.",
    "Great value for the price. Check-in was smooth and the host left helpful tips for the area.",
    "A lovely, peaceful stay. The beds were comfy and the kitchen had everything we needed.",
    "Our family had a wonderful time. Plenty of space and very thoughtful touches throughout.",
    "Beautiful property with so much character. Highly recommended.",
    "Everything was perfect. The host went above and beyond to make us feel welcome.",
    "Cosy, clean and quiet. Exactly what we were looking for.",
    "Fantastic location, easy to find, and the photos don't do it justice.",
]
GUEST_NAMES = ["Aarav Mehta", "Ishita Sharma", "Rohan Gupta", "Meera Nair", "Kabir Singh", "Ananya Iyer",
               "Vikram Rao", "Sana Khan", "Neha Kapoor", "Arjun Verma"]


def _amenities_for(cat: str, ptype: str) -> list[str]:
    names = ["Wifi", "Smoke alarm"]
    if ptype not in ("Tent", "Camp"):
        names += ["Kitchen", "TV"]
    extra = {"amazing-pools": ["Pool", "Hot tub", "Air conditioning", "Free parking", "BBQ grill"],
             "beachfront": ["Beach access", "BBQ grill", "Breakfast"], "cabins": ["Fireplace", "Mountain view", "Free parking"],
             "castles": ["Air conditioning", "Breakfast", "Garden view", "Free parking"],
             "lakefront": ["Lake access", "Breakfast", "Balcony"], "countryside": ["Garden view", "Free parking", "Breakfast"],
             "trending": ["Air conditioning", "Dedicated workspace", "Washer", "Gym"],
             "design": ["Air conditioning", "Dedicated workspace", "Balcony"], "camping": ["Breakfast", "Mountain view"],
             "amazing-views": ["Balcony", "Mountain view", "Air conditioning"], "treehouses": ["Garden view", "Breakfast"],
             "farms": ["Garden view", "Pets allowed", "BBQ grill", "Free parking"], "tiny-homes": ["Mountain view", "Fireplace"],
             "mansions": ["Pool", "Gym", "Air conditioning", "Free parking", "Pets allowed"],
             "islands": ["Beach access", "Breakfast"], "rooms": ["Air conditioning", "Breakfast", "Dedicated workspace"]}
    return names + extra.get(cat, [])


def seed(db: Session):
    if db.query(models.User).count():
        return
    random.seed(11)
    today = date.today()
    avatar = lambda n: f"https://api.dicebear.com/7.x/initials/svg?seed={n}"
    pw = hash_password("password123")

    hosts = []
    for i, (n, e, sup) in enumerate([("Priya Kapoor", "host@example.com", True), ("Rahul Desai", "rahul@example.com", True),
                                      ("Sneha Menon", "sneha@example.com", False), ("Aditya Rathore", "aditya@example.com", False)]):
        hosts.append(models.User(name=n, email=e, password_hash=pw, avatar_url=avatar(n), is_host=True, is_superhost=sup,
                                 bio="I love hosting travellers from around the world and sharing my favourite local spots."))
    demo = models.User(name="Kritika Demo", email="guest@example.com", password_hash=pw, avatar_url=avatar("Kritika Demo"))
    guests = [models.User(name=n, email=f"{n.split()[0].lower()}@example.com", password_hash=pw, avatar_url=avatar(n)) for n in GUEST_NAMES]
    db.add_all(hosts + [demo] + guests); db.flush()

    amen = {n: models.Amenity(name=n, icon=ic) for n, ic in AMENITIES}
    db.add_all(amen.values()); db.flush()

    listings = []
    for i, (title, city, state, lat, lng, ptype, cat, price, mg, br, ba, pool) in enumerate(LISTINGS):
        p = POOLS[pool]
        gallery = [p[i % len(p)], INTERIORS[i % 10], INTERIORS[(i + 3) % 10], p[(i + 1) % len(p)], INTERIORS[(i + 5) % 10]]
        
        # Override for first 4 listings to use ALL images from their local folder
        if i < 4:
            try:
                # Next.js public directory
                img_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'images', str(i + 1))
                if os.path.exists(img_dir):
                    files = sorted([f for f in os.listdir(img_dir) if f.endswith(('.avif', '.webp', '.jpg', '.png', '.jpeg'))])
                    if len(files) >= 5:
                        gallery = [f'/images/{i+1}/{f}' for f in files[:5]]
                    else:
                        print(f'Warning: Not enough images in folder {i+1}')
            except Exception as e:
                print('Error reading local images', e)

        l = models.Listing(
            host_id=hosts[i % 4].id, title=title, property_type=ptype, category=cat, city=city, state=state,
            country="India", address=f"{city}, {state}", lat=lat, lng=lng, price_per_night=price,
            cleaning_fee=round(price * 0.08, -2) or 300, max_guests=mg, bedrooms=br, beds=max(1, br + (mg > br * 2)), bathrooms=ba,
            description=(f"{CAT_BLURB[cat]}\n\nThis {ptype.lower()} in {city}, {state} sleeps {mg} guests across {br or 1} "
                         f"bedroom{'s' if br > 1 else ''}. Spend your days exploring the neighbourhood and come back to a "
                         f"comfortable, well-kept space.\n\nYour host is happy to share tips on where to eat, what to see "
                         f"and how to get around. Self check-in is available and the host is a message away for anything you need."),
            images=[models.ListingImage(url=(g if g.startswith('/') else U.format(g)), position=k) for k, g in enumerate(gallery)],
            amenities=[amen[n] for n in _amenities_for(cat, ptype)])
        listings.append(l)
    db.add_all(listings); db.flush()

    def book(l, guest, start, nights, n_guests=2):
        q = compute_quote(l, start, start + timedelta(days=nights))
        db.add(models.Booking(code=new_code(), listing_id=l.id, guest_id=guest.id, check_in=start,
                              check_out=start + timedelta(days=nights), guests=min(n_guests, l.max_guests),
                              nights=nights, subtotal=q["subtotal"], cleaning_fee=q["cleaning_fee"],
                              service_fee=q["service_fee"], total=q["total"], payment_method="card"))

    for i, l in enumerate(listings):
        g = random.sample(guests, 6)
        book(l, g[0], today - timedelta(days=40 + i * 3), 3)           # completed stay
        if i % 3 == 0:
            book(l, g[1], today + timedelta(days=7 + i), 3)           # upcoming => blocked dates on calendar
        for k, reviewer in enumerate(random.sample(guests, random.randint(4, 7))):
            db.add(models.Review(listing_id=l.id, user_id=reviewer.id, rating=random.choice([4, 5, 5, 5, 4, 5]),
                                 comment=random.choice(COMMENTS), created_at=today_dt(today, k * 9 + 5)))
    db.flush()
    for l in listings:
        recompute_rating(db, l)

    # demo guest: two completed stays (can leave a review on #2) and one upcoming trip
    book(listings[0], demo, today - timedelta(days=20), 3)
    book(listings[1], demo, today - timedelta(days=12), 3)
    book(listings[2], demo, today + timedelta(days=20), 3)
    db.commit()


def today_dt(today: date, days_ago: int):
    from datetime import datetime
    return datetime.combine(today, datetime.min.time()) - timedelta(days=days_ago)
