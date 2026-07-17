import cloudinary
import cloudinary.uploader
import os

cloudinary.config(
    cloud_name="u6r3rjvi",
    api_key="367178413822472",
    api_secret="iXiS8WXNzwwsL9UidK4iiIkKQ0Q",
    secure=True
)

blogs = [
    "image1",
    "image2",
    "image3",
    "image4",
    "image5",
    "image6",
    "image7",
    "image8",
    "image9",
    "image10",
    "image11",
    "image12"
    
    
]

print("🚀 Uploading blogs photos...\n")

for blog_id in blogs:
    uploaded = False
    for ext in ["jpg", "jpeg", "png", "webp"]:
        path = f"blog-photos/{blog_id}.{ext}"
        if os.path.exists(path):
            result = cloudinary.uploader.upload(
                path,
                public_id=f"taghouse/blogs/{blog_id}",
                overwrite=True,
                transformation=[
                    {"width": 400, "height": 400, "crop": "fill", "gravity": "face"}
                ]
            )
            print(f"✅ {blog_id}")
            print(f"   URL: {result['secure_url']}\n")
            uploaded = True
            break
    if not uploaded:
        print(f"⚠️  No photo found for: {blog_id}\n")

print("🎉 Done! Copy the URLs above into your blog data")