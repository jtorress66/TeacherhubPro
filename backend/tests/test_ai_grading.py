"""
AI Grading System Backend Tests
Tests for AI Assignment Generation and Grading endpoints
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://teacherhub-ux-fix.preview.emergentagent.com').rstrip('/')

# Test data - will be populated during tests
TEST_SESSION_TOKEN = "test_session_aigrading_1772730560226"
TEST_USER_ID = "test-user-aigrading-1772730560226"
TEST_CLASS_ID = "class_aitest_1772730560226"
TEST_CATEGORY_ID = "cat_aitest_1772730560226"


class TestAIGradingStats:
    """Test AI Grading Stats endpoint"""
    
    def test_get_stats_authenticated(self):
        """Test getting AI grading stats with authentication"""
        response = requests.get(
            f"{BASE_URL}/api/ai-grading/stats",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        # Should return 200 with stats
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total_assignments" in data
        assert "total_submissions" in data
        assert "pending_grading" in data
        assert "pending_review" in data
        assert "graded" in data
        print(f"✓ Stats endpoint working: {data}")
    
    def test_get_stats_unauthenticated(self):
        """Test getting stats without authentication - should fail"""
        response = requests.get(f"{BASE_URL}/api/ai-grading/stats")
        
        # Should return 401 Unauthorized
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Stats endpoint correctly requires authentication")


class TestAIAssignmentGeneration:
    """Test AI Assignment Generation endpoint"""
    
    def test_generate_assignment_authenticated(self):
        """Test generating an AI assignment"""
        payload = {
            "topic": "Fractions",
            "subject": "Math",
            "grade_level": "5",
            "question_types": ["multiple_choice", "short_answer"],
            "num_questions": 3,
            "difficulty": "medium",
            "language": "en"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-grading/generate-assignment",
            json=payload,
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"},
            timeout=60  # AI generation can take time
        )
        
        # Should return 200 with generated assignment
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "title" in data
        assert "questions" in data
        assert "ai_generated" in data
        assert data["ai_generated"] == True
        print(f"✓ AI Assignment generated: {data.get('title')}")
        print(f"  Questions count: {len(data.get('questions', []))}")
        
        return data
    
    def test_generate_assignment_missing_topic(self):
        """Test generating assignment without required topic"""
        payload = {
            "subject": "Math",
            "grade_level": "5",
            "question_types": ["multiple_choice"],
            "num_questions": 3
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-grading/generate-assignment",
            json=payload,
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        # Should return 422 validation error
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("✓ Validation correctly requires topic field")


class TestAIAssignmentsCRUD:
    """Test AI Assignments CRUD operations"""
    
    def test_get_assignments_empty(self):
        """Test getting assignments list (may be empty)"""
        response = requests.get(
            f"{BASE_URL}/api/ai-grading/assignments",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Assignments list retrieved: {len(data)} assignments")
    
    def test_get_assignments_by_class(self):
        """Test getting assignments filtered by class"""
        response = requests.get(
            f"{BASE_URL}/api/ai-grading/assignments?class_id={TEST_CLASS_ID}",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Assignments by class retrieved: {len(data)} assignments")
    
    def test_create_assignment(self):
        """Test creating an AI assignment"""
        payload = {
            "class_id": TEST_CLASS_ID,
            "category_id": TEST_CATEGORY_ID,
            "title": "Test AI Assignment - Fractions",
            "description": "Test assignment for fractions",
            "instructions": "Answer all questions carefully",
            "questions": [
                {
                    "question_id": "q1",
                    "question_type": "multiple_choice",
                    "question_text": "What is 1/2 + 1/4?",
                    "points": 10,
                    "options": [
                        {"text": "3/4", "is_correct": True},
                        {"text": "2/6", "is_correct": False},
                        {"text": "1/6", "is_correct": False},
                        {"text": "2/4", "is_correct": False}
                    ]
                },
                {
                    "question_id": "q2",
                    "question_type": "short_answer",
                    "question_text": "What is 3/4 as a decimal?",
                    "points": 10,
                    "correct_answer": "0.75"
                }
            ],
            "points": 20,
            "grade_level": "5",
            "grading_mode": "ai_suggest",
            "ai_generated": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-grading/assignments",
            json=payload,
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "assignment_id" in data
        assert "public_token" in data
        assert data["title"] == "Test AI Assignment - Fractions"
        print(f"✓ Assignment created: {data['assignment_id']}")
        print(f"  Public token: {data['public_token']}")
        
        return data
    
    def test_get_assignment_by_id(self):
        """Test getting a specific assignment"""
        # First create an assignment
        create_response = self.test_create_assignment()
        assignment_id = create_response["assignment_id"]
        
        # Then get it
        response = requests.get(
            f"{BASE_URL}/api/ai-grading/assignments/{assignment_id}",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["assignment_id"] == assignment_id
        print(f"✓ Assignment retrieved by ID: {assignment_id}")
    
    def test_delete_assignment(self):
        """Test deleting an assignment"""
        # First create an assignment
        create_response = self.test_create_assignment()
        assignment_id = create_response["assignment_id"]
        
        # Then delete it
        response = requests.delete(
            f"{BASE_URL}/api/ai-grading/assignments/{assignment_id}",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Assignment deleted: {assignment_id}")


class TestStudentAssignmentPublic:
    """Test public student assignment endpoints (no auth required)"""
    
    def test_get_student_assignment_invalid_token(self):
        """Test getting assignment with invalid token"""
        response = requests.get(f"{BASE_URL}/api/ai-grading/student/invalid_token_123")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid token correctly returns 404")
    
    def test_student_assignment_flow(self):
        """Test full student assignment flow: create -> get -> submit"""
        # 1. Create an assignment
        create_payload = {
            "class_id": TEST_CLASS_ID,
            "category_id": TEST_CATEGORY_ID,
            "title": "Student Test Assignment",
            "description": "Test for student submission",
            "instructions": "Answer all questions",
            "questions": [
                {
                    "question_id": "q1",
                    "question_type": "multiple_choice",
                    "question_text": "What is 2 + 2?",
                    "points": 10,
                    "options": [
                        {"text": "3", "is_correct": False},
                        {"text": "4", "is_correct": True},
                        {"text": "5", "is_correct": False}
                    ]
                }
            ],
            "points": 10,
            "grade_level": "3",
            "grading_mode": "ai_suggest",
            "ai_generated": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/ai-grading/assignments",
            json=create_payload,
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        assignment_data = create_response.json()
        public_token = assignment_data["public_token"]
        print(f"✓ Assignment created with token: {public_token}")
        
        # 2. Get assignment as student (no auth)
        student_response = requests.get(f"{BASE_URL}/api/ai-grading/student/{public_token}")
        
        assert student_response.status_code == 200, f"Student get failed: {student_response.text}"
        student_data = student_response.json()
        
        assert "title" in student_data
        assert "questions" in student_data
        # Verify correct answers are NOT exposed to students
        for q in student_data["questions"]:
            if q["question_type"] == "multiple_choice":
                for opt in q.get("options", []):
                    assert "is_correct" not in opt, "Correct answer should not be exposed to students!"
        print("✓ Student can access assignment without auth")
        print("✓ Correct answers are hidden from students")
        
        # 3. Submit assignment as student (no auth)
        submit_payload = {
            "student_name": "Test Student",
            "student_email": f"student_{int(time.time())}@test.com",
            "answers": {
                "q1": "4"
            }
        }
        
        submit_response = requests.post(
            f"{BASE_URL}/api/ai-grading/student/{public_token}/submit",
            json=submit_payload
        )
        
        assert submit_response.status_code == 200, f"Submit failed: {submit_response.text}"
        submit_data = submit_response.json()
        assert "submission_id" in submit_data
        print(f"✓ Student submission successful: {submit_data['submission_id']}")
        
        return submit_data


class TestSubmissionsAndGrading:
    """Test submissions and AI grading endpoints"""
    
    def test_get_submissions(self):
        """Test getting submissions list"""
        response = requests.get(
            f"{BASE_URL}/api/ai-grading/submissions",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Submissions list retrieved: {len(data)} submissions")


class TestHealthAndBasicEndpoints:
    """Test basic health and connectivity"""
    
    def test_health_endpoint(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Health endpoint working")
    
    def test_auth_me_with_token(self):
        """Test auth/me endpoint with valid token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        print(f"✓ Auth working for user: {data.get('name')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
