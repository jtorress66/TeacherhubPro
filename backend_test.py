#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class TeacherHubAPITester:
    def __init__(self, base_url="https://teacherhub-ux-fix.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.user_data = None
        self.test_class_id = None
        self.test_student_id = None
        self.test_plan_id = None
        self.test_assignment_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")

    def test_health_check(self):
        """Test health endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            success = response.status_code == 200
            self.log_test("Health Check", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Health Check", False, str(e))
            return False

    def test_login(self, email="test@school.edu", password="Test123!"):
        """Test user login"""
        try:
            response = self.session.post(f"{self.base_url}/auth/login", json={
                "email": email,
                "password": password
            })
            
            if response.status_code == 200:
                self.user_data = response.json()
                self.log_test("User Login", True, f"User: {self.user_data.get('name')}")
                return True
            else:
                self.log_test("User Login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("User Login", False, str(e))
            return False

    def test_get_current_user(self):
        """Test get current user endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/auth/me")
            success = response.status_code == 200
            if success:
                user_data = response.json()
                self.log_test("Get Current User", True, f"User ID: {user_data.get('user_id')}")
            else:
                self.log_test("Get Current User", False, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Get Current User", False, str(e))
            return False

    def test_dashboard(self):
        """Test dashboard endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/dashboard")
            success = response.status_code == 200
            if success:
                data = response.json()
                stats = data.get('stats', {})
                self.log_test("Dashboard", True, f"Classes: {stats.get('total_classes', 0)}, Students: {stats.get('total_students', 0)}")
            else:
                self.log_test("Dashboard", False, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Dashboard", False, str(e))
            return False

    def test_create_class(self):
        """Test creating a class"""
        try:
            class_data = {
                "name": "Test English Class",
                "grade": "4",
                "section": "A",
                "subject": "English",
                "year_term": "2024-2025"
            }
            response = self.session.post(f"{self.base_url}/classes", json=class_data)
            
            if response.status_code == 200:
                class_info = response.json()
                self.test_class_id = class_info.get('class_id')
                self.log_test("Create Class", True, f"Class ID: {self.test_class_id}")
                return True
            else:
                self.log_test("Create Class", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Class", False, str(e))
            return False

    def test_get_classes(self):
        """Test getting classes"""
        try:
            response = self.session.get(f"{self.base_url}/classes")
            success = response.status_code == 200
            if success:
                classes = response.json()
                self.log_test("Get Classes", True, f"Found {len(classes)} classes")
                # Use first class if we don't have test_class_id
                if not self.test_class_id and classes:
                    self.test_class_id = classes[0].get('class_id')
            else:
                self.log_test("Get Classes", False, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Get Classes", False, str(e))
            return False

    def test_add_student(self):
        """Test adding a student to class"""
        if not self.test_class_id:
            self.log_test("Add Student", False, "No test class available")
            return False
            
        try:
            student_data = {
                "first_name": "Test",
                "last_name": "Student",
                "student_number": "12345",
                "email": "test.student@school.edu",
                "parent_email": "parent@school.edu"
            }
            response = self.session.post(f"{self.base_url}/classes/{self.test_class_id}/students", json=student_data)
            
            if response.status_code == 200:
                student_info = response.json()
                self.test_student_id = student_info.get('student_id')
                self.log_test("Add Student", True, f"Student ID: {self.test_student_id}")
                return True
            else:
                self.log_test("Add Student", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Add Student", False, str(e))
            return False

    def test_get_students(self):
        """Test getting students from class"""
        if not self.test_class_id:
            self.log_test("Get Students", False, "No test class available")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/classes/{self.test_class_id}/students")
            success = response.status_code == 200
            if success:
                students = response.json()
                self.log_test("Get Students", True, f"Found {len(students)} students")
                # Use first student if we don't have test_student_id
                if not self.test_student_id and students:
                    self.test_student_id = students[0].get('student_id')
            else:
                self.log_test("Get Students", False, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Get Students", False, str(e))
            return False

    def test_create_lesson_plan(self):
        """Test creating a lesson plan"""
        if not self.test_class_id:
            self.log_test("Create Lesson Plan", False, "No test class available")
            return False
            
        try:
            today = datetime.now()
            week_start = today.strftime("%Y-%m-%d")
            week_end = (today + timedelta(days=4)).strftime("%Y-%m-%d")
            
            plan_data = {
                "class_id": self.test_class_id,
                "week_start": week_start,
                "week_end": week_end,
                "unit": "Test Unit 1",
                "story": "Test Story",
                "objective": "Test learning objective",
                "skills": ["Reading", "Writing", "Speaking"],
                "days": [
                    {
                        "date": week_start,
                        "day_name": "monday",
                        "theme": "Introduction",
                        "dok_levels": [1, 2],
                        "activities": [
                            {"activity_type": "brainstorming", "checked": True, "notes": "Test activity"}
                        ],
                        "materials": [
                            {"material_type": "book", "checked": True}
                        ],
                        "notes": "Test notes"
                    }
                ],
                "standards": [
                    {"week_index": 1, "domain": "reading", "codes": ["RF.4.3", "RF.4.4"]}
                ],
                "expectations": [
                    {"week_index": 1, "text": "Students will demonstrate reading comprehension"}
                ],
                "subject_integration": ["mathematics", "science"]
            }
            
            response = self.session.post(f"{self.base_url}/plans", json=plan_data)
            
            if response.status_code == 200:
                plan_info = response.json()
                self.test_plan_id = plan_info.get('plan_id')
                self.log_test("Create Lesson Plan", True, f"Plan ID: {self.test_plan_id}")
                return True
            else:
                self.log_test("Create Lesson Plan", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Lesson Plan", False, str(e))
            return False

    def test_get_lesson_plans(self):
        """Test getting lesson plans"""
        try:
            response = self.session.get(f"{self.base_url}/plans")
            success = response.status_code == 200
            if success:
                plans = response.json()
                self.log_test("Get Lesson Plans", True, f"Found {len(plans)} plans")
                # Use first plan if we don't have test_plan_id
                if not self.test_plan_id and plans:
                    self.test_plan_id = plans[0].get('plan_id')
            else:
                self.log_test("Get Lesson Plans", False, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Get Lesson Plans", False, str(e))
            return False

    def test_attendance(self):
        """Test attendance functionality"""
        if not self.test_class_id or not self.test_student_id:
            self.log_test("Attendance", False, "No test class or student available")
            return False
            
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            attendance_data = {
                "class_id": self.test_class_id,
                "date": today,
                "records": [
                    {
                        "student_id": self.test_student_id,
                        "status": "present",
                        "minutes_late": 0,
                        "note": ""
                    }
                ]
            }
            
            response = self.session.post(f"{self.base_url}/attendance", json=attendance_data)
            success = response.status_code == 200
            if success:
                self.log_test("Attendance", True, "Attendance recorded successfully")
            else:
                self.log_test("Attendance", False, f"Status: {response.status_code}, Response: {response.text}")
            return success
        except Exception as e:
            self.log_test("Attendance", False, str(e))
            return False

    def test_gradebook(self):
        """Test gradebook functionality"""
        if not self.test_class_id:
            self.log_test("Gradebook", False, "No test class available")
            return False
            
        try:
            # First create a category
            category_data = {
                "name": "Test Category",
                "weight_percent": 100.0
            }
            cat_response = self.session.post(f"{self.base_url}/classes/{self.test_class_id}/categories", json=category_data)
            
            if cat_response.status_code != 200:
                self.log_test("Gradebook - Create Category", False, f"Status: {cat_response.status_code}")
                return False
                
            category = cat_response.json()
            category_id = category.get('category_id')
            
            # Create an assignment
            assignment_data = {
                "class_id": self.test_class_id,
                "category_id": category_id,
                "title": "Test Assignment",
                "description": "Test assignment description",
                "points": 100.0,
                "due_date": datetime.now().strftime("%Y-%m-%d")
            }
            
            assign_response = self.session.post(f"{self.base_url}/assignments", json=assignment_data)
            
            if assign_response.status_code == 200:
                assignment = assign_response.json()
                self.test_assignment_id = assignment.get('assignment_id')
                self.log_test("Gradebook", True, f"Assignment ID: {self.test_assignment_id}")
                return True
            else:
                self.log_test("Gradebook", False, f"Status: {assign_response.status_code}, Response: {assign_response.text}")
                return False
        except Exception as e:
            self.log_test("Gradebook", False, str(e))
            return False

    def test_profile_update(self):
        """Test profile update"""
        try:
            profile_data = {
                "name": "Updated Test User",
                "language": "en"
            }
            response = self.session.put(f"{self.base_url}/auth/profile", json=profile_data)
            success = response.status_code == 200
            if success:
                self.log_test("Profile Update", True, "Profile updated successfully")
            else:
                self.log_test("Profile Update", False, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Profile Update", False, str(e))
            return False

    def test_logout(self):
        """Test logout"""
        try:
            response = self.session.post(f"{self.base_url}/auth/logout")
            success = response.status_code == 200
            self.log_test("Logout", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Logout", False, str(e))
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting TeacherHub API Tests...")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Core tests
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
            
        if not self.test_login():
            print("❌ Login failed - stopping tests")
            return False
            
        # Authentication tests
        self.test_get_current_user()
        self.test_dashboard()
        
        # Class management tests
        self.test_get_classes()
        self.test_create_class()
        
        # Student management tests
        self.test_get_students()
        self.test_add_student()
        
        # Lesson planning tests
        self.test_get_lesson_plans()
        self.test_create_lesson_plan()
        
        # Attendance tests
        self.test_attendance()
        
        # Gradebook tests
        self.test_gradebook()
        
        # Profile tests
        self.test_profile_update()
        
        # Logout test
        self.test_logout()
        
        # Summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80  # Consider 80%+ as passing

def main():
    tester = TeacherHubAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())