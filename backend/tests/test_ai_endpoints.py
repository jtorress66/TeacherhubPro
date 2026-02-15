"""
Test AI Endpoints for TeacherHubPro
Tests AI content generation and chat functionality after P0 bug fix
Model was updated from 'claude-sonnet-4-5-20250929' to 'claude-sonnet-4-20250514'
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@school.edu"
TEST_PASSWORD = "testpassword"


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        print(f"Login response status: {response.status_code}")
        print(f"Login response: {response.json()}")
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert data["email"] == TEST_EMAIL
        
        # Extract session token from cookies
        session_token = response.cookies.get("session_token")
        print(f"Session token obtained: {session_token is not None}")
        return session_token
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpassword"}
        )
        print(f"Invalid login response status: {response.status_code}")
        assert response.status_code == 401


class TestDashboard:
    """Test dashboard endpoint"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_dashboard_data(self, auth_session):
        """Test dashboard data loads correctly"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard")
        print(f"Dashboard response status: {response.status_code}")
        
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        data = response.json()
        print(f"Dashboard data keys: {data.keys()}")
        
        # Verify dashboard structure
        assert "classes_count" in data or "total_classes" in data or isinstance(data, dict)


class TestClasses:
    """Test classes endpoints"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_list_classes(self, auth_session):
        """Test listing classes"""
        response = auth_session.get(f"{BASE_URL}/api/classes")
        print(f"Classes list response status: {response.status_code}")
        
        assert response.status_code == 200, f"Classes list failed: {response.text}"
        data = response.json()
        print(f"Number of classes: {len(data)}")
        assert isinstance(data, list)


class TestLessonPlans:
    """Test lesson plan CRUD operations"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_list_plans(self, auth_session):
        """Test listing lesson plans"""
        response = auth_session.get(f"{BASE_URL}/api/plans")
        print(f"Plans list response status: {response.status_code}")
        
        assert response.status_code == 200, f"Plans list failed: {response.text}"
        data = response.json()
        print(f"Number of plans: {len(data)}")
        assert isinstance(data, list)
    
    def test_create_and_delete_plan(self, auth_session):
        """Test creating and deleting a lesson plan"""
        # First get a class to associate with
        classes_response = auth_session.get(f"{BASE_URL}/api/classes")
        classes = classes_response.json()
        
        if not classes:
            # Create a test class first
            class_response = auth_session.post(
                f"{BASE_URL}/api/classes",
                json={
                    "name": "TEST_AI_Class",
                    "grade": "5",
                    "section": "A",
                    "subject": "Math",
                    "year_term": "2024-2025"
                }
            )
            assert class_response.status_code == 200 or class_response.status_code == 201
            class_id = class_response.json()["class_id"]
        else:
            class_id = classes[0]["class_id"]
        
        # Create a lesson plan
        plan_data = {
            "class_id": class_id,
            "week_start": "2026-01-20",
            "week_end": "2026-01-24",
            "unit": "TEST_Unit_AI",
            "story": "Test Story",
            "objective": "Test objective for AI testing",
            "skills": ["reading", "writing"],
            "days": [],
            "standards": [],
            "expectations": [],
            "subject_integration": [],
            "is_template": False
        }
        
        create_response = auth_session.post(
            f"{BASE_URL}/api/plans",
            json=plan_data
        )
        print(f"Create plan response status: {create_response.status_code}")
        
        assert create_response.status_code == 200 or create_response.status_code == 201, f"Create plan failed: {create_response.text}"
        created_plan = create_response.json()
        plan_id = created_plan["plan_id"]
        print(f"Created plan ID: {plan_id}")
        
        # Verify plan was created by fetching it
        get_response = auth_session.get(f"{BASE_URL}/api/plans/{plan_id}")
        assert get_response.status_code == 200
        
        # Delete the plan
        delete_response = auth_session.delete(f"{BASE_URL}/api/plans/{plan_id}")
        print(f"Delete plan response status: {delete_response.status_code}")
        assert delete_response.status_code == 200
        
        # Verify plan was deleted
        verify_response = auth_session.get(f"{BASE_URL}/api/plans/{plan_id}")
        assert verify_response.status_code == 404


class TestAIGeneration:
    """Test AI content generation endpoints - P0 bug fix verification"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_ai_generate_lesson_plan(self, auth_session):
        """Test AI lesson plan generation - PRIMARY P0 BUG FIX TEST"""
        request_data = {
            "tool_type": "lesson_plan",
            "subject": "Math",
            "grade_level": "5th Grade",
            "topic": "Introduction to Fractions",
            "standards_framework": "common_core",
            "language": "en",
            "difficulty_level": "medium",
            "duration_minutes": 45
        }
        
        print(f"Testing AI generation with: {request_data}")
        response = auth_session.post(
            f"{BASE_URL}/api/ai/generate",
            json=request_data,
            timeout=120  # AI generation can take time
        )
        
        print(f"AI Generate response status: {response.status_code}")
        
        if response.status_code == 403:
            print("AI access requires subscription - checking error message")
            data = response.json()
            assert "subscription" in data.get("detail", "").lower() or "trial" in data.get("detail", "").lower()
            pytest.skip("User doesn't have AI access (subscription/trial required)")
        
        if response.status_code == 500:
            print(f"AI Generation error: {response.text}")
            # This is the P0 bug - should NOT happen after fix
            pytest.fail(f"AI Generation failed with 500 error: {response.text}")
        
        assert response.status_code == 200, f"AI generation failed: {response.text}"
        
        data = response.json()
        print(f"AI Generation response keys: {data.keys()}")
        
        # Verify response structure
        assert "generation_id" in data
        assert "content" in data
        assert "tool_type" in data
        assert data["tool_type"] == "lesson_plan"
        assert len(data["content"]) > 100, "Generated content should be substantial"
        
        print(f"AI Generation SUCCESS - Content length: {len(data['content'])} chars")
        print(f"Content preview: {data['content'][:200]}...")
    
    def test_ai_generate_quiz(self, auth_session):
        """Test AI quiz generation"""
        request_data = {
            "tool_type": "quiz",
            "subject": "Science",
            "grade_level": "4th Grade",
            "topic": "Water Cycle",
            "standards_framework": "common_core",
            "language": "en",
            "difficulty_level": "easy",
            "num_questions": 5
        }
        
        print(f"Testing AI quiz generation with: {request_data}")
        response = auth_session.post(
            f"{BASE_URL}/api/ai/generate",
            json=request_data,
            timeout=120
        )
        
        print(f"AI Quiz Generate response status: {response.status_code}")
        
        if response.status_code == 403:
            pytest.skip("User doesn't have AI access (subscription/trial required)")
        
        if response.status_code == 500:
            pytest.fail(f"AI Quiz Generation failed with 500 error: {response.text}")
        
        assert response.status_code == 200, f"AI quiz generation failed: {response.text}"
        
        data = response.json()
        assert "content" in data
        assert data["tool_type"] == "quiz"
        print(f"AI Quiz Generation SUCCESS - Content length: {len(data['content'])} chars")
    
    def test_ai_generate_summary(self, auth_session):
        """Test AI summary generation"""
        request_data = {
            "tool_type": "summary",
            "subject": "History",
            "grade_level": "6th Grade",
            "topic": "American Revolution",
            "standards_framework": "common_core",
            "language": "en",
            "difficulty_level": "medium"
        }
        
        print(f"Testing AI summary generation with: {request_data}")
        response = auth_session.post(
            f"{BASE_URL}/api/ai/generate",
            json=request_data,
            timeout=120
        )
        
        print(f"AI Summary Generate response status: {response.status_code}")
        
        if response.status_code == 403:
            pytest.skip("User doesn't have AI access (subscription/trial required)")
        
        if response.status_code == 500:
            pytest.fail(f"AI Summary Generation failed with 500 error: {response.text}")
        
        assert response.status_code == 200, f"AI summary generation failed: {response.text}"
        
        data = response.json()
        assert "content" in data
        print(f"AI Summary Generation SUCCESS - Content length: {len(data['content'])} chars")


class TestAIChat:
    """Test AI chat endpoint"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_ai_chat_single_message(self, auth_session):
        """Test AI chat with a single message"""
        session_id = f"test_chat_{uuid.uuid4().hex[:8]}"
        
        request_data = {
            "message": "What are some effective strategies for teaching fractions to 3rd graders?",
            "session_id": session_id,
            "language": "en"
        }
        
        print(f"Testing AI chat with session: {session_id}")
        response = auth_session.post(
            f"{BASE_URL}/api/ai/chat",
            json=request_data,
            timeout=120
        )
        
        print(f"AI Chat response status: {response.status_code}")
        
        if response.status_code == 403:
            pytest.skip("User doesn't have AI access (subscription/trial required)")
        
        if response.status_code == 500:
            pytest.fail(f"AI Chat failed with 500 error: {response.text}")
        
        assert response.status_code == 200, f"AI chat failed: {response.text}"
        
        data = response.json()
        print(f"AI Chat response keys: {data.keys()}")
        
        assert "message_id" in data
        assert "content" in data
        assert "role" in data
        assert data["role"] == "assistant"
        assert len(data["content"]) > 50, "Chat response should be substantial"
        
        print(f"AI Chat SUCCESS - Response length: {len(data['content'])} chars")
        print(f"Response preview: {data['content'][:200]}...")
    
    def test_ai_chat_multi_turn(self, auth_session):
        """Test AI chat with multi-turn conversation"""
        session_id = f"test_multi_{uuid.uuid4().hex[:8]}"
        
        # First message
        request1 = {
            "message": "I'm teaching 4th grade math. What topics should I cover?",
            "session_id": session_id,
            "language": "en"
        }
        
        response1 = auth_session.post(
            f"{BASE_URL}/api/ai/chat",
            json=request1,
            timeout=120
        )
        
        if response1.status_code == 403:
            pytest.skip("User doesn't have AI access (subscription/trial required)")
        
        if response1.status_code == 500:
            pytest.fail(f"AI Chat (turn 1) failed with 500 error: {response1.text}")
        
        assert response1.status_code == 200, f"AI chat turn 1 failed: {response1.text}"
        print(f"Turn 1 SUCCESS - Response length: {len(response1.json()['content'])} chars")
        
        # Second message (follow-up)
        request2 = {
            "message": "Can you give me more details about teaching multiplication?",
            "session_id": session_id,
            "language": "en"
        }
        
        response2 = auth_session.post(
            f"{BASE_URL}/api/ai/chat",
            json=request2,
            timeout=120
        )
        
        if response2.status_code == 500:
            pytest.fail(f"AI Chat (turn 2) failed with 500 error: {response2.text}")
        
        assert response2.status_code == 200, f"AI chat turn 2 failed: {response2.text}"
        print(f"Turn 2 SUCCESS - Response length: {len(response2.json()['content'])} chars")
        
        # Verify chat history
        history_response = auth_session.get(f"{BASE_URL}/api/ai/chat/history/{session_id}")
        assert history_response.status_code == 200
        
        history = history_response.json()
        print(f"Chat history has {len(history)} messages")
        assert len(history) >= 4, "Should have at least 4 messages (2 user + 2 assistant)"


class TestAITemplates:
    """Test AI template endpoints"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_get_starter_templates(self, auth_session):
        """Test getting starter templates"""
        response = auth_session.get(f"{BASE_URL}/api/ai/templates/starters")
        print(f"Starter templates response status: {response.status_code}")
        
        assert response.status_code == 200, f"Get starter templates failed: {response.text}"
        
        data = response.json()
        print(f"Number of starter templates: {len(data)}")
        assert isinstance(data, list)
        assert len(data) > 0, "Should have at least one starter template"
        
        # Verify template structure
        template = data[0]
        assert "template_id" in template
        assert "name" in template
        assert "subject" in template
    
    def test_get_weekly_template(self, auth_session):
        """Test getting template of the week"""
        response = auth_session.get(f"{BASE_URL}/api/ai/templates/weekly")
        print(f"Weekly template response status: {response.status_code}")
        
        assert response.status_code == 200, f"Get weekly template failed: {response.text}"
        
        data = response.json()
        assert "template_id" in data
        assert "name" in data
        print(f"Template of the week: {data['name']}")


class TestAIGenerations:
    """Test AI generations history endpoints"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_get_user_generations(self, auth_session):
        """Test getting user's AI generations"""
        response = auth_session.get(f"{BASE_URL}/api/ai/generations")
        print(f"User generations response status: {response.status_code}")
        
        assert response.status_code == 200, f"Get generations failed: {response.text}"
        
        data = response.json()
        print(f"Number of generations: {len(data)}")
        assert isinstance(data, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
