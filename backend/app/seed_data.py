"""Canonical network definition — the data that lived in Postgres (schema.sql / factory_seed.py)."""

# id, name, lat, lon — from factory_seed.py
REGIONS = [
    (1, "Mumbai", 19.0760, 72.8777),
    (2, "Pune", 18.5204, 73.8567),
    (3, "Nagpur", 21.1458, 79.0882),
    (4, "Nashik", 20.0110, 73.7903),
    (5, "Aurangabad", 19.8762, 75.3433),
    (6, "Kolhapur", 16.7050, 74.2433),
    (7, "Solapur", 17.6599, 75.9064),
    (8, "Chandrapur", 19.9535, 79.2961),
    (9, "Ratnagiri", 16.9902, 73.3120),
    (10, "Navi Mumbai", 19.0330, 73.0297),
]

# Default pollution profile for nodes an admin deploys later (was hardcoded in main.py)
REGION_LEVEL = {1: "high", 2: "moderate", 3: "good", 4: "good", 5: "high",
                6: "good", 7: "very_high", 8: "severe", 9: "low", 10: "high"}

# sensor codes from schema.sql, levels from scripts/sensor_simulator.py
_LEVELS = ["high", "very_high", "moderate", "high", "good", "moderate", "low", "good",
           "moderate", "high", "low", "good", "high", "very_high", "very_high", "severe",
           "low", "good", "moderate", "high"]
_PREFIX = ["MUM", "PUN", "NAG", "NAS", "AUR", "KOL", "SOL", "CHA", "RAT", "NVM"]

SENSORS = [
    {"id": i + 1, "region_id": i // 2 + 1, "code": f"{_PREFIX[i // 2]}00{i % 2 + 1}", "level": _LEVELS[i]}
    for i in range(20)
]

LEVEL_TARGET_AQI = {"low": 45, "good": 85, "moderate": 150, "high": 250, "very_high": 340, "severe": 430}

# Pollutant envelopes per level (µg/m³, CO in mg/m³) — from sensor_simulator.py
LEVEL_RANGES = {
    "low":       {"pm25": (5, 15), "pm10": (15, 40), "no2": (5, 15), "co": (0.1, 0.4), "so2": (2, 8), "o3": (10, 25), "nh3": (2, 8)},
    "good":      {"pm25": (15, 40), "pm10": (40, 80), "no2": (10, 25), "co": (0.3, 0.8), "so2": (5, 15), "o3": (20, 50), "nh3": (5, 15)},
    "moderate":  {"pm25": (40, 100), "pm10": (80, 200), "no2": (25, 60), "co": (0.7, 1.8), "so2": (10, 30), "o3": (40, 80), "nh3": (10, 30)},
    "high":      {"pm25": (100, 220), "pm10": (200, 400), "no2": (60, 120), "co": (1.5, 3), "so2": (20, 60), "o3": (60, 120), "nh3": (20, 60)},
    "very_high": {"pm25": (180, 300), "pm10": (350, 550), "no2": (90, 180), "co": (2.5, 5), "so2": (40, 100), "o3": (80, 160), "nh3": (40, 100)},
    "severe":    {"pm25": (300, 500), "pm10": (500, 800), "no2": (150, 300), "co": (5, 10), "so2": (80, 200), "o3": (150, 250), "nh3": (80, 150)},
}

POLLUTANTS = ["pm25", "pm10", "no2", "co", "so2", "o3", "nh3"]
