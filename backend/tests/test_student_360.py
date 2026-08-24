"""Student 360 View backend tests: /api/students/{id}/360, notes CRUD, AI insight, access control."""
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

KNOWN_STUDENT = "student_40da2916"
KNOWN_CLASS = "class_d79a6790"


@pytest.fixture(scope="module")
def creds():
    p = Path("/app/memory/test_credentials.md")
    if not p.exists():
        pytest.skip("missing credentials file")
    c = p.read_text()
    e = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?email(?:\*\*)?\s*:\s*`?([^`\s]+)', c)
    pw = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?password(?:\*\*)?\s*:\s*`?([^`\s]+)', c)
    if not e or not pw:
        pytest.skip("no creds parsed")
    return {"email": e.group(1), "password": pw.group(1)}


@pytest.fixture(scope="module")
def client(creds):
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed {r.status_code}: {r.text[:300]}")
    return s


@pytest.fixture(scope="module")
def student_id(client):
    r = client.get(f"{BASE_URL}/api/students/{KNOWN_STUDENT}/360", timeout=30)
    if r.status_code == 200:
        return KNOWN_STUDENT
    # fallback: pick any student from teacher's classes
    classes = client.get(f"{BASE_URL}/api/classes", timeout=30).json()
    for c in classes:
        studs = client.get(f"{BASE_URL}/api/students?class_id={c['class_id']}", timeout=30).json()
        if studs:
            return studs[0]["student_id"]
    pytest.fail("no accessible student found")


# ---------- GET /360 ----------
class TestStudent360:
    def test_360_structure(self, client, student_id):
        r = client.get(f"{BASE_URL}/api/students/{student_id}/360", timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        for key in ["student", "class", "stats", "missing_assignments", "notes", "timeline"]:
            assert key in d, f"missing {key}"
        assert d["student"]["student_id"] == student_id
        assert "_id" not in d["student"]
        st = d["stats"]
        for key in ["grade_average", "attendance_rate", "attendance_counts", "missing_count",
                    "total_sessions", "graded_count", "total_assignments"]:
            assert key in st
        assert set(st["attendance_counts"].keys()) == {"present", "absent", "tardy", "excused"}
        assert st["missing_count"] == len(d["missing_assignments"])
        assert isinstance(d["timeline"], list)

    def test_timeline_sorted_newest_first(self, client, student_id):
        d = client.get(f"{BASE_URL}/api/students/{student_id}/360", timeout=30).json()
        dates = [e.get("date") or "" for e in d["timeline"]]
        assert dates == sorted(dates, reverse=True), f"timeline not newest-first: {dates}"
        allowed = {"grade", "attendance", "assignment_due", "note"}
        assert all(e["type"] in allowed for e in d["timeline"])

    def test_grade_average_sane(self, client, student_id):
        st = client.get(f"{BASE_URL}/api/students/{student_id}/360", timeout=30).json()["stats"]
        if st["grade_average"] is not None:
            assert 0 <= st["grade_average"] <= 200
        if st["attendance_rate"] is not None:
            assert 0 <= st["attendance_rate"] <= 100

    def test_unknown_student_404(self, client):
        r = client.get(f"{BASE_URL}/api/students/student_doesnotexist/360", timeout=30)
        assert r.status_code == 404, f"expected 404 got {r.status_code}: {r.text[:200]}"

    def test_unauthenticated_rejected(self, student_id):
        r = requests.get(f"{BASE_URL}/api/students/{student_id}/360", timeout=30)
        assert r.status_code in (401, 403), r.status_code

    def test_other_teacher_student_forbidden(self, client, student_id):
        """Create a class+student under a second teacher, verify first teacher gets 403."""
        other = requests.Session()
        email = f"TEST_other_{os.urandom(4).hex()}@school.edu"
        reg = other.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "testpassword123",
            "name": "TEST Other Teacher", "role": "teacher"
        }, timeout=30)
        if reg.status_code not in (200, 201):
            pytest.skip(f"cannot register second teacher: {reg.status_code} {reg.text[:200]}")
        c = other.post(f"{BASE_URL}/api/classes", json={
            "name": "TEST Other Class", "subject": "Math", "grade": "5", "section": "A"
        }, timeout=30)
        assert c.status_code in (200, 201), c.text[:300]
        cid = c.json()["class_id"]
        s = other.post(f"{BASE_URL}/api/classes/{cid}/students", json={
            "first_name": "TEST", "last_name": "Foreign"
        }, timeout=30)
        assert s.status_code in (200, 201), s.text[:300]
        foreign_sid = s.json()["student_id"]

        r = client.get(f"{BASE_URL}/api/students/{foreign_sid}/360", timeout=30)
        assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text[:200]}"
        # note endpoints also blocked
        rn = client.post(f"{BASE_URL}/api/students/{foreign_sid}/notes", json={"content": "hack"}, timeout=30)
        assert rn.status_code == 403, rn.status_code
        ri = client.get(f"{BASE_URL}/api/students/{foreign_sid}/insight", timeout=30)
        assert ri.status_code == 403, ri.status_code
        # cleanup
        other.delete(f"{BASE_URL}/api/students/{foreign_sid}", timeout=30)
        other.delete(f"{BASE_URL}/api/classes/{cid}", timeout=30)


# ---------- Notes ----------
class TestStudentNotes:
    def test_create_note_and_persist(self, client, student_id):
        r = client.post(f"{BASE_URL}/api/students/{student_id}/notes",
                        json={"content": "TEST_note persisted content"}, timeout=30)
        assert r.status_code in (200, 201), r.text[:300]
        note = r.json()
        assert note["content"] == "TEST_note persisted content"
        assert note["note_id"].startswith("snote_")
        assert "_id" not in note
        nid = note["note_id"]

        d = client.get(f"{BASE_URL}/api/students/{student_id}/360", timeout=30).json()
        assert any(n["note_id"] == nid for n in d["notes"]), "note not persisted in 360"
        assert any(e["type"] == "note" and e.get("note_id") == nid for e in d["timeline"])

        # delete
        dl = client.delete(f"{BASE_URL}/api/students/{student_id}/notes/{nid}", timeout=30)
        assert dl.status_code in (200, 204), dl.text[:200]
        d2 = client.get(f"{BASE_URL}/api/students/{student_id}/360", timeout=30).json()
        assert not any(n["note_id"] == nid for n in d2["notes"]), "note still present after delete"

    def test_empty_content_400(self, client, student_id):
        for payload in [{"content": ""}, {"content": "   "}, {}]:
            r = client.post(f"{BASE_URL}/api/students/{student_id}/notes", json=payload, timeout=30)
            assert r.status_code == 400, f"payload {payload} -> {r.status_code}"

    def test_delete_unknown_note_404(self, client, student_id):
        r = client.delete(f"{BASE_URL}/api/students/{student_id}/notes/snote_nonexistent", timeout=30)
        assert r.status_code == 404, r.status_code

    def test_notes_ordered_newest_first(self, client, student_id):
        ids = []
        for i in range(2):
            r = client.post(f"{BASE_URL}/api/students/{student_id}/notes",
                            json={"content": f"TEST_order {i}"}, timeout=30)
            assert r.status_code in (200, 201)
            ids.append(r.json()["note_id"])
        notes = client.get(f"{BASE_URL}/api/students/{student_id}/360", timeout=30).json()["notes"]
        created = [n["created_at"] for n in notes]
        assert created == sorted(created, reverse=True)
        for nid in ids:
            client.delete(f"{BASE_URL}/api/students/{student_id}/notes/{nid}", timeout=30)


# ---------- AI insight ----------
class TestStudentInsight:
    def test_get_cached_insight(self, client, student_id):
        r = client.get(f"{BASE_URL}/api/students/{student_id}/insight", timeout=30)
        assert r.status_code == 200, r.text[:200]
        d = r.json()
        assert "insight" in d and "generated_at" in d

    def test_generate_insight(self, client, student_id):
        r = client.post(f"{BASE_URL}/api/students/{student_id}/insight", timeout=120)
        assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
        d = r.json()
        assert isinstance(d["insight"], str) and len(d["insight"]) > 50, d
        assert d["generated_at"]
        cached = client.get(f"{BASE_URL}/api/students/{student_id}/insight", timeout=30).json()
        assert cached["insight"] == d["insight"], "generated insight not cached"

    def test_insight_unknown_student_404(self, client):
        r = client.post(f"{BASE_URL}/api/students/student_nope/insight", timeout=60)
        assert r.status_code == 404, r.status_code
