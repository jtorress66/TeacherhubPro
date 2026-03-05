"""
Play to Learn - Mode Selection and Game Rendering Tests
Tests for:
1. Student can join a game session and see mode selection when game_type is 'all_modes'
2. Student game renders correctly for 'quiz' mode after selecting it
3. Student game renders correctly for 'fill_blank' mode
4. Student game renders correctly for 'true_false' mode
5. Teacher Host view shows back button in lobby
6. Teacher Host view shows PIN and players list in lobby
7. API endpoint GET /api/play-to-learn/sessions/{session_id} returns allowed_game_types
8. API endpoint POST /api/play-to-learn/sessions/select-mode works for selecting mode
"""

import pytest
import requests
import os
import json
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://educator-compliance.preview.emergentagent.com')

class TestPlayToLearnModeSelection:
    """Test suite for Play to Learn mode selection and game rendering"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get session token
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed - skipping tests")
        
        # Extract token from cookies
        self.token = login_response.cookies.get('session_token')
        if self.token:
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        self.user_data = login_response.json()
        print(f"Logged in as: {self.user_data.get('email')}")
    
    # ==================== ALL MODES SESSION TESTS ====================
    
    def test_create_all_modes_session(self):
        """Test creating a session with game_type='all_modes' for student choice"""
        # First create an assignment with multiple game types
        assignment_data = {
            "subject": "Science",
            "grade_level": "6th Grade",
            "topic": "Solar System",
            "difficulty": "medium",
            "item_count": 5,
            "allowed_game_types": ["quiz", "time_attack", "matching", "flashcard", "true_false", "fill_blank"],
            "language": "en"
        }
        
        assignment_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json=assignment_data
        )
        
        assert assignment_response.status_code == 200, f"Failed to create assignment: {assignment_response.text}"
        assignment_id = assignment_response.json()["assignment_id"]
        print(f"Created assignment: {assignment_id}")
        
        # Create session with all_modes
        session_data = {
            "assignment_id": assignment_id,
            "game_type": "all_modes",
            "mode": "SELF_PACED"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json=session_data
        )
        
        print(f"Create all_modes session response: {response.status_code}")
        print(f"Response body: {response.text[:1000]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "session_id" in data
        assert data["game_type"] == "all_modes"
        assert "allowed_game_types" in data
        assert len(data["allowed_game_types"]) > 1, "all_modes session should have multiple allowed game types"
        
        print(f"Session created: {data['session_id']}")
        print(f"Allowed game types: {data['allowed_game_types']}")
        
        return data
    
    def test_get_session_returns_allowed_game_types(self):
        """Test that GET /api/play-to-learn/sessions/{session_id} returns allowed_game_types"""
        # Create an all_modes session
        session_data = self.test_create_all_modes_session()
        session_id = session_data["session_id"]
        
        # Get session details
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        
        print(f"Get session response: {response.status_code}")
        print(f"Response body: {response.text[:1000]}")
        
        assert response.status_code == 200
        
        data = response.json()
        assert "allowed_game_types" in data, "Session response should include allowed_game_types"
        assert isinstance(data["allowed_game_types"], list), "allowed_game_types should be a list"
        assert len(data["allowed_game_types"]) > 0, "allowed_game_types should not be empty"
        
        print(f"Session {session_id} has allowed_game_types: {data['allowed_game_types']}")
    
    def test_select_mode_endpoint(self):
        """Test POST /api/play-to-learn/sessions/{session_id}/select-mode"""
        # Create an all_modes session
        session_data = self.test_create_all_modes_session()
        session_id = session_data["session_id"]
        
        # Join as participant first
        join_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": "TestStudent"}
        )
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        print(f"Joined as participant: {participant_id}")
        
        # Select quiz mode
        select_mode_data = {
            "game_type": "quiz",
            "participant_id": participant_id
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/select-mode",
            json=select_mode_data
        )
        
        print(f"Select mode response: {response.status_code}")
        print(f"Response body: {response.text[:1000]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["game_type"] == "quiz"
        assert "game_payload" in data
        assert data["game_payload"]["game_type"] == "quiz"
        
        print(f"Mode selected: {data['game_type']}")
        print(f"Game payload type: {data['game_payload']['game_type']}")
    
    def test_select_fill_blank_mode(self):
        """Test selecting fill_blank mode returns correct game payload"""
        # Create an all_modes session
        session_data = self.test_create_all_modes_session()
        session_id = session_data["session_id"]
        
        # Join as participant
        join_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": "FillBlankStudent"}
        )
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Select fill_blank mode
        select_mode_data = {
            "game_type": "fill_blank",
            "participant_id": participant_id
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/select-mode",
            json=select_mode_data
        )
        
        print(f"Select fill_blank mode response: {response.status_code}")
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["game_type"] == "fill_blank"
        assert data["game_payload"]["game_type"] == "fill_blank"
        
        # Verify fill_blank payload structure
        questions = data["game_payload"].get("questions", [])
        assert len(questions) > 0, "fill_blank should have questions"
        
        first_q = questions[0]
        assert "sentence" in first_q or "question" in first_q, "fill_blank question should have sentence or question"
        assert "blank_answer" in first_q or "correct_answer" in first_q, "fill_blank should have blank_answer or correct_answer"
        
        print(f"fill_blank mode selected with {len(questions)} questions")
        print(f"First question: {first_q}")
    
    def test_select_true_false_mode(self):
        """Test selecting true_false mode returns correct game payload"""
        # Create an all_modes session
        session_data = self.test_create_all_modes_session()
        session_id = session_data["session_id"]
        
        # Join as participant
        join_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": "TrueFalseStudent"}
        )
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Select true_false mode
        select_mode_data = {
            "game_type": "true_false",
            "participant_id": participant_id
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/select-mode",
            json=select_mode_data
        )
        
        print(f"Select true_false mode response: {response.status_code}")
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["game_type"] == "true_false"
        assert data["game_payload"]["game_type"] == "true_false"
        
        # Verify true_false payload structure
        questions = data["game_payload"].get("questions", [])
        assert len(questions) > 0, "true_false should have questions"
        
        first_q = questions[0]
        assert "statement" in first_q or "question" in first_q, "true_false question should have statement or question"
        assert "is_true" in first_q, "true_false should have is_true field"
        
        print(f"true_false mode selected with {len(questions)} questions")
        print(f"First question: {first_q}")
    
    def test_select_invalid_mode_rejected(self):
        """Test that selecting an invalid mode is rejected"""
        # Create an all_modes session
        session_data = self.test_create_all_modes_session()
        session_id = session_data["session_id"]
        
        # Join as participant
        join_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": "InvalidModeStudent"}
        )
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Try to select an invalid mode
        select_mode_data = {
            "game_type": "invalid_mode",
            "participant_id": participant_id
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/select-mode",
            json=select_mode_data
        )
        
        print(f"Select invalid mode response: {response.status_code}")
        
        assert response.status_code == 400, f"Expected 400 for invalid mode, got {response.status_code}"
        print("Invalid mode correctly rejected")
    
    # ==================== LIVE SESSION TESTS ====================
    
    def test_live_session_has_pin_and_lobby_status(self):
        """Test that LIVE session has PIN and starts in LOBBY status"""
        # Create assignment
        assignment_data = {
            "subject": "Math",
            "grade_level": "5th Grade",
            "topic": "Fractions",
            "difficulty": "medium",
            "item_count": 5,
            "allowed_game_types": ["quiz", "time_attack", "matching"],
            "language": "en"
        }
        
        assignment_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json=assignment_data
        )
        assert assignment_response.status_code == 200
        assignment_id = assignment_response.json()["assignment_id"]
        
        # Create LIVE session
        session_data = {
            "assignment_id": assignment_id,
            "game_type": "quiz",
            "mode": "LIVE"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json=session_data
        )
        
        print(f"Create LIVE session response: {response.status_code}")
        
        assert response.status_code == 200
        
        data = response.json()
        assert "join_pin" in data, "LIVE session should have join_pin"
        assert data["join_pin"] is not None, "join_pin should not be None"
        assert len(data["join_pin"]) == 6, "PIN should be 6 digits"
        assert data["status"] == "LOBBY", "LIVE session should start in LOBBY status"
        
        print(f"LIVE session created with PIN: {data['join_pin']}, status: {data['status']}")
        
        return data
    
    def test_get_live_session_shows_participants(self):
        """Test that getting a LIVE session shows participants list"""
        # Create LIVE session
        live_session = self.test_live_session_has_pin_and_lobby_status()
        session_id = live_session["session_id"]
        pin = live_session["join_pin"]
        
        # Join as participant
        join_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": "Player1", "pin": pin}
        )
        assert join_response.status_code == 200
        
        # Get session details
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        
        print(f"Get session response: {response.status_code}")
        
        assert response.status_code == 200
        
        data = response.json()
        assert "participants" in data, "Session should include participants list"
        assert len(data["participants"]) >= 1, "Should have at least 1 participant"
        
        # Check participant structure
        participant = data["participants"][0]
        assert "nickname" in participant, "Participant should have nickname"
        assert participant["nickname"] == "Player1"
        
        print(f"Session has {len(data['participants'])} participants")
        print(f"First participant: {participant}")


class TestExistingTestSessions:
    """Test the existing test sessions provided in the review request"""
    
    def test_all_modes_session_exists(self):
        """Test that the all_modes test session exists and has correct structure"""
        session_id = "ps_5a97ce4ea7204966"
        
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        
        print(f"Get all_modes session response: {response.status_code}")
        
        if response.status_code == 404:
            pytest.skip(f"Test session {session_id} not found - may have been deleted")
        
        assert response.status_code == 200
        
        data = response.json()
        print(f"Session data: {json.dumps(data, indent=2)[:1000]}")
        
        # Verify it's an all_modes session
        assert data.get("game_type") == "all_modes" or len(data.get("allowed_game_types", [])) > 1
        print(f"Session {session_id} is all_modes with allowed types: {data.get('allowed_game_types')}")
    
    def test_fill_blank_session_exists(self):
        """Test that the fill_blank test session exists"""
        session_id = "ps_0ceeb697653042f8"
        
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        
        print(f"Get fill_blank session response: {response.status_code}")
        
        if response.status_code == 404:
            pytest.skip(f"Test session {session_id} not found - may have been deleted")
        
        assert response.status_code == 200
        
        data = response.json()
        print(f"Session game_type: {data.get('game_type')}")
        print(f"Game payload type: {data.get('game_payload', {}).get('game_type')}")
    
    def test_true_false_session_exists(self):
        """Test that the true_false test session exists"""
        session_id = "ps_d1b14a096244449e"
        
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        
        print(f"Get true_false session response: {response.status_code}")
        
        if response.status_code == 404:
            pytest.skip(f"Test session {session_id} not found - may have been deleted")
        
        assert response.status_code == 200
        
        data = response.json()
        print(f"Session game_type: {data.get('game_type')}")
    
    def test_live_lobby_session_exists(self):
        """Test that the live lobby test session exists with PIN"""
        session_id = "ps_6d70dc387b43424d"
        expected_pin = "906479"
        
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        
        print(f"Get live lobby session response: {response.status_code}")
        
        if response.status_code == 404:
            pytest.skip(f"Test session {session_id} not found - may have been deleted")
        
        assert response.status_code == 200
        
        data = response.json()
        print(f"Session status: {data.get('status')}")
        print(f"Session PIN: {data.get('join_pin')}")
        print(f"Session mode: {data.get('mode')}")
        
        # Verify it's a LIVE session
        assert data.get("mode") == "LIVE", "Should be a LIVE session"
        assert data.get("join_pin") is not None, "LIVE session should have PIN"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
