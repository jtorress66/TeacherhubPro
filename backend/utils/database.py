"""Database connection and utilities"""
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
# Use database from connection string if available (Atlas auth), fallback to DB_NAME
import logging as _logging
try:
    db = client.get_default_database()
    _logging.info(f"[database.py] Using database from connection string: {db.name}")
except Exception:
    from urllib.parse import urlparse
    _parsed = urlparse(mongo_url.replace('+srv', ''))
    _url_db = _parsed.path.strip('/') if _parsed.path and _parsed.path.strip('/') else None
    if _url_db:
        db = client[_url_db]
        _logging.info(f"[database.py] Using database from URL path: {_url_db}")
    else:
        db_name = os.environ.get('DB_NAME', 'teacherhub')
        db = client[db_name]
        _logging.info(f"[database.py] Using database from DB_NAME env var: {db_name}")
