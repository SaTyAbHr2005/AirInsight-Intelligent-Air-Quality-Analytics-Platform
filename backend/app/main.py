from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import joblib
import numpy as np
from app.db import get_connection
from app.auth import hash_password, verify_password, create_token, verify_token
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# Security Scheme
# ==============================
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="admin/login")


# ==============================
# Load Models
# ==============================
model = joblib.load("models/aqi_model.pkl")
forecast_model = joblib.load("models/aqi_forecast_model.pkl")

# ==============================
# Utility Functions
# ==============================
def get_category(aqi):
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Satisfactory"
    elif aqi <= 200:
        return "Moderate"
    elif aqi <= 300:
        return "Poor"
    elif aqi <= 400:
        return "Very Poor"
    else:
        return "Severe"


def get_current_admin(token: str = Depends(oauth2_scheme)):
    admin_id = verify_token(token)

    if not admin_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return admin_id


# ==============================
# Request Schema
# ==============================
class AQIRequest(BaseModel):
    sensor_id: int
    PM2_5: float
    PM10: float
    NO2: float
    CO: float
    SO2: float
    O3: float
    NH3: float
    hour: int
    day: int
    month: int
    weekday: int


# ==============================
# Public Routes
# ==============================
@app.get("/")
def home():
    return {"message": "AQI API Running"}


# ==============================
# Admin Authentication
# ==============================
@app.post("/admin/register")
def register_admin(username: str, email: str, password: str):
    conn = get_connection()
    cursor = conn.cursor()

    password_hash = hash_password(password)

    cursor.execute("""
        INSERT INTO admins (username, email, password_hash)
        VALUES (%s, %s, %s)
        RETURNING id
    """, (username, email, password_hash))

    admin_id = cursor.fetchone()[0]
    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Admin registered", "admin_id": admin_id}


@app.post("/admin/login")
def login_admin(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, password_hash
        FROM admins
        WHERE username = %s
    """, (form_data.username,))

    admin = cursor.fetchone()
    cursor.close()
    conn.close()

    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    admin_id, password_hash = admin

    if not verify_password(form_data.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(admin_id)

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# ==============================
# Prediction API (Public)
# ==============================
@app.post("/predict")
def predict(data: AQIRequest):
    features = np.array([[
        data.PM2_5, data.PM10, data.NO2, data.CO,
        data.SO2, data.O3, data.NH3,
        data.hour, data.day, data.month, data.weekday
    ]])

    prediction = float(model.predict(features)[0])
    category = get_category(prediction)

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO sensor_readings
        (sensor_id, pm25, pm10, no2, co, so2, o3, nh3, predicted_aqi, category)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        data.sensor_id,
        data.PM2_5,
        data.PM10,
        data.NO2,
        data.CO,
        data.SO2,
        data.O3,
        data.NH3,
        prediction,
        category
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "predicted_AQI": prediction,
        "category": category
    }


# ==============================
# Public Data APIs
# ==============================
@app.get("/latest")
def get_latest_aqi():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT r.name, s.id, sr.predicted_aqi, sr.category, sr.timestamp
        FROM regions r
        JOIN sensors s ON s.region_id = r.id
        JOIN sensor_readings sr ON sr.sensor_id = s.id
        WHERE sr.timestamp = (
            SELECT MAX(timestamp)
            FROM sensor_readings
            WHERE sensor_id = s.id
        )
        ORDER BY sr.predicted_aqi DESC;
    """)

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    return [
        {
            "region": r[0],
            "sensor_id": r[1],
            "aqi": r[2],
            "category": r[3],
            "timestamp": r[4]
        }
        for r in rows
    ]


@app.get("/history/{region_id}")
def get_history(region_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT sr.timestamp, sr.predicted_aqi
        FROM sensor_readings sr
        JOIN sensors s ON s.id = sr.sensor_id
        WHERE s.region_id = %s
        ORDER BY sr.timestamp DESC
        LIMIT 50;
    """, (region_id,))
    
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    return [
        {
            "timestamp": r[0],
            "aqi": r[1]
        }
        for r in rows
    ]


@app.get("/top-polluted")
def get_top_polluted():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            r.name AS region,
            AVG(sr.predicted_aqi) AS avg_aqi,
            CASE
                WHEN AVG(sr.predicted_aqi) <= 50 THEN 'Good'
                WHEN AVG(sr.predicted_aqi) <= 100 THEN 'Satisfactory'
                WHEN AVG(sr.predicted_aqi) <= 200 THEN 'Moderate'
                WHEN AVG(sr.predicted_aqi) <= 300 THEN 'Poor'
                WHEN AVG(sr.predicted_aqi) <= 400 THEN 'Very Poor'
                ELSE 'Severe'
            END AS category
        FROM regions r
        JOIN sensors s ON s.region_id = r.id
        JOIN sensor_readings sr ON sr.sensor_id = s.id
        WHERE sr.timestamp = (
            SELECT MAX(timestamp)
            FROM sensor_readings
            WHERE sensor_id = s.id
        )
        GROUP BY r.name
        ORDER BY avg_aqi DESC
        LIMIT 5;
    """)

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    return [
        {
            "region": r[0],
            "aqi": float(r[1]),
            "category": r[2]
        }
        for r in rows
    ]


@app.get("/forecast/{sensor_id}")
def forecast_aqi(sensor_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT predicted_aqi
        FROM sensor_readings
        WHERE sensor_id = %s
        ORDER BY timestamp DESC
        LIMIT 6
    """, (sensor_id,))

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    if len(rows) < 6:
        return {"error": "Not enough data"}

    values = [r[0] for r in rows][::-1]

    features = [
        values[-1],
        values[-2],
        values[-3],
        values[-6],
    ]

    forecast = float(forecast_model.predict([features])[0])
    category = get_category(forecast)

    return {
        "sensor_id": sensor_id,
        "next_hour_AQI": round(forecast, 2),
        "category": category
    }


# ==============================
# Admin Sensor Management (Protected)
# ==============================
@app.get("/admin/sensors")
def get_sensors(admin_id: int = Depends(get_current_admin)):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, sensor_code, region_id, latitude, longitude, radius, is_active
        FROM sensors
        ORDER BY id
    """)

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    return [
        {
            "sensor_id": r[0],
            "sensor_code": r[1],
            "region_id": r[2],
            "latitude": r[3],
            "longitude": r[4],
            "radius": r[5],
            "is_active": r[6]
        }
        for r in rows
    ]


@app.post("/admin/sensor")
def add_sensor(
    sensor_code: str,
    region_id: int,
    latitude: float,
    longitude: float,
    radius: int,
    admin_id: int = Depends(get_current_admin)
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO sensors (sensor_code, region_id, latitude, longitude, radius, is_active)
        VALUES (%s,%s,%s,%s,%s,TRUE)
    """, (sensor_code, region_id, latitude, longitude, radius))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Sensor added"}


@app.put("/admin/sensor/{sensor_id}/status")
def update_status(sensor_id: int, is_active: bool,
                  admin_id: int = Depends(get_current_admin)):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE sensors
        SET is_active = %s
        WHERE id = %s
    """, (is_active, sensor_id))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Status updated"}


@app.delete("/admin/sensor/{sensor_id}")
def delete_sensor(sensor_id: int,
                  admin_id: int = Depends(get_current_admin)):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM sensors WHERE id = %s", (sensor_id,))
    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Sensor deleted"}