"""
Tests for AI Grading answer display bug fix
Bug: Teachers couldn't see student answers when clicking 'View' button - showed 'No answer'
Root cause: Manual assignments don't have question_id fields, so frontend lookup failed
Fix: Backend adds fallback question_id (q1, q2, etc.) if missing
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAIGradingAnswerDisplay:
    """Test the answer display fix for AI Grading submissions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Authenticate before each test"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@school.edu",
            "password": "testpassword"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    
    def test_submission_endpoint_returns_question_ids(self):
        """Test that GET /api/ai-grading/submissions/{id} returns questions with question_id populated"""
        # Test submission sub_8f94f177 - Capital Cities Quiz (created WITHOUT question_id fields)
        response = self.session.get(f"{BASE_URL}/api/ai-grading/submissions/sub_8f94f177")
        
        assert response.status_code == 200, f"Failed to get submission: {response.text}"
        data = response.json()
        
        # Verify submission has answers
        assert "submission" in data
        assert "answers" in data["submission"]
        answers = data["submission"]["answers"]
        assert len(answers) > 0, "Submission should have answers"
        
        # Verify assignment has questions
        assert "assignment" in data
        assert "questions" in data["assignment"]
        questions = data["assignment"]["questions"]
        assert len(questions) > 0, "Assignment should have questions"
        
        # CRITICAL: Verify all questions have question_id populated
        for i, q in enumerate(questions):
            assert "question_id" in q, f"Question {i} missing question_id"
            assert q["question_id"], f"Question {i} has empty question_id"
            expected_qid = f"q{i+1}"
            assert q["question_id"] == expected_qid, f"Question {i} should have question_id '{expected_qid}', got '{q['question_id']}'"
    
    def test_answer_keys_match_question_ids(self):
        """Test that submission answer keys match the populated question_ids"""
        response = self.session.get(f"{BASE_URL}/api/ai-grading/submissions/sub_8f94f177")
        assert response.status_code == 200
        data = response.json()
        
        answers = data["submission"]["answers"]
        questions = data["assignment"]["questions"]
        
        answer_keys = set(answers.keys())
        question_ids = set(q["question_id"] for q in questions)
        
        # All answer keys should have matching question_ids
        assert answer_keys == question_ids, f"Answer keys {answer_keys} don't match question IDs {question_ids}"
    
    def test_specific_answers_are_correct(self):
        """Test that specific student answers are present in the submission"""
        response = self.session.get(f"{BASE_URL}/api/ai-grading/submissions/sub_8f94f177")
        assert response.status_code == 200
        data = response.json()
        
        answers = data["submission"]["answers"]
        
        # Verify expected answers for Capital Cities Quiz
        assert answers.get("q1") == "San Juan", f"q1 should be 'San Juan', got '{answers.get('q1')}'"
        assert answers.get("q2") == "United States", f"q2 should be 'United States', got '{answers.get('q2')}'"
        assert answers.get("q3") == "Tallahassee", f"q3 should be 'Tallahassee', got '{answers.get('q3')}'"
    
    def test_matching_question_answers_are_objects(self):
        """Test that matching question answers (object type) are preserved correctly"""
        # Get a submission with matching question answers
        response = self.session.get(f"{BASE_URL}/api/ai-grading/submissions/sub_400c2d77")
        
        if response.status_code == 200:
            data = response.json()
            answers = data["submission"]["answers"]
            
            # Find an answer that is an object (matching type)
            object_answers = {k: v for k, v in answers.items() if isinstance(v, dict)}
            assert len(object_answers) > 0, "Should have at least one matching (object) type answer"
            
            # Verify object structure has keys and values
            for q_id, obj_answer in object_answers.items():
                assert len(obj_answer) > 0, f"Matching answer for {q_id} should have entries"
                for key, value in obj_answer.items():
                    assert isinstance(key, str), f"Matching answer keys should be strings"
                    assert isinstance(value, str), f"Matching answer values should be strings"
        else:
            pytest.skip("Test submission sub_400c2d77 not found")
    
    def test_assignment_without_qid_gets_fallback(self):
        """Test that assignment created without question_id fields gets fallback IDs"""
        # The Capital Cities Quiz (assign_b3837ab1) was specifically created without question_id
        response = self.session.get(f"{BASE_URL}/api/ai-grading/submissions/sub_8f94f177")
        assert response.status_code == 200
        data = response.json()
        
        assignment = data["assignment"]
        
        # Verify this is the correct test assignment
        assert "Capital Cities" in assignment["title"] or "QID" in assignment["title"], \
            f"Expected Capital Cities Quiz, got '{assignment['title']}'"
        
        # All questions should have fallback question_id
        for i, q in enumerate(assignment["questions"]):
            expected_id = f"q{i+1}"
            assert q.get("question_id") == expected_id, \
                f"Question {i} should have fallback ID '{expected_id}'"


class TestAIGradingSubmissionsList:
    """Test submissions list endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Authenticate before each test"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@school.edu",
            "password": "testpassword"
        })
        assert login_res.status_code == 200
    
    def test_submissions_list_returns_data(self):
        """Test that submissions list returns submission data"""
        response = self.session.get(f"{BASE_URL}/api/ai-grading/submissions")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Should return a list of submissions"
        assert len(data) > 0, "Should have at least one submission"
        
        # Verify submission structure
        for sub in data:
            assert "submission_id" in sub
            assert "student_name" in sub
            assert "answers" in sub
            assert "status" in sub


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
