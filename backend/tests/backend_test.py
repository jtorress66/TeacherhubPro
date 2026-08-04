"""Regression tests for authentication and Claude 4.6 AI integrations."""

import os
import time
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

FRONTEND_ENV = dotenv_values("/app/frontend/.env")
BASE_URL = (
    os.environ.get("REACT_APP_BACKEND_URL")
    or FRONTEND_ENV.get("REACT_APP_BACKEND_URL")
    or ""
).rstrip("/")
TEST_EMAIL = os.environ.get("TEST_EMAIL")
TEST_PASSWORD = os.environ.get("TEST_PASSWORD")

if not BASE_URL:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing")
if not TEST_EMAIL or not TEST_PASSWORD:
    raise RuntimeError("TEST_EMAIL and TEST_PASSWORD must be supplied by the test runner")


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
def completed_lesson_generation(authenticated_session):
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

    yield {"start": start_data, "final": final_response}

    generation_id = final_response.get("generation_id")
    if generation_id:
        authenticated_session.delete(
            f"{BASE_URL}/api/ai/generations/{generation_id}", timeout=30
        )


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
