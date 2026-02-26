"""
Test P0 Bug Fixes for ALL_MODES Sessions - Iteration 43
Tests for:
1. P0 Bug Fix: Fill in the Blank answer validation in ALL_MODES sessions
   - Student selects 'fill_blank', answers correctly with a single word (case-insensitive)
   - Answer should be marked CORRECT
2. P0 Bug Fix: Teacher Host View shows selected_mode for each participant in ALL_MODES sessions
3. ALL_MODES session flow: Create session, join as student, select a mode, game starts with correct mode
4. True/False game mode validation
5. Quiz game mode validation
"""

import pytest
import requests
import os
import json
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_TEACHER_EMAIL = "test@school.edu"
TEST_TEACHER_PASSWORD = "testpassword"

# Existing ALL_MODES session with participants
ALL_MODES_SESSION = "ps_4e12196eafae47cb"


class TestP0FillBlankInAllModes:
    """P0 Bug Fix: Fill in the Blank answer validation in ALL_MODES sessions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_all_modes_session_exists_and_active(self):
        """Verify the ALL_MODES session exists and is ACTIVE"""
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}")
        assert response.status_code == 200, f"Failed to get session: {response.text}"
        
        data = response.json()
        assert data["game_type"] == "all_modes", f"Expected game_type 'all_modes', got {data['game_type']}"
        assert data["status"] == "ACTIVE", f"Expected status 'ACTIVE', got {data['status']}"
        print(f"✓ ALL_MODES session exists and is ACTIVE")
    
    def test_participant_has_selected_mode_stored(self):
        """Verify participants have selected_mode stored in session"""
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}")
        assert response.status_code == 200
        
        data = response.json()
        participants = data.get("participants", [])
        
        # Find participants with selected_mode
        participants_with_mode = [p for p in participants if p.get("selected_mode")]
        assert len(participants_with_mode) > 0, "No participants have selected_mode"
        
        # Verify Pedro has fill_blank mode
        pedro = next((p for p in participants if p.get("nickname") == "Pedro"), None)
        if pedro:
            assert pedro.get("selected_mode") == "fill_blank", f"Pedro should have fill_blank mode, got {pedro.get('selected_mode')}"
            print(f"✓ Pedro has selected_mode='fill_blank'")
        
        # Verify Maria has quiz mode
        maria = next((p for p in participants if p.get("nickname") == "Maria"), None)
        if maria:
            assert maria.get("selected_mode") == "quiz", f"Maria should have quiz mode, got {maria.get('selected_mode')}"
            print(f"✓ Maria has selected_mode='quiz'")
        
        print(f"✓ {len(participants_with_mode)} participants have selected_mode stored")
    
    def test_fill_blank_answer_validation_in_all_modes(self):
        """P0 BUG FIX: Fill in the Blank answers should be validated against blank_answer, not MCQ options"""
        # Join the session with a new participant
        nickname = f"FillBlankTest_{int(time.time())}"
        join_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/join",
            json={"nickname": nickname}
        )
        assert join_response.status_code == 200, f"Failed to join: {join_response.text}"
        participant_id = join_response.json()["participant_id"]
        print(f"✓ Joined session as {nickname} with participant_id={participant_id}")
        
        # Select fill_blank mode
        select_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/select-mode",
            json={
                "game_type": "fill_blank",
                "participant_id": participant_id
            }
        )
        assert select_response.status_code == 200, f"Failed to select mode: {select_response.text}"
        
        result = select_response.json()
        assert result["game_type"] == "fill_blank", f"Expected fill_blank, got {result['game_type']}"
        
        # Get the fill_blank questions
        questions = result["game_payload"]["questions"]
        assert len(questions) > 0, "No questions in fill_blank payload"
        
        # Get the first question and its blank_answer
        first_q = questions[0]
        blank_answer = first_q.get("blank_answer", "")
        item_id = first_q.get("item_id")
        
        print(f"✓ Fill blank question: sentence='{first_q.get('sentence', '')[:50]}...', blank_answer='{blank_answer}'")
        
        # Submit the CORRECT answer (case-insensitive)
        answer_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/submit-answer?participant_id={participant_id}",
            json={
                "item_id": item_id,
                "answer": blank_answer.lower(),  # Test case-insensitive
                "time_taken_ms": 3000
            }
        )
        assert answer_response.status_code == 200, f"Failed to submit answer: {answer_response.text}"
        
        answer_result = answer_response.json()
        
        # P0 BUG FIX VERIFICATION: The answer should be marked CORRECT
        assert answer_result["is_correct"] == True, \
            f"P0 BUG NOT FIXED: Fill in the Blank answer '{blank_answer.lower()}' should be CORRECT but got is_correct={answer_result['is_correct']}. " \
            f"Expected correct_answer='{blank_answer}', got '{answer_result.get('correct_answer')}'"
        
        print(f"✓ P0 BUG FIXED: Fill in the Blank answer '{blank_answer.lower()}' is correctly marked as CORRECT")
        print(f"  - is_correct: {answer_result['is_correct']}")
        print(f"  - correct_answer: {answer_result.get('correct_answer')}")
        print(f"  - score: {answer_result.get('score')}")
    
    def test_fill_blank_case_insensitive_validation(self):
        """Verify Fill in the Blank answers are case-insensitive"""
        # Join with new participant
        nickname = f"CaseTest_{int(time.time())}"
        join_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/join",
            json={"nickname": nickname}
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
        
        questions = select_response.json()["game_payload"]["questions"]
        first_q = questions[0]
        blank_answer = first_q.get("blank_answer", "")
        item_id = first_q.get("item_id")
        
        # Submit answer in UPPERCASE
        answer_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/submit-answer?participant_id={participant_id}",
            json={
                "item_id": item_id,
                "answer": blank_answer.upper(),  # Test UPPERCASE
                "time_taken_ms": 2000
            }
        )
        assert answer_response.status_code == 200
        
        answer_result = answer_response.json()
        assert answer_result["is_correct"] == True, \
            f"Case-insensitive validation failed: '{blank_answer.upper()}' should match '{blank_answer}'"
        
        print(f"✓ Case-insensitive validation works: '{blank_answer.upper()}' matches '{blank_answer}'")


class TestP0HostViewSelectedMode:
    """P0 Bug Fix: Teacher Host View shows selected_mode for each participant"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_session_returns_selected_mode_for_participants(self):
        """Verify GET session returns selected_mode for each participant"""
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}")
        assert response.status_code == 200
        
        data = response.json()
        participants = data.get("participants", [])
        
        # Check that participants with modes have selected_mode field
        for p in participants:
            if p.get("selected_mode"):
                print(f"  - {p.get('nickname')}: selected_mode={p.get('selected_mode')}, score={p.get('score')}")
        
        # Verify at least some participants have selected_mode
        with_mode = [p for p in participants if p.get("selected_mode")]
        assert len(with_mode) > 0, "No participants have selected_mode in response"
        
        print(f"✓ Session returns selected_mode for {len(with_mode)}/{len(participants)} participants")
    
    def test_select_mode_stores_mode_in_participant(self):
        """Verify select-mode endpoint stores mode in participant record"""
        # Join with new participant
        nickname = f"ModeStoreTest_{int(time.time())}"
        join_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/join",
            json={"nickname": nickname}
        )
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Select quiz mode
        select_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/select-mode",
            json={
                "game_type": "quiz",
                "participant_id": participant_id
            }
        )
        assert select_response.status_code == 200
        
        # Verify mode is stored by fetching session again
        session_response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}")
        assert session_response.status_code == 200
        
        participants = session_response.json().get("participants", [])
        participant = next((p for p in participants if p.get("participant_id") == participant_id), None)
        
        assert participant is not None, f"Participant {participant_id} not found"
        assert participant.get("selected_mode") == "quiz", \
            f"Expected selected_mode='quiz', got '{participant.get('selected_mode')}'"
        
        print(f"✓ select-mode correctly stores mode in participant: {nickname} -> quiz")


class TestAllModesSessionFlow:
    """Test complete ALL_MODES session flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_join_select_mode_play_flow(self):
        """Test complete flow: join -> select mode -> play with correct game payload"""
        # Step 1: Join session
        nickname = f"FlowTest_{int(time.time())}"
        join_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/join",
            json={"nickname": nickname}
        )
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        allowed_types = join_response.json().get("allowed_game_types", [])
        
        print(f"✓ Step 1: Joined as {nickname}, allowed_game_types={allowed_types}")
        
        # Step 2: Select true_false mode
        select_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/select-mode",
            json={
                "game_type": "true_false",
                "participant_id": participant_id
            }
        )
        assert select_response.status_code == 200
        
        game_payload = select_response.json()["game_payload"]
        assert game_payload["game_type"] == "true_false"
        
        questions = game_payload["questions"]
        assert len(questions) > 0
        
        print(f"✓ Step 2: Selected true_false mode, got {len(questions)} questions")
        
        # Step 3: Answer a question
        first_q = questions[0]
        expected_answer = "true" if first_q.get("is_true", True) else "false"
        
        answer_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/submit-answer?participant_id={participant_id}",
            json={
                "item_id": first_q["item_id"],
                "answer": expected_answer,
                "time_taken_ms": 2500
            }
        )
        assert answer_response.status_code == 200
        
        result = answer_response.json()
        assert result["is_correct"] == True, f"Expected correct answer, got is_correct={result['is_correct']}"
        
        print(f"✓ Step 3: Answered '{expected_answer}' correctly, score={result['score']}")


class TestTrueFalseValidation:
    """Test True/False game mode validation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_true_false_correct_answer(self):
        """Test True/False answers are validated correctly"""
        # Join and select true_false
        nickname = f"TFTest_{int(time.time())}"
        join_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/join",
            json={"nickname": nickname}
        )
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        select_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/select-mode",
            json={
                "game_type": "true_false",
                "participant_id": participant_id
            }
        )
        assert select_response.status_code == 200
        
        questions = select_response.json()["game_payload"]["questions"]
        first_q = questions[0]
        
        # Answer based on is_true value
        correct_answer = "true" if first_q.get("is_true", True) else "false"
        
        answer_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/submit-answer?participant_id={participant_id}",
            json={
                "item_id": first_q["item_id"],
                "answer": correct_answer,
                "time_taken_ms": 2000
            }
        )
        assert answer_response.status_code == 200
        
        result = answer_response.json()
        assert result["is_correct"] == True, f"True/False validation failed for answer '{correct_answer}'"
        
        print(f"✓ True/False validation works: '{correct_answer}' is CORRECT")


class TestQuizValidation:
    """Test Quiz game mode validation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_quiz_correct_answer(self):
        """Test Quiz answers are validated correctly"""
        # Join and select quiz
        nickname = f"QuizTest_{int(time.time())}"
        join_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/join",
            json={"nickname": nickname}
        )
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        select_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/select-mode",
            json={
                "game_type": "quiz",
                "participant_id": participant_id
            }
        )
        assert select_response.status_code == 200
        
        questions = select_response.json()["game_payload"]["questions"]
        first_q = questions[0]
        correct_answer = first_q.get("correct_answer", "")
        
        answer_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{ALL_MODES_SESSION}/submit-answer?participant_id={participant_id}",
            json={
                "item_id": first_q["item_id"],
                "answer": correct_answer,
                "time_taken_ms": 2000
            }
        )
        assert answer_response.status_code == 200
        
        result = answer_response.json()
        assert result["is_correct"] == True, f"Quiz validation failed for answer '{correct_answer}'"
        
        print(f"✓ Quiz validation works: '{correct_answer[:30]}...' is CORRECT")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
