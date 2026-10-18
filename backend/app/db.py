import os

from dotenv import load_dotenv
from pymongo import ASCENDING, DESCENDING, MongoClient, ReturnDocument

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"), serverSelectionTimeoutMS=10000, tz_aware=True)
db = client[os.getenv("MONGODB_DB", "airinsight")]

regions = db.regions
sensors = db.sensors
readings = db.readings
admins = db.admins


def next_id(name: str) -> int:
    """Integer auto-increment so the public API keeps its numeric ids."""
    doc = db.counters.find_one_and_update(
        {"_id": name}, {"$inc": {"seq": 1}}, upsert=True, return_document=ReturnDocument.AFTER
    )
    return doc["seq"]


def ensure_indexes():
    readings.create_index([("sensor_id", ASCENDING), ("ts", DESCENDING)])
    readings.create_index([("region_id", ASCENDING), ("ts", DESCENDING)])
    readings.create_index("ts", expireAfterSeconds=60 * 60 * 24 * 45)  # keeps Atlas M0 under 512MB
    sensors.create_index("sensor_code", unique=True)
    admins.create_index("username", unique=True)
    admins.create_index("email", unique=True)
