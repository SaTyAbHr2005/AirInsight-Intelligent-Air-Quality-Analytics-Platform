# AirInsight: Decentralized Smart Air Quality Monitoring & Predictive Analytics 🌍 

## Overview
AirInsight is a comprehensive Smart City solution that deploys a decentralized virtual air quality monitoring network. Designed to analyze pollution patterns across various regions, the system collects real-time localized data, uses machine learning to estimate Current AQI, and deploys time-series forecasting models to predict future air quality trends. 

This platform acts as an integrated decision-support system, providing real-time geographical visualizations, health advisories, and actionable insights for both citizens and local city authorities.

## Core Features
* **Decentralized Virtual Sensor Network**: Simulates diverse geographical hardware nodes continuously streaming localized environmental telemetry (PM2.5, PM10, NO2, CO, SO2, O3, NH3).
* **Real-Time Predictive Modeling**: Utilizes an advanced CatBoost Regression pipeline to dynamically calculate live AQI and isolate specific primary pollution sources (Traffic, Industrial, Construction etc.).
* **Time-Series Forecasting**: Deploys secondary Lag-based CatBoost architectures to forecast upcoming next-hour AQI trends, providing proactive risk warnings.
* **Interactive Geo-Spatial Mapping**: Visualizes the entire sensor network on a live interactive OpenStreetMap utilizing Leaflet, color-coded strictly by Health Impact categories.
* **Intelligent Admin Control Panel**: Provides secured, JWT-authenticated capabilities for administrators to remotely provision, toggle, and permanently decommission regional hardware sensors.
* **Contextual Health Advisories**: Automatically maps extreme pollution conditions to actionable public health guidance.

## Architecture & Data Flow
1. **Edge Telemetry**: Virtual Sensors distributed across regions stream raw atmospheric composition data.
2. **Ingestion & Validation**: FastAPI backend securely validates and processes the incoming telemetry.
3. **Machine Learning Pipeline**: Data is fed into pre-trained CatBoost models to evaluate real-time hazards and formulate future predictions.
4. **Persistent Storage**: Readings, sensors and regions live in MongoDB (Atlas in production). Sensor histories are seeded from real CPCB hourly station records, and the network keeps reporting on its own every 15 minutes, with no background worker needed.
5. **Client Presentation**: The React Frontend fetches refined data to render responsive, high-fidelity real-time dashboards and geographical heatmaps. 

## Technology Stack
* **Frontend:** React 19, Vite, Tailwind CSS v4, three.js with React Three Fiber and Drei (3D story and butterfly gauge), GSAP ScrollTrigger and Lenis (scroll storytelling), TanStack Query, Framer Motion, Recharts, React Leaflet, Sonner
* **Backend:** Python, FastAPI, PyMongo
* **Machine Learning:** CatBoost Regressors (AQI estimation and lag-based forecasting)
* **Database:** MongoDB Atlas
* **Infrastructure:** Render (API), Vercel (frontend); Docker Compose for local runs

## Running locally

```bash
# 1. MongoDB: either a local instance or your Atlas URI in backend/.env (see backend/.env.example)
docker run -d --name airinsight-mongo -p 27017:27017 mongo:7

# 2. API (seeds an empty database on first start)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# 3. Frontend (proxies /api to localhost:8000)
cd frontend
npm install
npm run dev
```

Reseed at any time with `python -m app.seed --reset` from `backend/`. Default local admin: `admin1` / `admin123` (set `ADMIN_PASSWORD` to change it).

## Deployment (free tier)

1. **MongoDB Atlas**: create a free M0 cluster, a database user, and allow network access from `0.0.0.0/0`. Copy the connection string.
2. **Render (API)**: New, then Blueprint, then pick this repo. `render.yaml` creates the `airinsight-api` web service. Fill in `MONGODB_URI`, `ADMIN_PASSWORD` and `CORS_ORIGINS` (your Vercel URL). On first boot the API seeds Atlas automatically.
3. **Vercel (frontend)**: import the repo with **Root Directory** `frontend`. Set `VITE_API_URL` to the Render URL, e.g. `https://airinsight-api.onrender.com`.

Render's free plan sleeps after 15 idle minutes, so the first request after a nap takes around 50 seconds. When it wakes, the sensor network catches up with a fresh round of readings.

## Project Impact

### 🛡️ For Citizens
* **Real-time Awareness**: Check localized AQI seamlessly from anywhere via the Web Dashboard.
* **Health Safety**: Contextualized, straightforward public-health guidance natively derived from scientific severity indices.

### 🏛️ For Local Authorities
* **Hotspot Detection**: Instantaneous tracking isolating the worst affected environments on a live topological map.
* **Source Isolation**: Pinpointing precise mathematical origin causes (e.g. Traffic vs Construction) dynamically informing policy responses natively within seconds.

## Future Scope
While the core analytical platform is flawlessly structured and deployed, the overarching infrastructure is inherently designed to massively scale dynamically over subsequent iterations:

1. **Physical Hardware Integration**: Transitioning the virtual telemetry pipelines directly to physical, low-cost micro-controller IoT sensors installed across physical urban environments.
2. **Alert Broadcasting System**: Integrating SMS, Email, or Web-Socket push notifications directly to citizens when their hyper-local network sectors spontaneously detect extremely critical PM2.5 atmospheric spikes.
3. **Advanced Anomaly Detection Systems**: Implementing advanced structural algorithms (like Isolation Forests) natively alongside CatBoost models to instantly identify and alarm operators to entirely unnatural chemical signatures (e.g., highly localized industrial invisible gas leaks in factory districts).
4. **Native Mobile Application Suite**: Porting the responsive web dashboard inherently into a compiled cross-platform React Native / Flutter mobile application designed purely for broader systemic citizen engagement.
5. **Cross-State Scaling Configurations**: Expanding the micro-regional focus dynamically across boundaries by continuously ingesting vast topological, wind vectors, and deeper meteorological data sets to support state-wide networking topologies.
