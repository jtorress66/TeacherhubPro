"""
Test school logo integration for student assignment page and PDF generation.
Tests:
1. Backend: GET /api/ai-grading/student/{token} returns school_name and school_logo_url
2. Backend: Verify school lookup from class_id → school_id → school document
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@school.edu"
TEST_PASSWORD = "testpassword"
# Known test token from existing assignment
TEST_TOKEN = "2ae35432d130"


class TestSchoolLogoIntegration:
    """Test school logo integration in student assignment endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login to get auth cookie
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if login_response.status_code != 200:
            pytest.skip("Login failed - skipping authenticated tests")
    
    def test_student_endpoint_returns_school_fields(self):
        """Test that student assignment endpoint returns school_name and school_logo_url"""
        # This endpoint is public - no auth needed
        response = requests.get(f"{BASE_URL}/api/ai-grading/student/{TEST_TOKEN}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify school fields exist in response
        assert "school_name" in data, "school_name field missing from response"
        assert "school_logo_url" in data, "school_logo_url field missing from response"
        
        # Verify school_name has expected value for test school
        assert data["school_name"] == "My School", f"Expected 'My School', got '{data['school_name']}'"
        
        # school_logo_url can be empty string (test school has no logo)
        assert isinstance(data["school_logo_url"], str), "school_logo_url should be a string"
        
        print(f"✓ school_name: {data['school_name']}")
        print(f"✓ school_logo_url: '{data['school_logo_url']}' (empty is expected for test school)")
    
    def test_student_endpoint_returns_class_name(self):
        """Test that student endpoint returns class_name alongside school_name"""
        response = requests.get(f"{BASE_URL}/api/ai-grading/student/{TEST_TOKEN}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify class_name exists
        assert "class_name" in data, "class_name field missing"
        assert len(data["class_name"]) > 0, "class_name should not be empty"
        
        print(f"✓ class_name: {data['class_name']}")
        print(f"✓ school_name: {data['school_name']}")
    
    def test_student_endpoint_without_correct_answers(self):
        """Verify student endpoint doesn't expose correct answers (security check)"""
        response = requests.get(f"{BASE_URL}/api/ai-grading/student/{TEST_TOKEN}")
        
        assert response.status_code == 200
        data = response.json()
        
        questions = data.get("questions", [])
        assert len(questions) > 0, "Expected at least one question"
        
        for q in questions:
            # Verify no correct_answer field
            assert "correct_answer" not in q, f"Question {q.get('question_id')} exposes correct_answer"
            
            # For multiple choice, verify options don't have is_correct
            if q.get("question_type") == "multiple_choice":
                for opt in q.get("options", []):
                    assert "is_correct" not in opt, "Option exposes is_correct field"
        
        print(f"✓ {len(questions)} questions verified - no correct answers exposed")
    
    def test_student_endpoint_returns_assignment_details(self):
        """Test that student endpoint returns all required assignment details"""
        response = requests.get(f"{BASE_URL}/api/ai-grading/student/{TEST_TOKEN}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Required fields
        required_fields = [
            "assignment_id",
            "title",
            "description",
            "class_name",
            "school_name",
            "school_logo_url",
            "total_points",
            "questions"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        print(f"✓ All required fields present: {', '.join(required_fields)}")
    
    def test_invalid_token_returns_404(self):
        """Test that invalid token returns 404"""
        response = requests.get(f"{BASE_URL}/api/ai-grading/student/invalid_token_xyz")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid token correctly returns 404")
    
    def test_schools_endpoint_returns_logo_url(self):
        """Test that schools endpoint returns logo_url field"""
        # First get schools list
        response = self.session.get(f"{BASE_URL}/api/schools")
        
        if response.status_code == 200:
            schools = response.json()
            if len(schools) > 0:
                school = schools[0]
                # Verify logo_url field exists
                assert "logo_url" in school or "logo" in school, "School should have logo_url field"
                print(f"✓ School has logo field: {school.get('name')}")
        else:
            # If no direct schools endpoint, try getting school from class
            classes_response = self.session.get(f"{BASE_URL}/api/classes")
            if classes_response.status_code == 200:
                classes = classes_response.json()
                if len(classes) > 0 and classes[0].get("school_id"):
                    school_id = classes[0]["school_id"]
                    school_response = self.session.get(f"{BASE_URL}/api/schools/{school_id}")
                    if school_response.status_code == 200:
                        school = school_response.json()
                        print(f"✓ School data: {school.get('name')} - logo_url: '{school.get('logo_url', '')}'")


class TestAIAssignmentSchoolLogo:
    """Test AI assignment also returns school info"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if login_response.status_code != 200:
            pytest.skip("Login failed")
    
    def test_ai_assignments_have_public_token(self):
        """Verify AI assignments have public_token for student links"""
        response = self.session.get(f"{BASE_URL}/api/ai-grading/assignments")
        
        if response.status_code == 200:
            assignments = response.json()
            if len(assignments) > 0:
                assignment = assignments[0]
                assert "public_token" in assignment, "AI assignment should have public_token"
                print(f"✓ AI assignment has public_token: {assignment['public_token'][:8]}...")
                
                # Test that this token works
                student_response = requests.get(
                    f"{BASE_URL}/api/ai-grading/student/{assignment['public_token']}"
                )
                assert student_response.status_code == 200, "Student endpoint should work for AI assignment"
                
                data = student_response.json()
                assert "school_name" in data, "AI assignment student view should have school_name"
                assert "school_logo_url" in data, "AI assignment student view should have school_logo_url"
                
                print(f"✓ AI assignment student view has school info: {data.get('school_name')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
