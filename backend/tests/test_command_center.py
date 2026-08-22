"""Tests for Command Center endpoint (/api/command-center) and Class schedule fields."""
import os
import re
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")


@pytest.fixture(scope="session")
def test_credentials():
    content = Path("/app/memory/test_credentials.md").read_text(encoding="utf-8")
    email = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?email(?:\*\*)?\s*:\s*`?([^`\s]+)', content)
    password = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?password(?:\*\*)?\s*:\s*`?([^`\s]+)', content)
    if not email or not password:
        pytest.skip("credentials missing")
    return {"email": email.group(1), "password": password.group(1)}


@pytest.fixture(scope="session")
def client(test_credentials):
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=test_credentials, timeout=60)
    if r.status_code != 200:
        pytest.fail(f"Login failed {r.status_code}: {r.text[:300]}")
    data = r.json()
    token = data.get("token") or data.get("access_token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


# ---------- Command Center ----------
class TestCommandCenter:
    def test_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/command-center", timeout=60)
        assert r.status_code in (401, 403), f"expected auth error, got {r.status_code}"

    def test_structure(self, client):
        r = client.get(f"{BASE_URL}/api/command-center", timeout=90)
        assert r.status_code == 200, r.text[:500]
        d = r.json()
        for key in ["user", "today", "today_weekday", "schedule", "at_risk_students",
                    "assignments_to_grade", "upcoming_lessons", "recommendations", "stats"]:
            assert key in d, f"missing key {key}"
        assert isinstance(d["schedule"], list)
        assert isinstance(d["at_risk_students"], list)
        assert isinstance(d["assignments_to_grade"], list)
        assert isinstance(d["recommendations"], list)
        for k in ["total_classes", "total_students", "total_plans", "classes_today",
                  "attendance_complete", "at_risk_count", "pending_grading"]:
            assert k in d["stats"], f"missing stat {k}"
            assert isinstance(d["stats"][k], int)
        assert re.match(r"\d{4}-\d{2}-\d{2}", d["today"])
        # no mongo ObjectId leakage
        assert "'_id'" not in str(d)

    def test_stats_consistency(self, client):
        d = client.get(f"{BASE_URL}/api/command-center", timeout=90).json()
        assert d["stats"]["classes_today"] == len(d["schedule"])
        assert d["stats"]["at_risk_count"] == len(d["at_risk_students"])
        assert d["stats"]["pending_grading"] == sum(a["pending_count"] for a in d["assignments_to_grade"])
        classes = client.get(f"{BASE_URL}/api/classes", timeout=60).json()
        assert d["stats"]["total_classes"] == len(classes)

    def test_schedule_items_fields_and_sorting(self, client):
        d = client.get(f"{BASE_URL}/api/command-center", timeout=90).json()
        prev = None
        for item in d["schedule"]:
            for k in ["class_id", "name", "student_count", "attendance_taken"]:
                assert k in item, f"schedule item missing {k}"
            assert isinstance(item["student_count"], int)
            key = (item.get("period") or 99, item.get("start_time") or "23:59")
            if prev is not None:
                assert prev <= key, "schedule not sorted by period/start_time"
            prev = key

    def test_assignments_to_grade_fields(self, client):
        d = client.get(f"{BASE_URL}/api/command-center", timeout=90).json()
        for a in d["assignments_to_grade"]:
            for k in ["assignment_id", "title", "class_name", "total_students", "graded_count", "pending_count"]:
                assert k in a
            assert a["pending_count"] > 0
            assert a["pending_count"] <= a["total_students"] or a["total_students"] == 0

    def test_at_risk_fields(self, client):
        d = client.get(f"{BASE_URL}/api/command-center", timeout=90).json()
        for s in d["at_risk_students"]:
            for k in ["student_id", "first_name", "last_name", "class_name", "risk_factors", "risk_score"]:
                assert k in s
            assert s["risk_score"] >= 2
            assert len(s["risk_factors"]) > 0
            for f in s["risk_factors"]:
                assert f["severity"] in ("high", "medium", "low")

    def test_recommendations_fields(self, client):
        d = client.get(f"{BASE_URL}/api/command-center", timeout=90).json()
        for rec in d["recommendations"]:
            for k in ["type", "priority", "title", "description", "action_url", "icon"]:
                assert k in rec
            assert rec["action_url"].startswith("/")


# ---------- Class schedule fields ----------
class TestClassScheduleFields:
    created = []

    @pytest.fixture(scope="class", autouse=True)
    def cleanup(self, request):
        yield
        s = requests.Session()
        content = Path("/app/memory/test_credentials.md").read_text(encoding="utf-8")
        email = re.search(r'(?im)email\s*:\s*`?([^`\s]+)', content).group(1)
        pw = re.search(r'(?im)password\s*:\s*`?([^`\s]+)', content).group(1)
        s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pw}, timeout=60)
        for cid in TestClassScheduleFields.created:
            s.delete(f"{BASE_URL}/api/classes/{cid}", timeout=60)

    def test_create_with_schedule_and_persist(self, client):
        payload = {"name": "TEST_CC_Class", "grade": "7", "section": "A", "subject": "Math",
                   "year_term": "2025-2026", "period": 3, "start_time": "08:00", "end_time": "08:45"}
        r = client.post(f"{BASE_URL}/api/classes", json=payload, timeout=60)
        assert r.status_code in (200, 201), r.text[:400]
        c = r.json()
        TestClassScheduleFields.created.append(c["class_id"])
        assert c["period"] == 3
        assert c["start_time"] == "08:00"
        assert c["end_time"] == "08:45"
        assert c.get("days_of_week") == ["Mon", "Tue", "Wed", "Thu", "Fri"]
        g = client.get(f"{BASE_URL}/api/classes/{c['class_id']}", timeout=60)
        assert g.status_code == 200
        assert g.json()["period"] == 3
        assert g.json()["start_time"] == "08:00"

    def test_update_schedule_persist(self, client):
        payload = {"name": "TEST_CC_Class_Edit", "grade": "8", "section": "B", "year_term": "2025-2026"}
        c = client.post(f"{BASE_URL}/api/classes", json=payload, timeout=60).json()
        TestClassScheduleFields.created.append(c["class_id"])
        upd = {**payload, "period": 5, "start_time": "10:15", "end_time": "11:00"}
        r = client.put(f"{BASE_URL}/api/classes/{c['class_id']}", json=upd, timeout=60)
        assert r.status_code == 200, r.text[:400]
        assert r.json()["period"] == 5
        g = client.get(f"{BASE_URL}/api/classes/{c['class_id']}", timeout=60).json()
        assert g["period"] == 5 and g["start_time"] == "10:15" and g["end_time"] == "11:00"

    def test_create_with_empty_string_period_frontend_payload(self, client):
        """Frontend Classes.js sends period:'' when the field is left blank."""
        payload = {"name": "TEST_CC_EmptyPeriod", "grade": "9", "section": "C",
                   "subject": "", "year_term": "2025-2026",
                   "period": "", "start_time": "", "end_time": ""}
        r = client.post(f"{BASE_URL}/api/classes", json=payload, timeout=60)
        if r.status_code in (200, 201):
            TestClassScheduleFields.created.append(r.json()["class_id"])
        assert r.status_code in (200, 201), f"blank schedule payload rejected: {r.status_code} {r.text[:300]}"

    def test_new_class_appears_in_command_center_schedule(self, client):
        """A class created for today's weekday should appear in command-center schedule."""
        import datetime
        weekday = datetime.datetime.now(datetime.timezone.utc).strftime("%a")
        payload = {"name": "TEST_CC_Today", "grade": "10", "section": "Z", "year_term": "2025-2026",
                   "period": 1, "start_time": "07:30", "end_time": "08:15",
                   "days_of_week": [weekday]}
        c = client.post(f"{BASE_URL}/api/classes", json=payload, timeout=60)
        assert c.status_code in (200, 201), c.text[:300]
        cid = c.json()["class_id"]
        TestClassScheduleFields.created.append(cid)
        d = client.get(f"{BASE_URL}/api/command-center", timeout=90).json()
        ids = [s["class_id"] for s in d["schedule"]]
        assert cid in ids, f"class scheduled for {weekday} missing from today's schedule"
        item = next(s for s in d["schedule"] if s["class_id"] == cid)
        assert item["period"] == 1
        assert item["attendance_taken"] is False
        assert d["schedule"][0]["class_id"] == cid, "period 1 class should sort first"
