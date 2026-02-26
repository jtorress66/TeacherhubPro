"""
Test LIVE Mode Bug Fixes for Play to Learn
Tests:
1. Duplicate participant prevention (same nickname returns same ID)
2. Late join to ACTIVE game returns correct status
3. Session status transitions (LOBBY -> ACTIVE)
4. English questions for English assignment
5. True/False answer validation
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@school.edu"
TEST_PASSWORD = "testpassword"
TEST_ASSIGNMENT_ENGLISH = "pa_819f4878e48f4936"


class TestLiveModeFixesSetup:
    """Setup and authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for teacher"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.cookies.get('session_token') or response.json().get('token')
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    @pytest.fixture(scope="class")
    def auth_session(self, auth_token):
        """Create authenticated session"""
        session = requests.Session()
        session.cookies.set('session_token', auth_token)
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✓ API health check passed")


class TestDuplicateParticipantPrevention:
    """Test that same nickname returns same participant ID (no duplicates)"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        
        session = requests.Session()
        session.cookies.set('session_token', response.cookies.get('session_token'))
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    @pytest.fixture(scope="class")
    def live_session(self, auth_session):
        """Create a LIVE mode session for testing"""
        # Create a new LIVE session
        response = auth_session.post(f"{BASE_URL}/api/play-to-learn/sessions", json={
            "assignment_id": TEST_ASSIGNMENT_ENGLISH,
            "game_type": "quiz",
            "mode": "LIVE"
        })
        
        if response.status_code != 200:
            pytest.skip(f"Failed to create LIVE session: {response.text}")
        
        data = response.json()
        assert data.get("mode") == "LIVE"
        assert data.get("status") == "LOBBY"
        assert data.get("join_pin") is not None
        
        print(f"✓ Created LIVE session: {data['session_id']} with PIN: {data['join_pin']}")
        return data
    
    def test_first_join_creates_participant(self, live_session):
        """Test that first join creates a new participant"""
        session_id = live_session["session_id"]
        pin = live_session["join_pin"]
        
        response = requests.post(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join", json={
            "nickname": "TestPlayer1",
            "pin": pin
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "participant_id" in data
        assert data["nickname"] == "TestPlayer1"
        assert data["session_id"] == session_id
        
        print(f"✓ First join created participant: {data['participant_id']}")
        return data["participant_id"]
    
    def test_duplicate_join_returns_same_id(self, live_session):
        """Test that joining with same nickname returns same participant ID"""
        session_id = live_session["session_id"]
        pin = live_session["join_pin"]
        
        # First join
        response1 = requests.post(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join", json={
            "nickname": "DuplicateTest",
            "pin": pin
        })
        assert response1.status_code == 200
        first_id = response1.json()["participant_id"]
        
        # Second join with SAME nickname
        response2 = requests.post(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join", json={
            "nickname": "DuplicateTest",
            "pin": pin
        })
        assert response2.status_code == 200
        second_id = response2.json()["participant_id"]
        
        # Should return SAME participant ID
        assert first_id == second_id, f"Expected same ID but got {first_id} vs {second_id}"
        print(f"✓ Duplicate join returned same ID: {first_id}")
    
    def test_duplicate_join_case_insensitive(self, live_session):
        """Test that nickname matching is case-insensitive"""
        session_id = live_session["session_id"]
        pin = live_session["join_pin"]
        
        # First join with lowercase
        response1 = requests.post(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join", json={
            "nickname": "casetest",
            "pin": pin
        })
        assert response1.status_code == 200
        first_id = response1.json()["participant_id"]
        
        # Second join with UPPERCASE
        response2 = requests.post(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join", json={
            "nickname": "CASETEST",
            "pin": pin
        })
        assert response2.status_code == 200
        second_id = response2.json()["participant_id"]
        
        # Should return SAME participant ID (case-insensitive)
        assert first_id == second_id, f"Case-insensitive match failed: {first_id} vs {second_id}"
        print(f"✓ Case-insensitive duplicate detection works")
    
    def test_different_nicknames_create_different_ids(self, live_session):
        """Test that different nicknames create different participant IDs"""
        session_id = live_session["session_id"]
        pin = live_session["join_pin"]
        
        # First player
        response1 = requests.post(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join", json={
            "nickname": "UniquePlayer1",
            "pin": pin
        })
        assert response1.status_code == 200
        first_id = response1.json()["participant_id"]
        
        # Second player with different name
        response2 = requests.post(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join", json={
            "nickname": "UniquePlayer2",
            "pin": pin
        })
        assert response2.status_code == 200
        second_id = response2.json()["participant_id"]
        
        # Should be DIFFERENT IDs
        assert first_id != second_id, f"Different nicknames should have different IDs"
        print(f"✓ Different nicknames create different IDs: {first_id} vs {second_id}")


class TestLateJoinToActiveGame:
    """Test that late join to ACTIVE game returns correct status"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        
        session = requests.Session()
        session.cookies.set('session_token', response.cookies.get('session_token'))
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    @pytest.fixture(scope="class")
    def active_live_session(self, auth_session):
        """Create and start a LIVE session"""
        # Create LIVE session
        create_response = auth_session.post(f"{BASE_URL}/api/play-to-learn/sessions", json={
            "assignment_id": TEST_ASSIGNMENT_ENGLISH,
            "game_type": "quiz",
            "mode": "LIVE"
        })
        
        if create_response.status_code != 200:
            pytest.skip(f"Failed to create session: {create_response.text}")
        
        session_data = create_response.json()
        session_id = session_data["session_id"]
        pin = session_data["join_pin"]
        
        # Add a player first (required to start)
        join_response = requests.post(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join", json={
            "nickname": "FirstPlayer",
            "pin": pin
        })
        assert join_response.status_code == 200
        
        # Start the game
        start_response = auth_session.post(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/start")
        assert start_response.status_code == 200
        
        print(f"✓ Created and started LIVE session: {session_id}")
        return {"session_id": session_id, "pin": pin}
    
    def test_late_join_returns_active_status(self, active_live_session):
        """Test that joining an ACTIVE game returns status=ACTIVE"""
        session_id = active_live_session["session_id"]
        pin = active_live_session["pin"]
        
        # Late player joins
        response = requests.post(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join", json={
            "nickname": "LatePlayer",
            "pin": pin
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return ACTIVE status so frontend knows to start immediately
        assert data.get("status") == "ACTIVE", f"Expected ACTIVE status but got {data.get('status')}"
        print(f"✓ Late join returns ACTIVE status")
    
    def test_session_get_returns_active_status(self, active_live_session):
        """Test that GET session returns ACTIVE status after start"""
        session_id = active_live_session["session_id"]
        
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("status") == "ACTIVE"
        print(f"✓ GET session returns ACTIVE status")


class TestSessionStatusTransitions:
    """Test session status transitions for polling fallback"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        
        session = requests.Session()
        session.cookies.set('session_token', response.cookies.get('session_token'))
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_lobby_to_active_transition(self, auth_session):
        """Test that session transitions from LOBBY to ACTIVE correctly"""
        # Create LIVE session
        create_response = auth_session.post(f"{BASE_URL}/api/play-to-learn/sessions", json={
            "assignment_id": TEST_ASSIGNMENT_ENGLISH,
            "game_type": "quiz",
            "mode": "LIVE"
        })
        assert create_response.status_code == 200
        
        session_data = create_response.json()
        session_id = session_data["session_id"]
        pin = session_data["join_pin"]
        
        # Verify initial status is LOBBY
        get_response1 = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert get_response1.json()["status"] == "LOBBY"
        print(f"✓ Initial status is LOBBY")
        
        # Add a player
        join_response = requests.post(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join", json={
            "nickname": "TransitionTestPlayer",
            "pin": pin
        })
        assert join_response.status_code == 200
        
        # Start the game
        start_response = auth_session.post(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/start")
        assert start_response.status_code == 200
        
        # Verify status changed to ACTIVE (this is what polling would detect)
        get_response2 = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert get_response2.json()["status"] == "ACTIVE"
        print(f"✓ Status transitioned to ACTIVE after start")


class TestEnglishQuestionsGeneration:
    """Test that English assignment generates English questions"""
    
    def test_english_assignment_exists(self):
        """Verify the English test assignment exists"""
        response = requests.get(f"{BASE_URL}/api/play-to-learn/assignments/{TEST_ASSIGNMENT_ENGLISH}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("language") == "en", f"Expected language='en' but got {data.get('language')}"
        print(f"✓ English assignment exists with language='en'")
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        
        session = requests.Session()
        session.cookies.set('session_token', response.cookies.get('session_token'))
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_english_session_has_english_questions(self, auth_session):
        """Test that session created from English assignment has English questions"""
        # Create a session from the English assignment
        response = auth_session.post(f"{BASE_URL}/api/play-to-learn/sessions", json={
            "assignment_id": TEST_ASSIGNMENT_ENGLISH,
            "game_type": "quiz",
            "mode": "SELF_PACED"
        })
        
        assert response.status_code == 200
        session_data = response.json()
        session_id = session_data["session_id"]
        
        # Get full session with questions
        get_response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert get_response.status_code == 200
        
        session = get_response.json()
        questions = session.get("game_payload", {}).get("questions", [])
        
        assert len(questions) > 0, "No questions generated"
        
        # Check first question is in English (no Spanish characters)
        first_question = questions[0].get("question", "")
        spanish_chars = ['¿', '¡', 'ñ', 'á', 'é', 'í', 'ó', 'ú']
        has_spanish = any(char in first_question for char in spanish_chars)
        
        assert not has_spanish, f"Question appears to be in Spanish: {first_question}"
        
        # Check for English words
        english_indicators = ['the', 'is', 'are', 'what', 'which', 'how', 'a', 'an']
        has_english = any(word in first_question.lower() for word in english_indicators)
        
        print(f"✓ First question: {first_question[:100]}...")
        print(f"✓ Questions are in English (no Spanish chars, has English words)")


class TestTrueFalseAnswerValidation:
    """Test True/False answer validation - 'true' for true statement should be CORRECT"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        
        session = requests.Session()
        session.cookies.set('session_token', response.cookies.get('session_token'))
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    @pytest.fixture(scope="class")
    def true_false_session(self, auth_session):
        """Create a True/False session"""
        response = auth_session.post(f"{BASE_URL}/api/play-to-learn/sessions", json={
            "assignment_id": TEST_ASSIGNMENT_ENGLISH,
            "game_type": "true_false",
            "mode": "SELF_PACED"
        })
        
        if response.status_code != 200:
            pytest.skip(f"Failed to create true_false session: {response.text}")
        
        session_data = response.json()
        print(f"✓ Created true_false session: {session_data['session_id']}")
        return session_data
    
    def test_true_false_session_structure(self, true_false_session):
        """Test that true_false session has correct structure"""
        session_id = true_false_session["session_id"]
        
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert response.status_code == 200
        
        session = response.json()
        assert session.get("game_type") == "true_false"
        
        questions = session.get("game_payload", {}).get("questions", [])
        assert len(questions) > 0
        
        # Check structure of first question
        first_q = questions[0]
        assert "statement" in first_q, "Missing 'statement' field"
        assert "is_true" in first_q, "Missing 'is_true' field"
        assert "item_id" in first_q, "Missing 'item_id' field"
        
        print(f"✓ True/False session has correct structure")
        print(f"  Statement: {first_q['statement'][:80]}...")
        print(f"  is_true: {first_q['is_true']}")
    
    def test_true_answer_for_true_statement_is_correct(self, true_false_session):
        """Test that answering 'true' for a true statement is marked CORRECT"""
        session_id = true_false_session["session_id"]
        
        # Get session to find a question with is_true=True
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        session = response.json()
        
        questions = session.get("game_payload", {}).get("questions", [])
        true_question = next((q for q in questions if q.get("is_true") == True), None)
        
        if not true_question:
            pytest.skip("No true statement found in questions")
        
        # Join session first
        join_response = requests.post(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join", json={
            "nickname": "TrueFalseTestPlayer"
        })
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Submit answer "true" for a true statement
        answer_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/submit-answer?participant_id={participant_id}",
            json={
                "item_id": true_question["item_id"],
                "answer": "true",
                "time_taken_ms": 5000
            }
        )
        
        assert answer_response.status_code == 200
        result = answer_response.json()
        
        # KEY TEST: Answering "true" for is_true=True should be CORRECT
        assert result.get("is_correct") == True, f"Expected is_correct=True but got {result.get('is_correct')}"
        print(f"✓ Answering 'true' for true statement is CORRECT")
    
    def test_false_answer_for_true_statement_is_incorrect(self, true_false_session):
        """Test that answering 'false' for a true statement is marked INCORRECT"""
        session_id = true_false_session["session_id"]
        
        # Get session to find a question with is_true=True
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        session = response.json()
        
        questions = session.get("game_payload", {}).get("questions", [])
        true_question = next((q for q in questions if q.get("is_true") == True), None)
        
        if not true_question:
            pytest.skip("No true statement found in questions")
        
        # Join session with different nickname
        join_response = requests.post(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join", json={
            "nickname": "TrueFalseTestPlayer2"
        })
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Submit answer "false" for a true statement
        answer_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/submit-answer?participant_id={participant_id}",
            json={
                "item_id": true_question["item_id"],
                "answer": "false",
                "time_taken_ms": 5000
            }
        )
        
        assert answer_response.status_code == 200
        result = answer_response.json()
        
        # Answering "false" for is_true=True should be INCORRECT
        assert result.get("is_correct") == False, f"Expected is_correct=False but got {result.get('is_correct')}"
        print(f"✓ Answering 'false' for true statement is INCORRECT")


class TestJoinByPin:
    """Test join by PIN endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        
        session = requests.Session()
        session.cookies.set('session_token', response.cookies.get('session_token'))
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_join_by_pin_returns_session_info(self, auth_session):
        """Test that join by PIN returns session info including status"""
        # Create LIVE session
        create_response = auth_session.post(f"{BASE_URL}/api/play-to-learn/sessions", json={
            "assignment_id": TEST_ASSIGNMENT_ENGLISH,
            "game_type": "quiz",
            "mode": "LIVE"
        })
        assert create_response.status_code == 200
        
        session_data = create_response.json()
        pin = session_data["join_pin"]
        
        # Use join by PIN endpoint
        join_response = requests.get(f"{BASE_URL}/api/play-to-learn/join/{pin}")
        assert join_response.status_code == 200
        
        data = join_response.json()
        assert "session_id" in data
        assert "status" in data
        assert data["status"] == "LOBBY"
        assert data["mode"] == "LIVE"
        
        print(f"✓ Join by PIN returns session info with status")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
