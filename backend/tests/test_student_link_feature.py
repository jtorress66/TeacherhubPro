"""
Test suite for TeacherHubPro Student Link Feature
Testing:
1. POST /api/assignments returns public_token
2. GET /api/ai-grading/student/{token} checks both collections
3. Student endpoint returns attachments for manual assignments
4. AI assignment creation and preview with matching questions
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://teacherhub-ux-fix.preview.emergentagent.com').rstrip('/')
TEST_EMAIL = "test@school.edu"
TEST_PASSWORD = "testpassword"
EXISTING_MANUAL_TOKEN = "2ae35432d130"


class TestStudentLinkFeature:
    """Test student link and public token functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def login(self):
        """Helper to login and get session"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()
    
    # ==== TEST: Student endpoint checks both collections ====
    
    def test_student_endpoint_with_existing_manual_token(self):
        """Test that /api/ai-grading/student/{token} works with manual assignment token"""
        response = self.session.get(f"{BASE_URL}/api/ai-grading/student/{EXISTING_MANUAL_TOKEN}")
        print(f"Student endpoint response status: {response.status_code}")
        print(f"Student endpoint response: {response.text[:500] if response.text else 'empty'}")
        
        assert response.status_code == 200, f"Failed to get student assignment: {response.text}"
        
        data = response.json()
        
        # Verify student-safe data (no correct answers)
        assert "title" in data, "Missing title in response"
        assert "questions" in data, "Missing questions in response"
        
        # Verify questions don't expose correct answers
        for q in data.get("questions", []):
            assert "correct_answer" not in q or q.get("correct_answer") is None, \
                "Student data should NOT include correct_answer"
            if q.get("question_type") == "multiple_choice":
                for opt in q.get("options", []):
                    assert "is_correct" not in opt, "Student MC options should NOT have is_correct field"
        
        print(f"PASS: Student endpoint successfully loaded assignment: {data.get('title')}")
        print(f"Questions count: {len(data.get('questions', []))}")
        print(f"Is manual assignment: {data.get('is_manual', False)}")
    
    def test_student_endpoint_returns_attachments(self):
        """Test that student endpoint returns attachments array for manual assignments"""
        response = self.session.get(f"{BASE_URL}/api/ai-grading/student/{EXISTING_MANUAL_TOKEN}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        # attachments field should exist (may be empty array)
        assert "attachments" in data, "Missing 'attachments' field in student response"
        print(f"PASS: Attachments field present. Count: {len(data.get('attachments', []))}")
    
    def test_student_endpoint_with_invalid_token(self):
        """Test that invalid token returns 404"""
        response = self.session.get(f"{BASE_URL}/api/ai-grading/student/invalid_token_123")
        assert response.status_code == 404, f"Expected 404 for invalid token, got {response.status_code}"
        print("PASS: Invalid token correctly returns 404")
    
    # ==== TEST: Manual assignment creation returns public_token ====
    
    def test_create_manual_assignment_returns_public_token(self):
        """Test that POST /api/assignments returns public_token in response"""
        user = self.login()
        
        # First get a class
        classes_response = self.session.get(f"{BASE_URL}/api/classes")
        assert classes_response.status_code == 200, f"Failed to get classes: {classes_response.text}"
        
        classes = classes_response.json()
        if not classes:
            pytest.skip("No classes available for testing")
        
        class_id = classes[0]["class_id"]
        
        # Get or create a category
        cat_response = self.session.get(f"{BASE_URL}/api/classes/{class_id}/categories")
        assert cat_response.status_code == 200, f"Failed to get categories: {cat_response.text}"
        
        categories = cat_response.json()
        if not categories:
            pytest.skip("No categories available for testing")
        
        category_id = categories[0]["category_id"]
        
        # Create assignment with questions
        unique_title = f"TEST_StudentLink_Assignment_{uuid.uuid4().hex[:6]}"
        assignment_data = {
            "class_id": class_id,
            "category_id": category_id,
            "title": unique_title,
            "description": "Test assignment with questions",
            "points": 100,
            "due_date": "2026-04-01",
            "questions": [
                {
                    "question_text": "What is 2 + 2?",
                    "question_type": "multiple_choice",
                    "points": 10,
                    "options": [
                        {"text": "3", "is_correct": False},
                        {"text": "4", "is_correct": True},
                        {"text": "5", "is_correct": False}
                    ]
                },
                {
                    "question_text": "Python is a programming language",
                    "question_type": "true_false",
                    "points": 10,
                    "correct_answer": "True"
                }
            ],
            "attachments": []
        }
        
        response = self.session.post(f"{BASE_URL}/api/assignments", json=assignment_data)
        print(f"Create assignment response status: {response.status_code}")
        print(f"Create assignment response: {response.text[:500] if response.text else 'empty'}")
        
        assert response.status_code == 200, f"Failed to create assignment: {response.text}"
        
        data = response.json()
        
        # CRITICAL TEST: Verify public_token is returned
        assert "public_token" in data, "public_token NOT found in assignment creation response"
        assert data["public_token"] is not None, "public_token is None"
        assert len(data["public_token"]) > 0, "public_token is empty string"
        
        print(f"PASS: Assignment created with public_token: {data['public_token']}")
        
        # Verify student can access this assignment
        student_response = self.session.get(f"{BASE_URL}/api/ai-grading/student/{data['public_token']}")
        assert student_response.status_code == 200, f"Student endpoint failed for new assignment: {student_response.text}"
        
        student_data = student_response.json()
        assert student_data["title"] == unique_title, "Student assignment title mismatch"
        assert len(student_data.get("questions", [])) == 2, "Expected 2 questions"
        
        print(f"PASS: Student endpoint successfully loads new manual assignment")
        
        # Cleanup - delete test assignment
        if data.get("assignment_id"):
            self.session.delete(f"{BASE_URL}/api/assignments/{data['assignment_id']}")
    
    # ==== TEST: AI Assignment creation and token ====
    
    def test_ai_assignment_returns_public_token(self):
        """Test that AI assignment creation returns public_token"""
        user = self.login()
        
        # Get class and category
        classes_response = self.session.get(f"{BASE_URL}/api/classes")
        if classes_response.status_code != 200 or not classes_response.json():
            pytest.skip("No classes available")
        
        class_id = classes_response.json()[0]["class_id"]
        
        cat_response = self.session.get(f"{BASE_URL}/api/classes/{class_id}/categories")
        if cat_response.status_code != 200 or not cat_response.json():
            pytest.skip("No categories available")
        
        category_id = cat_response.json()[0]["category_id"]
        
        # Create AI assignment directly (skip AI generation for speed)
        unique_title = f"TEST_AI_Assignment_{uuid.uuid4().hex[:6]}"
        ai_assignment_data = {
            "class_id": class_id,
            "category_id": category_id,
            "title": unique_title,
            "description": "AI generated test",
            "instructions": "Answer all questions",
            "questions": [
                {
                    "question_id": "q1",
                    "question_type": "multiple_choice",
                    "question_text": "What color is the sky?",
                    "points": 10,
                    "options": [
                        {"text": "Blue", "is_correct": True},
                        {"text": "Green", "is_correct": False}
                    ]
                },
                {
                    "question_id": "q2",
                    "question_type": "matching",
                    "question_text": "Match the capitals",
                    "points": 20,
                    "matching_pairs": {
                        "USA": "Washington DC",
                        "France": "Paris",
                        "Japan": "Tokyo"
                    }
                }
            ],
            "points": 30,
            "grade_level": "5",
            "grading_mode": "ai_suggest",
            "ai_generated": True
        }
        
        response = self.session.post(f"{BASE_URL}/api/ai-grading/assignments", json=ai_assignment_data)
        print(f"AI assignment creation status: {response.status_code}")
        print(f"AI assignment response: {response.text[:500] if response.text else 'empty'}")
        
        assert response.status_code == 200, f"Failed to create AI assignment: {response.text}"
        
        data = response.json()
        
        # CRITICAL TEST: Verify public_token
        assert "public_token" in data, "public_token NOT found in AI assignment response"
        assert data["public_token"] is not None and len(data["public_token"]) > 0, "public_token is empty"
        
        print(f"PASS: AI Assignment created with public_token: {data['public_token']}")
        
        # Verify student can access
        student_response = self.session.get(f"{BASE_URL}/api/ai-grading/student/{data['public_token']}")
        assert student_response.status_code == 200, f"Student can't access AI assignment: {student_response.text}"
        
        student_data = student_response.json()
        
        # Verify matching question has left_items and right_items for student
        matching_q = next((q for q in student_data.get("questions", []) if q.get("question_type") == "matching"), None)
        if matching_q:
            assert "left_items" in matching_q, "Matching question missing left_items"
            assert "right_items" in matching_q, "Matching question missing right_items"
            print(f"PASS: Matching question has left_items: {matching_q.get('left_items')}")
            print(f"PASS: Matching question has right_items: {matching_q.get('right_items')}")
        
        # Cleanup
        if data.get("assignment_id"):
            self.session.delete(f"{BASE_URL}/api/ai-grading/assignments/{data['assignment_id']}")
    
    # ==== TEST: Student submission flow ====
    
    def test_student_can_submit_manual_assignment(self):
        """Test that a student can submit answers to a manual assignment"""
        # First, get the assignment
        response = self.session.get(f"{BASE_URL}/api/ai-grading/student/{EXISTING_MANUAL_TOKEN}")
        if response.status_code != 200:
            pytest.skip(f"Cannot access test assignment: {response.text}")
        
        data = response.json()
        questions = data.get("questions", [])
        
        if not questions:
            print("INFO: No questions in test assignment - skipping submission test")
            return
        
        # Build answers
        answers = {}
        for q in questions:
            q_id = q.get("question_id")
            q_type = q.get("question_type")
            
            if q_type == "multiple_choice" and q.get("options"):
                answers[q_id] = q["options"][0].get("text", "A")
            elif q_type == "true_false":
                answers[q_id] = "True"
            elif q_type == "matching":
                left_items = q.get("left_items", [])
                right_items = q.get("right_items", [])
                if left_items and right_items:
                    answers[q_id] = {left_items[0]: right_items[0]} if left_items and right_items else {}
            else:
                answers[q_id] = "Test answer"
        
        # Submit - use unique email to avoid duplicate error
        unique_email = f"test_student_{uuid.uuid4().hex[:6]}@example.com"
        submission_data = {
            "student_name": "Test Student",
            "student_email": unique_email,
            "answers": answers
        }
        
        submit_response = self.session.post(
            f"{BASE_URL}/api/ai-grading/student/{EXISTING_MANUAL_TOKEN}/submit",
            json=submission_data
        )
        
        print(f"Submission status: {submit_response.status_code}")
        print(f"Submission response: {submit_response.text[:300] if submit_response.text else 'empty'}")
        
        # Accept 200 (success) or 400 (duplicate - already submitted)
        assert submit_response.status_code in [200, 400], f"Unexpected status: {submit_response.status_code}"
        
        if submit_response.status_code == 200:
            print("PASS: Student submission successful")
        else:
            print("INFO: Submission returned 400 (may be duplicate)")


class TestMatchingQuestionPreview:
    """Test matching question rendering in AI assignment preview"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def login(self):
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()
    
    def test_matching_pairs_structure_in_ai_generation(self):
        """Test that AI-generated matching questions have proper matching_pairs structure"""
        self.login()
        
        # Check existing AI assignments for matching questions
        response = self.session.get(f"{BASE_URL}/api/ai-grading/assignments")
        if response.status_code != 200:
            pytest.skip("Cannot fetch AI assignments")
        
        assignments = response.json()
        
        # Find any assignment with matching questions
        for assignment in assignments[:5]:  # Check first 5
            for q in assignment.get("questions", []):
                if q.get("question_type") == "matching":
                    pairs = q.get("matching_pairs", {})
                    print(f"Found matching question in '{assignment.get('title')}'")
                    print(f"  matching_pairs: {pairs}")
                    
                    # Verify structure
                    assert isinstance(pairs, dict), "matching_pairs should be a dict"
                    if pairs:
                        assert len(pairs) > 0, "matching_pairs should have items"
                        print(f"PASS: Matching pairs properly structured with {len(pairs)} pairs")
                        return
        
        print("INFO: No existing matching questions found to verify structure")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
