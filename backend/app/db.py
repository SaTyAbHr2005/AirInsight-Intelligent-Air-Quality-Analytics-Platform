import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "air_quality_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "Satya@2005"),
    "port": os.getenv("DB_PORT", "5432")
}


def get_connection():
    conn = psycopg2.connect(**DB_CONFIG)
    return conn