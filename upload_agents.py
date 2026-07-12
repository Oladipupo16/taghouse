import cloudinary
import cloudinary.uploader
import os

cloudinary.config(
    cloud_name="u6r3rjvi",
    api_key="367178413822472",
    api_secret="iXiS8WXNzwwsL9UidK4iiIkKQ0Q",
    secure=True
)

agents = [
    "agent-john-okafor",
    "agent-amara-okeke",
    "agent-chisom-nwosu",
    "agent-omotola-phineas",
    "agent-adetona-ifeoluwa",
    "agent-emeka-maduka",
]

print("🚀 Uploading agent photos...\n")

for agent_id in agents:
    uploaded = False
    for ext in ["jpg", "jpeg", "png", "webp"]:
        path = f"agent-photos/{agent_id}.{ext}"
        if os.path.exists(path):
            result = cloudinary.uploader.upload(
                path,
                public_id=f"taghouse/agents/{agent_id}",
                overwrite=True,
                transformation=[
                    {"width": 400, "height": 400, "crop": "fill", "gravity": "face"}
                ]
            )
            print(f"✅ {agent_id}")
            print(f"   URL: {result['secure_url']}\n")
            uploaded = True
            break
    if not uploaded:
        print(f"⚠️  No photo found for: {agent_id}\n")

print("🎉 Done! Copy the URLs above into your agent data")