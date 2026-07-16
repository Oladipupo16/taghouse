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
    "blog-article1",
    "blog-article2",
    "blog-article3",
    "blog-article4",
    "blog-article5",
    "blog-article6",
    "blog-article7",
    "blog-article8",
    "blog-article9",
    "blog-article10",
    "blog-article11",
    "blog-article12"
    
]

print("🚀 Uploading blog photos...\n")

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