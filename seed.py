"""
Seed script — adds all 6 TagHouse listings into PostgreSQL
Run with: python3 seed.py
"""
import sys
from database import SessionLocal, engine
import models

# Create all tables if they don't exist
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ── Create a default admin user ───────────────────────────────────────────────
from auth import hash_password

admin_email = "admin@taghouse.com"
existing = db.query(models.User).filter(models.User.email == admin_email).first()

if not existing:
    admin = models.User(
        email=admin_email,
        hashed_password=hash_password("admin123"),
        full_name="TagHouse Admin",
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    admin_id = admin.id
    print(f"✅ Admin user created: {admin_email} / admin123")
else:
    admin_id = existing.id
    print(f"ℹ️  Admin user already exists: {admin_email}")

# ── Create agents ─────────────────────────────────────────────────────────────
agents_data = [
    {"name": "John Okafor",    "company": "BrightStone Realty",   "location": "Lagos",         "rating": 4.9},
    {"name": "Prime Acre Partners", "company": "Prime Acre Partners", "location": "Lagos",      "rating": 4.7},
    {"name": "Cedar Gate Homes",    "company": "Cedar Gate Homes",    "location": "Abuja",      "rating": 4.8},
    {"name": "HarborPoint Agency",  "company": "HarborPoint Agency",  "location": "Port Harcourt", "rating": 4.9},
    {"name": "MetroLet Managers",   "company": "MetroLet Managers",   "location": "Ibadan",     "rating": 4.6},
    {"name": "Northfield Assets",   "company": "Northfield Assets",   "location": "Abuja",      "rating": 4.8},
]

agent_map = {}
for a in agents_data:
    existing_agent = db.query(models.Agent).filter(models.Agent.name == a["name"]).first()
    if not existing_agent:
        agent = models.Agent(**a)
        db.add(agent)
        db.commit()
        db.refresh(agent)
        agent_map[a["name"]] = agent.id
        print(f"✅ Agent created: {a['name']}")
    else:
        agent_map[a["name"]] = existing_agent.id
        print(f"ℹ️  Agent already exists: {a['name']}")

# ── Create listings ───────────────────────────────────────────────────────────
listings_data = [
    {
        "title": "Serviced 2-bedroom apartment near Admiralty Way",
        "purpose": "rent",
        "category": "Apartment",
        "location": "Lekki",
        "price": 3200000,
        "price_label": "₦3.2m / year",
        "description": "A furnished apartment with standby power, security, water treatment, and quick access to major roads.",
        "image": "assets/apartmentone/building-outdoor.jpeg",
        "agent_name": "BrightStone Realty",
    },
    {
        "title": "Dry residential land with survey and deed",
        "purpose": "sale",
        "category": "Land",
        "location": "Lagos",
        "price": 18500000,
        "price_label": "₦18.5m",
        "description": "A fenced plot in a growing residential estate, suitable for a family home or medium-term investment.",
        "image": "assets/dryland/dryland1.jpeg",
        "agent_name": "Prime Acre Partners",
    },
    {
        "title": "4-bedroom detached house with boys' quarters",
        "purpose": "sale",
        "category": "House",
        "location": "Abuja",
        "price": 95000000,
        "price_label": "₦450m",
        "description": "Spacious detached home with fitted kitchen, family lounge, green area, and secure estate access.",
        "image": "assets/4bedroom-abuja/outside.jpeg",
        "agent_name": "Cedar Gate Homes",
    },
    {
        "title": "Open-plan office suite for growing teams",
        "purpose": "lease",
        "category": "Commercial",
        "location": "Port Harcourt",
        "price": 4800000,
        "price_label": "₦4.8m / year",
        "description": "Flexible office space with meeting room, reliable power options, and a central business location.",
        "image": "assets/office-port/outdoor.jpeg",
        "agent_name": "HarborPoint Agency",
    },
    {
        "title": "Student-friendly mini flat in gated compound",
        "purpose": "rent",
        "category": "Apartment",
        "location": "Ibadan",
        "price": 850000,
        "price_label": "₦850k / year",
        "description": "Compact mini flat with tiled rooms, personal meter, borehole water, and easy commute to campus areas.",
        "image": "assets/student-mini/entrance.jpeg",
        "agent_name": "MetroLet Managers",
    },
    {
        "title": "Long-lease mixed-use land on major road",
        "purpose": "lease",
        "category": "Land",
        "location": "Abuja",
        "price": 12500000,
        "price_label": "₦12.5m / year",
        "description": "Strategic lease opportunity for showroom, quick-service retail, logistics yard, or hospitality project.",
        "image": "assets/big-lease/droneview.jpeg",
        "agent_name": "Northfield Assets",
    },
]

for listing_data in listings_data:
    existing_listing = db.query(models.Listing).filter(
        models.Listing.title == listing_data["title"]
    ).first()

    if not existing_listing:
        agent_name = listing_data.pop("agent_name")
        agent_id = agent_map.get(agent_name)
        listing = models.Listing(
            **listing_data,
            user_id=admin_id,
            agent_id=agent_id,
            status="active"
        )
        db.add(listing)
        db.commit()
        print(f"✅ Listing created: {listing.title}")
    else:
        print(f"ℹ️  Listing already exists: {listing_data['title']}")

db.close()
print("\n🎉 Database seeded successfully!")
print(f"   Admin login: admin@taghouse.com / admin123")