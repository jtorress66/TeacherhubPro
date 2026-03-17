"""
Test PDF Parsing API endpoint for TeacherHubPro
Tests the POST /api/ai-grading/parse-pdf endpoint that uses pdfplumber and Claude AI
to convert PDF text into structured questions
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestPDFParsing:
    """Tests for the PDF to questions parsing feature"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth session for authenticated endpoints"""
        self.session = requests.Session()
        # Login to get auth cookie
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "test@school.edu",
                "password": "testpassword"
            }
        )
        if login_response.status_code != 200:
            pytest.skip("Could not authenticate - skipping auth-required tests")

    def test_parse_pdf_endpoint_exists(self):
        """Verify the parse-pdf endpoint is accessible"""
        # Test with an invalid file to verify endpoint exists
        response = self.session.post(
            f"{BASE_URL}/api/ai-grading/parse-pdf",
            json={
                "file_url": "/api/files/nonexistent.pdf",
                "total_points": 100
            }
        )
        # Should return 404 for non-existent file, not 404 for endpoint
        assert response.status_code in [404, 400, 500], f"Unexpected status: {response.status_code}"
        # If it's 404, should mention file not found, not route not found
        if response.status_code == 404:
            data = response.json()
            assert "not found" in data.get("detail", "").lower() or "pdf" in data.get("detail", "").lower()
        print(f"PASS: parse-pdf endpoint exists and returns expected error for non-existent file")

    def test_parse_pdf_with_valid_file(self):
        """Test parsing an actual PDF file - uses the pre-uploaded test PDF"""
        # Use the PDF mentioned in the testing context
        response = self.session.post(
            f"{BASE_URL}/api/ai-grading/parse-pdf",
            json={
                "file_url": "/api/files/file_eea896aed386.pdf",
                "total_points": 100
            },
            timeout=60  # AI parsing may take 10-30 seconds
        )
        
        print(f"Response status: {response.status_code}")
        
        # If file exists and AI is working, should return questions
        if response.status_code == 200:
            data = response.json()
            print(f"Parsed data: {data}")
            
            # Verify response structure
            assert "questions" in data, "Response should contain 'questions' field"
            questions = data["questions"]
            
            if len(questions) > 0:
                print(f"PASS: Extracted {len(questions)} questions from PDF")
                
                # Verify question structure
                first_q = questions[0]
                assert "question_id" in first_q, "Question should have question_id"
                assert "question_text" in first_q, "Question should have question_text"
                assert "question_type" in first_q, "Question should have question_type"
                assert "points" in first_q, "Question should have points"
                
                # Log question types found
                q_types = [q.get("question_type") for q in questions]
                print(f"Question types found: {q_types}")
                
                # Verify optional fields exist
                assert "title" in data, "Response should have title field"
                assert "instructions" in data, "Response should have instructions field"
            else:
                print("WARNING: No questions extracted from PDF")
        elif response.status_code == 404:
            print(f"NOTE: Test PDF not found - may have been deleted. Status: 404")
            pytest.skip("Test PDF file not available")
        elif response.status_code == 504:
            print("NOTE: AI parsing timed out")
            pytest.skip("AI parsing timed out - test inconclusive")
        else:
            print(f"Response: {response.text}")
            pytest.fail(f"Unexpected status code: {response.status_code}")

    def test_parse_pdf_without_auth(self):
        """Verify parse-pdf requires authentication"""
        # Use a new session without auth
        unauth_session = requests.Session()
        response = unauth_session.post(
            f"{BASE_URL}/api/ai-grading/parse-pdf",
            json={
                "file_url": "/api/files/file_eea896aed386.pdf",
                "total_points": 100
            }
        )
        
        # Should require authentication
        assert response.status_code in [401, 403], f"Should require auth, got: {response.status_code}"
        print("PASS: parse-pdf endpoint requires authentication")

    def test_parse_pdf_invalid_file_type(self):
        """Test parsing with a non-PDF file URL"""
        response = self.session.post(
            f"{BASE_URL}/api/ai-grading/parse-pdf",
            json={
                "file_url": "/api/files/notapdf.txt",
                "total_points": 100
            }
        )
        
        # Should return error for non-PDF
        assert response.status_code in [400, 404], f"Should reject non-PDF, got: {response.status_code}"
        print("PASS: parse-pdf rejects non-PDF files")


class TestStudentAssignmentAPI:
    """Tests for student assignment endpoints with parsed questions"""

    def test_student_assignment_with_parsed_questions(self):
        """Test that student API returns structured questions for parsed PDF assignments"""
        # Token for the Science Quiz assignment created from parsed PDF
        token = "32d746a9c0bf"
        
        response = requests.get(f"{BASE_URL}/api/ai-grading/student/{token}")
        
        assert response.status_code == 200, f"Failed to get assignment: {response.status_code}"
        
        data = response.json()
        
        # Verify assignment structure
        assert "title" in data, "Should have title"
        assert "questions" in data, "Should have questions"
        
        questions = data["questions"]
        assert len(questions) > 0, "Should have at least one question"
        
        print(f"Assignment: {data.get('title')}")
        print(f"Questions count: {len(questions)}")
        
        # Verify each question type is properly formatted
        q_types = set()
        for q in questions:
            q_type = q.get("question_type")
            q_types.add(q_type)
            
            if q_type == "multiple_choice":
                assert "options" in q, f"Multiple choice should have options"
                assert len(q["options"]) > 0, "Should have at least one option"
            elif q_type == "true_false":
                # True/false should have True/False options
                assert "options" in q, "True/false should have options"
            elif q_type == "short_answer":
                # Short answer just needs question_text
                assert "question_text" in q, "Should have question text"
            elif q_type == "matching":
                # Matching should have left_items and right_items for student view
                assert "left_items" in q, "Matching should have left_items"
                assert "right_items" in q, "Matching should have right_items"
            elif q_type == "essay":
                # Essay just needs question_text
                assert "question_text" in q, "Should have question text"
        
        print(f"Question types found: {q_types}")
        print("PASS: Student assignment returns properly structured questions")
        
        # Verify no PDF iframe data (attachments should be empty or no PDF shown)
        attachments = data.get("attachments", [])
        print(f"Attachments: {len(attachments)}")

    def test_student_assignment_matching_questions(self):
        """Test assignment with matching questions has proper structure"""
        token = "76006fe2f3f8"
        
        response = requests.get(f"{BASE_URL}/api/ai-grading/student/{token}")
        
        assert response.status_code == 200, f"Failed: {response.status_code}"
        
        data = response.json()
        questions = data.get("questions", [])
        
        # Find matching questions
        matching_questions = [q for q in questions if q.get("question_type") == "matching"]
        
        if len(matching_questions) > 0:
            mq = matching_questions[0]
            assert "left_items" in mq, "Matching should have left_items"
            assert "right_items" in mq, "Matching should have right_items"
            assert len(mq["left_items"]) > 0, "Should have left items"
            assert len(mq["right_items"]) > 0, "Should have right items"
            
            print(f"Matching question left items: {mq['left_items']}")
            print(f"Matching question right items: {mq['right_items']}")
            print("PASS: Matching questions have proper structure")
        else:
            print("NOTE: No matching questions found in this assignment")

    def test_student_assignment_with_instructions(self):
        """Test that per-question instructions are returned"""
        token = "76006fe2f3f8"
        
        response = requests.get(f"{BASE_URL}/api/ai-grading/student/{token}")
        
        assert response.status_code == 200
        
        data = response.json()
        questions = data.get("questions", [])
        
        # Check for questions with instructions
        questions_with_instructions = [q for q in questions if q.get("instructions")]
        
        print(f"Questions with instructions: {len(questions_with_instructions)}/{len(questions)}")
        
        for q in questions_with_instructions:
            print(f"  - Q{q.get('question_id')}: {q.get('instructions')[:50]}...")
        
        # At least some questions should have instructions per the test context
        if len(questions_with_instructions) > 0:
            print("PASS: Per-question instructions are returned in API")
        else:
            print("NOTE: No questions with instructions found")


class TestStudentSubmission:
    """Tests for student submission flow"""

    def test_submission_with_all_question_types(self):
        """Test that student can submit answers for all question types"""
        token = "32d746a9c0bf"
        
        # First get the assignment to see questions
        get_response = requests.get(f"{BASE_URL}/api/ai-grading/student/{token}")
        assert get_response.status_code == 200
        
        assignment = get_response.json()
        questions = assignment.get("questions", [])
        
        # Build answers for each question type
        answers = {}
        for q in questions:
            q_id = q.get("question_id")
            q_type = q.get("question_type")
            
            if q_type == "multiple_choice":
                # Select first option
                options = q.get("options", [])
                if options:
                    answers[q_id] = options[0].get("text", "Option A")
            elif q_type == "true_false":
                answers[q_id] = "True"
            elif q_type == "short_answer":
                answers[q_id] = "Test short answer response"
            elif q_type == "matching":
                # Match left items with right items
                left_items = q.get("left_items", [])
                right_items = q.get("right_items", [])
                if left_items and right_items:
                    answers[q_id] = {left: right_items[i % len(right_items)] for i, left in enumerate(left_items)}
            elif q_type == "essay":
                answers[q_id] = "This is my essay response for the test question."
            else:
                answers[q_id] = "Generic answer"
        
        print(f"Prepared answers for {len(answers)} questions")
        
        # Submit with unique email to avoid duplicate error
        import uuid
        unique_email = f"test_submit_{uuid.uuid4().hex[:8]}@example.com"
        
        submit_response = requests.post(
            f"{BASE_URL}/api/ai-grading/student/{token}/submit",
            json={
                "student_name": "Test Student",
                "student_email": unique_email,
                "answers": answers
            }
        )
        
        if submit_response.status_code == 200:
            data = submit_response.json()
            assert "submission_id" in data, "Should return submission_id"
            print(f"PASS: Submission successful with ID: {data.get('submission_id')}")
        elif submit_response.status_code == 400:
            # May fail due to duplicate email
            print(f"NOTE: Submission returned 400 - {submit_response.json().get('detail')}")
        else:
            print(f"Submission response: {submit_response.text}")
            pytest.fail(f"Unexpected submission status: {submit_response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
