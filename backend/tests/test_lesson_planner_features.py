"""
Test cases for TeacherHub Lesson Planner - Teacher Name and Other Activity Notes features
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestLessonPlannerFeatures:
    """Test Teacher Name and Other Activity Notes features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get session token
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        # Extract token from cookies
        self.token = login_response.cookies.get("session_token")
        if self.token:
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        # Get class_id for testing
        classes_response = self.session.get(f"{BASE_URL}/api/classes")
        assert classes_response.status_code == 200
        classes = classes_response.json()
        assert len(classes) > 0, "No classes found for testing"
        self.class_id = classes[0]["class_id"]
        
        yield
        
        # Cleanup: Delete test plans created during tests
        plans_response = self.session.get(f"{BASE_URL}/api/plans")
        if plans_response.status_code == 200:
            for plan in plans_response.json():
                if plan.get("unit", "").startswith("TEST_"):
                    self.session.delete(f"{BASE_URL}/api/plans/{plan['plan_id']}")
    
    def test_create_plan_with_teacher_name(self):
        """Test creating a lesson plan with teacher_name field"""
        plan_data = {
            "class_id": self.class_id,
            "week_start": "2026-02-10",
            "week_end": "2026-02-14",
            "unit": "TEST_Unit_TeacherName",
            "story": "Test Story",
            "teacher_name": "Mrs. Smith",  # Teacher name field
            "objective": "Test objective",
            "skills": ["Reading", "Writing"],
            "days": [],
            "standards": [],
            "expectations": [],
            "subject_integration": [],
            "is_template": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/plans", json=plan_data)
        assert response.status_code == 200, f"Create plan failed: {response.text}"
        
        created_plan = response.json()
        assert "plan_id" in created_plan
        assert created_plan["teacher_name"] == "Mrs. Smith", "Teacher name not saved correctly"
        
        # Verify by fetching the plan
        get_response = self.session.get(f"{BASE_URL}/api/plans/{created_plan['plan_id']}")
        assert get_response.status_code == 200
        fetched_plan = get_response.json()
        assert fetched_plan["teacher_name"] == "Mrs. Smith", "Teacher name not persisted correctly"
        
        print(f"✓ Plan created with teacher_name: {fetched_plan['teacher_name']}")
    
    def test_update_plan_teacher_name(self):
        """Test updating teacher_name field in an existing plan"""
        # First create a plan
        plan_data = {
            "class_id": self.class_id,
            "week_start": "2026-02-17",
            "week_end": "2026-02-21",
            "unit": "TEST_Unit_UpdateTeacher",
            "story": "Test Story",
            "teacher_name": "Mr. Johnson",
            "objective": "Test objective",
            "skills": [],
            "days": [],
            "standards": [],
            "expectations": [],
            "subject_integration": [],
            "is_template": False
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/plans", json=plan_data)
        assert create_response.status_code == 200
        plan_id = create_response.json()["plan_id"]
        
        # Update the teacher name
        plan_data["teacher_name"] = "Ms. Williams"
        update_response = self.session.put(f"{BASE_URL}/api/plans/{plan_id}", json=plan_data)
        assert update_response.status_code == 200
        
        updated_plan = update_response.json()
        assert updated_plan["teacher_name"] == "Ms. Williams", "Teacher name not updated correctly"
        
        # Verify persistence
        get_response = self.session.get(f"{BASE_URL}/api/plans/{plan_id}")
        assert get_response.status_code == 200
        fetched_plan = get_response.json()
        assert fetched_plan["teacher_name"] == "Ms. Williams", "Updated teacher name not persisted"
        
        print(f"✓ Teacher name updated from 'Mr. Johnson' to '{fetched_plan['teacher_name']}'")
    
    def test_create_plan_with_other_activity_notes(self):
        """Test creating a plan with 'Other' activity and notes"""
        plan_data = {
            "class_id": self.class_id,
            "week_start": "2026-02-24",
            "week_end": "2026-02-28",
            "unit": "TEST_Unit_OtherActivity",
            "story": "Test Story",
            "teacher_name": "Test Teacher",
            "objective": "Test objective",
            "skills": [],
            "days": [
                {
                    "date": "2026-02-24",
                    "day_name": "monday",
                    "theme": "Test Theme",
                    "dok_levels": [1],
                    "eca": {"E": False, "C": True, "A": False},
                    "activities": [
                        {"activity_type": "brainstorming", "checked": True, "notes": ""},
                        {"activity_type": "other", "checked": True, "notes": "Custom activity: Group discussion"}
                    ],
                    "materials": [{"material_type": "book", "checked": True}],
                    "notes": "Day notes"
                }
            ],
            "standards": [],
            "expectations": [],
            "subject_integration": [],
            "is_template": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/plans", json=plan_data)
        assert response.status_code == 200, f"Create plan failed: {response.text}"
        
        created_plan = response.json()
        plan_id = created_plan["plan_id"]
        
        # Verify by fetching the plan
        get_response = self.session.get(f"{BASE_URL}/api/plans/{plan_id}")
        assert get_response.status_code == 200
        fetched_plan = get_response.json()
        
        # Check that the 'other' activity with notes is saved
        assert len(fetched_plan["days"]) > 0, "Days not saved"
        day_activities = fetched_plan["days"][0].get("activities", [])
        
        other_activity = None
        for activity in day_activities:
            if activity.get("activity_type") == "other":
                other_activity = activity
                break
        
        assert other_activity is not None, "Other activity not found in saved plan"
        assert other_activity.get("checked") == True, "Other activity not marked as checked"
        assert other_activity.get("notes") == "Custom activity: Group discussion", \
            f"Other activity notes not saved correctly. Got: {other_activity.get('notes')}"
        
        print(f"✓ Other activity notes saved: '{other_activity.get('notes')}'")
    
    def test_update_other_activity_notes(self):
        """Test updating 'Other' activity notes in an existing plan"""
        # Create a plan with other activity
        plan_data = {
            "class_id": self.class_id,
            "week_start": "2026-03-03",
            "week_end": "2026-03-07",
            "unit": "TEST_Unit_UpdateOther",
            "story": "Test Story",
            "teacher_name": "Test Teacher",
            "objective": "Test objective",
            "skills": [],
            "days": [
                {
                    "date": "2026-03-03",
                    "day_name": "monday",
                    "theme": "Test Theme",
                    "dok_levels": [],
                    "eca": {"E": False, "C": False, "A": False},
                    "activities": [
                        {"activity_type": "other", "checked": True, "notes": "Initial notes"}
                    ],
                    "materials": [],
                    "notes": ""
                }
            ],
            "standards": [],
            "expectations": [],
            "subject_integration": [],
            "is_template": False
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/plans", json=plan_data)
        assert create_response.status_code == 200
        plan_id = create_response.json()["plan_id"]
        
        # Update the other activity notes
        plan_data["days"][0]["activities"][0]["notes"] = "Updated custom activity notes"
        update_response = self.session.put(f"{BASE_URL}/api/plans/{plan_id}", json=plan_data)
        assert update_response.status_code == 200
        
        # Verify persistence
        get_response = self.session.get(f"{BASE_URL}/api/plans/{plan_id}")
        assert get_response.status_code == 200
        fetched_plan = get_response.json()
        
        other_activity = fetched_plan["days"][0]["activities"][0]
        assert other_activity.get("notes") == "Updated custom activity notes", \
            f"Other activity notes not updated. Got: {other_activity.get('notes')}"
        
        print(f"✓ Other activity notes updated to: '{other_activity.get('notes')}'")
    
    def test_plan_without_teacher_name(self):
        """Test that plans can be created without teacher_name (optional field)"""
        plan_data = {
            "class_id": self.class_id,
            "week_start": "2026-03-10",
            "week_end": "2026-03-14",
            "unit": "TEST_Unit_NoTeacher",
            "story": "Test Story",
            # teacher_name intentionally omitted
            "objective": "Test objective",
            "skills": [],
            "days": [],
            "standards": [],
            "expectations": [],
            "subject_integration": [],
            "is_template": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/plans", json=plan_data)
        assert response.status_code == 200, f"Create plan without teacher_name failed: {response.text}"
        
        created_plan = response.json()
        # teacher_name should be None or empty
        assert created_plan.get("teacher_name") is None or created_plan.get("teacher_name") == "", \
            f"Expected empty teacher_name, got: {created_plan.get('teacher_name')}"
        
        print("✓ Plan created successfully without teacher_name")
    
    def test_empty_other_activity_notes(self):
        """Test that 'Other' activity can be checked without notes"""
        plan_data = {
            "class_id": self.class_id,
            "week_start": "2026-03-17",
            "week_end": "2026-03-21",
            "unit": "TEST_Unit_EmptyOther",
            "story": "Test Story",
            "teacher_name": "Test Teacher",
            "objective": "Test objective",
            "skills": [],
            "days": [
                {
                    "date": "2026-03-17",
                    "day_name": "monday",
                    "theme": "Test Theme",
                    "dok_levels": [],
                    "eca": {"E": False, "C": False, "A": False},
                    "activities": [
                        {"activity_type": "other", "checked": True, "notes": ""}  # Empty notes
                    ],
                    "materials": [],
                    "notes": ""
                }
            ],
            "standards": [],
            "expectations": [],
            "subject_integration": [],
            "is_template": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/plans", json=plan_data)
        assert response.status_code == 200, f"Create plan with empty other notes failed: {response.text}"
        
        print("✓ Plan created with 'Other' activity checked but empty notes")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
