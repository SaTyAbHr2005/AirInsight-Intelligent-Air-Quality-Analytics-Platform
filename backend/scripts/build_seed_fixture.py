"""
One-off: distil the (gitignored) CPCB hourly dataset into a small committed fixture
so any fresh MongoDB (local or Atlas) can be seeded with real atmospheric traces.

Each of the 20 sensors gets a real, contiguous 7-day window from a distinct CPCB
station whose mean AQI matches the sensor's pollution level.

Run from backend/:  python scripts/build_seed_fixture.py
"""
import gzip
import json
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.seed_data import SENSORS, LEVEL_TARGET_AQI  # noqa: E402

CSV = Path("data/processed/clean_air_quality.csv")
OUT = Path("app/seed_readings.json.gz")
HOURS = 168
COLS = ["PM2.5", "PM10", "NO2", "CO", "SO2", "O3", "NH3", "AQI"]

df = pd.read_csv(CSV, parse_dates=["Datetime"]).sort_values(["StationId", "Datetime"])

# Candidate windows: every complete 168h block per station
candidates = []
for station, g in df.groupby("StationId"):
    g = g.set_index("Datetime")[COLS]
    g = g[~g.index.duplicated()].asfreq("h")
    for end in range(len(g), HOURS, -HOURS):
        win = g.iloc[end - HOURS:end]
        if win.isna().any().any():
            continue
        candidates.append((station, win["AQI"].mean(), win.round(2).values.tolist()))

print(f"{len(candidates)} complete 7-day windows found")

used, fixture = set(), {}
for s in SENSORS:
    target = LEVEL_TARGET_AQI[s["level"]]
    station, mean, rows = min(
        (c for c in candidates if c[0] not in used),
        key=lambda c: abs(c[1] - target),
    )
    used.add(station)
    fixture[s["id"]] = {"station": station, "rows": rows}
    print(f"sensor {s['id']:>2} {s['level']:<10} <- {station} (mean AQI {mean:.0f}, target {target})")

with gzip.open(OUT, "wt") as f:
    json.dump(fixture, f, separators=(",", ":"))
print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")
