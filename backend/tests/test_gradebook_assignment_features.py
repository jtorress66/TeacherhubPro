"""
Test suite for TeacherHubPro - Enhanced Create Assignment features
Tests:
1. Assignment creation with questions and attachments
2. File upload endpoint (/upload-file)
3. File serving endpoint (/files/{filename})
4. Various question types (multiple choice, true/false, short answer, essay)
"""

import pytest
import requests
import os
import json
import io
from pathlib import Path

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://teacherhub-ux-fix.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "test@school.edu"
TEST_PASSWORD = "testpassword"


class TestAuthAndSetup:
    """Authentication and setup tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create a requests session for auth"""
        return requests.Session()
    
    def test_login_success(self, session):
        """Test login with test credentials"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        print(f"Login response: {response.status_code} - {response.text[:200] if response.text else 'empty'}")
        
        # If login fails due to user not existing, register first
        if response.status_code == 401:
            reg_response = session.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": "Test Teacher"
            })
            print(f"Registration response: {reg_response.status_code}")
            if reg_response.status_code in [200, 201]:
                # Try login again
                response = session.post(f"{BASE_URL}/api/auth/login", json={
                    "email": TEST_EMAIL,
                    "password": TEST_PASSWORD
                })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert data["email"] == TEST_EMAIL
        print(f"Login successful for user: {data['user_id']}")
        return data
    
    def test_get_current_user(self, session):
        """Verify authentication state"""
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        print(f"Current user: {data['email']}")


class TestFileUpload:
    """Test file upload functionality"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 401:
            # Register if user doesn't exist
            session.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": "Test Teacher"
            })
            session.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
        return session
    
    def test_upload_pdf_file(self, auth_session):
        """Test uploading a PDF file"""
        # Create a simple PDF-like content (not a real PDF but tests the endpoint)
        file_content = b"%PDF-1.4 Test PDF content for assignment upload"
        files = {'file': ('test_assignment.pdf', file_content, 'application/pdf')}
        
        response = auth_session.post(f"{BASE_URL}/api/upload-file", files=files)
        print(f"Upload PDF response: {response.status_code} - {response.text}")
        
        assert response.status_code == 200
        data = response.json()
        assert "file_id" in data
        assert "filename" in data
        assert "file_url" in data
        assert "file_size" in data
        assert data["filename"] == "test_assignment.pdf"
        assert data["file_url"].startswith("/api/files/")
        print(f"Uploaded file: {data['filename']} - {data['file_url']}")
        return data
    
    def test_upload_image_file(self, auth_session):
        """Test uploading an image file"""
        # Create minimal PNG header
        png_header = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100  # Minimal PNG-like content
        files = {'file': ('test_image.png', png_header, 'image/png')}
        
        response = auth_session.post(f"{BASE_URL}/api/upload-file", files=files)
        print(f"Upload PNG response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == "test_image.png"
        return data
    
    def test_upload_docx_file(self, auth_session):
        """Test uploading a Word document"""
        # Create minimal DOCX-like content
        docx_content = b'PK\x03\x04' + b'\x00' * 100  # ZIP-based format
        files = {'file': ('test_document.docx', docx_content, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
        
        response = auth_session.post(f"{BASE_URL}/api/upload-file", files=files)
        print(f"Upload DOCX response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == "test_document.docx"
    
    def test_upload_invalid_file_type(self, auth_session):
        """Test uploading an invalid file type should fail"""
        file_content = b'executable content'
        files = {'file': ('test_malware.exe', file_content, 'application/octet-stream')}
        
        response = auth_session.post(f"{BASE_URL}/api/upload-file", files=files)
        print(f"Invalid file upload response: {response.status_code}")
        
        # Should be rejected with 400
        assert response.status_code == 400
    
    def test_serve_uploaded_file(self, auth_session):
        """Test serving an uploaded file"""
        # First upload a file
        file_content = b"%PDF-1.4 Serve test content"
        files = {'file': ('serve_test.pdf', file_content, 'application/pdf')}
        
        upload_response = auth_session.post(f"{BASE_URL}/api/upload-file", files=files)
        assert upload_response.status_code == 200
        
        file_data = upload_response.json()
        file_url = file_data["file_url"]
        
        # Now try to fetch it
        serve_response = requests.get(f"{BASE_URL}{file_url}")
        print(f"Serve file response: {serve_response.status_code}")
        
        assert serve_response.status_code == 200
        assert len(serve_response.content) > 0
    
    def test_serve_nonexistent_file(self, auth_session):
        """Test serving a non-existent file returns 404 or 400 for invalid format"""
        response = requests.get(f"{BASE_URL}/api/files/file_nonexistent123.pdf")
        print(f"Non-existent file response: {response.status_code}")
        
        # 400 for invalid filename format, 404 for valid format but file doesn't exist
        assert response.status_code in [400, 404]


class TestAssignmentWithQuestions:
    """Test assignment creation with questions"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 401:
            session.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": "Test Teacher"
            })
            session.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
        return session
    
    @pytest.fixture(scope="class")
    def test_class(self, auth_session):
        """Get or create a test class"""
        # List existing classes
        response = auth_session.get(f"{BASE_URL}/api/classes")
        classes = response.json()
        
        if classes:
            return classes[0]
        
        # Create a new class if none exist
        create_response = auth_session.post(f"{BASE_URL}/api/classes", json={
            "name": "TEST_Assignment_Class",
            "grade": "5",
            "section": "A",
            "subject": "Math"
        })
        assert create_response.status_code in [200, 201]
        return create_response.json()
    
    @pytest.fixture(scope="class")
    def test_category(self, auth_session, test_class):
        """Get or create a test category"""
        class_id = test_class["class_id"]
        response = auth_session.get(f"{BASE_URL}/api/classes/{class_id}/categories")
        categories = response.json()
        
        if categories:
            return categories[0]
        
        # Create a category if none exist
        create_response = auth_session.post(f"{BASE_URL}/api/classes/{class_id}/categories", json={
            "name": "TEST_Quiz",
            "weight_percent": 25
        })
        assert create_response.status_code in [200, 201]
        return create_response.json()
    
    def test_create_assignment_with_multiple_choice(self, auth_session, test_class, test_category):
        """Test creating an assignment with multiple choice questions"""
        class_id = test_class["class_id"]
        category_id = test_category["category_id"]
        
        questions = [
            {
                "question_text": "What is 2 + 2?",
                "question_type": "multiple_choice",
                "points": 10,
                "options": [
                    {"text": "3", "is_correct": False},
                    {"text": "4", "is_correct": True},
                    {"text": "5", "is_correct": False},
                    {"text": "6", "is_correct": False}
                ]
            }
        ]
        
        response = auth_session.post(f"{BASE_URL}/api/assignments", json={
            "class_id": class_id,
            "category_id": category_id,
            "title": "TEST_Math Quiz - Multiple Choice",
            "description": "Test quiz with multiple choice questions",
            "points": 100,
            "due_date": "2026-04-01",
            "questions": questions,
            "attachments": []
        })
        
        print(f"Create assignment response: {response.status_code} - {response.text[:300] if response.text else 'empty'}")
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert "assignment_id" in data
        assert data["title"] == "TEST_Math Quiz - Multiple Choice"
        assert len(data.get("questions", [])) == 1
        print(f"Created assignment: {data['assignment_id']}")
        return data
    
    def test_create_assignment_with_true_false(self, auth_session, test_class, test_category):
        """Test creating an assignment with true/false questions"""
        class_id = test_class["class_id"]
        category_id = test_category["category_id"]
        
        questions = [
            {
                "question_text": "The Earth is round.",
                "question_type": "true_false",
                "points": 5,
                "options": [
                    {"text": "True", "is_correct": True},
                    {"text": "False", "is_correct": False}
                ]
            }
        ]
        
        response = auth_session.post(f"{BASE_URL}/api/assignments", json={
            "class_id": class_id,
            "category_id": category_id,
            "title": "TEST_Science Quiz - True/False",
            "description": "Test quiz with true/false questions",
            "points": 50,
            "questions": questions,
            "attachments": []
        })
        
        print(f"True/False assignment response: {response.status_code}")
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert len(data.get("questions", [])) == 1
        assert data["questions"][0]["question_type"] == "true_false"
    
    def test_create_assignment_with_short_answer(self, auth_session, test_class, test_category):
        """Test creating an assignment with short answer questions"""
        class_id = test_class["class_id"]
        category_id = test_category["category_id"]
        
        questions = [
            {
                "question_text": "What is the capital of France?",
                "question_type": "short_answer",
                "points": 10,
                "correct_answer": "Paris"
            }
        ]
        
        response = auth_session.post(f"{BASE_URL}/api/assignments", json={
            "class_id": class_id,
            "category_id": category_id,
            "title": "TEST_Geography Quiz - Short Answer",
            "description": "Test quiz with short answer questions",
            "points": 50,
            "questions": questions,
            "attachments": []
        })
        
        print(f"Short answer assignment response: {response.status_code}")
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert len(data.get("questions", [])) == 1
        assert data["questions"][0]["question_type"] == "short_answer"
    
    def test_create_assignment_with_essay(self, auth_session, test_class, test_category):
        """Test creating an assignment with essay questions"""
        class_id = test_class["class_id"]
        category_id = test_category["category_id"]
        
        questions = [
            {
                "question_text": "Explain the water cycle in your own words.",
                "question_type": "essay",
                "points": 25
            }
        ]
        
        response = auth_session.post(f"{BASE_URL}/api/assignments", json={
            "class_id": class_id,
            "category_id": category_id,
            "title": "TEST_Science Essay",
            "description": "Essay assignment about the water cycle",
            "points": 100,
            "questions": questions,
            "attachments": []
        })
        
        print(f"Essay assignment response: {response.status_code}")
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert len(data.get("questions", [])) == 1
        assert data["questions"][0]["question_type"] == "essay"
    
    def test_create_assignment_with_attachment(self, auth_session, test_class, test_category):
        """Test creating an assignment with file attachment"""
        class_id = test_class["class_id"]
        category_id = test_category["category_id"]
        
        # First upload a file
        file_content = b"%PDF-1.4 Assignment worksheet content"
        files = {'file': ('worksheet.pdf', file_content, 'application/pdf')}
        
        upload_response = auth_session.post(f"{BASE_URL}/api/upload-file", files=files)
        assert upload_response.status_code == 200
        file_data = upload_response.json()
        
        # Create assignment with attachment
        response = auth_session.post(f"{BASE_URL}/api/assignments", json={
            "class_id": class_id,
            "category_id": category_id,
            "title": "TEST_Assignment with Attachment",
            "description": "Assignment with an attached worksheet",
            "points": 100,
            "questions": [],
            "attachments": [file_data]
        })
        
        print(f"Assignment with attachment response: {response.status_code}")
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert len(data.get("attachments", [])) == 1
        assert data["attachments"][0]["filename"] == "worksheet.pdf"
    
    def test_create_assignment_mixed_questions(self, auth_session, test_class, test_category):
        """Test creating an assignment with mixed question types"""
        class_id = test_class["class_id"]
        category_id = test_category["category_id"]
        
        questions = [
            {
                "question_text": "What is the largest planet?",
                "question_type": "multiple_choice",
                "points": 10,
                "options": [
                    {"text": "Earth", "is_correct": False},
                    {"text": "Jupiter", "is_correct": True},
                    {"text": "Mars", "is_correct": False},
                    {"text": "Saturn", "is_correct": False}
                ]
            },
            {
                "question_text": "The sun is a star.",
                "question_type": "true_false",
                "points": 5,
                "options": [
                    {"text": "True", "is_correct": True},
                    {"text": "False", "is_correct": False}
                ]
            },
            {
                "question_text": "Name one planet in our solar system.",
                "question_type": "short_answer",
                "points": 5,
                "correct_answer": ""
            },
            {
                "question_text": "Describe what you know about the solar system.",
                "question_type": "essay",
                "points": 20
            }
        ]
        
        response = auth_session.post(f"{BASE_URL}/api/assignments", json={
            "class_id": class_id,
            "category_id": category_id,
            "title": "TEST_Comprehensive Science Test",
            "description": "Mixed question types test",
            "points": 100,
            "questions": questions,
            "attachments": []
        })
        
        print(f"Mixed questions assignment response: {response.status_code}")
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert len(data.get("questions", [])) == 4
        
        # Verify each question type is present
        question_types = [q["question_type"] for q in data["questions"]]
        assert "multiple_choice" in question_types
        assert "true_false" in question_types
        assert "short_answer" in question_types
        assert "essay" in question_types


class TestGradebookIntegration:
    """Test gradebook integration with assignments"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 401:
            session.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": "Test Teacher"
            })
            session.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
        return session
    
    def test_get_gradebook_with_new_assignments(self, auth_session):
        """Test getting gradebook data including new assignments with questions"""
        # Get classes first
        classes_response = auth_session.get(f"{BASE_URL}/api/classes")
        classes = classes_response.json()
        
        if not classes:
            pytest.skip("No classes available for gradebook test")
        
        class_id = classes[0]["class_id"]
        
        # Get gradebook data
        response = auth_session.get(f"{BASE_URL}/api/gradebook/{class_id}")
        print(f"Gradebook response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "students" in data
        assert "assignments" in data
        assert "grades" in data
        
        # Check if any assignments have questions or attachments
        for assignment in data["assignments"]:
            if "TEST_" in assignment.get("title", ""):
                print(f"Found test assignment: {assignment['title']}")
                if assignment.get("questions"):
                    print(f"  - Has {len(assignment['questions'])} questions")
                if assignment.get("attachments"):
                    print(f"  - Has {len(assignment['attachments'])} attachments")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 401:
            session.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": "Test Teacher"
            })
            session.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
        return session
    
    def test_cleanup_test_assignments(self, auth_session):
        """Clean up test assignments created during tests"""
        # Get classes
        classes_response = auth_session.get(f"{BASE_URL}/api/classes")
        classes = classes_response.json()
        
        deleted_count = 0
        for cls in classes:
            # Get gradebook to find assignments
            gradebook_response = auth_session.get(f"{BASE_URL}/api/gradebook/{cls['class_id']}")
            if gradebook_response.status_code != 200:
                continue
            
            gradebook = gradebook_response.json()
            for assignment in gradebook.get("assignments", []):
                if assignment.get("title", "").startswith("TEST_"):
                    delete_response = auth_session.delete(f"{BASE_URL}/api/assignments/{assignment['assignment_id']}")
                    if delete_response.status_code in [200, 204]:
                        deleted_count += 1
                        print(f"Deleted test assignment: {assignment['title']}")
        
        print(f"Cleaned up {deleted_count} test assignments")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
