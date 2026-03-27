"""
Test suite for Chatbot Lead Generation API endpoints
Tests: POST /api/chatbot/message, POST /api/chatbot/lead, GET /api/chatbot/leads, GET /api/chatbot/leads/stats
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@school.edu"
TEST_PASSWORD = "testpassword"


class TestChatbotMessageEndpoint:
    """Tests for POST /api/chatbot/message - AI chatbot responses"""
    
    def test_chatbot_message_basic(self):
        """Test basic chatbot message with role context"""
        session_id = f"test_session_{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/chatbot/message",
            json={
                "session_id": session_id,
                "message": "I am a Teacher.",
                "page_url": "/",
                "visitor_role": "teacher"
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "response" in data, "Response should contain 'response' field"
        assert "session_id" in data, "Response should contain 'session_id' field"
        assert data["session_id"] == session_id
        assert len(data["response"]) > 0, "AI response should not be empty"
        print(f"✓ Chatbot message test passed. AI response: {data['response'][:100]}...")
    
    def test_chatbot_message_with_interest(self):
        """Test chatbot message with role and interest context"""
        session_id = f"test_session_{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/chatbot/message",
            json={
                "session_id": session_id,
                "message": "I'm most interested in: Lesson Planning",
                "page_url": "/features",
                "visitor_role": "teacher",
                "visitor_interest": "lesson_planning"
            },
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 0
        print(f"✓ Chatbot message with interest test passed")
    
    def test_chatbot_message_district_admin(self):
        """Test chatbot message for district/admin role (high priority lead context)"""
        session_id = f"test_session_{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/chatbot/message",
            json={
                "session_id": session_id,
                "message": "I'm a district administrator looking for enterprise solutions",
                "page_url": "/pricing",
                "visitor_role": "district"
            },
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        print(f"✓ District admin chatbot message test passed")


class TestLeadCaptureEndpoint:
    """Tests for POST /api/chatbot/lead - Lead capture and scoring"""
    
    def test_capture_lead_teacher_medium_priority(self):
        """Test lead capture for teacher role - should be medium priority"""
        session_id = f"test_session_{uuid.uuid4().hex[:8]}"
        lead_data = {
            "session_id": session_id,
            "first_name": "TEST_Jane",
            "last_name": "Teacher",
            "email": f"test_teacher_{uuid.uuid4().hex[:6]}@school.edu",
            "school_org": "Test Elementary School",
            "role_title": "5th Grade Teacher",
            "phone": "555-0101",
            "interest": "Lesson Planning",
            "visitor_category": "teacher",
            "interest_category": "lesson_planning",
            "page_url": "/features",
            "chat_summary": "user: I am a Teacher.\nassistant: Great! What are you interested in?"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chatbot/lead",
            json=lead_data,
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "lead_id" in data, "Response should contain lead_id"
        assert "lead_score" in data, "Response should contain lead_score"
        assert data["lead_score"] == "medium", f"Teacher role should be medium priority, got {data['lead_score']}"
        assert "message" in data
        print(f"✓ Teacher lead capture test passed. Lead ID: {data['lead_id']}, Score: {data['lead_score']}")
        return data["lead_id"]
    
    def test_capture_lead_district_high_priority(self):
        """Test lead capture for district role - should be high priority"""
        session_id = f"test_session_{uuid.uuid4().hex[:8]}"
        lead_data = {
            "session_id": session_id,
            "first_name": "TEST_Robert",
            "last_name": "Admin",
            "email": f"test_admin_{uuid.uuid4().hex[:6]}@district.edu",
            "school_org": "Test School District",
            "role_title": "Technology Director",
            "phone": "555-0202",
            "interest": "Enterprise Solution",
            "visitor_category": "district",
            "interest_category": "demo",
            "page_url": "/pricing",
            "chat_summary": "user: I'm a district administrator.\nassistant: I'd be happy to help with enterprise solutions!"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chatbot/lead",
            json=lead_data,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["lead_score"] == "high", f"District role should be high priority, got {data['lead_score']}"
        print(f"✓ District lead capture test passed. Lead ID: {data['lead_id']}, Score: {data['lead_score']}")
        return data["lead_id"]
    
    def test_capture_lead_administrator_high_priority(self):
        """Test lead capture for administrator role - should be high priority"""
        session_id = f"test_session_{uuid.uuid4().hex[:8]}"
        lead_data = {
            "session_id": session_id,
            "first_name": "TEST_Principal",
            "last_name": "Smith",
            "email": f"test_principal_{uuid.uuid4().hex[:6]}@school.edu",
            "school_org": "Test High School",
            "role_title": "Principal",
            "visitor_category": "administrator",
            "interest_category": "school_solution",
            "page_url": "/enterprise-overview"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chatbot/lead",
            json=lead_data,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["lead_score"] == "high", f"Administrator role should be high priority, got {data['lead_score']}"
        print(f"✓ Administrator lead capture test passed. Score: {data['lead_score']}")
    
    def test_capture_lead_minimal_fields(self):
        """Test lead capture with only required fields (first_name, email)"""
        session_id = f"test_session_{uuid.uuid4().hex[:8]}"
        lead_data = {
            "session_id": session_id,
            "first_name": "TEST_Minimal",
            "last_name": "",
            "email": f"test_minimal_{uuid.uuid4().hex[:6]}@test.com"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chatbot/lead",
            json=lead_data,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "lead_id" in data
        # With just email, should be medium priority
        assert data["lead_score"] == "medium", f"Lead with email should be medium priority, got {data['lead_score']}"
        print(f"✓ Minimal lead capture test passed")


class TestLeadsListEndpoint:
    """Tests for GET /api/chatbot/leads - Requires authentication"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30
        )
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code}")
        return session
    
    def test_leads_list_requires_auth(self):
        """Test that leads list endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/chatbot/leads",
            timeout=30
        )
        
        assert response.status_code == 401, f"Expected 401 for unauthenticated request, got {response.status_code}"
        print(f"✓ Leads list auth check passed - returns 401 without auth")
    
    def test_leads_list_with_auth(self, auth_session):
        """Test leads list with authenticated session"""
        response = auth_session.get(
            f"{BASE_URL}/api/chatbot/leads",
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "leads" in data, "Response should contain 'leads' array"
        assert "total" in data, "Response should contain 'total' count"
        assert isinstance(data["leads"], list)
        print(f"✓ Leads list test passed. Total leads: {data['total']}")
        
        # Verify lead structure if leads exist
        if len(data["leads"]) > 0:
            lead = data["leads"][0]
            expected_fields = ["lead_id", "first_name", "email", "lead_score", "status", "created_at"]
            for field in expected_fields:
                assert field in lead, f"Lead should contain '{field}' field"
            print(f"✓ Lead structure verified: {list(lead.keys())}")


class TestLeadsStatsEndpoint:
    """Tests for GET /api/chatbot/leads/stats - Requires authentication"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30
        )
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code}")
        return session
    
    def test_leads_stats_requires_auth(self):
        """Test that leads stats endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/chatbot/leads/stats",
            timeout=30
        )
        
        assert response.status_code == 401, f"Expected 401 for unauthenticated request, got {response.status_code}"
        print(f"✓ Leads stats auth check passed - returns 401 without auth")
    
    def test_leads_stats_with_auth(self, auth_session):
        """Test leads stats with authenticated session"""
        response = auth_session.get(
            f"{BASE_URL}/api/chatbot/leads/stats",
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        expected_fields = ["total", "high_priority", "medium_priority", "low_priority", "new_leads"]
        for field in expected_fields:
            assert field in data, f"Stats should contain '{field}' field"
            assert isinstance(data[field], int), f"'{field}' should be an integer"
        
        print(f"✓ Leads stats test passed. Stats: total={data['total']}, high={data['high_priority']}, medium={data['medium_priority']}, low={data['low_priority']}, new={data['new_leads']}")


class TestLeadScoring:
    """Tests for lead scoring logic"""
    
    def test_scoring_high_priority_roles(self):
        """Test that high priority roles get high score"""
        high_priority_roles = ["district", "administrator", "admin", "principal"]
        
        for role in high_priority_roles:
            session_id = f"test_session_{uuid.uuid4().hex[:8]}"
            response = requests.post(
                f"{BASE_URL}/api/chatbot/lead",
                json={
                    "session_id": session_id,
                    "first_name": f"TEST_{role}",
                    "last_name": "User",
                    "email": f"test_{role}_{uuid.uuid4().hex[:6]}@test.com",
                    "visitor_category": role
                },
                timeout=30
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["lead_score"] == "high", f"Role '{role}' should be high priority, got {data['lead_score']}"
        
        print(f"✓ High priority role scoring test passed for: {high_priority_roles}")
    
    def test_scoring_high_priority_interests(self):
        """Test that high priority interests get high score"""
        high_priority_interests = ["demo", "enterprise", "school solution"]
        
        for interest in high_priority_interests:
            session_id = f"test_session_{uuid.uuid4().hex[:8]}"
            response = requests.post(
                f"{BASE_URL}/api/chatbot/lead",
                json={
                    "session_id": session_id,
                    "first_name": "TEST_Interest",
                    "last_name": "User",
                    "email": f"test_interest_{uuid.uuid4().hex[:6]}@test.com",
                    "interest_category": interest
                },
                timeout=30
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["lead_score"] == "high", f"Interest '{interest}' should be high priority, got {data['lead_score']}"
        
        print(f"✓ High priority interest scoring test passed")


# Cleanup fixture to remove test leads after tests
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_leads():
    """Cleanup TEST_ prefixed leads after all tests"""
    yield
    # Note: In production, you'd want to delete test leads here
    # For now, we just log that cleanup would happen
    print("\n[Cleanup] Test leads with TEST_ prefix should be cleaned up in production")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
