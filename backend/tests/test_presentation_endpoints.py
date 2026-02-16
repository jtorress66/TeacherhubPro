"""
Test suite for Presentation Creator endpoints
Tests: POST /api/ai/presentation/generate, CRUD for /api/ai/presentations
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@school.edu"
TEST_PASSWORD = "testpassword"


class TestPresentationEndpoints:
    """Test suite for Presentation Creator feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get session cookie
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.user_data = login_response.json()
        print(f"Logged in as: {self.user_data.get('email')}")
        
        yield
        
        # Cleanup - delete any test presentations created
        try:
            presentations = self.session.get(f"{BASE_URL}/api/ai/presentations").json()
            for pres in presentations:
                if pres.get('name', '').startswith('TEST_'):
                    self.session.delete(f"{BASE_URL}/api/ai/presentations/{pres['presentation_id']}")
        except Exception:
            pass
    
    # ==================== AI PRESENTATION GENERATION ====================
    
    def test_ai_presentation_generate_success(self):
        """Test AI presentation generation with valid inputs"""
        print("\n=== Testing AI Presentation Generation ===")
        
        payload = {
            "topic": "The Solar System",
            "subject": "Science",
            "grade_level": "4th",
            "num_slides": 4,
            "language": "en",
            "theme": "ocean"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/ai/presentation/generate",
            json=payload
        )
        
        print(f"Status: {response.status_code}")
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "title" in data, "Response should contain 'title'"
        assert "slides" in data, "Response should contain 'slides'"
        assert isinstance(data["slides"], list), "Slides should be a list"
        assert len(data["slides"]) > 0, "Should have at least one slide"
        
        # Verify slide structure
        first_slide = data["slides"][0]
        assert "template" in first_slide, "Slide should have 'template'"
        assert "title" in first_slide, "Slide should have 'title'"
        
        print(f"Generated presentation: {data.get('title')}")
        print(f"Number of slides: {len(data['slides'])}")
        print(f"First slide template: {first_slide.get('template')}")
        print("AI Presentation Generation: PASSED")
    
    def test_ai_presentation_generate_missing_fields(self):
        """Test AI presentation generation with missing required fields"""
        print("\n=== Testing AI Generation with Missing Fields ===")
        
        # Missing topic
        payload = {
            "subject": "Science",
            "grade_level": "4th"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/ai/presentation/generate",
            json=payload
        )
        
        # Should fail validation
        assert response.status_code == 422, f"Expected 422 for missing topic, got {response.status_code}"
        print("Missing fields validation: PASSED")
    
    # ==================== PRESENTATION CRUD ====================
    
    def test_create_presentation(self):
        """Test creating a new presentation"""
        print("\n=== Testing Create Presentation ===")
        
        payload = {
            "name": "TEST_My First Presentation",
            "topic": "Introduction to Fractions",
            "subject": "Math",
            "grade_level": "3rd",
            "theme_id": "ocean",
            "slides": [
                {
                    "template": "title",
                    "title": "Introduction to Fractions",
                    "subtitle": "Math - 3rd Grade",
                    "content": "",
                    "image": "📚",
                    "imageType": "emoji",
                    "bullets": []
                },
                {
                    "template": "content",
                    "title": "What are Fractions?",
                    "subtitle": "",
                    "content": "Fractions represent parts of a whole",
                    "image": "",
                    "imageType": "emoji",
                    "bullets": ["Numerator", "Denominator", "Equal parts"]
                }
            ]
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/ai/presentations",
            json=payload
        )
        
        print(f"Status: {response.status_code}")
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "presentation_id" in data, "Response should contain 'presentation_id'"
        assert "name" in data, "Response should contain 'name'"
        assert data["name"] == payload["name"], "Name should match"
        
        self.created_presentation_id = data["presentation_id"]
        print(f"Created presentation ID: {self.created_presentation_id}")
        print("Create Presentation: PASSED")
        
        return self.created_presentation_id
    
    def test_list_presentations(self):
        """Test listing user's presentations"""
        print("\n=== Testing List Presentations ===")
        
        # First create a presentation
        create_payload = {
            "name": "TEST_List Test Presentation",
            "topic": "Test Topic",
            "subject": "Science",
            "grade_level": "5th",
            "theme_id": "forest",
            "slides": [{"template": "title", "title": "Test", "subtitle": "", "content": "", "image": "", "imageType": "emoji", "bullets": []}]
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/ai/presentations", json=create_payload)
        assert create_response.status_code == 200
        created_id = create_response.json()["presentation_id"]
        
        # Now list presentations
        response = self.session.get(f"{BASE_URL}/api/ai/presentations")
        
        print(f"Status: {response.status_code}")
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Find our created presentation
        found = False
        for pres in data:
            if pres.get("presentation_id") == created_id:
                found = True
                assert "name" in pres, "Presentation should have 'name'"
                assert "slides_count" in pres, "Presentation should have 'slides_count'"
                assert "created_at" in pres, "Presentation should have 'created_at'"
                break
        
        assert found, f"Created presentation {created_id} not found in list"
        print(f"Total presentations: {len(data)}")
        print("List Presentations: PASSED")
    
    def test_get_presentation_by_id(self):
        """Test getting a specific presentation by ID"""
        print("\n=== Testing Get Presentation by ID ===")
        
        # First create a presentation
        create_payload = {
            "name": "TEST_Get By ID Presentation",
            "topic": "Specific Topic",
            "subject": "ELA",
            "grade_level": "2nd",
            "theme_id": "sunset",
            "slides": [
                {"template": "title", "title": "Test Title", "subtitle": "Test Subtitle", "content": "", "image": "🎯", "imageType": "emoji", "bullets": []},
                {"template": "content", "title": "Content Slide", "subtitle": "", "content": "Some content", "image": "", "imageType": "emoji", "bullets": ["Point 1", "Point 2"]}
            ]
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/ai/presentations", json=create_payload)
        assert create_response.status_code == 200
        created_id = create_response.json()["presentation_id"]
        
        # Get the presentation
        response = self.session.get(f"{BASE_URL}/api/ai/presentations/{created_id}")
        
        print(f"Status: {response.status_code}")
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert data["presentation_id"] == created_id, "ID should match"
        assert data["name"] == create_payload["name"], "Name should match"
        assert data["topic"] == create_payload["topic"], "Topic should match"
        assert data["subject"] == create_payload["subject"], "Subject should match"
        assert data["grade_level"] == create_payload["grade_level"], "Grade level should match"
        assert data["theme_id"] == create_payload["theme_id"], "Theme ID should match"
        assert "slides" in data, "Should have slides"
        assert len(data["slides"]) == 2, "Should have 2 slides"
        
        # Verify slide content
        assert data["slides"][0]["title"] == "Test Title", "First slide title should match"
        assert data["slides"][1]["bullets"] == ["Point 1", "Point 2"], "Second slide bullets should match"
        
        print(f"Retrieved presentation: {data['name']}")
        print(f"Slides count: {len(data['slides'])}")
        print("Get Presentation by ID: PASSED")
    
    def test_get_presentation_not_found(self):
        """Test getting a non-existent presentation"""
        print("\n=== Testing Get Non-existent Presentation ===")
        
        response = self.session.get(f"{BASE_URL}/api/ai/presentations/pres_nonexistent123")
        
        print(f"Status: {response.status_code}")
        
        # Should return 404
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Get Non-existent Presentation: PASSED")
    
    def test_update_presentation(self):
        """Test updating a presentation"""
        print("\n=== Testing Update Presentation ===")
        
        # First create a presentation
        create_payload = {
            "name": "TEST_Update Test Presentation",
            "topic": "Original Topic",
            "subject": "Math",
            "grade_level": "4th",
            "theme_id": "ocean",
            "slides": [{"template": "title", "title": "Original Title", "subtitle": "", "content": "", "image": "", "imageType": "emoji", "bullets": []}]
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/ai/presentations", json=create_payload)
        assert create_response.status_code == 200
        created_id = create_response.json()["presentation_id"]
        
        # Update the presentation
        update_payload = {
            "name": "TEST_Updated Presentation Name",
            "topic": "Updated Topic",
            "theme_id": "galaxy",
            "slides": [
                {"template": "title", "title": "Updated Title", "subtitle": "New Subtitle", "content": "", "image": "🚀", "imageType": "emoji", "bullets": []},
                {"template": "content", "title": "New Slide", "subtitle": "", "content": "Added content", "image": "", "imageType": "emoji", "bullets": ["New point"]}
            ]
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/ai/presentations/{created_id}",
            json=update_payload
        )
        
        print(f"Status: {response.status_code}")
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify update by fetching
        get_response = self.session.get(f"{BASE_URL}/api/ai/presentations/{created_id}")
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["name"] == update_payload["name"], "Name should be updated"
        assert data["topic"] == update_payload["topic"], "Topic should be updated"
        assert data["theme_id"] == update_payload["theme_id"], "Theme should be updated"
        assert len(data["slides"]) == 2, "Should have 2 slides after update"
        assert data["slides"][0]["title"] == "Updated Title", "First slide title should be updated"
        
        print(f"Updated presentation: {data['name']}")
        print("Update Presentation: PASSED")
    
    def test_update_presentation_not_found(self):
        """Test updating a non-existent presentation"""
        print("\n=== Testing Update Non-existent Presentation ===")
        
        update_payload = {"name": "TEST_Should Fail"}
        
        response = self.session.put(
            f"{BASE_URL}/api/ai/presentations/pres_nonexistent123",
            json=update_payload
        )
        
        print(f"Status: {response.status_code}")
        
        # Should return 404
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Update Non-existent Presentation: PASSED")
    
    def test_delete_presentation(self):
        """Test deleting a presentation"""
        print("\n=== Testing Delete Presentation ===")
        
        # First create a presentation
        create_payload = {
            "name": "TEST_Delete Test Presentation",
            "topic": "To Be Deleted",
            "subject": "Art",
            "grade_level": "K",
            "theme_id": "candy",
            "slides": [{"template": "title", "title": "Delete Me", "subtitle": "", "content": "", "image": "", "imageType": "emoji", "bullets": []}]
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/ai/presentations", json=create_payload)
        assert create_response.status_code == 200
        created_id = create_response.json()["presentation_id"]
        
        # Delete the presentation
        response = self.session.delete(f"{BASE_URL}/api/ai/presentations/{created_id}")
        
        print(f"Status: {response.status_code}")
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify deletion by trying to fetch
        get_response = self.session.get(f"{BASE_URL}/api/ai/presentations/{created_id}")
        assert get_response.status_code == 404, "Deleted presentation should return 404"
        
        print(f"Deleted presentation: {created_id}")
        print("Delete Presentation: PASSED")
    
    def test_delete_presentation_not_found(self):
        """Test deleting a non-existent presentation"""
        print("\n=== Testing Delete Non-existent Presentation ===")
        
        response = self.session.delete(f"{BASE_URL}/api/ai/presentations/pres_nonexistent123")
        
        print(f"Status: {response.status_code}")
        
        # Should return 404
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Delete Non-existent Presentation: PASSED")
    
    # ==================== FULL CRUD FLOW ====================
    
    def test_full_crud_flow(self):
        """Test complete Create -> Read -> Update -> Delete flow"""
        print("\n=== Testing Full CRUD Flow ===")
        
        # CREATE
        create_payload = {
            "name": "TEST_CRUD Flow Presentation",
            "topic": "CRUD Test Topic",
            "subject": "Science",
            "grade_level": "5th",
            "theme_id": "nature",
            "slides": [
                {"template": "title", "title": "CRUD Test", "subtitle": "Testing", "content": "", "image": "🧪", "imageType": "emoji", "bullets": []}
            ]
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/ai/presentations", json=create_payload)
        assert create_response.status_code == 200, f"CREATE failed: {create_response.text}"
        created_id = create_response.json()["presentation_id"]
        print(f"1. CREATE: Created {created_id}")
        
        # READ
        read_response = self.session.get(f"{BASE_URL}/api/ai/presentations/{created_id}")
        assert read_response.status_code == 200, f"READ failed: {read_response.text}"
        read_data = read_response.json()
        assert read_data["name"] == create_payload["name"], "READ: Name mismatch"
        print(f"2. READ: Retrieved {read_data['name']}")
        
        # UPDATE
        update_payload = {
            "name": "TEST_CRUD Flow Updated",
            "slides": [
                {"template": "title", "title": "Updated CRUD Test", "subtitle": "Updated", "content": "", "image": "✅", "imageType": "emoji", "bullets": []},
                {"template": "content", "title": "New Slide", "subtitle": "", "content": "Added via update", "image": "", "imageType": "emoji", "bullets": ["Point A"]}
            ]
        }
        
        update_response = self.session.put(f"{BASE_URL}/api/ai/presentations/{created_id}", json=update_payload)
        assert update_response.status_code == 200, f"UPDATE failed: {update_response.text}"
        
        # Verify update
        verify_response = self.session.get(f"{BASE_URL}/api/ai/presentations/{created_id}")
        verify_data = verify_response.json()
        assert verify_data["name"] == update_payload["name"], "UPDATE: Name not updated"
        assert len(verify_data["slides"]) == 2, "UPDATE: Slides not updated"
        print(f"3. UPDATE: Updated to {verify_data['name']}")
        
        # DELETE
        delete_response = self.session.delete(f"{BASE_URL}/api/ai/presentations/{created_id}")
        assert delete_response.status_code == 200, f"DELETE failed: {delete_response.text}"
        
        # Verify deletion
        final_response = self.session.get(f"{BASE_URL}/api/ai/presentations/{created_id}")
        assert final_response.status_code == 404, "DELETE: Presentation still exists"
        print(f"4. DELETE: Deleted {created_id}")
        
        print("Full CRUD Flow: PASSED")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
