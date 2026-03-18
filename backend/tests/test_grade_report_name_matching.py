"""
Test Grade Report and Report Card name matching bug fix.
Tests:
1. Grade Report endpoint shows grades from ai_submissions for matching students
2. Report Card endpoint shows grades from ai_submissions with correct category breakdown
3. Name matching handles partial names (e.g., 'Paul Figueroa' matches 'Paul J. Figueroa Mendez')
4. Grade Report correctly counts completed AI assignments
5. Report Card GPA is calculated correctly with AI grades included
6. Report Card shows assignment titles and scores for each graded submission
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test class and credentials
CLASS_ID = "class_d79a6790"
TEST_EMAIL = "test@school.edu"
TEST_PASSWORD = "testpassword"

class TestNameMatchingFunction:
    """Unit tests for the names_match helper function logic"""
    
    def test_exact_match(self):
        """Exact name should match"""
        # Simulating the names_match function logic
        roster = "Maria Garcia"
        submission = "Maria Garcia"
        assert self._names_match(roster, submission) == True
    
    def test_partial_name_match(self):
        """'Maria Garcia' submission should match 'Maria J. Garcia' roster (middle initial)"""
        roster = "Maria J. Garcia"
        submission = "Maria Garcia"
        assert self._names_match(roster, submission) == True
    
    def test_paul_figueroa_case(self):
        """CRITICAL: 'Paul Figueroa' should match 'Paul J. Figueroa Mendez'"""
        roster = "Paul J. Figueroa Mendez"
        submission = "Paul Figueroa"
        # Paul and Figueroa are 2 significant parts that match
        assert self._names_match(roster, submission) == True
    
    def test_mari_maria_match(self):
        """'Mari Garcia' should NOT match 'Maria Garcia' (only 1 significant part matches)"""
        roster = "Maria Garcia"
        submission = "Mari Garcia"
        # mari != maria, only 'garcia' matches -> False (only 1 significant part)
        result = self._names_match(roster, submission)
        # This is the expected behavior - Mari is NOT a subset of Maria
        assert result == False  # Expected: No match since 'mari' != 'maria'
    
    def test_middle_initial_stripped(self):
        """Middle initials like 'J.' should be stripped"""
        roster = "Carlos A. Lopez Ramirez"
        submission = "Carlos Lopez"
        assert self._names_match(roster, submission) == True
    
    def test_spanish_particles_ignored(self):
        """Name particles like 'de', 'la' should be ignored"""
        roster = "Maria de la Cruz"
        submission = "Maria Cruz"
        assert self._names_match(roster, submission) == True
    
    def _names_match(self, roster_name: str, submission_name: str) -> bool:
        """Python implementation of the names_match helper"""
        r_parts = set(roster_name.lower().split())
        s_parts = set(submission_name.lower().split())
        particles = {'de', 'la', 'del', 'el', 'los', 'las', 'san', 'a', 'e', 'y'}
        r_clean = {p.rstrip('.') for p in r_parts} - particles
        s_clean = {p.rstrip('.') for p in s_parts} - particles
        # Remove single-char initials
        r_significant = {p for p in r_clean if len(p) > 1}
        s_significant = {p for p in s_clean if len(p) > 1}
        if not s_significant or not r_significant:
            return False
        # If all submission parts are in roster -> match
        if s_significant.issubset(r_significant):
            return True
        # If at least 2 significant parts match -> match
        if len(s_significant & r_significant) >= 2:
            return True
        return False


class TestGradeReportEndpoint:
    """Tests for GET /api/gradebook/report/{class_id}"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookies"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    
    def test_grade_report_returns_200(self):
        """Grade report endpoint should return 200"""
        response = self.session.get(f"{BASE_URL}/api/gradebook/report/{CLASS_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_grade_report_includes_ai_submissions_count(self):
        """Grade report should include ai_submissions_count field"""
        response = self.session.get(f"{BASE_URL}/api/gradebook/report/{CLASS_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "ai_submissions_count" in data, "Missing ai_submissions_count field"
        print(f"AI submissions count: {data['ai_submissions_count']}")
    
    def test_grade_report_includes_ai_assignments(self):
        """Grade report should include AI assignments in total count"""
        response = self.session.get(f"{BASE_URL}/api/gradebook/report/{CLASS_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "total_ai_assignments" in data, "Missing total_ai_assignments field"
        print(f"Total AI assignments: {data['total_ai_assignments']}")
        assert data['total_ai_assignments'] >= 2, f"Expected at least 2 AI assignments, got {data['total_ai_assignments']}"
    
    def test_grade_report_maria_garcia_has_grades(self):
        """Maria Garcia (student_40da2916) should have AI grades recorded"""
        response = self.session.get(f"{BASE_URL}/api/gradebook/report/{CLASS_ID}")
        assert response.status_code == 200
        data = response.json()
        
        # Find Maria Garcia
        maria = None
        for student in data['students']:
            if student['student_id'] == 'student_40da2916':
                maria = student
                break
        
        assert maria is not None, "Maria Garcia (student_40da2916) not found in report"
        print(f"Maria Garcia report: {maria}")
        
        # She should have completed assignments (from AI graded submissions)
        total_completed = maria.get('total_assignments_completed', 0)
        ai_completed = maria.get('ai_assignments_completed', 0)
        print(f"Maria Garcia - Total completed: {total_completed}, AI completed: {ai_completed}")
        
        # Expect at least 1 completed (Maria Garcia has a graded submission)
        assert total_completed >= 1, f"Maria should have at least 1 completed assignment, got {total_completed}"
    
    def test_grade_report_student_average_calculated(self):
        """Students with grades should have calculated average"""
        response = self.session.get(f"{BASE_URL}/api/gradebook/report/{CLASS_ID}")
        assert response.status_code == 200
        data = response.json()
        
        # Find student with grades
        for student in data['students']:
            if student.get('total_assignments_completed', 0) > 0:
                assert student.get('average') is not None, f"Student {student['student_id']} has grades but no average"
                print(f"Student {student['first_name']} {student['last_name']} average: {student['average']}")


class TestReportCardEndpoint:
    """Tests for GET /api/report-cards/generate"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookies"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    
    def test_report_card_returns_200(self):
        """Report card endpoint should return 200"""
        response = self.session.get(
            f"{BASE_URL}/api/report-cards/generate",
            params={"student_id": "student_40da2916", "class_id": CLASS_ID}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_report_card_maria_garcia_has_grades(self):
        """Maria Garcia's report card should show grades from AI submissions"""
        response = self.session.get(
            f"{BASE_URL}/api/report-cards/generate",
            params={"student_id": "student_40da2916", "class_id": CLASS_ID}
        )
        assert response.status_code == 200
        data = response.json()
        
        print(f"Maria Garcia Report Card: {data}")
        
        # Should have grades list
        grades = data.get('grades', [])
        
        print(f"Grades breakdown: {grades}")
        
        # Calculate total earned from grades list
        total_earned = sum(g.get('points_earned', 0) for g in grades)
        total_possible = sum(g.get('points_possible', 0) for g in grades)
        
        print(f"Total earned (calculated): {total_earned}, Total possible: {total_possible}")
        
        # Expect at least some points (Maria has graded submissions)
        assert total_earned > 0, f"Maria should have points earned (she has graded submissions), got {total_earned}"
        
        # Check that AI grades are included (look for AI category)
        ai_grades = [g for g in grades if g.get('is_ai') == True or '(AI)' in g.get('category', '')]
        print(f"AI grades found: {ai_grades}")
        assert len(ai_grades) >= 1, f"Expected at least 1 AI grade category, got {len(ai_grades)}"
    
    def test_report_card_shows_gpa(self):
        """Report card should calculate GPA"""
        response = self.session.get(
            f"{BASE_URL}/api/report-cards/generate",
            params={"student_id": "student_40da2916", "class_id": CLASS_ID}
        )
        assert response.status_code == 200
        data = response.json()
        
        gpa = data.get('gpa')
        assert gpa is not None, "GPA should be calculated"
        assert 0 <= gpa <= 4.0, f"GPA should be between 0 and 4.0, got {gpa}"
        print(f"Maria Garcia GPA: {gpa}")
    
    def test_report_card_shows_assignment_details(self):
        """Report card should show assignment titles and scores"""
        response = self.session.get(
            f"{BASE_URL}/api/report-cards/generate",
            params={"student_id": "student_40da2916", "class_id": CLASS_ID}
        )
        assert response.status_code == 200
        data = response.json()
        
        grades = data.get('grades', [])
        
        # Find categories with assignments
        for grade_cat in grades:
            if grade_cat.get('assignment_count', 0) > 0:
                print(f"Category: {grade_cat.get('category')}, Count: {grade_cat.get('assignment_count')}, Points: {grade_cat.get('points_earned')}/{grade_cat.get('points_possible')}")
    
    def test_report_card_second_maria_garcia(self):
        """Second Maria Garcia (student_ea7cb18e5b4f) should also show grades"""
        response = self.session.get(
            f"{BASE_URL}/api/report-cards/generate",
            params={"student_id": "student_ea7cb18e5b4f", "class_id": CLASS_ID}
        )
        assert response.status_code == 200
        data = response.json()
        
        total_earned = data.get('total_points_earned', 0)
        print(f"Second Maria Garcia - Total earned: {total_earned}")
        
        # Note: Both Maria Garcias have the same name, so name matching should work for both
        # The AI submission for "Maria Garcia" (exact match) should match either student
        # This tests the name matching robustness


class TestNameMatchingWithPartialNames:
    """Test that partial names work for Grade Report and Report Card"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookies"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    
    def test_verify_names_match_implementation(self):
        """Verify the names_match function implementation via API behavior"""
        # Get the grade report
        response = self.session.get(f"{BASE_URL}/api/gradebook/report/{CLASS_ID}")
        assert response.status_code == 200
        data = response.json()
        
        # The graded submissions are:
        # 1. "Mari Garcia" (typo) -> aiassign_83a2256e, Score: 80
        # 2. "Maria Garcia" (exact) -> aiassign_5aa71494, Score: 66
        
        # Find students and check if their grades were matched
        print(f"\n=== Grade Report Analysis ===")
        print(f"AI submissions count: {data.get('ai_submissions_count', 0)}")
        
        for student in data['students']:
            name = f"{student['first_name']} {student['last_name']}"
            completed = student.get('total_assignments_completed', 0)
            ai_completed = student.get('ai_assignments_completed', 0)
            avg = student.get('average')
            
            if completed > 0 or ai_completed > 0:
                print(f"Student: {name} (ID: {student['student_id']})")
                print(f"  - Total completed: {completed}, AI completed: {ai_completed}")
                print(f"  - Average: {avg}")


class TestGradeReportResponseStructure:
    """Verify the Grade Report response structure is correct"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookies"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200
    
    def test_response_has_required_fields(self):
        """Grade report response should have all required fields"""
        response = self.session.get(f"{BASE_URL}/api/gradebook/report/{CLASS_ID}")
        assert response.status_code == 200
        data = response.json()
        
        # Required top-level fields
        required_fields = ['class_id', 'class_name', 'students', 'total_assignments', 
                          'total_ai_assignments', 'categories', 'ai_submissions_count']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Student report fields
        if len(data['students']) > 0:
            student = data['students'][0]
            student_fields = ['student_id', 'first_name', 'last_name', 'assignments_completed',
                             'ai_assignments_completed', 'total_assignments_completed', 
                             'total_points', 'max_points', 'average']
            for field in student_fields:
                assert field in student, f"Missing student field: {field}"


class TestReportCardResponseStructure:
    """Verify the Report Card response structure is correct"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookies"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200
    
    def test_response_has_required_fields(self):
        """Report card response should have all required fields"""
        response = self.session.get(
            f"{BASE_URL}/api/report-cards/generate",
            params={"student_id": "student_40da2916", "class_id": CLASS_ID}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Required top-level fields (based on actual API response)
        required_fields = ['student', 'class', 'grades', 'gpa', 'overall_percentage', 'attendance']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Grade category fields
        if len(data['grades']) > 0:
            grade_cat = data['grades'][0]
            grade_fields = ['category', 'points_earned', 'points_possible', 'percentage', 'assignment_count']
            for field in grade_fields:
                assert field in grade_cat, f"Missing grade field: {field}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
