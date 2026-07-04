const http = require("node:http");
const { readFile, writeFile, mkdir } = require("node:fs/promises");
const path = require("node:path");

const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

const fallbackDb = {
  listings: [],
  listingRequests: [],
  enquiries: [],
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message, details) {
  sendJson(res, status, { error: message, details });
}

function cleanString(value) {
  return String(value || "").trim();
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function publicListing(listing) {
  const { status, ...rest } = listing;
  return rest;
}

async function readDb() {
  try {
    const raw = await readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...fallbackDb,
      ...parsed,
      listings: Array.isArray(parsed.listings) ? parsed.listings : [],
      listingRequests: Array.isArray(parsed.listingRequests) ? parsed.listingRequests : [],
      enquiries: Array.isArray(parsed.enquiries) ? parsed.enquiries : [],
    };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await mkdir(DATA_DIR, { recursive: true });
    await writeDb(fallbackDb);
    return { ...fallbackDb };
  }
}

async function writeDb(db) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

async function parseBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) {
      throw Object.assign(new Error("Request body is too large"), { status: 413 });
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Request body must be valid JSON"), { status: 400 });
  }
}

function filterListings(listings, query) {
  const purpose = query.get("purpose");
  const category = query.get("category");
  const location = query.get("location");
  const maxPrice = Number(query.get("maxPrice") || 0);

  return listings
    .filter((listing) => listing.status !== "archived")
    .filter((listing) => !purpose || purpose === "all" || listing.purpose === purpose)
    .filter((listing) => !category || category === "all" || listing.category === category)
    .filter((listing) => !location || location === "all" || listing.location === location)
    .filter((listing) => !maxPrice || listing.price <= maxPrice)
    .map(publicListing);
}

function validateListing(payload) {
  const title = cleanString(payload.title);
  const purpose = cleanString(payload.purpose).toLowerCase();
  const category = cleanString(payload.category);
  const location = cleanString(payload.location);
  const price = Number(payload.price);
  const priceLabel = cleanString(payload.priceLabel);
  const agent = cleanString(payload.agent);
  const description = cleanString(payload.description);
  const specs = Array.isArray(payload.specs) ? payload.specs.map(cleanString).filter(Boolean) : [];

  if (!title) return { error: "Title is required" };
  if (!["rent", "sale", "lease"].includes(purpose)) return { error: "Purpose must be rent, sale, or lease" };
  if (!category) return { error: "Category is required" };
  if (!location) return { error: "Location is required" };
  if (!Number.isFinite(price) || price <= 0) return { error: "Price must be a positive number" };
  if (!priceLabel) return { error: "Price label is required" };
  if (!agent) return { error: "Agent is required" };
  if (!description) return { error: "Description is required" };

  return {
    listing: {
      title,
      purpose,
      category,
      location,
      price,
      priceLabel,
      specs,
      image: cleanString(payload.image) || "assets/house.svg",
      agent,
      description,
      status: "active",
    },
  };
}

async function handleApi(req, res, url) {
  const db = await readDb();
  const { pathname, searchParams } = url;

  if (req.method === "GET" && pathname === "/api/health") {
    return sendJson(res, 200, {
      ok: true,
      listings: db.listings.length,
      listingRequests: db.listingRequests.length,
      enquiries: db.enquiries.length,
    });
  }

  if (req.method === "GET" && pathname === "/api/listings") {
    return sendJson(res, 200, { listings: filterListings(db.listings, searchParams) });
  }

  const listingMatch = pathname.match(/^\/api\/listings\/(\d+)$/);
  if (req.method === "GET" && listingMatch) {
    const listing = db.listings.find((item) => Number(item.id) === Number(listingMatch[1]) && item.status !== "archived");
    if (!listing) return sendError(res, 404, "Listing not found");
    return sendJson(res, 200, { listing: publicListing(listing) });
  }

  if (req.method === "POST" && pathname === "/api/listings") {
    const payload = await parseBody(req);
    const validation = validateListing(payload);
    if (validation.error) return sendError(res, 422, validation.error);

    const listing = {
      id: nextId(db.listings),
      ...validation.listing,
      createdAt: new Date().toISOString(),
    };
    db.listings.push(listing);
    await writeDb(db);
    return sendJson(res, 201, { listing: publicListing(listing) });
  }

  if (req.method === "POST" && pathname === "/api/listing-requests") {
    const payload = await parseBody(req);
    const request = {
      id: nextId(db.listingRequests),
      title: cleanString(payload.title),
      type: cleanString(payload.type),
      location: cleanString(payload.location),
      price: cleanString(payload.price),
      details: cleanString(payload.details),
      status: "new",
      createdAt: new Date().toISOString(),
    };

    if (!request.title || !request.type || !request.location || !request.price || !request.details) {
      return sendError(res, 422, "All listing request fields are required");
    }

    // Handle images if provided
    let imagePaths = [];
    if (Array.isArray(payload.images) && payload.images.length > 0) {
      const uploadsDir = path.join(ROOT, "uploads");
      try {
        await mkdir(uploadsDir, { recursive: true });
        
        for (let i = 0; i < payload.images.length; i++) {
          const image = payload.images[i];
          if (image.data && typeof image.data === "string" && image.data.startsWith("data:")) {
            const base64Data = image.data.replace(/^data:image\/[a-z]+;base64,/, "");
            const ext = image.type?.split("/")[1] || "jpg";
            const fileName = `req-${request.id}-${Date.now()}-${i}.${ext}`;
            const filePath = path.join(uploadsDir, fileName);
            
            await writeFile(filePath, Buffer.from(base64Data, "base64"));
            imagePaths.push(`/uploads/${fileName}`);
          }
        }
      } catch (err) {
        console.error("Error saving images:", err);
      }
    }

    request.images = imagePaths;
    db.listingRequests.push(request);
    await writeDb(db);
    return sendJson(res, 201, { request });
  }

  if (req.method === "GET" && pathname === "/api/listing-requests") {
    return sendJson(res, 200, { requests: db.listingRequests });
  }

  if (req.method === "POST" && pathname === "/api/enquiries") {
    const payload = await parseBody(req);
    const listingId = Number(payload.listingId);
    const listing = db.listings.find((item) => Number(item.id) === listingId && item.status !== "archived");
    if (!listing) return sendError(res, 404, "Listing not found");

    const enquiry = {
      id: nextId(db.enquiries),
      listingId,
      listingTitle: listing.title,
      name: cleanString(payload.name) || "Website visitor",
      contact: cleanString(payload.contact),
      message: cleanString(payload.message) || `I am interested in ${listing.title}.`,
      status: "new",
      createdAt: new Date().toISOString(),
    };

    db.enquiries.push(enquiry);
    await writeDb(db);
    return sendJson(res, 201, { enquiry });
  }

  if (req.method === "GET" && pathname === "/api/enquiries") {
    return sendJson(res, 200, { enquiries: db.enquiries });
  }

  sendError(res, 404, "API route not found");
}

async function serveStatic(req, res, url) {
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(ROOT, requested));

  if (!filePath.startsWith(ROOT)) {
    return sendError(res, 403, "Forbidden");
  }

  try {
    const body = await readFile(filePath);
    const extension = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream",
      "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=3600",
    });
    res.end(body);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      return sendError(res, 404, "File not found");
    }
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return res.end();
    }

    if (url.pathname.startsWith("/api/")) {
      return await handleApi(req, res, url);
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendError(res, 405, "Method not allowed");
    }

    await serveStatic(req, res, url);
  } catch (error) {
    sendError(res, error.status || 500, error.message || "Server error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`TagHouse running at http://${HOST}:${PORT}`);
});
