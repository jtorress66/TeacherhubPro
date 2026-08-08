"""Regression tests for authentication and Claude 4.6 AI integrations."""

import os
import re
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values
from pymongo import MongoClient

FRONTEND_ENV = dotenv_values("/app/frontend/.env")
BACKEND_ENV = dotenv_values("/app/backend/.env")
CREDENTIALS_PATH = Path("/app/memory/test_credentials.md")
BASE_URL = (
    os.environ.get("REACT_APP_BACKEND_URL")
    or FRONTEND_ENV.get("REACT_APP_BACKEND_URL")
    or ""
).rstrip("/")

credential_text = CREDENTIALS_PATH.read_text(encoding="utf-8") if CREDENTIALS_PATH.exists() else ""
email_match = re.search(r"(?im)^\s*[-*]\s*Email:\s*(\S+)", credential_text)
password_match = re.search(r"(?im)^\s*[-*]\s*Password:\s*(\S+)", credential_text)
TEST_EMAIL = os.environ.get("TEST_EMAIL") or (email_match.group(1) if email_match else None)
TEST_PASSWORD = os.environ.get("TEST_PASSWORD") or (password_match.group(1) if password_match else None)
MONGO_URL = os.environ.get("MONGO_URL") or BACKEND_ENV.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME") or BACKEND_ENV.get("DB_NAME")

if not BASE_URL:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing")
if not TEST_EMAIL or not TEST_PASSWORD:
    raise RuntimeError("Test credentials are missing from environment and /app/memory/test_credentials.md")
if not MONGO_URL or not DB_NAME:
    raise RuntimeError("MONGO_URL and DB_NAME are required for deterministic job-state tests")


@pytest.fixture(scope="session")
def authenticated_session():
    """Login once and retain the cookie used by protected AI routes."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    response = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=30,
    )
    if response.status_code != 200:
        pytest.fail(f"Authentication failed ({response.status_code}): {response.text[:500]}")

    data = response.json()
    assert data["email"] == TEST_EMAIL
    assert isinstance(data.get("user_id"), str) and data["user_id"]
    assert isinstance(data.get("name"), str) and data["name"]
    assert response.cookies.get("session_token"), "Login did not set session_token cookie"
    return session


@pytest.fixture(scope="session")
def mongo_db():
    """Use the configured database only to seed deterministic TEST_ job states."""
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=10000)
    client.admin.command("ping")
    yield client[DB_NAME]
    client.close()


@pytest.fixture
def deterministic_jobs(mongo_db):
    """Create processing and failed jobs that exercise polling without mocking the API."""
    suffix = uuid.uuid4().hex[:12]
    processing_id = f"job_TEST_processing_{suffix}"
    failed_id = f"job_TEST_failed_{suffix}"
    aged_failed_id = f"job_TEST_aged_failed_{suffix}"
    now = datetime.now(timezone.utc).isoformat()
    ninety_seconds_ago = (datetime.now(timezone.utc) - timedelta(seconds=90)).isoformat()
    mongo_db.generation_jobs.insert_many([
        {
            "job_id": processing_id,
            "status": "processing",
            "user_id": "TEST_polling_state",
            "created_at": now,
            "updated_at": now,
        },
        {
            "job_id": failed_id,
            "status": "failed",
            "user_id": "TEST_polling_state",
            "error": "TEST_forced generation failure",
            "created_at": now,
            "updated_at": now,
        },
        {
            "job_id": aged_failed_id,
            "status": "failed",
            "user_id": "TEST_polling_state",
            "error": "TEST_aged generation failure",
            "created_at": now,
            "updated_at": now,
            "retrieved_at": ninety_seconds_ago,
        },
    ])
    job_ids = [processing_id, failed_id, aged_failed_id]
    yield {
        "processing": processing_id,
        "failed": failed_id,
        "aged_failed": aged_failed_id,
    }
    mongo_db.generation_jobs.delete_many({"job_id": {"$in": job_ids}})


@pytest.fixture(scope="session")
def completed_lesson_generation(authenticated_session, mongo_db):
    """Start one async lesson job and poll until it produces persisted content."""
    payload = {
        "tool_type": "lesson_plan",
        "subject": "Science",
        "grade_level": "5",
        "topic": "TEST_Claude46 Water Cycle Mini Lesson",
        "language": "en",
        "standards_framework": "common_core",
        "difficulty_level": "easy",
        "duration_minutes": 20,
        "additional_instructions": "Keep the response concise while including an objective and activity.",
    }
    start = authenticated_session.post(
        f"{BASE_URL}/api/ai/generate-async", json=payload, timeout=30
    )
    assert start.status_code == 200, start.text
    start_data = start.json()
    assert start_data.get("status") == "processing"
    assert isinstance(start_data.get("job_id"), str)
    assert start_data["job_id"].startswith("job_")

    job_id = start_data["job_id"]
    final_response = None
    deadline = time.monotonic() + 180
    while time.monotonic() < deadline:
        time.sleep(3)
        poll = authenticated_session.get(
            f"{BASE_URL}/api/ai/generate-async/{job_id}", timeout=30
        )
        if poll.status_code != 200:
            pytest.fail(f"AI job {job_id} polling failed ({poll.status_code}): {poll.text[:1000]}")
        poll_data = poll.json()
        if poll_data.get("status") == "completed":
            final_response = poll_data
            break
        assert poll_data == {"status": "processing"}

    if final_response is None:
        pytest.fail(f"AI job {job_id} did not complete within 180 seconds")

    yield {"start": start_data, "final": final_response, "job_id": job_id}

    generation_id = final_response.get("generation_id")
    if generation_id:
        authenticated_session.delete(
            f"{BASE_URL}/api/ai/generations/{generation_id}", timeout=30
        )
    mongo_db.generation_jobs.delete_one({"job_id": job_id})


# Authentication and cookie behavior
def test_login_flow_sets_cookie_and_returns_user(authenticated_session):
    me = authenticated_session.get(f"{BASE_URL}/api/auth/me", timeout=30)
    assert me.status_code == 200, me.text
    data = me.json()
    assert data["email"] == TEST_EMAIL
    assert isinstance(data.get("user_id"), str) and data["user_id"]


def test_login_rejects_invalid_password():
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": "TEST_intentionally_wrong_password"},
        timeout=30,
    )
    assert response.status_code == 401
    assert response.json().get("detail") == "Invalid credentials"


# Async AI lesson generation start and completion
def test_ai_lesson_generation_starts_processing(completed_lesson_generation):
    data = completed_lesson_generation["start"]
    assert data["status"] == "processing"
    assert data["job_id"].startswith("job_")


def test_ai_lesson_generation_completes_with_content(completed_lesson_generation):
    data = completed_lesson_generation["final"]
    assert data["status"] == "completed"
    assert data["tool_type"] == "lesson_plan"
    assert isinstance(data.get("generation_id"), str) and data["generation_id"].startswith("gen_")
    assert isinstance(data.get("content"), str) and len(data["content"].strip()) > 100
    assert isinstance(data.get("metadata"), dict)
    assert data["metadata"]["difficulty"] == "easy"
    assert data["metadata"]["duration"] == 20



# Polling state, completed-result idempotency, and failure response contract
def test_ai_job_returns_processing_while_running(authenticated_session, deterministic_jobs):
    response = authenticated_session.get(
        f"{BASE_URL}/api/ai/generate-async/{deterministic_jobs['processing']}", timeout=30
    )
    assert response.status_code == 200, response.text
    assert response.json() == {"status": "processing"}


def test_completed_ai_job_can_be_polled_second_and_third_time(
    authenticated_session, completed_lesson_generation
):
    expected = completed_lesson_generation["final"]
    job_id = completed_lesson_generation["job_id"]

    for poll_number in (2, 3):
        response = authenticated_session.get(
            f"{BASE_URL}/api/ai/generate-async/{job_id}", timeout=30
        )
        assert response.status_code == 200, (
            f"Completed job returned {response.status_code} on poll {poll_number}: {response.text}"
        )
        data = response.json()
        assert data["status"] == "completed"
        assert data["generation_id"] == expected["generation_id"]
        assert data["content"] == expected["content"]
        assert data["tool_type"] == expected["tool_type"]
        assert data["metadata"] == expected["metadata"]


def test_failed_ai_job_returns_body_and_is_idempotent(authenticated_session, deterministic_jobs):
    job_id = deterministic_jobs["failed"]
    for poll_number in (1, 2, 3):
        response = authenticated_session.get(
            f"{BASE_URL}/api/ai/generate-async/{job_id}", timeout=30
        )
        assert response.status_code == 200, (
            f"Failed job returned HTTP {response.status_code} on poll {poll_number}: {response.text}"
        )
        assert response.json() == {
            "status": "failed",
            "error": "TEST_forced generation failure",
        }




def test_failed_job_is_retained_for_full_two_minute_retry_window(
    authenticated_session, deterministic_jobs
):
    """A failed job first retrieved 90s ago must still survive retry before the 2m TTL."""
    job_id = deterministic_jobs["aged_failed"]
    first_retry = authenticated_session.get(
        f"{BASE_URL}/api/ai/generate-async/{job_id}", timeout=30
    )
    second_retry = authenticated_session.get(
        f"{BASE_URL}/api/ai/generate-async/{job_id}", timeout=30
    )
    assert first_retry.status_code == 200, first_retry.text
    assert first_retry.json() == {
        "status": "failed",
        "error": "TEST_aged generation failure",
    }
    assert second_retry.status_code == 200, (
        "Failed job was deleted after 60 seconds instead of the required 120-second retry window: "
        f"{second_retry.text}"
    )
    assert second_retry.json() == first_retry.json()

def test_removed_ai_grading_debug_endpoints_return_404():
    token_list = requests.get(f"{BASE_URL}/api/ai-grading/debug/tokens", timeout=30)
    assignment = requests.get(
        f"{BASE_URL}/api/ai-grading/debug/assignment/TEST_nonexistent_token", timeout=30
    )
    assert token_list.status_code == 404, token_list.text
    assert assignment.status_code == 404, assignment.text
    assert token_list.json().get("detail") == "Not Found"
    assert assignment.json().get("detail") == "Not Found"


def test_ai_job_poll_requires_auth(completed_lesson_generation):
    job_id = completed_lesson_generation["start"]["job_id"]
    response = requests.get(f"{BASE_URL}/api/ai/generate-async/{job_id}", timeout=30)
    assert response.status_code == 401
    assert "authenticated" in response.json().get("detail", "").lower()


# Public sales chatbot must not misclassify lesson-planning questions as pricing
def test_chatbot_lesson_planning_not_misclassified_as_pricing():
    session_id = f"TEST_claude46_{uuid.uuid4().hex[:12]}"
    response = requests.post(
        f"{BASE_URL}/api/chatbot/message",
        json={
            "session_id": session_id,
            "message": "In one sentence, how can TeacherHubPro help a fifth-grade teacher plan lessons?",
            "page_url": "/features",
            "visitor_role": "teacher",
            "visitor_interest": "lesson_planning",
            "language": "en",
        },
        timeout=60,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data.get("session_id") == session_id
    answer = data.get("response", "")
    assert isinstance(answer, str) and len(answer.strip()) > 30
    lowered = answer.lower()
    assert "having a moment" not in lowered
    assert "i apologize for the inconvenience" not in lowered
    assert "contact page for immediate assistance" not in lowered
    assert "teacherhubpro" in lowered or "lesson" in lowered


# Public sales chatbot should return model content rather than its error fallbacks
def test_chatbot_message_returns_real_ai_response():
    session_id = f"TEST_claude46_basic_{uuid.uuid4().hex[:12]}"
    response = requests.post(
        f"{BASE_URL}/api/chatbot/message",
        json={
            "session_id": session_id,
            "message": "In one sentence, what teaching tasks can Ed help with?",
            "page_url": "/features",
            "visitor_role": "teacher",
            "visitor_interest": "ai_tools",
            "language": "en",
        },
        timeout=60,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data.get("session_id") == session_id
    answer = data.get("response", "")
    assert isinstance(answer, str) and len(answer.strip()) > 30
    lowered = answer.lower()
    assert "having a moment" not in lowered
    assert "i apologize for the inconvenience" not in lowered
    assert "contact page for immediate assistance" not in lowered
    assert "teacherhubpro" in lowered or "teach" in lowered



# AI grading shares the Claude model configuration and must complete its async job
def test_ai_assignment_generation_completes(authenticated_session):
    start = authenticated_session.post(
        f"{BASE_URL}/api/ai-grading/generate-assignment",
        json={
            "topic": "TEST_Claude46 Adding Fractions",
            "grade_level": "5",
            "subject": "Math",
            "question_types": ["multiple_choice"],
            "num_questions": 2,
            "difficulty": "easy",
            "language": "en",
            "additional_instructions": "Use concise wording.",
        },
        timeout=30,
    )
    assert start.status_code == 200, start.text
    start_data = start.json()
    assert start_data.get("status") == "processing"
    job_id = start_data.get("job_id")
    assert isinstance(job_id, str) and job_id.startswith("assigngen_")

    deadline = time.monotonic() + 180
    while time.monotonic() < deadline:
        time.sleep(3)
        poll = authenticated_session.get(
            f"{BASE_URL}/api/ai-grading/generate-assignment-status/{job_id}",
            timeout=30,
        )
        assert poll.status_code == 200, poll.text
        data = poll.json()
        if data.get("status") == "failed":
            pytest.fail(f"AI assignment generation failed: {data.get('error')}")
        if data.get("status") == "completed":
            result = data.get("result")
            assert isinstance(result, dict)
            assert result.get("ai_generated") is True
            assert result.get("grade_level") == "5"
            assert isinstance(result.get("title"), str) and result["title"]
            questions = result.get("questions")
            assert isinstance(questions, list) and len(questions) == 2
            for question in questions:
                assert question.get("question_type") == "multiple_choice"
                assert isinstance(question.get("question_text"), str) and question["question_text"]
                assert any(option.get("is_correct") for option in question.get("options", []))
            return
        assert data.get("status") == "processing"

    pytest.fail(f"AI assignment job {job_id} did not complete within 180 seconds")


# Static regression: invalid dated model identifier must not remain in backend runtime code
def test_backend_runtime_uses_claude_sonnet_46_only():
    backend = Path("/app/backend")
    runtime_files = [
        backend / "routes" / "ai.py",
        backend / "routes" / "chatbot.py",
        backend / "routes" / "ai_grading.py",
        backend / "routes" / "adaptive_learning.py",
        backend / "routes" / "games.py",
        backend / "server.py",
    ]
    invalid_model = "claude-sonnet-4-20250514"
    expected_model = "claude-sonnet-4-6"
    for runtime_file in runtime_files:
        content = runtime_file.read_text(encoding="utf-8")
        assert invalid_model not in content, f"Invalid model remains in {runtime_file}"
        assert expected_model in content, f"Claude 4.6 model missing from {runtime_file}"



# Class editing API: create, update persistence, validation, authorization, and cleanup
@pytest.fixture
def editable_test_class(authenticated_session):
    suffix = uuid.uuid4().hex[:10]
    payload = {
        "name": f"TEST_Edit_Class_{suffix}",
        "grade": "5",
        "section": "QA",
        "subject": "Science",
        "year_term": "2026-2027",
    }
    create_response = authenticated_session.post(
        f"{BASE_URL}/api/classes", json=payload, timeout=30
    )
    assert create_response.status_code == 200, create_response.text
    created = create_response.json()
    assert isinstance(created.get("class_id"), str) and created["class_id"].startswith("class_")
    assert created["name"] == payload["name"]
    assert created["grade"] == payload["grade"]
    assert created["section"] == payload["section"]
    assert created["subject"] == payload["subject"]
    assert created["year_term"] == payload["year_term"]

    yield created

    delete_response = authenticated_session.delete(
        f"{BASE_URL}/api/classes/{created['class_id']}", timeout=30
    )
    assert delete_response.status_code in (200, 404), delete_response.text
    verify_deleted = authenticated_session.get(
        f"{BASE_URL}/api/classes/{created['class_id']}", timeout=30
    )
    assert verify_deleted.status_code == 404, verify_deleted.text


def test_class_update_persists_and_appears_in_list(authenticated_session, editable_test_class):
    class_id = editable_test_class["class_id"]
    updated_payload = {
        "name": f"{editable_test_class['name']}_Updated",
        "grade": "6",
        "section": "QB",
        "subject": "Mathematics",
        "year_term": "2027-2028",
    }
    update_response = authenticated_session.put(
        f"{BASE_URL}/api/classes/{class_id}", json=updated_payload, timeout=30
    )
    assert update_response.status_code == 200, update_response.text
    updated = update_response.json()
    assert updated["class_id"] == class_id
    for field, expected in updated_payload.items():
        assert updated[field] == expected
    assert "_id" not in updated

    get_response = authenticated_session.get(
        f"{BASE_URL}/api/classes/{class_id}", timeout=30
    )
    assert get_response.status_code == 200, get_response.text
    persisted = get_response.json()
    for field, expected in updated_payload.items():
        assert persisted[field] == expected

    list_response = authenticated_session.get(f"{BASE_URL}/api/classes", timeout=30)
    assert list_response.status_code == 200, list_response.text
    listed = next((item for item in list_response.json() if item["class_id"] == class_id), None)
    assert listed is not None
    assert listed["name"] == updated_payload["name"]


def test_class_update_rejects_missing_required_name(authenticated_session, editable_test_class):
    class_id = editable_test_class["class_id"]
    invalid_payload = {
        "grade": editable_test_class["grade"],
        "section": editable_test_class["section"],
        "subject": editable_test_class["subject"],
        "year_term": editable_test_class["year_term"],
    }
    response = authenticated_session.put(
        f"{BASE_URL}/api/classes/{class_id}", json=invalid_payload, timeout=30
    )
    assert response.status_code == 422, response.text
    details = response.json().get("detail")
    assert isinstance(details, list)
    assert any(error.get("loc", [])[-1:] == ["name"] for error in details)

    verify = authenticated_session.get(f"{BASE_URL}/api/classes/{class_id}", timeout=30)
    assert verify.status_code == 200, verify.text
    assert verify.json()["name"] == editable_test_class["name"]


def test_class_update_requires_authentication(editable_test_class):
    payload = {
        "name": "TEST_Unauthorized_Update",
        "grade": editable_test_class["grade"],
        "section": editable_test_class["section"],
        "subject": editable_test_class["subject"],
        "year_term": editable_test_class["year_term"],
    }
    response = requests.put(
        f"{BASE_URL}/api/classes/{editable_test_class['class_id']}",
        json=payload,
        timeout=30,
    )
    assert response.status_code == 401, response.text
    assert "authenticated" in response.json().get("detail", "").lower()


def test_class_update_unknown_id_returns_404(authenticated_session):
    response = authenticated_session.put(
        f"{BASE_URL}/api/classes/class_TEST_missing",
        json={
            "name": "TEST_Missing",
            "grade": "5",
            "section": "QA",
            "subject": "Science",
            "year_term": "2026-2027",
        },
        timeout=30,
    )
    assert response.status_code == 404, response.text
    assert response.json().get("detail") == "Class not found"



def test_class_update_rejects_whitespace_only_name(authenticated_session, editable_test_class):
    class_id = editable_test_class["class_id"]
    response = authenticated_session.put(
        f"{BASE_URL}/api/classes/{class_id}",
        json={
            "name": "   ",
            "grade": editable_test_class["grade"],
            "section": editable_test_class["section"],
            "subject": editable_test_class["subject"],
            "year_term": editable_test_class["year_term"],
        },
        timeout=30,
    )
    assert response.status_code == 422, (
        "Whitespace-only class names should fail required-field validation; "
        f"received {response.status_code}: {response.text}"
    )

    verify = authenticated_session.get(f"{BASE_URL}/api/classes/{class_id}", timeout=30)
    assert verify.status_code == 200, verify.text
    assert verify.json()["name"] == editable_test_class["name"]
