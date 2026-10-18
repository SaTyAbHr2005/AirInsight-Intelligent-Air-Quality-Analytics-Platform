"""
Seed MongoDB with the AirInsight network: 10 regions, 20 sensors, a bootstrap admin,
and 7 days of real CPCB hourly readings per sensor (time-shifted to end now).

    python -m app.seed           # seed only if empty
    python -m app.seed --reset   # wipe and reseed
"""
import gzip
import json
import os
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app import db
from app.auth import hash_password
from app.seed_data import POLLUTANTS, REGION_LEVEL, REGIONS, SENSORS
from app.engine import get_category

FIXTURE = Path(__file__).parent / "seed_readings.json.gz"


def seed(reset=False):
    if reset:
        for c in ("regions", "sensors", "readings", "counters"):
            db.db.drop_collection(c)
    if db.regions.count_documents({}):
        return False

    db.ensure_indexes()
    rnd = random.Random(2005)  # deterministic sensor placement
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)

    db.regions.insert_many([
        {"_id": rid, "name": name, "latitude": lat, "longitude": lon, "level": REGION_LEVEL[rid]}
        for rid, name, lat, lon in REGIONS
    ])
    loc = {rid: (lat, lon) for rid, _, lat, lon in REGIONS}

    fixture = json.loads(gzip.open(FIXTURE, "rt").read())
    docs = []
    for s in SENSORS:
        lat, lon = loc[s["region_id"]]
        db.sensors.insert_one({
            "_id": s["id"], "sensor_code": s["code"], "region_id": s["region_id"],
            "latitude": round(lat + rnd.uniform(-0.15, 0.15), 6),
            "longitude": round(lon + rnd.uniform(-0.15, 0.15), 6),
            "radius": rnd.randint(15, 45), "is_active": True, "level": s["level"],
            "source_station": fixture[str(s["id"])]["station"],
        })
        rows = fixture[str(s["id"])]["rows"]
        for i, row in enumerate(rows):
            doc = dict(zip(POLLUTANTS, row[:7]))
            doc.update(sensor_id=s["id"], region_id=s["region_id"], aqi=row[7],
                       category=get_category(row[7]), ts=now - timedelta(hours=len(rows) - 1 - i))
            docs.append(doc)
    db.readings.insert_many(docs)

    for name, coll in (("regions", db.regions), ("sensors", db.sensors)):
        db.db.counters.update_one({"_id": name}, {"$set": {"seq": coll.count_documents({})}}, upsert=True)

    username = os.getenv("ADMIN_USERNAME", "admin1")
    if not db.admins.find_one({"username": username}):
        db.admins.insert_one({
            "_id": db.next_id("admins"), "username": username,
            "email": os.getenv("ADMIN_EMAIL", "admin@airinsight.local"),
            "password_hash": hash_password(os.getenv("ADMIN_PASSWORD", "admin123")),
        })
    print(f"Seeded {len(REGIONS)} regions, {len(SENSORS)} sensors, {len(docs)} readings, admin '{username}'")
    return True


if __name__ == "__main__":
    if not seed(reset="--reset" in sys.argv):
        print("Database already seeded (use --reset to wipe and reseed)")
