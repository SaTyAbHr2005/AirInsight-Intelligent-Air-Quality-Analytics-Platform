import requests
import random
import time
import datetime
import psycopg2

# =============================
# CONFIG
# =============================

API_URL = "http://127.0.0.1:8000/predict"

DB_CONFIG = {
    "host": "localhost",
    "database": "air_quality_db",
    "user": "postgres",
    "password": "Satya@2005",
    "port": "5432"
}

# =============================
# SENSOR DEFINITIONS
# =============================

sensors = [
    {"sensor_id": 1, "region": "Mumbai", "level": "high"},
    {"sensor_id": 2, "region": "Mumbai", "level": "very_high"},
    {"sensor_id": 3, "region": "Pune", "level": "moderate"},
    {"sensor_id": 4, "region": "Pune", "level": "high"},
    {"sensor_id": 5, "region": "Nagpur", "level": "good"},
    {"sensor_id": 6, "region": "Nagpur", "level": "moderate"},
    {"sensor_id": 7, "region": "Nashik", "level": "low"},
    {"sensor_id": 8, "region": "Nashik", "level": "good"},
    {"sensor_id": 9, "region": "Aurangabad", "level": "moderate"},
    {"sensor_id": 10, "region": "Aurangabad", "level": "high"},
    {"sensor_id": 11, "region": "Kolhapur", "level": "low"},
    {"sensor_id": 12, "region": "Kolhapur", "level": "good"},
    {"sensor_id": 13, "region": "Solapur", "level": "high"},
    {"sensor_id": 14, "region": "Solapur", "level": "very_high"},
    {"sensor_id": 15, "region": "Chandrapur", "level": "very_high"},
    {"sensor_id": 16, "region": "Chandrapur", "level": "severe"},
    {"sensor_id": 17, "region": "Ratnagiri", "level": "low"},
    {"sensor_id": 18, "region": "Ratnagiri", "level": "good"},
    {"sensor_id": 19, "region": "Navi Mumbai", "level": "moderate"},
    {"sensor_id": 20, "region": "Navi Mumbai", "level": "high"},
]

# =============================
# DATABASE FUNCTIONS
# =============================

def get_connection():
    return psycopg2.connect(**DB_CONFIG)


def get_active_sensors():
    """
    Fetch active sensor IDs from database
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM sensors WHERE is_active = TRUE")
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    active_ids = [row[0] for row in rows]
    return active_ids


# =============================
# DATA GENERATION
# =============================

def generate_pollution(level):

    if level == "low":
        return {
            "PM2_5": random.uniform(5, 15),
            "PM10": random.uniform(15, 40),
            "NO2": random.uniform(5, 15),
            "CO": random.uniform(0.1, 0.4),
            "SO2": random.uniform(2, 8),
            "O3": random.uniform(10, 25),
            "NH3": random.uniform(2, 8)
        }

    elif level == "good":
        return {
            "PM2_5": random.uniform(15, 40),
            "PM10": random.uniform(40, 80),
            "NO2": random.uniform(10, 25),
            "CO": random.uniform(0.3, 0.8),
            "SO2": random.uniform(5, 15),
            "O3": random.uniform(20, 50),
            "NH3": random.uniform(5, 15)
        }

    elif level == "moderate":
        return {
            "PM2_5": random.uniform(40, 100),
            "PM10": random.uniform(80, 200),
            "NO2": random.uniform(25, 60),
            "CO": random.uniform(0.7, 1.8),
            "SO2": random.uniform(10, 30),
            "O3": random.uniform(40, 80),
            "NH3": random.uniform(10, 30)
        }

    elif level == "high":
        return {
            "PM2_5": random.uniform(100, 220),
            "PM10": random.uniform(200, 400),
            "NO2": random.uniform(60, 120),
            "CO": random.uniform(1.5, 3),
            "SO2": random.uniform(20, 60),
            "O3": random.uniform(60, 120),
            "NH3": random.uniform(20, 60)
        }

    elif level == "very_high":
        return {
            "PM2_5": random.uniform(180, 300),
            "PM10": random.uniform(350, 550),
            "NO2": random.uniform(90, 180),
            "CO": random.uniform(2.5, 5),
            "SO2": random.uniform(40, 100),
            "O3": random.uniform(80, 160),
            "NH3": random.uniform(40, 100)
        }

    else:  # severe
        return {
            "PM2_5": random.uniform(300, 500),
            "PM10": random.uniform(500, 800),
            "NO2": random.uniform(150, 300),
            "CO": random.uniform(5, 10),
            "SO2": random.uniform(80, 200),
            "O3": random.uniform(150, 250),
            "NH3": random.uniform(80, 150)
        }


def get_time_features():
    now = datetime.datetime.now()
    return {
        "hour": now.hour,
        "day": now.day,
        "month": now.month,
        "weekday": now.weekday()
    }


# =============================
# MAIN LOOP
# =============================

print("Starting Maharashtra Sensor Network...\n")

while True:

    try:
        active_sensors = get_active_sensors()
    except Exception as e:
        print("Database error:", e)
        time.sleep(5)
        continue

    for sensor in sensors:

        # Skip inactive sensors
        if sensor["sensor_id"] not in active_sensors:
            continue

        pollution = generate_pollution(sensor["level"])
        time_data = get_time_features()

        payload = {
            "sensor_id": sensor["sensor_id"],
            **pollution,
            **time_data
        }

        try:
            response = requests.post(API_URL, json=payload)
            result = response.json()

            print(
                f"Sensor {sensor['sensor_id']} | "
                f"{sensor['region']} | Level: {sensor['level']} | "
                f"AQI: {result['predicted_AQI']} | {result['category']}"
            )

        except Exception as e:
            print(f"API error for sensor {sensor['sensor_id']}: {e}")

    print("---- Next cycle in 5 seconds ----\n")
    time.sleep(5)