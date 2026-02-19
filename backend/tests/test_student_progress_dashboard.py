"""
Test suite for Student Progress Dashboard feature
Tests the GET /api/adaptive-learning/dashboard/{student_id} endpoint
and related functionality for parents to view their child's adaptive learning progress.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from previous iteration
TEST_EMAIL = "test@school.edu"
TEST_PASSWORD = "testpassword"
TEST_STUDENT_ID = "student_40da2916"  # Maria Garcia - has 1 completed lesson in math


class TestStudentProgressDashboard:
    """Tests for the Student Progress Dashboard endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get auth token
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code} - {login_response.text}")
        
        # Extract session token from cookies
        self.session_token = login_response.cookies.get("session_token")
        if self.session_token:
            self.session.headers.update({"Authorization": f"Bearer {self.session_token}"})
        
        yield
        
        # Cleanup
        self.session.close()
    
    def test_dashboard_endpoint_returns_200(self):
        """Test that dashboard endpoint returns 200 for valid student"""
        response = self.session.get(
            f"{BASE_URL}/api/adaptive-learning/dashboard/{TEST_STUDENT_ID}"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "student" in data, "Response should contain 'student' field"
        assert "subjects" in data, "Response should contain 'subjects' field"
        assert "total_lessons_completed" in data, "Response should contain 'total_lessons_completed'"
        assert "total_time_spent" in data, "Response should contain 'total_time_spent'"
        assert "current_streak" in data, "Response should contain 'current_streak'"
        assert "achievements" in data, "Response should contain 'achievements'"
    
    def test_dashboard_returns_student_info(self):
        """Test that dashboard returns correct student information"""
        response = self.session.get(
            f"{BASE_URL}/api/adaptive-learning/dashboard/{TEST_STUDENT_ID}"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        student = data.get("student", {})
        assert student.get("student_id") == TEST_STUDENT_ID
        assert student.get("name"), "Student should have a name"
    
    def test_dashboard_returns_progress_data(self):
        """Test that dashboard returns progress data with expected structure"""
        response = self.session.get(
            f"{BASE_URL}/api/adaptive-learning/dashboard/{TEST_STUDENT_ID}"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check numeric fields
        assert isinstance(data.get("total_lessons_completed"), int)
        assert isinstance(data.get("total_time_spent"), int)
        assert isinstance(data.get("current_streak"), int)
        
        # Check lists
        assert isinstance(data.get("subjects"), list)
        assert isinstance(data.get("achievements"), list)
    
    def test_dashboard_subjects_structure(self):
        """Test that subjects array has correct structure"""
        response = self.session.get(
            f"{BASE_URL}/api/adaptive-learning/dashboard/{TEST_STUDENT_ID}"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        subjects = data.get("subjects", [])
        
        # If student has progress, check structure
        if subjects:
            for subject in subjects:
                assert "subject" in subject, "Subject should have 'subject' field"
                assert "current_level" in subject, "Subject should have 'current_level'"
                assert "completed_lessons" in subject, "Subject should have 'completed_lessons'"
                assert "total_lessons" in subject, "Subject should have 'total_lessons'"
                assert "time_spent" in subject, "Subject should have 'time_spent'"
    
    def test_dashboard_achievements_structure(self):
        """Test that achievements array has correct structure"""
        response = self.session.get(
            f"{BASE_URL}/api/adaptive-learning/dashboard/{TEST_STUDENT_ID}"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        achievements = data.get("achievements", [])
        
        # If student has achievements, check structure
        if achievements:
            for achievement in achievements:
                assert "title" in achievement, "Achievement should have 'title'"
                assert "earned_at" in achievement, "Achievement should have 'earned_at'"
    
    def test_dashboard_returns_404_for_invalid_student(self):
        """Test that dashboard returns 404 for non-existent student"""
        response = self.session.get(
            f"{BASE_URL}/api/adaptive-learning/dashboard/invalid_student_id_12345"
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_dashboard_requires_authentication(self):
        """Test that dashboard requires authentication"""
        # Create new session without auth
        unauthenticated_session = requests.Session()
        unauthenticated_session.headers.update({"Content-Type": "application/json"})
        
        response = unauthenticated_session.get(
            f"{BASE_URL}/api/adaptive-learning/dashboard/{TEST_STUDENT_ID}"
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        unauthenticated_session.close()
    
    def test_dashboard_time_calculation(self):
        """Test that time spent is calculated correctly (15 min per lesson)"""
        response = self.session.get(
            f"{BASE_URL}/api/adaptive-learning/dashboard/{TEST_STUDENT_ID}"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        total_lessons = data.get("total_lessons_completed", 0)
        total_time = data.get("total_time_spent", 0)
        
        # Time should be 15 min per lesson
        expected_time = total_lessons * 15
        assert total_time == expected_time, f"Expected {expected_time} min, got {total_time} min"
    
    def test_dashboard_recent_activity(self):
        """Test that recent activity is returned if available"""
        response = self.session.get(
            f"{BASE_URL}/api/adaptive-learning/dashboard/{TEST_STUDENT_ID}"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # recent_activity should be a list
        recent_activity = data.get("recent_activity", [])
        assert isinstance(recent_activity, list)
        
        # If there's activity, check structure
        if recent_activity:
            for activity in recent_activity:
                assert "lesson_title" in activity
                assert "subject" in activity


class TestStudentsEndpoint:
    """Tests for the GET /api/students endpoint used by the dashboard"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get auth token
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code}")
        
        self.session_token = login_response.cookies.get("session_token")
        if self.session_token:
            self.session.headers.update({"Authorization": f"Bearer {self.session_token}"})
        
        yield
        self.session.close()
    
    def test_students_endpoint_returns_list(self):
        """Test that /api/students returns a list of students"""
        response = self.session.get(f"{BASE_URL}/api/students")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_students_contains_test_student(self):
        """Test that students list contains our test student"""
        response = self.session.get(f"{BASE_URL}/api/students")
        
        assert response.status_code == 200
        students = response.json()
        
        # Find test student
        test_student = next(
            (s for s in students if s.get("student_id") == TEST_STUDENT_ID),
            None
        )
        
        assert test_student is not None, f"Test student {TEST_STUDENT_ID} not found"
        assert test_student.get("first_name") == "Maria" or "Maria" in test_student.get("name", "")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
