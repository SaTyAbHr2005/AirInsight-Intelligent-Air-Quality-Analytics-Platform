import psycopg2
from app.db import get_connection
import random
import uuid

SENSORS = [
    (1, "Mumbai"), (2, "Mumbai"),
    (3, "Pune"), (4, "Pune"),
    (5, "Nagpur"), (6, "Nagpur"),
    (7, "Nashik"), (8, "Nashik"),
    (9, "Aurangabad"), (10, "Aurangabad"),
    (11, "Kolhapur"), (12, "Kolhapur"),
    (13, "Solapur"), (14, "Solapur"),
    (15, "Chandrapur"), (16, "Chandrapur"),
    (17, "Ratnagiri"), (18, "Ratnagiri"),
    (19, "Navi Mumbai"), (20, "Navi Mumbai")
]

locs = {
    "Mumbai": (19.0760, 72.8777),
    "Pune": (18.5204, 73.8567),
    "Nagpur": (21.1458, 79.0882),
    "Nashik": (20.0110, 73.7903),
    "Aurangabad": (19.8762, 75.3433),
    "Kolhapur": (16.7050, 74.2433),
    "Solapur": (17.6599, 75.9064),
    "Chandrapur": (19.9535, 79.2961),
    "Ratnagiri": (16.9902, 73.3120),
    "Navi Mumbai": (19.0330, 73.0297)
}

def seed_hardware():
    print("Connecting to db...")
    conn = get_connection()
    cursor = conn.cursor()

    print("Fetching region IDs...")
    cursor.execute("SELECT id, name FROM regions")
    regions = {name: r_id for r_id, name in cursor.fetchall()}

    print("Injecting Base Hardware Sensors...")
    inserted = 0
    for s_id, r_name in SENSORS:
        cursor.execute("SELECT id FROM sensors WHERE id = %s", (s_id,))
        if not cursor.fetchone():
            r_id = regions.get(r_name)
            if not r_id:
                cursor.execute("INSERT INTO regions (name) VALUES (%s) RETURNING id", (r_name,))
                r_id = cursor.fetchone()[0]
                regions[r_name] = r_id

            lat, lon = locs.get(r_name, (19.0, 73.0))
            lat += random.uniform(-0.15, 0.15)
            lon += random.uniform(-0.15, 0.15)
            rad = random.randint(15, 45)
            sensor_code = f"SNS-{uuid.uuid4().hex[:8].upper()}"
            
            cursor.execute("""
                INSERT INTO sensors (id, sensor_code, region_id, latitude, longitude, radius, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, TRUE)
            """, (s_id, sensor_code, r_id, lat, lon, rad))
            inserted += 1
            
            # Inject baseline telemetry so the dashboard loads immediately
            pm25, pm10 = random.uniform(15.0, 80.0), random.uniform(30.0, 150.0)
            no2, co, so2 = random.uniform(10.0, 40.0), random.uniform(0.1, 1.5), random.uniform(2.0, 10.0)
            o3, nh3 = random.uniform(20.0, 60.0), random.uniform(2.0, 8.0)
            aqi = max(pm25 * 3, pm10 * 1.5)
            cat = "Moderate" if aqi > 100 else "Satisfactory"
            
            cursor.execute("""
                INSERT INTO sensor_readings
                (sensor_id, pm25, pm10, no2, co, so2, o3, nh3, predicted_aqi, category)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (s_id, pm25, pm10, no2, co, so2, o3, nh3, aqi, cat))
            
    conn.commit()
    cursor.close()
    conn.close()
    print(f"Successfully deployed {inserted} physical hardware sensors into the database!")

if __name__ == '__main__':
    seed_hardware()
