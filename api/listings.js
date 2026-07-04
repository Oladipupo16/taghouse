const fs = require("node:fs");
const path = require("node:path");

const dbPath = path.join(process.cwd(), "data", "db.json");

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
  } catch {
    return { listings: [] };
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const db = readDb();
  const listings = Array.isArray(db.listings)
    ? db.listings.filter((listing) => listing.status !== "archived")
    : [];

  return res.status(200).json({ listings });
};
