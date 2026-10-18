"""ML inference + the self-ticking sensor network (no background worker needed on free hosting)."""
import math
import os
import random
import threading
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import joblib

from app import db
from app.seed_data import LEVEL_RANGES, POLLUTANTS

MODELS = Path(__file__).resolve().parent.parent / "models"  # our own trained artifacts, committed in-repo
model = joblib.load(MODELS / "aqi_model.pkl")
forecast_model = joblib.load(MODELS / "aqi_forecast_model.pkl")

IST = timezone(timedelta(hours=5, minutes=30))  # models were trained on Indian local time
TICK = timedelta(minutes=int(os.getenv("TICK_MINUTES", "15")))


def get_category(aqi):
    for limit, name in ((50, "Good"), (100, "Satisfactory"), (200, "Moderate"), (300, "Poor"), (400, "Very Poor")):
        if aqi <= limit:
            return name
    return "Severe"


def predict_aqi(v, when=None):
    t = (when or datetime.now(timezone.utc)).astimezone(IST)
    features = [[v["pm25"], v["pm10"], v["no2"], v["co"], v["so2"], v["o3"], v["nh3"],
                 t.hour, t.day, t.month, t.weekday()]]
    return round(max(0.0, float(model.predict(features)[0])), 2)


def drift(prev, level, when):
    """Next plausible reading: mean-reverting random walk toward the sensor's profile, with a night-time peak."""
    hour = when.astimezone(IST).hour
    diurnal = 1 + 0.2 * math.cos(2 * math.pi * (hour - 22) / 24)
    out = {}
    for p in POLLUTANTS:
        lo, hi = LEVEL_RANGES.get(level, LEVEL_RANGES["moderate"])[p]
        target = (lo + hi) / 2 * diurnal
        cur = prev[p] if prev else target
        out[p] = round(max(lo * 0.5, cur + 0.35 * (target - cur) + random.gauss(0, 0.08 * target)), 2)
    return out


def reading_doc(sensor, values, when):
    aqi = predict_aqi(values, when)
    return {**values, "sensor_id": sensor["_id"], "region_id": sensor["region_id"],
            "aqi": aqi, "category": get_category(aqi), "ts": when}


_lock = threading.Lock()
_last_check = 0.0


def pulse():
    """Called on read: if the newest reading is older than TICK, every active sensor reports once.
    ponytail: in-process lock, assumes a single worker (Render free tier); use a DB lease if scaled out."""
    global _last_check
    if time.monotonic() - _last_check < 30 or not _lock.acquire(blocking=False):
        return
    try:
        _last_check = time.monotonic()
        now = datetime.now(timezone.utc)
        newest = db.readings.find_one(sort=[("ts", -1)])
        if newest and now - newest["ts"] < TICK:
            return
        docs = []
        for s in db.sensors.find({"is_active": True}):
            prev = db.readings.find_one({"sensor_id": s["_id"]}, sort=[("ts", -1)])
            docs.append(reading_doc(s, drift(prev, s.get("level", "moderate"), now), now))
        if docs:
            db.readings.insert_many(docs)
    finally:
        _lock.release()


def hourly_series(sensor_id, n):
    """Last n readings spaced ~1h apart (oldest first) — the forecast model was trained on hourly lags."""
    picked = []
    for r in db.readings.find({"sensor_id": sensor_id}, sort=[("ts", -1)]).limit(200):
        if not picked or picked[-1]["ts"] - r["ts"] >= timedelta(minutes=55):
            picked.append(r)
            if len(picked) == n:
                break
    return picked[::-1]


def forecast(sensor_id, hours=6):
    series = hourly_series(sensor_id, 6)
    if len(series) < 6:
        return None
    values = [r["aqi"] for r in series]
    start = series[-1]["ts"]
    outlook = []
    for h in range(1, hours + 1):
        nxt = max(0.0, float(forecast_model.predict([[values[-1], values[-2], values[-3], values[-6]]])[0]))
        values.append(nxt)
        outlook.append({"hour": h, "timestamp": start + timedelta(hours=h), "aqi": round(nxt, 2), "category": get_category(nxt)})
    return outlook


if __name__ == "__main__":
    assert get_category(50) == "Good" and get_category(50.1) == "Satisfactory" and get_category(999) == "Severe"
    now = datetime.now(timezone.utc)
    v = drift(None, "severe", now)
    assert all(v[p] > 0 for p in POLLUTANTS)
    assert predict_aqi(drift(None, "severe", now), now) > predict_aqi(drift(None, "low", now), now)
    print("engine ok")
