"""
Test Parent Portal and Gradebook Reports Features
- Gradebook Reports API
- Parent Portal token generation
- Parent Portal data access (public endpoint)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

class TestGradebookReports:
    """Test Gradebook Reports API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get session
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        # Get classes for testing
        classes_response = self.session.get(f"{BASE_URL}/api/classes")
        assert classes_response.status_code == 200
        self.classes = classes_response.json()
        
    def test_gradebook_report_endpoint_exists(self):
        """Test that gradebook report endpoint returns data"""
        if not self.classes:
            pytest.skip("No classes available for testing")
        
        class_id = self.classes[0]["class_id"]
        response = self.session.get(f"{BASE_URL}/api/gradebook/report/{class_id}")
        
        assert response.status_code == 200, f"Gradebook report failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "class_id" in data
        assert "class_name" in data
        assert "students" in data
        assert "total_assignments" in data
        assert isinstance(data["students"], list)
        print(f"✓ Gradebook report returned {len(data['students'])} students, {data['total_assignments']} assignments")
    
    def test_gradebook_report_student_data_structure(self):
        """Test that student data in report has correct structure"""
        if not self.classes:
            pytest.skip("No classes available for testing")
        
        class_id = self.classes[0]["class_id"]
        response = self.session.get(f"{BASE_URL}/api/gradebook/report/{class_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        if data["students"]:
            student = data["students"][0]
            # Verify student report structure
            assert "student_id" in student
            assert "first_name" in student
            assert "last_name" in student
            assert "assignments_completed" in student
            assert "total_points" in student
            assert "max_points" in student
            assert "average" in student
            print(f"✓ Student data structure verified: {student['first_name']} {student['last_name']}")
        else:
            print("✓ No students in class, structure test skipped")
    
    def test_gradebook_report_invalid_class(self):
        """Test that invalid class ID returns 404"""
        response = self.session.get(f"{BASE_URL}/api/gradebook/report/invalid_class_id_12345")
        assert response.status_code == 404
        print("✓ Invalid class ID correctly returns 404")


class TestParentPortalTokenGeneration:
    """Test Parent Portal token generation endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        # Get classes and students
        classes_response = self.session.get(f"{BASE_URL}/api/classes")
        assert classes_response.status_code == 200
        self.classes = classes_response.json()
        
        self.students = []
        if self.classes:
            students_response = self.session.get(f"{BASE_URL}/api/classes/{self.classes[0]['class_id']}/students")
            if students_response.status_code == 200:
                self.students = students_response.json()
    
    def test_generate_portal_token(self):
        """Test generating a portal token for a student"""
        if not self.students:
            pytest.skip("No students available for testing")
        
        student_id = self.students[0]["student_id"]
        response = self.session.post(f"{BASE_URL}/api/students/{student_id}/portal-token")
        
        assert response.status_code == 200, f"Token generation failed: {response.text}"
        data = response.json()
        
        assert "token" in data
        assert "portal_url" in data
        assert data["token"].startswith("portal_")
        print(f"✓ Portal token generated: {data['token'][:30]}...")
    
    def test_generate_portal_token_idempotent(self):
        """Test that generating token twice returns same token"""
        if not self.students:
            pytest.skip("No students available for testing")
        
        student_id = self.students[0]["student_id"]
        
        # First request
        response1 = self.session.post(f"{BASE_URL}/api/students/{student_id}/portal-token")
        assert response1.status_code == 200
        token1 = response1.json()["token"]
        
        # Second request
        response2 = self.session.post(f"{BASE_URL}/api/students/{student_id}/portal-token")
        assert response2.status_code == 200
        token2 = response2.json()["token"]
        
        assert token1 == token2, "Token should be the same on repeated requests"
        print("✓ Token generation is idempotent")
    
    def test_generate_portal_token_invalid_student(self):
        """Test that invalid student ID returns 404"""
        response = self.session.post(f"{BASE_URL}/api/students/invalid_student_12345/portal-token")
        assert response.status_code == 404
        print("✓ Invalid student ID correctly returns 404")


class TestParentPortalPublicAccess:
    """Test Parent Portal public access (no auth required)"""
    
    def test_portal_access_with_known_token(self):
        """Test accessing portal with the known test token"""
        # Use the token provided in the test request
        token = "portal_0a88ee368639449ab9c34b2303c47854"
        response = requests.get(f"{BASE_URL}/api/portal/{token}")
        
        assert response.status_code == 200, f"Portal access failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "student" in data
        assert "classes" in data
        assert "language" in data
        
        # Verify student data
        student = data["student"]
        assert "student_id" in student
        assert "first_name" in student
        assert "last_name" in student
        print(f"✓ Portal access successful for student: {student['first_name']} {student['last_name']}")
    
    def test_portal_data_structure(self):
        """Test that portal data has complete structure"""
        token = "portal_0a88ee368639449ab9c34b2303c47854"
        response = requests.get(f"{BASE_URL}/api/portal/{token}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify classes data structure
        if data["classes"]:
            cls = data["classes"][0]
            assert "class_id" in cls
            assert "name" in cls
            assert "average" in cls
            assert "assignments" in cls
            assert "attendance" in cls
            assert "attendance_history" in cls
            assert "recent_grades" in cls
            print(f"✓ Class data structure verified: {cls['name']}")
            
            # Verify attendance structure
            attendance = cls["attendance"]
            assert "present" in attendance
            assert "absent" in attendance
            assert "tardy" in attendance
            assert "excused" in attendance
            assert "total" in attendance
            print(f"✓ Attendance structure verified: {attendance}")
        else:
            print("✓ No classes in portal data")
    
    def test_portal_invalid_token(self):
        """Test that invalid token returns 404"""
        response = requests.get(f"{BASE_URL}/api/portal/invalid_token_12345")
        assert response.status_code == 404
        print("✓ Invalid token correctly returns 404")
    
    def test_portal_no_auth_required(self):
        """Test that portal endpoint doesn't require authentication"""
        # Make request without any session/cookies
        token = "portal_0a88ee368639449ab9c34b2303c47854"
        response = requests.get(f"{BASE_URL}/api/portal/{token}")
        
        # Should not return 401 (unauthorized)
        assert response.status_code != 401, "Portal should not require authentication"
        print("✓ Portal endpoint is publicly accessible (no auth required)")


class TestPortalReadOnly:
    """Test that portal is read-only (no modification endpoints)"""
    
    def test_portal_has_no_write_endpoints(self):
        """Verify portal data doesn't expose write operations"""
        token = "portal_0a88ee368639449ab9c34b2303c47854"
        response = requests.get(f"{BASE_URL}/api/portal/{token}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify no edit/delete URLs or tokens in response
        response_str = str(data)
        assert "edit" not in response_str.lower() or "edit" in "recent_grades"  # Allow "recent_grades" field
        assert "delete" not in response_str.lower()
        assert "update" not in response_str.lower()
        print("✓ Portal data doesn't expose write operations")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
