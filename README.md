# Contour Studio

AI-powered 3D terrain visualization from addresses, DEM databases, and topographic maps.

## What It Does

- Search for a location by address.
- Fetch elevation data from OpenTopography (global DEM including USGS lidar) or Open-Meteo (free fallback).
- Generate an interactive 3D terrain mesh in the browser.
- Export to OBJ, STL, or grayscale heightmap PNG.
- Upload topographic maps for AI-assisted analysis with vision-capable models.
- Save projects and export history with server-side accounts.

## Tech Stack

- **Backend:** Fastify (Node.js)
- **Database:** SQLite via `better-sqlite3` (Postgres-ready)
- **Auth:** Argon2id password hashing + JWT sessions
- **Map:** MapLibre GL JS with OpenStreetMap / OpenFreeMap tiles
- **3D:** Three.js
- **Frontend:** Vanilla JS + centralized store

## Quick Start

1. Clone the repo.
2. Copy `.env.example` to `.env` and fill in secrets:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run migrations:
   ```bash
   npm run migrate
   ```
5. Start dev server:
   ```bash
   npm run dev
   ```

The Vite dev server runs on port 5173 and proxies API calls to the Fastify backend on port 3000.

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `JWT_SECRET` | Yes | Long random string |
| `COOKIE_SECRET` | Yes | Long random string |
| `ENCRYPTION_KEY` | Yes | 64-char hex string (32 bytes) |
| `DATABASE_URL` | Yes | SQLite path or Postgres URL |
| `NODE_ENV` | Yes for deploy | Set to `production` on build.io |
| `APP_URL` | Yes for deploy | Public URL of the deployed app |
| `OPEN_TOPOGRAPHY_API_KEY` | No | Free from portal.opentopography.org for real DEM data |
| `AIAND_API_KEY` | No | AIand provider key for map analysis |
| `OPENAI_API_KEY` | No | OpenAI key for map analysis |
| `ANTHROPIC_API_KEY` | No | Anthropic key (use via OpenRouter or OpenAI-compatible proxy) |
| `OPENROUTER_API_KEY` | No | OpenRouter key for map analysis |
| `NOMINATIM_USER_AGENT` | No | Required by Nominatim; include contact info |

## Detail Levels

Terrain generation runs as an async job so large downloads don't time out.

| Level | Database Source | Grid Size |
|-------|-----------------|-----------|
| **Draft** | SRTM 90 m global DEM | 128 × 128 |
| **Standard** | SRTM 30 m global DEM | 256 × 256 |
| **Survey** | USGS 1 m lidar (US only) or SRTM 30 m fallback | 512 × 512 |

## Deployment

### build.io (Recommended)

This app is configured for build.io auto-deploy from GitHub.

1. In build.io, create a new web service.
2. Connect your GitHub account and select the `richardaiand/contour-studio` repo.
3. Use these settings:
   - **Runtime:** Node
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
   - **Node version:** `20`
4. Add environment variables from `.env.example`:
   - `JWT_SECRET`
   - `COOKIE_SECRET`
   - `ENCRYPTION_KEY`
   - `NODE_ENV=production`
   - `APP_URL=https://your-app-url.build.io`
   - `DATABASE_URL=./data/contour-studio.db`
   - `NOMINATIM_USER_AGENT=contour-studio/0.1.0 (your-email@example.com)`
   - Optional: `OPEN_TOPOGRAPHY_API_KEY`, `AIAND_API_KEY`, etc.
5. Enable auto-deploy on every push to `main`.

build.io will automatically run `npm install` on its servers. You do **not** need to install Node.js on your own computer.

### Local Development (Optional)

If you want to run the app on your own machine:

1. Install Node.js 20 from https://nodejs.org/
2. Clone the repo.
3. Copy `.env.example` to `.env` and fill in secrets.
4. Run:
   ```bash
   npm install
   npm run migrate
   npm run dev
   ```

### CI / GitHub Actions

Every push to `main` triggers a GitHub Actions workflow that:

- Installs dependencies with `npm ci`
- Runs database migrations
- Builds the frontend
- Verifies the server starts

Check the `.github/workflows/ci.yml` file for details.

## Roadmap

- [x] Full GeoTIFF raster parsing with geotiff.js
- [x] OpenTopography global DEM download (includes USGS lidar)
- [x] Async job queue for terrain generation
- [x] AI vision map analysis pipeline
- [x] Heightmap PNG export with proper encoding
- [ ] Local topographic map catalog direct downloads
- [ ] GLB export
- [ ] Scene enhancement (trees, water, buildings)
- [ ] PDF-to-image conversion for map uploads
