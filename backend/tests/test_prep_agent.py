"""Prep Agent API regression tests for standards, empty state, batch creation, and progress."""

import os
import re
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values
import time
import uuid

FRONTEND_ENV = dotenv_values("/app/frontend/.env")
BASE_URL = (
    os.environ.get("REACT_APP_BACKEND_URL")
    or FRONTEND_ENV.get("REACT_APP_BACKEND_URL")
    or ""
).rstrip("/")
CREDENTIALS_PATH = Path("/app/memory/test_credentials.md")


@pytest.fixture(scope="module")
def authenticated_session():
    """Authenticate with the supplied teacher account and retain its session cookie."""
    if not CREDENTIALS_PATH.exists():
        pytest.skip("Missing /app/memory/test_credentials.md")

    content = CREDENTIALS_PATH.read_text(encoding="utf-8")
    email_match = re.search(r"(?im)^\s*[-*]\s*Email:\s*(\S+)", content)
    password_match = re.search(r"(?im)^\s*[-*]\s*Password:\s*(\S+)", content)
    if not email_match or not password_match:
        pytest.skip("No email/password found in /app/memory/test_credentials.md")

    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    response = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email_match.group(1), "password": password_match.group(1)},
        timeout=30,
    )
    if response.status_code != 200:
        pytest.fail(f"Authentication failed ({response.status_code}): {response.text[:500]}")

    data = response.json()
    assert data["email"] == email_match.group(1)
    assert isinstance(data.get("user_id"), str) and data["user_id"]
    assert response.cookies.get("session_token")
    yield session
    session.close()


# Public Common Core standards response for fifth-grade mathematics.
def test_get_math_fifth_grade_standards():
    response = requests.get(
        f"{BASE_URL}/api/prep-agent/standards/Math/5th", timeout=30
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["subject"] == "Math"
    assert data["grade"] == "5th"
    assert isinstance(data["standards"], list) and len(data["standards"]) >= 2
    assert data["standards"][0] == {
        "code": "CCSS.MATH.CONTENT.5.NBT.A.1",
        "description": "Recognize that in a multi-digit number, a digit in one place represents 10 times as much as it represents in the place to its right.",
    }
    assert any(
        item.get("code") == "CCSS.MATH.CONTENT.5.NF.A.1"
        for item in data["standards"]
    )


# New-feature empty state plus create -> GET progress -> DELETE persistence flow.
def test_prep_batch_create_get_and_cleanup(authenticated_session):
    initial = authenticated_session.get(
        f"{BASE_URL}/api/prep-agent/batches", timeout=30
    )
    assert initial.status_code == 200, initial.text
    initial_data = initial.json()
    assert isinstance(initial_data, list)
    initial_batch_ids = {
        batch["batch_id"] for batch in initial_data if isinstance(batch.get("batch_id"), str)
    }

    classes_response = authenticated_session.get(f"{BASE_URL}/api/classes", timeout=30)
    assert classes_response.status_code == 200, classes_response.text
    classes = classes_response.json()
    assert isinstance(classes, list) and classes, "Teacher needs an existing class for prep"
    class_id = classes[0]["class_id"]

    payload = {
        "prompt": f"TEST_Prep next week for 5th grade fractions {uuid.uuid4().hex[:8]}",
        "class_id": class_id,
        "week_start": "2026-08-17",
        "num_days": 5,
        "include_quiz": False,
        "include_presentations": False,
        "include_worksheets": False,
        "include_calendar": False,
        "include_parent_email": False,
        "parent_email_content": None,
    }
    create_started = time.perf_counter()
    create_response = authenticated_session.post(
        f"{BASE_URL}/api/prep-agent/batches", json=payload, timeout=30
    )
    create_elapsed = time.perf_counter() - create_started
    assert create_response.status_code == 200, create_response.text
    assert create_elapsed < 1.0, f"POST blocked for {create_elapsed:.3f}s"
    created = create_response.json()
    batch_id = created.get("batch_id")

    try:
        assert isinstance(batch_id, str) and batch_id.startswith("batch_")
        assert created["status"] == "pending"
        assert created["class_id"] == class_id
        assert created["prompt"] == payload["prompt"]
        assert created["current_step"] == 0
        assert created["total_steps"] == 4
        assert created["progress_message"] == "Starting prep agent..."
        assert created["num_days"] == 5
        assert batch_id not in initial_batch_ids

        list_started = time.perf_counter()
        list_response = authenticated_session.get(
            f"{BASE_URL}/api/prep-agent/batches", timeout=30
        )
        list_elapsed = time.perf_counter() - list_started
        assert list_response.status_code == 200, list_response.text
        assert list_elapsed < 1.0, f"GET list blocked for {list_elapsed:.3f}s"
        listed = next(
            (batch for batch in list_response.json() if batch.get("batch_id") == batch_id),
            None,
        )
        assert listed is not None
        assert listed["prompt"] == payload["prompt"]
        assert listed["class_id"] == class_id

        details_started = time.perf_counter()
        details_response = authenticated_session.get(
            f"{BASE_URL}/api/prep-agent/batches/{batch_id}", timeout=30
        )
        details_elapsed = time.perf_counter() - details_started
        assert details_response.status_code == 200, details_response.text
        assert details_elapsed < 1.0, f"GET detail blocked for {details_elapsed:.3f}s"
        print(
            f"Prep Agent latency: POST={create_elapsed:.3f}s, "
            f"GET list={list_elapsed:.3f}s, GET detail={details_elapsed:.3f}s"
        )
        details = details_response.json()
        assert details["batch_id"] == batch_id
        assert details["class_id"] == class_id
        assert details["total_steps"] == 4
        assert isinstance(details["current_step"], int)
        assert 0 <= details["current_step"] <= details["total_steps"]
        assert isinstance(details["progress_message"], str) and details["progress_message"]
        assert details["status"] in {
            "pending",
            "processing",
            "step_1",
            "step_1_complete",
            "step_2",
            "step_2_complete",
            "step_3",
            "step_3_complete",
            "step_4",
            "completed",
            "failed",
        }

        # The worker must actually start, not leave the accepted batch pending forever.
        progress = details
        deadline = time.monotonic() + 3
        while progress["status"] == "pending" and time.monotonic() < deadline:
            time.sleep(0.25)
            poll_started = time.perf_counter()
            progress_response = authenticated_session.get(
                f"{BASE_URL}/api/prep-agent/batches/{batch_id}", timeout=30
            )
            poll_elapsed = time.perf_counter() - poll_started
            assert progress_response.status_code == 200, progress_response.text
            assert poll_elapsed < 1.0, f"GET progress blocked for {poll_elapsed:.3f}s"
            progress = progress_response.json()
        assert progress["status"] != "pending", (
            "Background workflow did not start within 3 seconds; batch remained pending"
        )
        assert progress["status"] != "failed", progress.get("error")
    finally:
        if batch_id:
            delete_response = authenticated_session.delete(
                f"{BASE_URL}/api/prep-agent/batches/{batch_id}", timeout=30
            )
            assert delete_response.status_code == 200, delete_response.text
            assert delete_response.json() == {"status": "deleted"}

            missing_response = authenticated_session.get(
                f"{BASE_URL}/api/prep-agent/batches/{batch_id}", timeout=30
            )
            assert missing_response.status_code == 404
            assert missing_response.json().get("detail") == "Batch not found"


def test_prep_batches_require_authentication():
    response = requests.get(f"{BASE_URL}/api/prep-agent/batches", timeout=30)
    assert response.status_code == 401
    assert response.json().get("detail") == "Not authenticated"


# Active subscription is required for the requested Prep Agent browser route.
def test_teacher_has_prep_agent_subscription_access(authenticated_session):
    response = authenticated_session.get(
        f"{BASE_URL}/api/subscription/status", timeout=30
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert isinstance(data.get("has_access"), bool)
    assert data["has_access"] is True, data
    assert data.get("status") in {"active", "trialing"}, data

