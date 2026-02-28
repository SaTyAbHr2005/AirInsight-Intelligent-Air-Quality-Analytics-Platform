import psycopg2
from app.db import get_connection
from app.auth import hash_password

def setup_database():
    print("Connecting to db...")
    conn = get_connection()
    cursor = conn.cursor()

    print("Creating tables if they don't exist...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS regions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sensors (
            id SERIAL PRIMARY KEY,
            sensor_code VARCHAR(50) UNIQUE NOT NULL,
            region_id INTEGER REFERENCES regions(id),
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            radius DECIMAL(5, 2) DEFAULT 20.0,
            is_active BOOLEAN DEFAULT TRUE
        );

        CREATE TABLE IF NOT EXISTS admins (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sensor_readings (
            id SERIAL PRIMARY KEY,
            sensor_id INTEGER REFERENCES sensors(id),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            pm25 DECIMAL(10, 2),
            pm10 DECIMAL(10, 2),
            no2 DECIMAL(10, 2),
            co DECIMAL(10, 2),
            so2 DECIMAL(10, 2),
            o3 DECIMAL(10, 2),
            nh3 DECIMAL(10, 2),
            predicted_aqi DECIMAL(10, 2),
            category VARCHAR(50)
        );
    """)

    print("Checking for default admin...")
    cursor.execute("SELECT * FROM admins WHERE username = 'admin1'")
    if not cursor.fetchone():
        print("Inserting default admin (admin1:admin123)...")
        hashed = hash_password("admin123")
        cursor.execute("INSERT INTO admins (username, email, password_hash) VALUES (%s, %s, %s)", ('admin1', 'admin@example.com', hashed))

    print("Inserting default regions...")
    regions = ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Kolhapur", "Solapur", "Chandrapur", "Amravati", "Navi Mumbai"]
    for region in regions:
        cursor.execute("SELECT * FROM regions WHERE name = %s", (region,))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO regions (name) VALUES (%s)", (region,))

    conn.commit()
    cursor.close()
    conn.close()
    print("Database successfully initialized!")

if __name__ == '__main__':
    setup_database()
