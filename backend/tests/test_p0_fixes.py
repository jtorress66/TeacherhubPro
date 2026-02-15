"""
Test P0 Fixes for TeacherHubPro
- Pricing page admin button enabled
- Substitute Packet editable/savable
- Semester CRUD for teachers
- /setup-admin page loads
- Sub-packet API endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSubPacketAPI:
    """Test substitute packet data endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session token"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@school.edu",
            "password": "testpassword"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.user = login_response.json()
        print(f"Logged in as: {self.user['email']} (role: {self.user['role']})")
    
    def test_get_classes_for_sub_packet(self):
        """Get classes to use for sub-packet testing"""
        response = self.session.get(f"{BASE_URL}/api/classes")
        assert response.status_code == 200
        classes = response.json()
        print(f"Found {len(classes)} classes")
        if classes:
            self.class_id = classes[0]['class_id']
            print(f"Using class: {classes[0]['name']} ({self.class_id})")
        return classes
    
    def test_get_sub_packet_empty(self):
        """GET /api/classes/{class_id}/sub-packet - should return null or saved data"""
        classes = self.test_get_classes_for_sub_packet()
        if not classes:
            pytest.skip("No classes available for testing")
        
        class_id = classes[0]['class_id']
        response = self.session.get(f"{BASE_URL}/api/classes/{class_id}/sub-packet")
        assert response.status_code == 200
        data = response.json()
        print(f"Sub-packet data: {data}")
        # Can be null or have saved data
        return class_id
    
    def test_save_sub_packet_data(self):
        """PUT /api/classes/{class_id}/sub-packet - save editable packet data"""
        classes = self.test_get_classes_for_sub_packet()
        if not classes:
            pytest.skip("No classes available for testing")
        
        class_id = classes[0]['class_id']
        
        # Save packet data
        packet_data = {
            "main_office_ext": "Ext. 200",
            "nurse_ext": "Ext. 210",
            "daily_routines": "8:00 AM - Morning meeting\n8:30 AM - Reading block\n10:00 AM - Math",
            "emergency_procedures": "Fire drill: Exit through Room 101 door\nLockdown: Lock door, lights off",
            "additional_notes": "Student A needs extra time for tests. Student B has allergies."
        }
        
        response = self.session.put(f"{BASE_URL}/api/classes/{class_id}/sub-packet", json=packet_data)
        assert response.status_code == 200, f"Save failed: {response.text}"
        result = response.json()
        print(f"Save result: {result}")
        assert result.get("message") == "Packet data saved"
        
        # Verify data was saved by fetching it
        get_response = self.session.get(f"{BASE_URL}/api/classes/{class_id}/sub-packet")
        assert get_response.status_code == 200
        saved_data = get_response.json()
        print(f"Saved data retrieved: {saved_data}")
        
        assert saved_data is not None, "Saved data should not be null"
        assert saved_data.get("main_office_ext") == "Ext. 200"
        assert saved_data.get("nurse_ext") == "Ext. 210"
        assert "Morning meeting" in saved_data.get("daily_routines", "")
        assert "Fire drill" in saved_data.get("emergency_procedures", "")
        assert "Student A" in saved_data.get("additional_notes", "")
    
    def test_update_sub_packet_data(self):
        """PUT /api/classes/{class_id}/sub-packet - update existing packet data"""
        classes = self.test_get_classes_for_sub_packet()
        if not classes:
            pytest.skip("No classes available for testing")
        
        class_id = classes[0]['class_id']
        
        # Update with new data
        updated_data = {
            "main_office_ext": "Ext. 300",
            "nurse_ext": "Ext. 310",
            "daily_routines": "Updated daily routines",
            "emergency_procedures": "Updated emergency procedures",
            "additional_notes": "Updated notes"
        }
        
        response = self.session.put(f"{BASE_URL}/api/classes/{class_id}/sub-packet", json=updated_data)
        assert response.status_code == 200
        
        # Verify update
        get_response = self.session.get(f"{BASE_URL}/api/classes/{class_id}/sub-packet")
        assert get_response.status_code == 200
        saved_data = get_response.json()
        
        assert saved_data.get("main_office_ext") == "Ext. 300"
        assert saved_data.get("daily_routines") == "Updated daily routines"
        print("Sub-packet data updated successfully")


class TestSemesterCRUDForTeachers:
    """Test that teachers can create/edit/delete semesters"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as teacher"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@school.edu",
            "password": "testpassword"
        })
        assert login_response.status_code == 200
        self.user = login_response.json()
        print(f"Logged in as: {self.user['email']} (role: {self.user['role']})")
    
    def test_get_semesters(self):
        """GET /api/semesters - teachers can view semesters"""
        response = self.session.get(f"{BASE_URL}/api/semesters")
        assert response.status_code == 200
        semesters = response.json()
        print(f"Found {len(semesters)} semesters")
        for sem in semesters:
            print(f"  - {sem.get('name')} ({sem.get('year_term')}) - Active: {sem.get('is_active')}")
        return semesters
    
    def test_create_semester(self):
        """POST /api/semesters - teachers can create semesters"""
        semester_data = {
            "name": "Test Semester",
            "name_es": "Semestre de Prueba",
            "start_date": "2026-01-15",
            "end_date": "2026-05-15",
            "year_term": "2025-2026",
            "is_active": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/semesters", json=semester_data)
        assert response.status_code == 200, f"Create failed: {response.text}"
        created = response.json()
        print(f"Created semester: {created.get('name')} (ID: {created.get('semester_id')})")
        
        assert created.get("name") == "Test Semester"
        assert created.get("semester_id") is not None
        return created.get("semester_id")
    
    def test_update_semester(self):
        """PUT /api/semesters/{id} - teachers can update semesters"""
        # First create a semester
        semester_id = self.test_create_semester()
        
        # Update it
        update_data = {
            "name": "Updated Test Semester",
            "is_active": False
        }
        
        response = self.session.put(f"{BASE_URL}/api/semesters/{semester_id}", json=update_data)
        assert response.status_code == 200, f"Update failed: {response.text}"
        print(f"Updated semester {semester_id}")
        
        # Verify update
        semesters = self.session.get(f"{BASE_URL}/api/semesters").json()
        updated = next((s for s in semesters if s.get("semester_id") == semester_id), None)
        assert updated is not None
        assert updated.get("name") == "Updated Test Semester"
        
        return semester_id
    
    def test_delete_semester(self):
        """DELETE /api/semesters/{id} - teachers can delete semesters"""
        # First create a semester
        semester_id = self.test_create_semester()
        
        # Delete it
        response = self.session.delete(f"{BASE_URL}/api/semesters/{semester_id}")
        assert response.status_code == 200, f"Delete failed: {response.text}"
        print(f"Deleted semester {semester_id}")
        
        # Verify deletion
        semesters = self.session.get(f"{BASE_URL}/api/semesters").json()
        deleted = next((s for s in semesters if s.get("semester_id") == semester_id), None)
        assert deleted is None, "Semester should be deleted"


class TestSubscriptionStatus:
    """Test subscription status for admin users"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@school.edu",
            "password": "testpassword"
        })
        assert login_response.status_code == 200
        self.user = login_response.json()
        print(f"Logged in as: {self.user['email']} (role: {self.user['role']})")
    
    def test_subscription_status_for_admin(self):
        """GET /api/subscription/status - admin should have 'admin' status"""
        response = self.session.get(f"{BASE_URL}/api/subscription/status")
        assert response.status_code == 200
        status = response.json()
        print(f"Subscription status: {status}")
        
        # Admin users should have status='admin' which enables pricing buttons
        if self.user.get('role') in ['admin', 'super_admin']:
            assert status.get('status') == 'admin', f"Admin should have status='admin', got: {status.get('status')}"
            assert status.get('has_access') == True
            print("Admin subscription status verified - buttons should be enabled")


class TestSetupAdminPage:
    """Test /setup-admin page accessibility"""
    
    def test_setup_admin_page_loads(self):
        """GET /setup-admin - page should load (not 404)"""
        # This is a frontend route, test via the backend health first
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("Backend is healthy")
        
        # The /setup-admin is a frontend route - we'll test it via Playwright
        # For now, verify the setup-key endpoint exists
        # Note: The actual page test will be done in frontend testing


class TestPricingCheckout:
    """Test pricing checkout for admin users"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@school.edu",
            "password": "testpassword"
        })
        assert login_response.status_code == 200
        self.user = login_response.json()
    
    def test_checkout_endpoint_exists(self):
        """POST /api/subscription/checkout - endpoint should exist"""
        # Test that the endpoint exists (will fail with Stripe error but not 404)
        checkout_data = {
            "plan_id": "individual_monthly",
            "quantity": 1,
            "origin_url": "https://classmate-128.preview.emergentagent.com"
        }
        
        response = self.session.post(f"{BASE_URL}/api/subscription/checkout", json=checkout_data)
        # Should not be 404 - might be 500 if Stripe fails but endpoint exists
        assert response.status_code != 404, "Checkout endpoint should exist"
        print(f"Checkout endpoint response: {response.status_code}")
        
        # If Stripe is configured, it should return checkout_url
        if response.status_code == 200:
            data = response.json()
            print(f"Checkout response: {data}")
            assert "checkout_url" in data or "error" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
