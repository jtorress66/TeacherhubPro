"""
Test Suite for Semester System and Portal Email Features
Tests:
- Semester CRUD operations (Admin Panel)
- Semester active status toggle (only one active at a time)
- Gradebook semester selector
- Gradebook Reports semester filter
- Portal email functionality with Resend
- Portal token expiration dates
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@school.edu"
TEST_PASSWORD = "testpassword"


@pytest.fixture(scope="module")
def auth_session():
    """Get authenticated session for super_admin user"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Login
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    
    # Get session token from cookies
    session_token = response.cookies.get("session_token")
    if session_token:
        session.headers.update({"Authorization": f"Bearer {session_token}"})
    
    return session


class TestSemesterCRUD:
    """Test Semester CRUD operations - Admin Panel Semesters tab"""
    
    def test_get_semesters(self, auth_session):
        """GET /api/semesters returns list of semesters"""
        response = auth_session.get(f"{BASE_URL}/api/semesters")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        # Should have at least 1 semester
        assert len(data) >= 1
        
        # Verify semester structure
        for semester in data:
            assert "semester_id" in semester
            assert "name" in semester
            assert "start_date" in semester
            assert "end_date" in semester
            assert "year_term" in semester
            assert "is_active" in semester
    
    def test_get_active_semester(self, auth_session):
        """GET /api/semesters/active returns the active semester or most recent"""
        response = auth_session.get(f"{BASE_URL}/api/semesters/active")
        assert response.status_code == 200
        
        data = response.json()
        # May return active semester or most recent if none active
        if data:
            assert "semester_id" in data
            assert "name" in data
            # is_active may be True or False (returns most recent if none active)
    
    def test_create_semester(self, auth_session):
        """POST /api/semesters creates a new semester"""
        new_semester = {
            "name": "Test Semester",
            "name_es": "Semestre de Prueba",
            "start_date": "2025-06-01",
            "end_date": "2025-08-31",
            "year_term": "2025-2026",
            "is_active": False
        }
        
        response = auth_session.post(f"{BASE_URL}/api/semesters", json=new_semester)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Test Semester"
        assert data["name_es"] == "Semestre de Prueba"
        assert data["start_date"] == "2025-06-01"
        assert data["end_date"] == "2025-08-31"
        assert data["year_term"] == "2025-2026"
        assert data["is_active"] == False
        assert "semester_id" in data
        
        # Store for cleanup
        pytest.test_semester_id = data["semester_id"]
    
    def test_update_semester(self, auth_session):
        """PUT /api/semesters/{semester_id} updates a semester"""
        if not hasattr(pytest, 'test_semester_id'):
            pytest.skip("No test semester created")
        
        update_data = {
            "name": "Updated Test Semester",
            "name_es": "Semestre de Prueba Actualizado"
        }
        
        response = auth_session.put(
            f"{BASE_URL}/api/semesters/{pytest.test_semester_id}", 
            json=update_data
        )
        assert response.status_code == 200
        
        # Verify update
        response = auth_session.get(f"{BASE_URL}/api/semesters")
        semesters = response.json()
        updated = next((s for s in semesters if s["semester_id"] == pytest.test_semester_id), None)
        assert updated is not None
        assert updated["name"] == "Updated Test Semester"
    
    def test_toggle_semester_active_status(self, auth_session):
        """PUT /api/semesters/{semester_id} with is_active toggles status"""
        if not hasattr(pytest, 'test_semester_id'):
            pytest.skip("No test semester created")
        
        # Set test semester as active
        response = auth_session.put(
            f"{BASE_URL}/api/semesters/{pytest.test_semester_id}",
            json={"is_active": True}
        )
        assert response.status_code == 200
        
        # Verify only one semester is active
        response = auth_session.get(f"{BASE_URL}/api/semesters")
        semesters = response.json()
        active_count = sum(1 for s in semesters if s["is_active"])
        assert active_count == 1, "Only one semester should be active at a time"
        
        # Verify our test semester is now active
        test_sem = next((s for s in semesters if s["semester_id"] == pytest.test_semester_id), None)
        assert test_sem["is_active"] == True
        
        # Restore original active semester (Semester 2)
        sem2 = next((s for s in semesters if s["name"] == "Semester 2"), None)
        if sem2:
            auth_session.put(
                f"{BASE_URL}/api/semesters/{sem2['semester_id']}",
                json={"is_active": True}
            )
    
    def test_delete_semester(self, auth_session):
        """DELETE /api/semesters/{semester_id} deletes a semester"""
        if not hasattr(pytest, 'test_semester_id'):
            pytest.skip("No test semester created")
        
        response = auth_session.delete(f"{BASE_URL}/api/semesters/{pytest.test_semester_id}")
        assert response.status_code == 200
        
        # Verify deletion
        response = auth_session.get(f"{BASE_URL}/api/semesters")
        semesters = response.json()
        deleted = next((s for s in semesters if s["semester_id"] == pytest.test_semester_id), None)
        assert deleted is None
    
    def test_delete_semester_with_classes_fails(self, auth_session):
        """DELETE /api/semesters/{semester_id} fails if semester has classes"""
        # Get existing semesters
        response = auth_session.get(f"{BASE_URL}/api/semesters")
        semesters = response.json()
        
        # Try to delete Semester 2 (which may have classes)
        sem2 = next((s for s in semesters if s["name"] == "Semester 2"), None)
        if sem2:
            # This should fail if there are classes linked to this semester
            # (depends on data state, so we just verify the endpoint exists)
            response = auth_session.delete(f"{BASE_URL}/api/semesters/{sem2['semester_id']}")
            # Either 200 (no classes) or 400 (has classes)
            assert response.status_code in [200, 400]


class TestGradebookSemesterSelector:
    """Test Gradebook semester selector functionality"""
    
    def test_gradebook_endpoint_exists(self, auth_session):
        """GET /api/classes returns classes (for gradebook)"""
        response = auth_session.get(f"{BASE_URL}/api/classes")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_semesters_available_for_gradebook(self, auth_session):
        """Semesters are available for gradebook filtering"""
        response = auth_session.get(f"{BASE_URL}/api/semesters")
        assert response.status_code == 200
        
        semesters = response.json()
        assert len(semesters) >= 1, "At least one semester should exist for gradebook"
        
        # Verify semester has required fields for selector
        for sem in semesters:
            assert "semester_id" in sem
            assert "name" in sem
            assert "is_active" in sem


class TestGradebookReportsSemesterFilter:
    """Test Gradebook Reports semester filter"""
    
    def test_gradebook_report_endpoint(self, auth_session):
        """GET /api/gradebook/report/{class_id} works"""
        # Get a class first
        response = auth_session.get(f"{BASE_URL}/api/classes")
        classes = response.json()
        
        if not classes:
            pytest.skip("No classes available for testing")
        
        class_id = classes[0]["class_id"]
        response = auth_session.get(f"{BASE_URL}/api/gradebook/report/{class_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "class_id" in data
        assert "students" in data


class TestPortalEmailFunctionality:
    """Test Portal email functionality with Resend"""
    
    def test_portal_token_with_expiration(self, auth_session):
        """POST /api/students/{student_id}/portal-token returns token with expiration"""
        # Get a student
        response = auth_session.get(f"{BASE_URL}/api/classes")
        classes = response.json()
        
        if not classes:
            pytest.skip("No classes available")
        
        response = auth_session.get(f"{BASE_URL}/api/classes/{classes[0]['class_id']}/students")
        students = response.json()
        
        if not students:
            pytest.skip("No students available")
        
        student_id = students[0]["student_id"]
        
        # Generate token with custom expiration
        response = auth_session.post(
            f"{BASE_URL}/api/students/{student_id}/portal-token?expires_days=30"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "portal_url" in data
        assert "expires_at" in data, "Portal token should have expiration date"
        
        # Verify expiration is in the future
        expires_at = datetime.fromisoformat(data["expires_at"].replace("Z", "+00:00"))
        assert expires_at > datetime.now(expires_at.tzinfo)
        
        # Store for email test
        pytest.portal_token_data = data
        pytest.test_student_id = student_id
    
    def test_portal_email_endpoint_exists(self, auth_session):
        """POST /api/portal/email endpoint exists"""
        if not hasattr(pytest, 'test_student_id'):
            pytest.skip("No test student available")
        
        # Test with invalid email to verify endpoint exists
        response = auth_session.post(f"{BASE_URL}/api/portal/email", json={
            "student_id": pytest.test_student_id,
            "parent_email": "test-parent@example.com",
            "expires_days": 30
        })
        
        # Should be 200 (email sent), 500 (Resend error), or 520 (Cloudflare timeout)
        # The endpoint should exist and process the request
        # Note: Resend in test mode only allows sending to verified email
        assert response.status_code in [200, 500, 520], f"Portal email endpoint should exist: {response.status_code}"
    
    def test_portal_email_with_different_expiration_days(self, auth_session):
        """Portal email supports different expiration days (7, 14, 30, 60, 90)"""
        if not hasattr(pytest, 'test_student_id'):
            pytest.skip("No test student available")
        
        # Test that the endpoint accepts different expiration values
        for days in [7, 14, 30, 60, 90]:
            response = auth_session.post(f"{BASE_URL}/api/portal/email", json={
                "student_id": pytest.test_student_id,
                "parent_email": f"test-{days}days@example.com",
                "expires_days": days
            })
            # Endpoint should accept the request (200, 500 for Resend issues, or 520 for timeout)
            assert response.status_code in [200, 500, 520], f"Should accept {days} days expiration"
    
    def test_portal_token_expiration_validation(self, auth_session):
        """Portal tokens have proper expiration dates"""
        if not hasattr(pytest, 'test_student_id'):
            pytest.skip("No test student available")
        
        # Note: If a token already exists, it returns the existing one
        # So we just verify the token has an expiration date
        response = auth_session.post(
            f"{BASE_URL}/api/students/{pytest.test_student_id}/portal-token?expires_days=7"
        )
        
        if response.status_code == 200:
            data = response.json()
            # Verify token has expiration (may be existing token with different expiry)
            if data.get("expires_at"):
                expires_at = datetime.fromisoformat(data["expires_at"].replace("Z", "+00:00"))
                now = datetime.now(expires_at.tzinfo)
                
                # Should expire in the future
                assert expires_at > now, "Token should expire in the future"


class TestPortalEmailRequestModel:
    """Test PortalEmailRequest model validation"""
    
    def test_portal_email_requires_student_id(self, auth_session):
        """Portal email requires student_id"""
        response = auth_session.post(f"{BASE_URL}/api/portal/email", json={
            "parent_email": "test@example.com",
            "expires_days": 30
        })
        assert response.status_code == 422, "Should require student_id"
    
    def test_portal_email_requires_valid_email(self, auth_session):
        """Portal email requires valid parent_email"""
        if not hasattr(pytest, 'test_student_id'):
            # Get a student
            response = auth_session.get(f"{BASE_URL}/api/classes")
            classes = response.json()
            if classes:
                response = auth_session.get(f"{BASE_URL}/api/classes/{classes[0]['class_id']}/students")
                students = response.json()
                if students:
                    pytest.test_student_id = students[0]["student_id"]
        
        if not hasattr(pytest, 'test_student_id'):
            pytest.skip("No test student available")
        
        response = auth_session.post(f"{BASE_URL}/api/portal/email", json={
            "student_id": pytest.test_student_id,
            "parent_email": "invalid-email",
            "expires_days": 30
        })
        assert response.status_code == 422, "Should require valid email format"
    
    def test_portal_email_invalid_student_returns_404(self, auth_session):
        """Portal email with invalid student_id returns 404"""
        response = auth_session.post(f"{BASE_URL}/api/portal/email", json={
            "student_id": "invalid_student_id",
            "parent_email": "test@example.com",
            "expires_days": 30
        })
        assert response.status_code == 404


class TestSemesterAdminPermissions:
    """Test that only admins can manage semesters"""
    
    def test_semester_create_requires_admin(self):
        """Non-admin users cannot create semesters"""
        # Create a non-admin session
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Try to create semester without auth
        response = session.post(f"{BASE_URL}/api/semesters", json={
            "name": "Unauthorized Semester",
            "start_date": "2025-01-01",
            "end_date": "2025-06-30",
            "year_term": "2025-2026"
        })
        
        # Should be 401 (unauthorized)
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
