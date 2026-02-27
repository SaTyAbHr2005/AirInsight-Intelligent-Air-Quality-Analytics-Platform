# AirInsight Docker Compose Ports Reference

When you are ready to write your `docker-compose.yml` file for AWS deployment, you will need to map the following ports for each service in the stack:

## 1. Frontend (React/Vite)
* **Internal Container Port**: `5173` (or `80` if serving a production build via Nginx)
* **Host Port (Public)**: `80` or `3000`
* **Purpose**: Serves the user interface and mapping dashboards.

## 2. Backend (FastAPI Python)
* **Internal Container Port**: `8000`
* **Host Port (Public)**: `8000`
* **Purpose**: Handles all API requests, sensor simulations, ML predictions, and database connections.
* **Important**: Your frontend Axios configuration (`src/services/api.js`) points to `http://localhost:8000`. Depending on your deployment, you may need to update this URL to your AWS public IP/Domain.

## 3. Database (PostgreSQL)
* **Internal Container Port**: `5432`
* **Host Port (Local/Secure)**: `5432` 
* **Purpose**: Relational database storing sensors, admin users, and telemetry readings.
* **Important**: In a Docker network, you should map this so the backend connects to it via the internal docker network (e.g., `host: "db"` instead of `localhost`), and optionally expose it to the host `5432` if you want external GUI access via pgAdmin/DBeaver.

---

### Example Docker Compose Snippet:
```yaml
services:
  database:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: Satya@2005
      POSTGRES_DB: air_quality_db
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - database

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
```
