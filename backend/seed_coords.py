from app.db import get_connection
import random

locs = {
    "Mumbai": (19.0760, 72.8777, 40),
    "Pune": (18.5204, 73.8567, 30),
    "Nagpur": (21.1458, 79.0882, 35),
    "Nashik": (20.0110, 73.7903, 25),
    "Chandrapur": (19.9535, 79.2961, 20)
}

try:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT s.id, r.name FROM sensors s JOIN regions r ON s.region_id = r.id")
    rows = cursor.fetchall()
    
    updated = 0
    for sensor_id, region_name in rows:
        if region_name in locs:
            lat, lon, root_rad = locs[region_name]
            jitter_lat = random.uniform(-0.15, 0.15)
            jitter_lon = random.uniform(-0.15, 0.15)
            # Assign random valid radius between 10km and 50km
            rad = random.randint(10, 50)
            cursor.execute("UPDATE sensors SET latitude=%s, longitude=%s, radius=%s WHERE id=%s", (lat + jitter_lat, lon + jitter_lon, rad, sensor_id))
            updated += 1

    conn.commit()
    print(f"Successfully injected map coordinates into {updated} backend sensors.")
except Exception as e:
    print("Error:", e)
finally:
    cursor.close()
    conn.close()
