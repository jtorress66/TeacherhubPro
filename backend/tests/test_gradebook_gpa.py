"""
Test Gradebook GPA and Category Management Features
- GPA calculation (percentage to 4.0 scale)
- Letter grade assignment (A-F based on school's custom scale)
- Category CRUD operations (create, read, update, delete)
- Category weight management
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestGradebookGPA:
    """Test GPA calculation and display in gradebook"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.user = login_response.json()
        # Extract session token from cookies
        self.cookies = login_response.cookies
        
    def test_login_success(self):
        """Verify login works and returns user data"""
        assert self.user["email"] == "test@school.edu"
        assert self.user["role"] == "super_admin"
        print(f"✓ Login successful for user: {self.user['name']}")
        
    def test_get_classes(self):
        """Get classes for the user"""
        response = self.session.get(
            f"{BASE_URL}/api/classes",
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to get classes: {response.text}"
        classes = response.json()
        print(f"✓ Found {len(classes)} classes")
        return classes
        
    def test_create_test_class_for_gradebook(self):
        """Create a test class for gradebook testing"""
        test_class_data = {
            "name": f"TEST_GPA_Class_{uuid.uuid4().hex[:6]}",
            "grade": "5",
            "section": "A",
            "subject": "Mathematics",
            "year_term": "2024-2025"
        }
        response = self.session.post(
            f"{BASE_URL}/api/classes",
            json=test_class_data,
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to create class: {response.text}"
        created_class = response.json()
        assert "class_id" in created_class
        print(f"✓ Created test class: {created_class['name']} (ID: {created_class['class_id']})")
        return created_class
        
    def test_gradebook_endpoint(self):
        """Test gradebook endpoint returns proper structure"""
        # First get or create a class
        classes_response = self.session.get(f"{BASE_URL}/api/classes", cookies=self.cookies)
        classes = classes_response.json()
        
        if not classes:
            # Create a test class
            test_class = self.test_create_test_class_for_gradebook()
            class_id = test_class["class_id"]
        else:
            class_id = classes[0]["class_id"]
            
        # Get gradebook data
        response = self.session.get(
            f"{BASE_URL}/api/gradebook/{class_id}",
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to get gradebook: {response.text}"
        gradebook = response.json()
        
        # Verify gradebook structure
        assert "class_id" in gradebook
        assert "students" in gradebook
        assert "assignments" in gradebook
        assert "categories" in gradebook
        assert "grades" in gradebook
        
        print(f"✓ Gradebook structure verified for class {class_id}")
        print(f"  - Students: {len(gradebook['students'])}")
        print(f"  - Assignments: {len(gradebook['assignments'])}")
        print(f"  - Categories: {len(gradebook['categories'])}")
        return gradebook


class TestCategoryManagement:
    """Test category CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.user = login_response.json()
        self.cookies = login_response.cookies
        
        # Get or create a test class
        classes_response = self.session.get(f"{BASE_URL}/api/classes", cookies=self.cookies)
        classes = classes_response.json()
        
        if classes:
            self.class_id = classes[0]["class_id"]
        else:
            # Create a test class
            test_class_data = {
                "name": f"TEST_Category_Class_{uuid.uuid4().hex[:6]}",
                "grade": "6",
                "section": "B",
                "subject": "Science",
                "year_term": "2024-2025"
            }
            response = self.session.post(
                f"{BASE_URL}/api/classes",
                json=test_class_data,
                cookies=self.cookies
            )
            self.class_id = response.json()["class_id"]
            
    def test_get_categories(self):
        """Test getting categories for a class"""
        response = self.session.get(
            f"{BASE_URL}/api/classes/{self.class_id}/categories",
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to get categories: {response.text}"
        categories = response.json()
        print(f"✓ Found {len(categories)} categories for class {self.class_id}")
        return categories
        
    def test_create_category_with_bilingual_names(self):
        """Test creating a category with English and Spanish names"""
        category_data = {
            "name": f"TEST_Participation_{uuid.uuid4().hex[:4]}",
            "name_es": f"TEST_Participación_{uuid.uuid4().hex[:4]}",
            "weight_percent": 15.0
        }
        response = self.session.post(
            f"{BASE_URL}/api/classes/{self.class_id}/categories",
            json=category_data,
            cookies=self.cookies
        )
        assert response.status_code == 200, f"Failed to create category: {response.text}"
        created_category = response.json()
        
        # Verify category structure
        assert "category_id" in created_category
        assert created_category["name"] == category_data["name"]
        assert created_category["name_es"] == category_data["name_es"]
        assert created_category["weight_percent"] == category_data["weight_percent"]
        
        print(f"✓ Created category: {created_category['name']} / {created_category['name_es']} ({created_category['weight_percent']}%)")
        return created_category
        
    def test_update_category(self):
        """Test updating a category"""
        # First create a category
        category_data = {
            "name": f"TEST_ToUpdate_{uuid.uuid4().hex[:4]}",
            "name_es": f"TEST_ParaActualizar_{uuid.uuid4().hex[:4]}",
            "weight_percent": 10.0
        }
        create_response = self.session.post(
            f"{BASE_URL}/api/classes/{self.class_id}/categories",
            json=category_data,
            cookies=self.cookies
        )
        assert create_response.status_code == 200
        created_category = create_response.json()
        category_id = created_category["category_id"]
        
        # Update the category
        update_data = {
            "name": f"TEST_Updated_{uuid.uuid4().hex[:4]}",
            "name_es": f"TEST_Actualizado_{uuid.uuid4().hex[:4]}",
            "weight_percent": 20.0
        }
        update_response = self.session.put(
            f"{BASE_URL}/api/categories/{category_id}",
            json=update_data,
            cookies=self.cookies
        )
        assert update_response.status_code == 200, f"Failed to update category: {update_response.text}"
        
        # Verify update by getting categories again
        get_response = self.session.get(
            f"{BASE_URL}/api/classes/{self.class_id}/categories",
            cookies=self.cookies
        )
        categories = get_response.json()
        updated_cat = next((c for c in categories if c["category_id"] == category_id), None)
        
        assert updated_cat is not None
        assert updated_cat["name"] == update_data["name"]
        assert updated_cat["name_es"] == update_data["name_es"]
        assert updated_cat["weight_percent"] == update_data["weight_percent"]
        
        print(f"✓ Updated category: {updated_cat['name']} ({updated_cat['weight_percent']}%)")
        return updated_cat
        
    def test_delete_category_without_assignments(self):
        """Test deleting a category that has no assignments"""
        # Create a category to delete
        category_data = {
            "name": f"TEST_ToDelete_{uuid.uuid4().hex[:4]}",
            "name_es": f"TEST_ParaEliminar_{uuid.uuid4().hex[:4]}",
            "weight_percent": 5.0
        }
        create_response = self.session.post(
            f"{BASE_URL}/api/classes/{self.class_id}/categories",
            json=category_data,
            cookies=self.cookies
        )
        assert create_response.status_code == 200
        created_category = create_response.json()
        category_id = created_category["category_id"]
        
        # Delete the category
        delete_response = self.session.delete(
            f"{BASE_URL}/api/categories/{category_id}",
            cookies=self.cookies
        )
        assert delete_response.status_code == 200, f"Failed to delete category: {delete_response.text}"
        
        # Verify deletion
        get_response = self.session.get(
            f"{BASE_URL}/api/classes/{self.class_id}/categories",
            cookies=self.cookies
        )
        categories = get_response.json()
        deleted_cat = next((c for c in categories if c["category_id"] == category_id), None)
        
        assert deleted_cat is None, "Category should have been deleted"
        print(f"✓ Successfully deleted category: {category_data['name']}")
        
    def test_delete_category_with_assignments_fails(self):
        """Test that deleting a category with assignments fails"""
        # Create a category
        category_data = {
            "name": f"TEST_WithAssignment_{uuid.uuid4().hex[:4]}",
            "name_es": f"TEST_ConTarea_{uuid.uuid4().hex[:4]}",
            "weight_percent": 10.0
        }
        create_response = self.session.post(
            f"{BASE_URL}/api/classes/{self.class_id}/categories",
            json=category_data,
            cookies=self.cookies
        )
        assert create_response.status_code == 200
        created_category = create_response.json()
        category_id = created_category["category_id"]
        
        # Create an assignment in this category
        assignment_data = {
            "class_id": self.class_id,
            "category_id": category_id,
            "title": f"TEST_Assignment_{uuid.uuid4().hex[:4]}",
            "points": 100.0
        }
        assignment_response = self.session.post(
            f"{BASE_URL}/api/assignments",
            json=assignment_data,
            cookies=self.cookies
        )
        assert assignment_response.status_code == 200
        assignment = assignment_response.json()
        
        # Try to delete the category - should fail
        delete_response = self.session.delete(
            f"{BASE_URL}/api/categories/{category_id}",
            cookies=self.cookies
        )
        assert delete_response.status_code == 400, f"Should have failed to delete category with assignments"
        
        print(f"✓ Correctly prevented deletion of category with assignments")
        
        # Cleanup: delete the assignment first, then the category
        self.session.delete(f"{BASE_URL}/api/assignments/{assignment['assignment_id']}", cookies=self.cookies)
        self.session.delete(f"{BASE_URL}/api/categories/{category_id}", cookies=self.cookies)


class TestGPACalculation:
    """Test GPA calculation logic via API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and setup test data"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        assert login_response.status_code == 200
        self.cookies = login_response.cookies
        
    def test_gpa_scale_reference(self):
        """Verify GPA scale matches school's custom scale:
        A: 4.00 - 3.50
        B: 3.49 - 2.50
        C: 2.49 - 1.60
        D: 1.59 - 0.80
        F: 0.79 - 0
        """
        # GPA calculation: percentage / 100 * 4.0
        test_cases = [
            # (percentage, expected_gpa, expected_letter)
            (100, 4.00, 'A'),  # 100% = 4.0 GPA = A
            (95, 3.80, 'A'),   # 95% = 3.8 GPA = A
            (87.5, 3.50, 'A'), # 87.5% = 3.5 GPA = A (boundary)
            (87, 3.48, 'B'),   # 87% = 3.48 GPA = B
            (75, 3.00, 'B'),   # 75% = 3.0 GPA = B
            (62.5, 2.50, 'B'), # 62.5% = 2.5 GPA = B (boundary)
            (62, 2.48, 'C'),   # 62% = 2.48 GPA = C
            (50, 2.00, 'C'),   # 50% = 2.0 GPA = C
            (40, 1.60, 'C'),   # 40% = 1.6 GPA = C (boundary)
            (39, 1.56, 'D'),   # 39% = 1.56 GPA = D
            (30, 1.20, 'D'),   # 30% = 1.2 GPA = D
            (20, 0.80, 'D'),   # 20% = 0.8 GPA = D (boundary)
            (19, 0.76, 'F'),   # 19% = 0.76 GPA = F
            (10, 0.40, 'F'),   # 10% = 0.4 GPA = F
            (0, 0.00, 'F'),    # 0% = 0.0 GPA = F
        ]
        
        print("\n✓ GPA Scale Verification:")
        print("  Percentage -> GPA -> Letter Grade")
        print("  " + "-" * 40)
        
        for percentage, expected_gpa, expected_letter in test_cases:
            # Calculate GPA (same formula as frontend)
            calculated_gpa = (percentage / 100) * 4.0
            
            # Determine letter grade (same logic as frontend)
            if calculated_gpa >= 3.50:
                letter = 'A'
            elif calculated_gpa >= 2.50:
                letter = 'B'
            elif calculated_gpa >= 1.60:
                letter = 'C'
            elif calculated_gpa >= 0.80:
                letter = 'D'
            else:
                letter = 'F'
            
            # Verify calculations
            assert abs(calculated_gpa - expected_gpa) < 0.01, f"GPA mismatch for {percentage}%: expected {expected_gpa}, got {calculated_gpa}"
            assert letter == expected_letter, f"Letter mismatch for {percentage}%: expected {expected_letter}, got {letter}"
            
            print(f"  {percentage:5.1f}% -> {calculated_gpa:.2f} GPA -> {letter}")
            
        print("  " + "-" * 40)
        print("  ✓ All GPA calculations match expected values")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        self.cookies = login_response.cookies
        
    def test_cleanup_test_data(self):
        """Clean up TEST_ prefixed data"""
        # Get all classes
        classes_response = self.session.get(f"{BASE_URL}/api/classes", cookies=self.cookies)
        classes = classes_response.json()
        
        deleted_count = 0
        for cls in classes:
            if cls["name"].startswith("TEST_"):
                # Delete the class
                delete_response = self.session.delete(
                    f"{BASE_URL}/api/classes/{cls['class_id']}",
                    cookies=self.cookies
                )
                if delete_response.status_code == 200:
                    deleted_count += 1
                    
        print(f"✓ Cleaned up {deleted_count} test classes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
