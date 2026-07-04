const requests = [];

function cleanString(value) {
  return String(value || "").trim();
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    const payload = req.body || {};
    const images = Array.isArray(payload.images)
      ? payload.images
          .filter((image) => typeof image?.data === "string" && image.data.startsWith("data:image/"))
          .slice(0, 6)
          .map((image) => image.data)
      : [];

    const request = {
      id: Date.now(),
      title: cleanString(payload.title),
      type: cleanString(payload.type),
      location: cleanString(payload.location),
      price: cleanString(payload.price),
      details: cleanString(payload.details),
      images,
      status: "new",
      createdAt: new Date().toISOString(),
    };

    if (!request.title || !request.type || !request.location || !request.price || !request.details) {
      return res.status(422).json({ error: "All listing request fields are required" });
    }

    requests.unshift(request);
    return res.status(201).json({ request });
  }

  if (req.method === "GET") {
    return res.status(200).json({ requests });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
