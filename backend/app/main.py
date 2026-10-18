import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError

from app import db
from app.auth import create_token, hash_password, verify_password, verify_token
from app.engine import drift, forecast, get_category, model, pulse, reading_doc
from app.seed import seed
from app.seed_data import POLLUTANTS


@asynccontextmanager
async def lifespan(_):
    db.ensure_indexes()
    if os.getenv("AUTO_SEED", "true").lower() == "true":
        seed()
    yield


app = FastAPI(title="AirInsight API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="admin/login")


def get_current_admin(token: str = Depends(oauth2_scheme)):
    admin_id = verify_token(token)
    if not admin_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return admin_id


# ==============================
# Schemas
# ==============================
class AQIRequest(BaseModel):
    sensor_id: int = 1
    PM2_5: float = Field(ge=0)
    PM10: float = Field(ge=0)
    NO2: float = Field(ge=0)
    CO: float = Field(ge=0)
    SO2: float = Field(ge=0)
    O3: float = Field(ge=0)
    NH3: float = Field(ge=0)
    hour: int = Field(ge=0, le=23)
    day: int = Field(ge=1, le=31)
    month: int = Field(ge=1, le=12)
    weekday: int = Field(ge=0, le=6)


class SensorCreate(BaseModel):
    sensor_code: str = Field(min_length=2, max_length=50)
    region_id: int
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    radius: int = Field(gt=0, le=500)


class AdminCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6)


# ==============================
# Helpers
# ==============================
def region_names():
    return {r["_id"]: r["name"] for r in db.regions.find({}, {"name": 1})}


def latest_per_sensor():
    names = region_names()
    codes = {s["_id"]: s["sensor_code"] for s in db.sensors.find({}, {"sensor_code": 1})}
    rows = db.readings.aggregate([
        {"$sort": {"sensor_id": 1, "ts": -1}},
        {"$group": {"_id": "$sensor_id", "r": {"$first": "$$ROOT"}}},
    ])
    out = [
        {
            "region": names.get(r["region_id"]), "region_id": r["region_id"],
            "sensor_id": r["sensor_id"], "sensor_code": codes.get(r["sensor_id"]),
            "aqi": r["aqi"], "category": r["category"], "timestamp": r["ts"],
            "PM2_5": r["pm25"], "PM10": r["pm10"], "NO2": r["no2"], "CO": r["co"],
            "SO2": r["so2"], "O3": r["o3"], "NH3": r["nh3"],
        }
        for r in (g["r"] for g in rows) if r["sensor_id"] in codes
    ]
    return sorted(out, key=lambda r: r["aqi"], reverse=True)


def region_summary():
    by_region = {}
    for r in latest_per_sensor():
        by_region.setdefault(r["region_id"], []).append(r["aqi"])
    active = {}
    for s in db.sensors.find({"is_active": True}, {"region_id": 1}):
        active[s["region_id"]] = active.get(s["region_id"], 0) + 1
    out = []
    for reg in db.regions.find():
        vals = by_region.get(reg["_id"], [])
        aqi = round(sum(vals) / len(vals), 2) if vals else None
        out.append({
            "region_id": reg["_id"], "region": reg["name"],
            "latitude": reg["latitude"], "longitude": reg["longitude"],
            "aqi": aqi, "category": get_category(aqi) if aqi is not None else None,
            "active_sensors": active.get(reg["_id"], 0),
        })
    return sorted(out, key=lambda r: r["aqi"] or -1, reverse=True)


# ==============================
# Public Routes
# ==============================
@app.get("/")
def home():
    return {"message": "AQI API Running"}


@app.post("/admin/register")
def register_admin(payload: AdminCreate):
    if os.getenv("ALLOW_ADMIN_SIGNUP", "true").lower() != "true":
        raise HTTPException(status_code=403, detail="Admin registration is closed on this deployment.")
    try:
        admin_id = db.next_id("admins")
        db.admins.insert_one({"_id": admin_id, "username": payload.username, "email": payload.email,
                              "password_hash": hash_password(payload.password)})
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Username or email already registered.")
    return {"message": "Admin registered", "admin_id": admin_id}


@app.post("/admin/login")
def login_admin(form_data: OAuth2PasswordRequestForm = Depends()):
    admin = db.admins.find_one({"username": form_data.username})
    if not admin or not verify_password(form_data.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": create_token(admin["_id"]), "token_type": "bearer"}


@app.post("/predict")
def predict(data: AQIRequest, persist: bool = True):
    """persist=false is a pure what-if (Prediction Lab); true records a reading (simulators)."""
    values = {"pm25": data.PM2_5, "pm10": data.PM10, "no2": data.NO2, "co": data.CO,
              "so2": data.SO2, "o3": data.O3, "nh3": data.NH3}
    features = [[*values.values(), data.hour, data.day, data.month, data.weekday]]
    prediction = round(max(0.0, float(model.predict(features)[0])), 2)
    category = get_category(prediction)

    if persist:
        sensor = db.sensors.find_one({"_id": data.sensor_id})
        if not sensor:
            raise HTTPException(status_code=404, detail="Unknown sensor")
        db.readings.insert_one({**values, "sensor_id": sensor["_id"], "region_id": sensor["region_id"],
                                "aqi": prediction, "category": category, "ts": datetime.now(timezone.utc)})

    return {"predicted_AQI": prediction, "category": category}


@app.get("/latest")
def get_latest_aqi():
    pulse()
    return latest_per_sensor()


@app.get("/regions")
def get_regions():
    pulse()
    return region_summary()


@app.get("/public/sensors")
def get_public_sensors():
    names = region_names()
    return [
        {"sensor_id": s["_id"], "sensor_code": s["sensor_code"], "latitude": s["latitude"],
         "longitude": s["longitude"], "radius": s.get("radius", 20), "region": names.get(s["region_id"]),
         "region_id": s["region_id"], "is_active": s["is_active"]}
        for s in db.sensors.find().sort("_id", 1)
    ]


@app.get("/history/{region_id}")
def get_history(region_id: int, hours: int = Query(48, ge=1, le=24 * 30)):
    """Hourly region average (all sensors) for the last `hours`, oldest first."""
    pulse()
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    rows = db.readings.aggregate([
        {"$match": {"region_id": region_id, "ts": {"$gte": since}}},
        {"$group": {"_id": {"$dateTrunc": {"date": "$ts", "unit": "hour"}},
                    "aqi": {"$avg": "$aqi"}, **{p: {"$avg": f"${p}"} for p in POLLUTANTS}}},
        {"$sort": {"_id": 1}},
    ])
    return [{"timestamp": r["_id"], **{k: round(r[k] or 0, 2) for k in ("aqi", *POLLUTANTS)}} for r in rows]


@app.get("/top-polluted")
def get_top_polluted():
    return [{"region": r["region"], "aqi": r["aqi"], "category": r["category"]}
            for r in region_summary() if r["aqi"] is not None][:5]


@app.get("/forecast/{sensor_id}")
def forecast_aqi(sensor_id: int, hours: int = Query(6, ge=1, le=24)):
    outlook = forecast(sensor_id, hours)
    if not outlook:
        return {"error": "Not enough data"}
    return {"sensor_id": sensor_id, "next_hour_AQI": outlook[0]["aqi"],
            "category": outlook[0]["category"], "outlook": outlook}


# ==============================
# Admin Sensor Management (Protected)
# ==============================
@app.get("/admin/sensors")
def get_sensors(admin_id: int = Depends(get_current_admin)):
    names = region_names()
    return [
        {"sensor_id": s["_id"], "sensor_code": s["sensor_code"], "region_id": s["region_id"],
         "region": names.get(s["region_id"]), "latitude": s["latitude"], "longitude": s["longitude"],
         "radius": s.get("radius", 20), "is_active": s["is_active"], "source_station": s.get("source_station")}
        for s in db.sensors.find().sort("_id", 1)
    ]


@app.post("/admin/sensor")
def add_sensor(payload: SensorCreate, admin_id: int = Depends(get_current_admin)):
    region = db.regions.find_one({"_id": payload.region_id})
    if not region:
        raise HTTPException(status_code=400, detail="Unknown region")
    sensor = {"_id": db.next_id("sensors"), **payload.model_dump(), "is_active": True, "level": region["level"]}
    try:
        db.sensors.insert_one(sensor)
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="A sensor with this Identity Code already exists.")
    # First reading so the node shows up on the map immediately
    now = datetime.now(timezone.utc)
    db.readings.insert_one(reading_doc(sensor, drift(None, sensor["level"], now), now))
    return {"message": "Sensor deployed successfully", "sensor_id": sensor["_id"]}


@app.put("/admin/sensor/{sensor_id}/status")
def update_status(sensor_id: int, is_active: bool, admin_id: int = Depends(get_current_admin)):
    db.sensors.update_one({"_id": sensor_id}, {"$set": {"is_active": is_active}})
    return {"message": "Status updated"}


@app.delete("/admin/sensor/{sensor_id}")
def delete_sensor(sensor_id: int, admin_id: int = Depends(get_current_admin)):
    db.readings.delete_many({"sensor_id": sensor_id})
    db.sensors.delete_one({"_id": sensor_id})
    return {"message": "Sensor deleted"}
