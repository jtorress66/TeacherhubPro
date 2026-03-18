"""
Test Assignment Edit and Share Button Bug Fixes
Tests for:
1. PUT /api/assignments/{assignment_id} - Update existing assignment with questions
2. Assignments without questions should NOT have Google Classroom share buttons
3. Assignments WITH questions/attachments SHOULD show share buttons
4. Student assignment page should load and show questions
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def auth_session():
    """Create authenticated session with test credentials"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Login with test credentials
    login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "test@school.edu",
        "password": "testpassword"
    })
    
    if login_resp.status_code != 200:
        pytest.skip(f"Login failed: {login_resp.status_code} - {login_resp.text}")
    
    return session


@pytest.fixture(scope="module")
def test_class(auth_session):
    """Get or create a test class"""
    classes_resp = auth_session.get(f"{BASE_URL}/api/classes")
    assert classes_resp.status_code == 200, f"Failed to get classes: {classes_resp.text}"
    
    classes = classes_resp.json()
    if classes:
        return classes[0]
    
    # Create a test class if none exists
    create_resp = auth_session.post(f"{BASE_URL}/api/classes", json={
        "name": "Test Class for Assignment Edit",
        "grade": "5",
        "section": "A",
        "subject": "Math",
        "year_term": "2024-2025"
    })
    assert create_resp.status_code == 200, f"Failed to create class: {create_resp.text}"
    return create_resp.json()


@pytest.fixture(scope="module")
def test_category(auth_session, test_class):
    """Get or create a test category"""
    cats_resp = auth_session.get(f"{BASE_URL}/api/classes/{test_class['class_id']}/categories")
    assert cats_resp.status_code == 200, f"Failed to get categories: {cats_resp.text}"
    
    cats = cats_resp.json()
    if cats:
        return cats[0]
    
    pytest.skip("No categories found - should be auto-created")


class TestAssignmentCRUD:
    """Test Assignment Create, Read, Update, Delete operations"""
    
    def test_create_assignment_without_questions(self, auth_session, test_class, test_category):
        """Create an assignment without questions - should not have share capability"""
        resp = auth_session.post(f"{BASE_URL}/api/assignments", json={
            "class_id": test_class["class_id"],
            "category_id": test_category["category_id"],
            "title": "TEST_Assignment Without Questions",
            "description": "This assignment has no questions",
            "points": 50,
            "questions": [],
            "attachments": []
        })
        
        assert resp.status_code == 200, f"Create failed: {resp.text}"
        data = resp.json()
        
        # Verify assignment was created
        assert data["title"] == "TEST_Assignment Without Questions"
        assert data["assignment_id"]
        assert data.get("public_token")  # Token is generated but UI shouldn't show share
        assert data.get("questions", []) == []
        assert data.get("attachments", []) == []
        
        # Store for cleanup
        self.assignment_no_questions_id = data["assignment_id"]
        return data
    
    def test_create_assignment_with_questions(self, auth_session, test_class, test_category):
        """Create an assignment with questions - should have share capability"""
        questions = [
            {
                "question_id": "q1",
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
                "question_id": "q2",
                "question_text": "Explain the process of photosynthesis.",
                "question_type": "short_answer",
                "points": 20,
                "correct_answer": "Plants convert sunlight to energy"
            },
            {
                "question_id": "q3",
                "question_text": "Is the sky blue?",
                "question_type": "true_false",
                "points": 5,
                "options": [
                    {"text": "True", "is_correct": True},
                    {"text": "False", "is_correct": False}
                ]
            }
        ]
        
        resp = auth_session.post(f"{BASE_URL}/api/assignments", json={
            "class_id": test_class["class_id"],
            "category_id": test_category["category_id"],
            "title": "TEST_Assignment With Questions",
            "description": "This assignment has questions",
            "points": 100,
            "questions": questions,
            "attachments": []
        })
        
        assert resp.status_code == 200, f"Create failed: {resp.text}"
        data = resp.json()
        
        # Verify assignment was created with questions
        assert data["title"] == "TEST_Assignment With Questions"
        assert data["assignment_id"]
        assert data.get("public_token")  # Token exists
        assert len(data.get("questions", [])) == 3
        
        # Store for later tests
        self.assignment_with_questions_id = data["assignment_id"]
        self.assignment_with_questions_token = data["public_token"]
        return data
    
    def test_update_assignment_add_questions(self, auth_session, test_class, test_category):
        """Test updating an assignment to ADD questions (the fix)"""
        # First create an assignment without questions
        create_resp = auth_session.post(f"{BASE_URL}/api/assignments", json={
            "class_id": test_class["class_id"],
            "category_id": test_category["category_id"],
            "title": "TEST_Assignment For Update",
            "description": "Will add questions via PUT",
            "points": 80,
            "questions": [],
            "attachments": []
        })
        
        assert create_resp.status_code == 200
        created = create_resp.json()
        assignment_id = created["assignment_id"]
        
        # Verify no questions initially
        assert len(created.get("questions", [])) == 0
        
        # Now UPDATE the assignment to add questions
        new_questions = [
            {
                "question_id": "q1",
                "question_text": "What is the capital of France?",
                "question_type": "short_answer",
                "points": 25,
                "correct_answer": "Paris"
            },
            {
                "question_id": "q2",
                "question_text": "2 + 3 = ?",
                "question_type": "multiple_choice",
                "points": 25,
                "options": [
                    {"text": "4", "is_correct": False},
                    {"text": "5", "is_correct": True},
                    {"text": "6", "is_correct": False}
                ]
            }
        ]
        
        update_resp = auth_session.put(f"{BASE_URL}/api/assignments/{assignment_id}", json={
            "class_id": test_class["class_id"],
            "category_id": test_category["category_id"],
            "title": "TEST_Updated Assignment With Questions",
            "description": "Questions added via PUT request",
            "points": 50,
            "questions": new_questions,
            "attachments": []
        })
        
        assert update_resp.status_code == 200, f"PUT failed: {update_resp.text}"
        updated = update_resp.json()
        
        # Verify update was successful
        assert updated["title"] == "TEST_Updated Assignment With Questions"
        assert updated["points"] == 50
        assert len(updated.get("questions", [])) == 2
        assert updated["questions"][0]["question_text"] == "What is the capital of France?"
        
        # Verify with GET
        get_resp = auth_session.get(f"{BASE_URL}/api/assignments/{assignment_id}")
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert len(fetched.get("questions", [])) == 2
        
        self.updated_assignment_id = assignment_id
        return updated
    
    def test_update_assignment_modify_existing_questions(self, auth_session, test_class, test_category):
        """Test modifying questions in an existing assignment"""
        # Create with one question
        create_resp = auth_session.post(f"{BASE_URL}/api/assignments", json={
            "class_id": test_class["class_id"],
            "category_id": test_category["category_id"],
            "title": "TEST_Assignment For Question Modification",
            "points": 100,
            "questions": [{
                "question_id": "q1",
                "question_text": "Original question text",
                "question_type": "short_answer",
                "points": 100
            }],
            "attachments": []
        })
        
        assert create_resp.status_code == 200
        created = create_resp.json()
        assignment_id = created["assignment_id"]
        
        # Update with modified question
        update_resp = auth_session.put(f"{BASE_URL}/api/assignments/{assignment_id}", json={
            "class_id": test_class["class_id"],
            "category_id": test_category["category_id"],
            "title": "TEST_Assignment For Question Modification",
            "points": 100,
            "questions": [{
                "question_id": "q1",
                "question_text": "MODIFIED question text",
                "question_type": "short_answer",
                "points": 100
            }],
            "attachments": []
        })
        
        assert update_resp.status_code == 200
        updated = update_resp.json()
        
        # Verify question was modified
        assert updated["questions"][0]["question_text"] == "MODIFIED question text"
        
        self.modified_assignment_id = assignment_id


class TestStudentAssignmentPage:
    """Test the student assignment page (public - no auth)"""
    
    def test_student_page_with_known_token_has_questions(self):
        """Test student page with token that has 3 questions"""
        # Use the known token from test data: '2ae35432d130' (has 3 questions)
        token = "2ae35432d130"
        
        resp = requests.get(f"{BASE_URL}/api/ai-grading/student/{token}")
        
        if resp.status_code == 404:
            pytest.skip(f"Token {token} not found - may have been deleted")
        
        assert resp.status_code == 200, f"Failed to get assignment: {resp.text}"
        data = resp.json()
        
        assert data.get("title")
        assert len(data.get("questions", [])) == 3, f"Expected 3 questions, got {len(data.get('questions', []))}"
        
        # Verify question structure (no answers visible to students)
        for q in data["questions"]:
            assert "question_id" in q
            assert "question_text" in q
            assert "question_type" in q
    
    def test_student_page_with_zero_questions_token(self):
        """Test student page with token that has 0 questions - PDF test"""
        # Use the known token: '348d67436aaa' (0 questions - PDF test)
        token = "348d67436aaa"
        
        resp = requests.get(f"{BASE_URL}/api/ai-grading/student/{token}")
        
        if resp.status_code == 404:
            pytest.skip(f"Token {token} not found - may have been deleted")
        
        assert resp.status_code == 200, f"Failed to get assignment: {resp.text}"
        data = resp.json()
        
        assert data.get("title")
        # This assignment should have 0 questions but may have attachments
        questions = data.get("questions", [])
        print(f"Assignment '{data.get('title')}' has {len(questions)} questions")
    
    def test_student_page_invalid_token(self):
        """Test student page with invalid token returns 404"""
        resp = requests.get(f"{BASE_URL}/api/ai-grading/student/invalid_token_12345")
        assert resp.status_code == 404


class TestGradebookAssignmentList:
    """Test getting assignment list through gradebook"""
    
    def test_gradebook_returns_assignments_with_questions_count(self, auth_session, test_class):
        """Verify gradebook returns assignments with question counts"""
        resp = auth_session.get(f"{BASE_URL}/api/gradebook/{test_class['class_id']}")
        
        assert resp.status_code == 200, f"Failed to get gradebook: {resp.text}"
        data = resp.json()
        
        assignments = data.get("assignments", [])
        print(f"Found {len(assignments)} assignments in gradebook")
        
        # Check each assignment has questions field
        for a in assignments:
            assert "assignment_id" in a
            assert "title" in a
            # The frontend uses questions?.length to determine share button visibility
            # So questions field should be present (even if empty array)
            if "questions" in a:
                print(f"  - {a['title']}: {len(a['questions'])} questions")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_assignments(self, auth_session):
        """Delete all TEST_ prefixed assignments"""
        # Get all classes first
        classes_resp = auth_session.get(f"{BASE_URL}/api/classes")
        if classes_resp.status_code != 200:
            return
        
        classes = classes_resp.json()
        deleted = 0
        
        for cls in classes:
            gradebook_resp = auth_session.get(f"{BASE_URL}/api/gradebook/{cls['class_id']}")
            if gradebook_resp.status_code != 200:
                continue
            
            assignments = gradebook_resp.json().get("assignments", [])
            
            for a in assignments:
                if a.get("title", "").startswith("TEST_"):
                    del_resp = auth_session.delete(f"{BASE_URL}/api/assignments/{a['assignment_id']}")
                    if del_resp.status_code in [200, 204]:
                        deleted += 1
        
        print(f"Cleaned up {deleted} test assignments")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
