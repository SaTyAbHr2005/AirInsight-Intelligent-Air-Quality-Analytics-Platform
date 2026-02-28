FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required for psycopg2 and catboost
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose port and run Gunicorn with Uvicorn workers (Limited to 1 worker for 1GB RAM EC2)
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
