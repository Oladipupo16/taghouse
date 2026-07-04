const enquiries = [];

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
    const enquiry = {
      id: Date.now(),
      listingId: Number(payload.listingId) || null,
      name: cleanString(payload.name) || "Website visitor",
      contact: cleanString(payload.contact),
      message: cleanString(payload.message),
      status: "new",
      createdAt: new Date().toISOString(),
    };

    if (!enquiry.listingId) {
      return res.status(422).json({ error: "Listing ID is required" });
    }

    enquiries.unshift(enquiry);
    return res.status(201).json({ enquiry });
  }

  if (req.method === "GET") {
    return res.status(200).json({ enquiries });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
