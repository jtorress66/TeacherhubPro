"""
Test suite for TeacherHubPro - Homeschool Portal, Report Cards, and Template of Week features
Tests:
1. POST /api/students/{student_id}/homeschool-portal-token - generates portal access token
2. GET /api/homeschool-portal/{token} - returns adaptive learning progress (no auth)
3. GET /api/classes/{class_id}/students - returns students for a class
4. GET /api/report-cards/generate - generates report card data
5. GET /api/ai/templates/weekly - returns template of the week
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@school.edu"
TEST_PASSWORD = "testpassword"
TEST_STUDENT_ID = "student_40da2916"  # Maria Garcia
PORTAL_TOKEN = "hsp_f203a47563f94f85958b588ff45e2840"


@pytest.fixture(scope="module")
def auth_session():
    """Get authenticated session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Login
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if response.status_code == 200:
        return session
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


class TestHomeschoolPortalToken:
    """Tests for POST /api/students/{student_id}/homeschool-portal-token"""
    
    def test_generate_portal_token_success(self, auth_session):
        """Test generating a portal token for a valid student"""
        response = auth_session.post(
            f"{BASE_URL}/api/students/{TEST_STUDENT_ID}/homeschool-portal-token"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain 'token'"
        assert "portal_url" in data, "Response should contain 'portal_url'"
        assert "expires_at" in data, "Response should contain 'expires_at'"
        assert "student_id" in data, "Response should contain 'student_id'"
        
        # Verify token format
        assert data["token"].startswith("hsp_"), f"Token should start with 'hsp_', got {data['token']}"
        assert data["portal_url"].startswith("/homeschool-portal/"), "Portal URL should start with /homeschool-portal/"
        assert data["student_id"] == TEST_STUDENT_ID
        
        print(f"✓ Generated portal token: {data['token'][:20]}...")
        print(f"✓ Portal URL: {data['portal_url']}")
        
        # Store token for later tests
        pytest.portal_token = data["token"]
    
    def test_generate_portal_token_invalid_student(self, auth_session):
        """Test generating token for non-existent student returns 404"""
        response = auth_session.post(
            f"{BASE_URL}/api/students/invalid_student_id/homeschool-portal-token"
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid student returns 404")
    
    def test_generate_portal_token_requires_auth(self):
        """Test that generating token requires authentication"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/students/{TEST_STUDENT_ID}/homeschool-portal-token"
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Endpoint requires authentication")


class TestHomeschoolPortalData:
    """Tests for GET /api/homeschool-portal/{token}"""
    
    def test_get_portal_data_with_valid_token(self, auth_session):
        """Test getting portal data with a valid token"""
        # First generate a token
        token_response = auth_session.post(
            f"{BASE_URL}/api/students/{TEST_STUDENT_ID}/homeschool-portal-token"
        )
        assert token_response.status_code == 200
        token = token_response.json()["token"]
        
        # Now get portal data (no auth required)
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/homeschool-portal/{token}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify student info
        assert "student" in data, "Response should contain 'student'"
        assert data["student"]["student_id"] == TEST_STUDENT_ID
        assert "name" in data["student"]
        print(f"✓ Student name: {data['student']['name']}")
        
        # Verify progress data
        assert "progress" in data, "Response should contain 'progress'"
        progress = data["progress"]
        
        assert "subjects" in progress, "Progress should contain 'subjects'"
        assert "total_lessons_completed" in progress, "Progress should contain 'total_lessons_completed'"
        assert "total_time_spent" in progress, "Progress should contain 'total_time_spent'"
        assert "current_streak" in progress, "Progress should contain 'current_streak'"
        assert "achievements" in progress, "Progress should contain 'achievements'"
        
        print(f"✓ Total lessons completed: {progress['total_lessons_completed']}")
        print(f"✓ Total time spent: {progress['total_time_spent']} minutes")
        print(f"✓ Current streak: {progress['current_streak']} days")
        print(f"✓ Achievements count: {len(progress['achievements'])}")
        
        # Verify language
        assert "language" in data, "Response should contain 'language'"
        print(f"✓ Language: {data['language']}")
    
    def test_get_portal_data_no_auth_required(self):
        """Test that portal data endpoint doesn't require authentication"""
        # Use the known test token
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/homeschool-portal/{PORTAL_TOKEN}")
        
        # Should either return 200 (valid token) or 404 (expired/invalid)
        # But NOT 401 (auth required)
        assert response.status_code != 401, "Portal endpoint should not require authentication"
        print(f"✓ Portal endpoint accessible without auth (status: {response.status_code})")
    
    def test_get_portal_data_invalid_token(self):
        """Test getting portal data with invalid token returns 404"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/homeschool-portal/invalid_token_12345")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid token returns 404")


class TestReportCardsStudentFetch:
    """Tests for GET /api/classes/{class_id}/students - Report Cards student selection"""
    
    def test_get_students_for_class(self, auth_session):
        """Test fetching students for a specific class"""
        # First get classes
        classes_response = auth_session.get(f"{BASE_URL}/api/classes")
        assert classes_response.status_code == 200
        
        classes = classes_response.json()
        if not classes:
            pytest.skip("No classes available for testing")
        
        class_id = classes[0]["class_id"]
        print(f"Testing with class: {classes[0].get('name', class_id)}")
        
        # Get students for this class
        response = auth_session.get(f"{BASE_URL}/api/classes/{class_id}/students")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        students = response.json()
        assert isinstance(students, list), "Response should be a list"
        
        print(f"✓ Found {len(students)} students in class")
        
        if students:
            student = students[0]
            assert "student_id" in student, "Student should have 'student_id'"
            assert "first_name" in student or "name" in student, "Student should have name"
            print(f"✓ First student: {student.get('first_name', '')} {student.get('last_name', '')}")
    
    def test_get_students_invalid_class(self, auth_session):
        """Test fetching students for non-existent class returns 404"""
        response = auth_session.get(f"{BASE_URL}/api/classes/invalid_class_id/students")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid class returns 404")
    
    def test_get_students_requires_auth(self):
        """Test that fetching students requires authentication"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/classes/some_class_id/students")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Endpoint requires authentication")


class TestReportCardGeneration:
    """Tests for GET /api/report-cards/generate"""
    
    def test_generate_report_card(self, auth_session):
        """Test generating a report card for a student"""
        # First get a class and student
        classes_response = auth_session.get(f"{BASE_URL}/api/classes")
        assert classes_response.status_code == 200
        
        classes = classes_response.json()
        if not classes:
            pytest.skip("No classes available for testing")
        
        class_id = classes[0]["class_id"]
        
        # Get students
        students_response = auth_session.get(f"{BASE_URL}/api/classes/{class_id}/students")
        assert students_response.status_code == 200
        
        students = students_response.json()
        if not students:
            pytest.skip("No students available for testing")
        
        student_id = students[0]["student_id"]
        
        # Generate report card
        response = auth_session.get(
            f"{BASE_URL}/api/report-cards/generate",
            params={"student_id": student_id, "class_id": class_id}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify structure
        assert "student" in data, "Response should contain 'student'"
        assert "class" in data, "Response should contain 'class'"
        assert "grades" in data, "Response should contain 'grades'"
        assert "gpa" in data, "Response should contain 'gpa'"
        assert "attendance" in data, "Response should contain 'attendance'"
        
        print(f"✓ Report card generated for student: {data['student'].get('name', student_id)}")
        print(f"✓ GPA: {data['gpa']}")
        print(f"✓ Grades count: {len(data['grades'])}")
    
    def test_generate_report_card_invalid_student(self, auth_session):
        """Test generating report card for invalid student returns 404"""
        classes_response = auth_session.get(f"{BASE_URL}/api/classes")
        classes = classes_response.json()
        if not classes:
            pytest.skip("No classes available")
        
        response = auth_session.get(
            f"{BASE_URL}/api/report-cards/generate",
            params={"student_id": "invalid_student", "class_id": classes[0]["class_id"]}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid student returns 404")


class TestTemplateOfWeek:
    """Tests for GET /api/ai/templates/weekly - Template of the Week"""
    
    def test_get_template_of_week(self):
        """Test getting the template of the week"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/ai/templates/weekly")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify structure
        assert "template_id" in data, "Response should contain 'template_id'"
        assert "name" in data, "Response should contain 'name'"
        assert "description" in data, "Response should contain 'description'"
        assert "subject" in data, "Response should contain 'subject'"
        assert "grade_level" in data, "Response should contain 'grade_level'"
        assert "days_count" in data, "Response should contain 'days_count'"
        assert "is_starter" in data, "Response should contain 'is_starter'"
        
        # Verify Spanish translations
        assert "name_es" in data, "Response should contain 'name_es'"
        assert "description_es" in data, "Response should contain 'description_es'"
        
        # Verify customization tips
        assert "customization_tips" in data, "Response should contain 'customization_tips'"
        
        print(f"✓ Template of the week: {data['name']}")
        print(f"✓ Spanish name: {data['name_es']}")
        print(f"✓ Subject: {data['subject']}")
        print(f"✓ Grade level: {data['grade_level']}")
        print(f"✓ Days count: {data['days_count']}")
        print(f"✓ Is starter: {data['is_starter']}")
        print(f"✓ Week number: {data.get('week_number', 'N/A')}")
    
    def test_template_of_week_no_auth_required(self):
        """Test that template of week endpoint doesn't require authentication"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/ai/templates/weekly")
        
        # Should return 200, not 401
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Template of week endpoint accessible without auth")


class TestStarterTemplates:
    """Tests for GET /api/ai/templates/starters/{template_id}"""
    
    def test_get_starter_template(self):
        """Test getting a specific starter template"""
        session = requests.Session()
        
        # First get template of week to get a valid template_id
        weekly_response = session.get(f"{BASE_URL}/api/ai/templates/weekly")
        assert weekly_response.status_code == 200
        
        template_id = weekly_response.json()["template_id"]
        
        # Get full template
        response = session.get(f"{BASE_URL}/api/ai/templates/starters/{template_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify full template has days content
        assert "days" in data, "Full template should contain 'days'"
        assert isinstance(data["days"], dict), "Days should be a dictionary"
        
        print(f"✓ Full template retrieved: {data['name']}")
        print(f"✓ Days content available: {len(data['days'])} days")
    
    def test_get_invalid_starter_template(self):
        """Test getting non-existent starter template returns 404"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/ai/templates/starters/invalid_template_id")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid template returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
