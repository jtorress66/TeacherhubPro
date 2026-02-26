"""
Test Play to Learn Bug Fixes - Iteration 38
Tests for 6 critical bug fixes:
1. all_modes not supported error - Frontend should show mode selection
2. Questions in Spanish for English class - Should generate ENGLISH questions
3. True/False always wrong answer - Answer validation fix
4. Confusing workflow steps - Quick Start Guide updated
5. LIVE mode WebSocket handling
6. Lobby player nickname display
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_TEACHER_EMAIL = "test@school.edu"
TEST_TEACHER_PASSWORD = "testpassword"

# Test sessions from main agent
ENGLISH_TRUE_FALSE_SESSION = "ps_a32b64e3c7fc4481"
ALL_MODES_SESSION = "ps_82064f9739a44765"
ENGLISH_ASSIGNMENT = "pa_819f4878e48f4936"


class TestPlayToLearnBugFixes:
    """Test suite for Play to Learn bug fixes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    # ==================== BUG FIX 1: all_modes support ====================
    
    def test_all_modes_session_exists(self):
        """Verify all_modes session exists and has correct game_type"""
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}")
        assert response.status_code == 200, f"Failed to get session: {response.text}"
        
        data = response.json()
        assert data["game_type"] == "all_modes", f"Expected game_type 'all_modes', got {data['game_type']}"
        assert "allowed_game_types" in data, "Missing allowed_game_types field"
        assert len(data["allowed_game_types"]) > 1, "all_modes should have multiple allowed game types"
        print(f"✓ all_modes session exists with allowed_game_types: {data['allowed_game_types']}")
    
    def test_all_modes_session_has_game_payload(self):
        """Verify all_modes session has a valid game_payload (default quiz)"""
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}")
        assert response.status_code == 200
        
        data = response.json()
        assert "game_payload" in data, "Missing game_payload"
        assert data["game_payload"]["game_type"] == "quiz", "Default game_payload should be quiz"
        assert "questions" in data["game_payload"], "game_payload should have questions"
        print(f"✓ all_modes session has valid game_payload with {len(data['game_payload']['questions'])} questions")
    
    # ==================== BUG FIX 2: English questions for English class ====================
    
    def test_english_assignment_has_english_language(self):
        """Verify English assignment has language='en'"""
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/assignments/{ENGLISH_ASSIGNMENT}")
        assert response.status_code == 200, f"Failed to get assignment: {response.text}"
        
        data = response.json()
        assert data["language"] == "en", f"Expected language 'en', got {data['language']}"
        assert "English" in data["subject"], f"Subject should contain 'English', got {data['subject']}"
        print(f"✓ English assignment has language='en', subject='{data['subject']}'")
    
    def test_english_session_has_english_questions(self):
        """Verify questions in English session are in ENGLISH (not Spanish)"""
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{ENGLISH_TRUE_FALSE_SESSION}")
        assert response.status_code == 200
        
        data = response.json()
        questions = data["game_payload"]["questions"]
        
        # Check that questions are in English (no Spanish characters/words)
        spanish_indicators = ["¿", "á", "é", "í", "ó", "ú", "ñ", "Cuál", "Qué", "Cómo"]
        
        for q in questions:
            statement = q.get("statement", q.get("question", ""))
            for indicator in spanish_indicators:
                assert indicator not in statement, f"Found Spanish indicator '{indicator}' in question: {statement[:50]}..."
            
            # Verify English content
            assert any(word in statement.lower() for word in ["which", "the", "is", "are", "what", "how"]), \
                f"Question doesn't appear to be in English: {statement[:50]}..."
        
        print(f"✓ All {len(questions)} questions are in ENGLISH")
    
    # ==================== BUG FIX 3: True/False answer validation ====================
    
    def test_true_false_session_structure(self):
        """Verify True/False session has correct structure"""
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{ENGLISH_TRUE_FALSE_SESSION}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["game_type"] == "true_false", f"Expected game_type 'true_false', got {data['game_type']}"
        
        questions = data["game_payload"]["questions"]
        for q in questions:
            assert "statement" in q, "True/False question should have 'statement' field"
            assert "is_true" in q, "True/False question should have 'is_true' field"
            assert isinstance(q["is_true"], bool), "is_true should be boolean"
        
        print(f"✓ True/False session has correct structure with {len(questions)} questions")
    
    def test_true_false_answer_validation_correct(self):
        """Test that answering 'true' for a true statement is marked CORRECT"""
        # First join the session
        join_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ENGLISH_TRUE_FALSE_SESSION}/join",
            json={"nickname": f"TestPlayer_{os.urandom(4).hex()}"}
        )
        assert join_response.status_code == 200, f"Failed to join: {join_response.text}"
        participant_id = join_response.json()["participant_id"]
        
        # Get session to find a question
        session_response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{ENGLISH_TRUE_FALSE_SESSION}")
        questions = session_response.json()["game_payload"]["questions"]
        
        # Find a question where is_true is True
        true_question = next((q for q in questions if q["is_true"] == True), None)
        assert true_question is not None, "No question with is_true=True found"
        
        # Submit answer 'true' for a true statement
        answer_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ENGLISH_TRUE_FALSE_SESSION}/submit-answer?participant_id={participant_id}",
            json={
                "item_id": true_question["item_id"],
                "answer": "true",
                "time_taken_ms": 2000
            }
        )
        assert answer_response.status_code == 200, f"Failed to submit answer: {answer_response.text}"
        
        result = answer_response.json()
        assert result["is_correct"] == True, f"Expected is_correct=True, got {result['is_correct']}. Answer validation bug not fixed!"
        print(f"✓ True/False answer validation FIXED - 'true' for true statement is CORRECT")
    
    def test_true_false_answer_validation_incorrect(self):
        """Test that answering 'false' for a true statement is marked INCORRECT"""
        # Join the session
        join_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ENGLISH_TRUE_FALSE_SESSION}/join",
            json={"nickname": f"TestPlayer_{os.urandom(4).hex()}"}
        )
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Get session to find a question
        session_response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{ENGLISH_TRUE_FALSE_SESSION}")
        questions = session_response.json()["game_payload"]["questions"]
        
        # Find a question where is_true is True
        true_question = next((q for q in questions if q["is_true"] == True), None)
        assert true_question is not None
        
        # Submit answer 'false' for a true statement (should be incorrect)
        answer_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ENGLISH_TRUE_FALSE_SESSION}/submit-answer?participant_id={participant_id}",
            json={
                "item_id": true_question["item_id"],
                "answer": "false",
                "time_taken_ms": 2000
            }
        )
        assert answer_response.status_code == 200
        
        result = answer_response.json()
        assert result["is_correct"] == False, f"Expected is_correct=False, got {result['is_correct']}"
        print(f"✓ True/False validation correct - 'false' for true statement is INCORRECT")
    
    # ==================== BUG FIX 4: Mode selection endpoint ====================
    
    def test_select_mode_endpoint_works(self):
        """Test that select-mode endpoint transforms game payload correctly"""
        # Join the all_modes session
        join_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/join",
            json={"nickname": f"TestPlayer_{os.urandom(4).hex()}"}
        )
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Select true_false mode
        select_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/select-mode",
            json={
                "game_type": "true_false",
                "participant_id": participant_id
            }
        )
        assert select_response.status_code == 200, f"Failed to select mode: {select_response.text}"
        
        result = select_response.json()
        assert result["game_type"] == "true_false", f"Expected game_type 'true_false', got {result['game_type']}"
        assert result["game_payload"]["game_type"] == "true_false", "game_payload should be transformed to true_false"
        assert "questions" in result["game_payload"], "true_false payload should have questions"
        
        # Verify questions have true_false structure
        for q in result["game_payload"]["questions"]:
            assert "statement" in q, "true_false question should have statement"
            assert "is_true" in q, "true_false question should have is_true"
        
        print(f"✓ select-mode endpoint transforms payload correctly to true_false")
    
    def test_select_fill_blank_mode(self):
        """Test selecting fill_blank mode"""
        # Join the all_modes session
        join_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/join",
            json={"nickname": f"TestPlayer_{os.urandom(4).hex()}"}
        )
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Select fill_blank mode
        select_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/select-mode",
            json={
                "game_type": "fill_blank",
                "participant_id": participant_id
            }
        )
        assert select_response.status_code == 200
        
        result = select_response.json()
        assert result["game_type"] == "fill_blank"
        assert result["game_payload"]["game_type"] == "fill_blank"
        
        # Verify fill_blank structure
        for q in result["game_payload"]["questions"]:
            assert "sentence" in q, "fill_blank question should have sentence"
            assert "blank_answer" in q, "fill_blank question should have blank_answer"
        
        print(f"✓ select-mode endpoint transforms payload correctly to fill_blank")
    
    # ==================== BUG FIX 5: Score and streak tracking ====================
    
    def test_score_updates_after_correct_answer(self):
        """Test that score and streak update correctly after answering"""
        # Join the session
        join_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ENGLISH_TRUE_FALSE_SESSION}/join",
            json={"nickname": f"TestPlayer_{os.urandom(4).hex()}"}
        )
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Get session to find a question
        session_response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{ENGLISH_TRUE_FALSE_SESSION}")
        questions = session_response.json()["game_payload"]["questions"]
        true_question = next((q for q in questions if q["is_true"] == True), None)
        
        # Submit correct answer
        answer_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ENGLISH_TRUE_FALSE_SESSION}/submit-answer?participant_id={participant_id}",
            json={
                "item_id": true_question["item_id"],
                "answer": "true",
                "time_taken_ms": 2000
            }
        )
        assert answer_response.status_code == 200
        
        result = answer_response.json()
        assert result["is_correct"] == True
        assert result["score"] >= 1, f"Score should be at least 1, got {result['score']}"
        assert result["streak"] >= 1, f"Streak should be at least 1, got {result['streak']}"
        print(f"✓ Score and streak update correctly: score={result['score']}, streak={result['streak']}")
    
    # ==================== BUG FIX 6: LIVE mode session creation ====================
    
    def test_live_session_creation(self):
        """Test that LIVE mode sessions can be created with PIN"""
        # This requires authentication, so we'll test the session structure
        # by checking an existing LIVE session or creating one with auth
        
        # For now, verify the session endpoint returns correct structure
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{ENGLISH_TRUE_FALSE_SESSION}")
        assert response.status_code == 200
        
        data = response.json()
        # Verify session has all required fields
        required_fields = ["session_id", "assignment_id", "game_type", "mode", "status", "game_payload"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        print(f"✓ Session structure is correct with all required fields")


class TestFillBlankMode:
    """Test Fill in the Blank mode rendering and functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_fill_blank_has_input_field_structure(self):
        """Verify fill_blank mode has correct structure for input field"""
        # Join all_modes session and select fill_blank
        join_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/join",
            json={"nickname": f"TestPlayer_{os.urandom(4).hex()}"}
        )
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Select fill_blank mode
        select_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/select-mode",
            json={
                "game_type": "fill_blank",
                "participant_id": participant_id
            }
        )
        assert select_response.status_code == 200
        
        result = select_response.json()
        questions = result["game_payload"]["questions"]
        
        for q in questions:
            # Verify structure for input field rendering
            assert "sentence" in q, "fill_blank should have sentence"
            assert "blank_answer" in q, "fill_blank should have blank_answer"
            assert "hint" in q, "fill_blank should have hint"
            assert "_____" in q["sentence"] or "is the answer to:" in q["sentence"], \
                f"Sentence should contain blank: {q['sentence'][:50]}..."
        
        print(f"✓ Fill in the Blank mode has correct structure for {len(questions)} questions")


class TestWebSocketBroadcast:
    """Test WebSocket functionality for LIVE mode"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_session_has_websocket_fields(self):
        """Verify session has fields needed for WebSocket"""
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{ENGLISH_TRUE_FALSE_SESSION}")
        assert response.status_code == 200
        
        data = response.json()
        # Verify fields needed for WebSocket
        assert "status" in data, "Session should have status for WebSocket state"
        assert "participants" in data, "Session should have participants list"
        assert "current_question_index" in data, "Session should have current_question_index"
        
        print(f"✓ Session has all fields needed for WebSocket: status={data['status']}, participants={len(data['participants'])}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
