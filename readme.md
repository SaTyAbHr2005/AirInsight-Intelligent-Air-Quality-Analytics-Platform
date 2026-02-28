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
4. **Persistent Storage**: Validated analytics are heavily indexed and stored in a highly relational PostgreSQL database.
5. **Client Presentation**: The React Frontend fetches refined data to render responsive, high-fidelity real-time dashboards and geographical heatmaps. 

## Technology Stack
* **Frontend:** React, HTML, Vanilla CSS, Vite, Leaflet Maps, Chart.js, Lucide Icons
* **Backend:** Python, FastAPI, Contextual Dependency Injection
* **Machine Learning:** CatBoost Regressors, Scikit-learn, Numpy, Pandas
* **Database:** PostgreSQL, psycopg2
* **Infrastructure:** AWS EC2, Docker Compose, Nginx Reverse Proxy, Gunicorn, Uvicorn

## Infrastructure & Cloud Deployment
The system is perfectly built within a declarative Dockerized framework, expertly architected to run exceptionally well on minimal remote resources (such as the AWS EC2 Free Tier).

- **Production Frontend**: The React SPA is cleanly built and statically served directly by highly optimized Nginx Reverse Proxies, effectively solving backend CORS and routing issues natively.
- **Backend Portability**: The Python endpoints execute within isolated, ultra-efficient Linux environments handling robust network traffic smoothly via Uvicorn workers.

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
