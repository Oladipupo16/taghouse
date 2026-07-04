# TagHouse

A housing marketplace for renting, buying, selling, and leasing apartments, houses, commercial spaces, and land.

## Run Locally

```bash
npm start
```

Then open:

```text
http://127.0.0.1:5173
```

The backend uses only Node.js built-in modules, so there are no packages to install.

## Data Storage

Marketplace data is stored in:

```text
data/db.json
```

This is good a For production, replace it with a real database such as PostgreSQL, MySQL, MongoDB, or Supabase.

## API Routes

```text
GET  /api/health
GET  /api/listings
GET  /api/listings/:id
POST /api/listings
POST /api/enquiries
GET  /api/enquiries
POST /api/listing-requests
GET  /api/listing-requests
```

## Example Listing Payload

```json
{
  "title": "3-bedroom apartment in Lekki",
  "purpose": "rent",
  "category": "Apartment",
  "location": "Lekki",
  "price": 2500000,
  "priceLabel": "₦2.5m / year",
  "specs": ["3 beds", "4 baths", "Parking"],
  "image": "assets/apartment.svg",
  "agent": "EstateMarket Agent",
  "description": "Clean apartment with good access road, security, and steady water."
}
```

## Checks

```bash
npm run check
```
