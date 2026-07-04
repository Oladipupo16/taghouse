"""
Cloudinary Upload Script for TagHouse
Uploads all property images to Cloudinary and updates the database
Run with: python3 upload_to_cloudinary.py
"""
import cloudinary
import cloudinary.uploader
import os
from database import SessionLocal
import models

# ── Cloudinary Config ─────────────────────────────────────────────
cloudinary.config(
    cloud_name="u6r3rjvi",
    api_key="367178413822472",
    api_secret="iXiS8WXNzwwsL9UidK4iiIkKQ0Q",
    secure=True
)

# ── Image mapping: local path → listing title keyword ────────────
image_map = {
    "assets/apartmentone/building-outdoor.jpeg": "Serviced 2-bedroom apartment",
    "assets/dryland/dryland1.jpeg":              "Dry residential land",
    "assets/4bedroom-abuja/outside.jpeg":        "4-bedroom detached house",
    "assets/office-port/outdoor.jpeg":           "Open-plan office suite",
    "assets/student-mini/entrance.jpeg":         "Student-friendly mini flat",
    "assets/big-lease/droneview.jpeg":           "Long-lease mixed-use land",
}

db = SessionLocal()

print("🚀 Starting Cloudinary upload...\n")

for local_path, title_keyword in image_map.items():
    if not os.path.exists(local_path):
        print(f"⚠️  File not found: {local_path} — skipping")
        continue

    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            local_path,
            folder="taghouse",
            use_filename=True,
            unique_filename=True,
        )
        cloudinary_url = result["secure_url"]
        print(f"✅ Uploaded: {local_path}")
        print(f"   URL: {cloudinary_url}\n")

        # Update the database
        listing = db.query(models.Listing).filter(
            models.Listing.title.ilike(f"%{title_keyword}%")
        ).first()

        if listing:
            listing.image = cloudinary_url
            db.commit()
            print(f"   ✅ Database updated for: {listing.title}\n")
        else:
            print(f"   ⚠️  No listing found matching: {title_keyword}\n")

    except Exception as e:
        print(f"❌ Error uploading {local_path}: {e}\n")

db.close()
print("🎉 Done! All images uploaded to Cloudinary.")