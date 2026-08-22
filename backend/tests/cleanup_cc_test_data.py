"""One-off cleanup of TEST_ classes created during Command Center UI testing."""
import re
from pathlib import Path

import requests
from dotenv import dotenv_values

BASE_URL = dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"].rstrip("/")
content = Path("/app/memory/test_credentials.md").read_text(encoding="utf-8")
email = re.search(r'(?im)email\s*:\s*`?([^`\s]+)', content).group(1)
pw = re.search(r'(?im)password\s*:\s*`?([^`\s]+)', content).group(1)

s = requests.Session()
s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pw}, timeout=60)
classes = s.get(f"{BASE_URL}/api/classes", timeout=60).json()
for c in classes:
    if c["name"].startswith("TEST_UI_") or c["name"].startswith("TEST_CC_"):
        r = s.delete(f"{BASE_URL}/api/classes/{c['class_id']}", timeout=60)
        print("deleted", c["name"], r.status_code)
