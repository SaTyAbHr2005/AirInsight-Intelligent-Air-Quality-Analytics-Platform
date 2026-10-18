"""Read models shared by the public API and the assistant."""
from app import db
from app.engine import get_category


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
