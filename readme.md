# AirInsight

**Live:** https://airinsight-mh.vercel.app

AirInsight follows a Common Grass Yellow butterfly through a Maharashtra meadow as the air around it fills with smog, then hands you the tools to read that air yourself. A network of 20 sensors across 10 cities reports pollutant levels. CatBoost models turn them into an AQI and a six-hour forecast, and an AI assistant turns the numbers into advice for the person asking.

## What's inside

### The story (home page)
A scroll-driven 3D scene (three.js, GSAP ScrollTrigger, Lenis). The meadow fills with haze, the butterfly is grounded on a flower, sensor beacons rise at each city's real coordinates, and the air clears. The live AQI, the cigarette equivalent and the forecast are written into the story as you scroll.

### The observatory
| Page | What it does |
|---|---|
| **Today** | City AQI with count-up numbers, a 3D butterfly whose flight follows the air, a personal health advisory, a six-hour outlook with the best time to step out, a cigarette equivalent, the main pollution source, and per-pollutant bars against safe limits |
| **Trends** | Hourly history (day, 3 days, week) with the forecast overlaid, a comparison against any other city, a **breathing calendar** (7-day × 24-hour heatmap of daily rhythms), and per-pollutant charts |
| **Map** | Flat Leaflet map of sensor coverage, or **3D towers** (one per city, height = AQI) to orbit and click into |
| **Prediction lab** | Pollutant sliders and real-world presets scored live by the model. Nothing is saved |
| **Simulator** (admin) | Stages a pollution event in any city; every page reacts |

Extras: a **Ctrl+K** command palette, day and night themes, ambient pollution particles behind each page that follow the selected city's AQI, and animated sign-in pages with a 3D butterfly swarm.

### Air assistant
- **Personal advisories** for 8 profiles: everyone, asthma, heart condition, children, older adults, pregnancy, outdoor workers, runners.
- **A chat** available on every page.
- **Grounded:** the model receives the city's live readings, pollutant ratios and forecast, and is told to use only those numbers.
- **Provider chain:** Gemini first, Groq as backup, then a built-in rules engine based on CPCB health guidance. Advice never goes blank.
- **Scoped:** off-topic requests and attempts to override its rules ("ignore your instructions", role-play) get a fixed refusal written by the server, not the model.
- **Quota-friendly:** advisories are cached for 15 minutes per city, profile and reading. Each IP is limited to 20 assistant requests per 5 minutes, and a chat sends at most the last 12 messages of up to 1,000 characters each.

### Admin
JWT sign-in. Admins deploy sensors by clicking a mini-map (the nearest city is picked for you), pause and resume them, remove them with their history, and see network stats at a glance.

## How it works

1. **Seed data:** each of the 20 sensors starts with a real 7-day window of hourly readings from a different CPCB monitoring station, matched to that sensor's pollution profile and shifted to end at the present (`backend/app/seed_readings.json.gz`, built by `scripts/build_seed_fixture.py`).
2. **Live network:** the API has no background worker. Whenever a request finds the newest reading more than 15 minutes old, every active sensor reports once: a mean-reverting random walk with a night-time peak, scored by the AQI model. This keeps the free Render tier working.
3. **Models:** `aqi_model.pkl` maps 7 pollutants plus time features to an AQI. `aqi_forecast_model.pkl` predicts the next hour from AQI lags of 1, 2, 3 and 6 hours, applied recursively for a six-hour outlook.
4. **Storage:** MongoDB Atlas holds regions, sensors, readings (45-day TTL index to stay inside the free tier) and admins.

## Tech stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, three.js with React Three Fiber and Drei, GSAP ScrollTrigger, Lenis, Framer Motion, TanStack Query, Recharts, React Leaflet, cmdk, Sonner
- **Backend:** Python 3.11 in production (3.10+ works locally), FastAPI, PyMongo, CatBoost, python-jose (JWT), bcrypt
- **AI:** Google Gemini (primary), Groq (backup), rules engine (fallback)
- **Data:** MongoDB Atlas
- **Hosting:** Render (API), Vercel (frontend)

## Project layout

```
backend/
  app/
    main.py          API routes
    assistant.py     advisories + chat (Gemini -> Groq -> rules), topic guard, rate limit
    engine.py        model inference, self-ticking network, forecast
    queries.py       shared read models
    seed.py          seeds an empty database
    seed_data.py     regions, sensors, pollutant profiles
    db.py, auth.py
  models/            trained CatBoost models (committed; the API loads them)
  scripts/           training, data cleaning, seed fixture builder, CLI simulator
frontend/
  src/pages/         Story, Dashboard, Trends, MapView, Prediction, Simulator, admin pages
  src/three/         3D scenes: butterfly, story meadow, swarm, region towers
  src/components/    shell, assistant, advisory panel, calendar, palette, particles
render.yaml          Render blueprint for the API
frontend/vercel.json SPA routing for Vercel
```

## Running locally

You need Python 3.10+, Node 20.19+ (or 22.12+, which Vite 7 requires), and a MongoDB connection string (a free Atlas cluster works).

```bash
cd backend
python -m pip install -r requirements.txt
```

Copy `backend/.env.example` to `backend/.env` and fill in at least `MONGODB_URI`. Without the AI keys, the assistant falls back to its rules engine. Then start the API; it seeds an empty database on first start:

```bash
python -m uvicorn app.main:app --reload
```

In a second terminal, start the frontend. It proxies `/api` to `localhost:8000`:

```bash
cd frontend
npm install
npm run dev
```

Reseed from `backend/` with `python -m app.seed --reset`. To retrain the models or run the data scripts, install `requirements-train.txt` as well.

### Environment variables (`backend/.env`)

| Variable | Purpose |
|---|---|
| `MONGODB_URI`, `MONGODB_DB` | Atlas connection and database name |
| `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_HOURS` | JWT signing |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL` | Bootstrap admin, created at startup if that username doesn't exist yet |
| `ALLOW_ADMIN_SIGNUP` | `false` in production so strangers can't create admin accounts |
| `CORS_ORIGINS` | Comma-separated frontend origins, e.g. `https://airinsight-mh.vercel.app` |
| `TICK_MINUTES` | Minutes between network check-ins (default 15) |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Primary assistant model (default `gemini-3.8-flash`) |
| `GROQ_API_KEY`, `GROQ_MODEL` | Backup assistant model (default `openai/gpt-oss-120b`) |

The frontend needs one variable in production: `VITE_API_URL`, the API's public URL.

## Deployment (free tier)

1. **MongoDB Atlas:** create an M0 cluster and a database user, and allow network access from `0.0.0.0/0`.
2. **Render (API):** choose New, then Blueprint, then this repo. `render.yaml` defines `airinsight-api`. Fill in `MONGODB_URI`, `ADMIN_PASSWORD`, `CORS_ORIGINS`, `GEMINI_API_KEY` and `GROQ_API_KEY`.
3. **Vercel (frontend):** import the repo with Root Directory `frontend`, and set `VITE_API_URL` to the Render URL.

After setup, every push to `main` redeploys both: Vercel through its Git integration, and Render through the blueprint's auto-deploy.

Render's free plan sleeps after 15 idle minutes, so the first request afterwards takes about 50 seconds. On waking, the network catches up with a fresh round of readings.

### Deploying the frontend from the Vercel CLI

Git pushes are the normal path, but you can also deploy straight from your machine. Install the CLI with `npm i -g vercel` and sign in with `vercel login`, then link the folder to the existing project (one time):

```bash
cd frontend
vercel link
```

Set the API URL for production builds, if the project doesn't have it yet:

```bash
vercel env add VITE_API_URL production
```

Deploy to production:

```bash
vercel deploy --prod
```

### Changing the admin password

The API creates the bootstrap admin at startup only when that username doesn't exist, so changing `ADMIN_PASSWORD` alone doesn't change an existing account. To reset it:

1. Set the new `ADMIN_PASSWORD` in Render's environment settings (or `backend/.env` locally).
2. In Atlas, open the `airinsight` database, then the `admins` collection, and delete the admin's document.
3. Restart the API (on Render: Manual Deploy, then Restart service). Startup recreates the admin with the new password, and other data is untouched.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| The site loads but shows no data, and the browser console reports CORS errors | `CORS_ORIGINS` on Render must match the site's origin exactly: `https://airinsight-mh.vercel.app`, with no trailing slash |
| The first page load takes about a minute | Render's free plan was asleep. Later requests are fast |
| Advisories say "Standard advisory" instead of Gemini or Groq | Both AI providers failed. The API log has a `[assistant] … failed: HTTP …` line with the provider's reason. A 404 usually means the model was retired, so set `GEMINI_MODEL` or `GROQ_MODEL` to a current one. A 401 or 403 points to the API key |
| Forecasts show "needs six hours of readings" | A newly deployed sensor needs six hourly readings before the forecast model can run |

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Health check (Render pings this) |
| GET | `/latest` | Latest reading per sensor |
| GET | `/regions` | City averages with coordinates and active sensor counts |
| GET | `/public/sensors` | Sensor locations, radii and status |
| GET | `/history/{region_id}?hours=` | Hourly city average, oldest first |
| GET | `/forecast/{sensor_id}?hours=` | Next-hour AQI plus a 1 to 24 hour outlook |
| GET | `/top-polluted` | Five worst cities |
| POST | `/predict?persist=` | Scores pollutant values; `persist=true` stores them as a reading |
| GET | `/assistant/profiles` | Health profiles for advisories |
| POST | `/assistant/advisory` | `{region_id, profile}` gives a personal advisory |
| POST | `/assistant/chat` | `{region_id, profile, messages}` gives a grounded, scoped reply |
| POST | `/admin/login`, `/admin/register` | Admin auth (registration gated by `ALLOW_ADMIN_SIGNUP`) |
| GET, POST, PUT, DELETE | `/admin/sensors`, `/admin/sensor/...` | Sensor management (JWT required) |

Interactive docs are served at `/docs`.

## Future scope

- Physical low-cost IoT sensors feeding the same `/predict` endpoint
- Push alerts when a saved city crosses a threshold
- Anomaly detection for unusual chemical signatures, such as industrial leaks
- Wind and weather inputs for better forecasts
