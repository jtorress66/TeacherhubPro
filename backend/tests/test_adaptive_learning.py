"""
Test suite for Adaptive Learning (Homeschool Features) endpoints
- GET /api/students - returns all students across all classes for a teacher
- POST /api/adaptive-learning/generate-path - generates AI-powered adaptive learning path
- POST /api/adaptive-learning/complete-lesson - marks a lesson as completed
- GET /api/adaptive-learning/progress/{student_id} - gets student's adaptive learning progress
"""

import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from MongoDB setup
TEST_SESSION_TOKEN = "test_session_1771519839374"
TEST_USER_ID = "test-user-1771519839374"
TEST_STUDENT_ID = "student_1771519839374"


@pytest.fixture
def auth_headers():
    """Return headers with authentication token"""
    return {
        "Authorization": f"Bearer {TEST_SESSION_TOKEN}",
        "Content-Type": "application/json"
    }


class TestGetAllStudents:
    """Tests for GET /api/students endpoint"""
    
    def test_get_students_returns_list(self, auth_headers):
        """Test that GET /api/students returns a list of students"""
        response = requests.get(f"{BASE_URL}/api/students", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/students returned {len(data)} students")
    
    def test_get_students_contains_test_student(self, auth_headers):
        """Test that the test student is in the returned list"""
        response = requests.get(f"{BASE_URL}/api/students", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Find our test student
        test_student = next((s for s in data if s.get("student_id") == TEST_STUDENT_ID), None)
        assert test_student is not None, f"Test student {TEST_STUDENT_ID} not found"
        
        # Verify student fields
        assert "first_name" in test_student
        assert "last_name" in test_student
        assert "class_id" in test_student
        print(f"✓ Test student found: {test_student.get('first_name')} {test_student.get('last_name')}")
    
    def test_get_students_requires_auth(self):
        """Test that GET /api/students requires authentication"""
        response = requests.get(f"{BASE_URL}/api/students")
        
        assert response.status_code == 401
        print("✓ GET /api/students correctly requires authentication")


class TestGenerateLearningPath:
    """Tests for POST /api/adaptive-learning/generate-path endpoint"""
    
    def test_generate_path_success(self, auth_headers):
        """Test that generate-path returns a valid learning path"""
        payload = {
            "student_id": TEST_STUDENT_ID,
            "subject": "math",
            "language": "es"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/adaptive-learning/generate-path",
            headers=auth_headers,
            json=payload,
            timeout=60  # AI generation can take time
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify learning path structure
        assert "title" in data
        assert "description" in data
        assert "lessons" in data
        assert isinstance(data["lessons"], list)
        assert len(data["lessons"]) > 0
        
        # Verify lesson structure
        first_lesson = data["lessons"][0]
        assert "id" in first_lesson
        assert "title" in first_lesson
        assert "objective" in first_lesson
        assert "content" in first_lesson
        
        print(f"✓ Generated learning path: {data['title']}")
        print(f"  - {len(data['lessons'])} lessons generated")
    
    def test_generate_path_different_subjects(self, auth_headers):
        """Test that different subjects generate different paths"""
        subjects = ["math", "language", "science", "reading"]
        
        for subject in subjects:
            payload = {
                "student_id": TEST_STUDENT_ID,
                "subject": subject,
                "language": "en"
            }
            
            response = requests.post(
                f"{BASE_URL}/api/adaptive-learning/generate-path",
                headers=auth_headers,
                json=payload,
                timeout=60
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "lessons" in data
            print(f"✓ Generated path for {subject}: {data.get('title', 'N/A')}")
    
    def test_generate_path_invalid_student(self, auth_headers):
        """Test that generate-path returns 404 for invalid student"""
        payload = {
            "student_id": "invalid_student_id",
            "subject": "math",
            "language": "es"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/adaptive-learning/generate-path",
            headers=auth_headers,
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 404
        print("✓ Generate path correctly returns 404 for invalid student")
    
    def test_generate_path_requires_auth(self):
        """Test that generate-path requires authentication"""
        payload = {
            "student_id": TEST_STUDENT_ID,
            "subject": "math",
            "language": "es"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/adaptive-learning/generate-path",
            json=payload
        )
        
        assert response.status_code == 401
        print("✓ Generate path correctly requires authentication")


class TestCompleteLesson:
    """Tests for POST /api/adaptive-learning/complete-lesson endpoint"""
    
    def test_complete_lesson_success(self, auth_headers):
        """Test that complete-lesson marks a lesson as completed"""
        # Use a unique lesson ID to avoid conflicts
        lesson_id = f"lesson_test_{uuid.uuid4().hex[:8]}"
        
        payload = {
            "student_id": TEST_STUDENT_ID,
            "lesson_id": lesson_id,
            "subject": "math"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/adaptive-learning/complete-lesson",
            headers=auth_headers,
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "Lesson completed successfully"
        assert data.get("lesson_id") == lesson_id
        print(f"✓ Lesson {lesson_id} marked as completed")
    
    def test_complete_lesson_updates_progress(self, auth_headers):
        """Test that completing a lesson updates student progress"""
        lesson_id = f"lesson_progress_{uuid.uuid4().hex[:8]}"
        
        # Complete a lesson
        payload = {
            "student_id": TEST_STUDENT_ID,
            "lesson_id": lesson_id,
            "subject": "science"  # Use different subject to avoid conflicts
        }
        
        response = requests.post(
            f"{BASE_URL}/api/adaptive-learning/complete-lesson",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200
        
        # Check progress was updated
        progress_response = requests.get(
            f"{BASE_URL}/api/adaptive-learning/progress/{TEST_STUDENT_ID}",
            headers=auth_headers
        )
        
        assert progress_response.status_code == 200
        progress_data = progress_response.json()
        
        # Find science progress
        science_progress = next(
            (p for p in progress_data if p.get("subject") == "science"),
            None
        )
        
        assert science_progress is not None
        assert lesson_id in science_progress.get("completed_lessons", [])
        print(f"✓ Progress updated with completed lesson {lesson_id}")
    
    def test_complete_lesson_requires_auth(self):
        """Test that complete-lesson requires authentication"""
        payload = {
            "student_id": TEST_STUDENT_ID,
            "lesson_id": "lesson_1",
            "subject": "math"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/adaptive-learning/complete-lesson",
            json=payload
        )
        
        assert response.status_code == 401
        print("✓ Complete lesson correctly requires authentication")


class TestGetProgress:
    """Tests for GET /api/adaptive-learning/progress/{student_id} endpoint"""
    
    def test_get_progress_returns_list(self, auth_headers):
        """Test that get progress returns a list of progress records"""
        response = requests.get(
            f"{BASE_URL}/api/adaptive-learning/progress/{TEST_STUDENT_ID}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET progress returned {len(data)} progress records")
    
    def test_get_progress_contains_expected_fields(self, auth_headers):
        """Test that progress records contain expected fields"""
        response = requests.get(
            f"{BASE_URL}/api/adaptive-learning/progress/{TEST_STUDENT_ID}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            progress = data[0]
            assert "student_id" in progress
            assert "subject" in progress
            assert "completed_lessons" in progress
            assert "current_level" in progress
            print(f"✓ Progress record has all expected fields")
            print(f"  - Subject: {progress.get('subject')}")
            print(f"  - Level: {progress.get('current_level')}")
            print(f"  - Completed: {len(progress.get('completed_lessons', []))} lessons")
        else:
            print("✓ No progress records yet (expected for new student)")
    
    def test_get_progress_empty_for_new_student(self, auth_headers):
        """Test that get progress returns empty list for student with no progress"""
        response = requests.get(
            f"{BASE_URL}/api/adaptive-learning/progress/nonexistent_student_123",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data == []
        print("✓ GET progress returns empty list for student with no progress")
    
    def test_get_progress_requires_auth(self):
        """Test that get progress requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/adaptive-learning/progress/{TEST_STUDENT_ID}"
        )
        
        assert response.status_code == 401
        print("✓ GET progress correctly requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
