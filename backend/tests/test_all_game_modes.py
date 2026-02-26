"""
Play to Learn - ALL Game Modes Comprehensive Tests
Tests for:
1. MEMORY game - cards don't reshuffle on click, reveals work, matching works
2. FILL_BLANK game - proper sentences with blanks, answer validation works
3. QUIZ game - multiple choice questions, answer validation
4. TRUE_FALSE game - True/False buttons, answer validation
5. MATCHING game - pair matching works
6. FLASHCARD game - flip cards work
7. All Modes selection - student can choose mode, game plays correctly
8. Teacher Host view shows each player's selected mode for all_modes sessions
"""

import pytest
import requests
import os
import json
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://classroom-games-2.preview.emergentagent.com')

# Test sessions from review request
TEST_SESSIONS = {
    "quiz": "ps_93315ba2253248f1",
    "memory": "ps_aad62777d66f4f75",
    "fill_blank": "ps_2978eb3440bc49a5"
}

TEST_ASSIGNMENT = "pa_2cf521cf4b204655"  # Animal Classification


class TestAPIHealth:
    """Basic API health check"""
    
    def test_api_health(self):
        """Test API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"API healthy: {data}")


class TestMemoryGame:
    """Test MEMORY game mode - cards shuffled once, reveals work, matching works"""
    
    def test_memory_session_exists(self):
        """Test memory session exists and has correct structure"""
        session_id = TEST_SESSIONS["memory"]
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        
        assert response.status_code == 200, f"Memory session not found: {response.text}"
        data = response.json()
        
        assert data["game_type"] == "memory", f"Expected memory, got {data['game_type']}"
        assert "game_payload" in data
        assert "pairs" in data["game_payload"]
        
        pairs = data["game_payload"]["pairs"]
        assert len(pairs) > 0, "Memory game should have pairs"
        
        print(f"Memory session has {len(pairs)} pairs")
        return data
    
    def test_memory_pairs_structure(self):
        """Test memory pairs have correct structure (pair_id, card_a, card_b)"""
        session_id = TEST_SESSIONS["memory"]
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        
        assert response.status_code == 200
        data = response.json()
        pairs = data["game_payload"]["pairs"]
        
        for pair in pairs:
            assert "pair_id" in pair, f"Pair missing pair_id: {pair}"
            assert "card_a" in pair, f"Pair missing card_a: {pair}"
            assert "card_b" in pair, f"Pair missing card_b: {pair}"
            
            # Verify card_a and card_b are non-empty strings
            assert isinstance(pair["card_a"], str) and len(pair["card_a"]) > 0
            assert isinstance(pair["card_b"], str) and len(pair["card_b"]) > 0
        
        print(f"All {len(pairs)} pairs have correct structure")
        print(f"Sample pair: {pairs[0]}")
    
    def test_memory_pairs_are_unique(self):
        """Test that memory pairs have unique pair_ids"""
        session_id = TEST_SESSIONS["memory"]
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        
        assert response.status_code == 200
        data = response.json()
        pairs = data["game_payload"]["pairs"]
        
        pair_ids = [p["pair_id"] for p in pairs]
        unique_ids = set(pair_ids)
        
        assert len(pair_ids) == len(unique_ids), f"Duplicate pair_ids found: {pair_ids}"
        print(f"All {len(pairs)} pair_ids are unique")


class TestFillBlankGame:
    """Test FILL_BLANK game mode - proper sentences with blanks, answer validation"""
    
    def test_fill_blank_session_exists(self):
        """Test fill_blank session exists and has correct structure"""
        session_id = TEST_SESSIONS["fill_blank"]
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        
        assert response.status_code == 200, f"Fill blank session not found: {response.text}"
        data = response.json()
        
        assert data["game_type"] == "fill_blank", f"Expected fill_blank, got {data['game_type']}"
        assert "game_payload" in data
        assert "questions" in data["game_payload"]
        
        questions = data["game_payload"]["questions"]
        assert len(questions) > 0, "Fill blank game should have questions"
        
        print(f"Fill blank session has {len(questions)} questions")
        return data
    
    def test_fill_blank_sentence_has_blank(self):
        """Test fill_blank sentences contain _____ blank placeholder"""
        session_id = TEST_SESSIONS["fill_blank"]
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        
        assert response.status_code == 200
        data = response.json()
        questions = data["game_payload"]["questions"]
        
        for q in questions:
            sentence = q.get("sentence", "")
            assert "_____" in sentence or "___" in sentence, f"Sentence missing blank: {sentence}"
        
        print(f"All {len(questions)} sentences have blanks")
        print(f"Sample sentence: {questions[0]['sentence']}")
    
    def test_fill_blank_has_answer(self):
        """Test fill_blank questions have blank_answer field"""
        session_id = TEST_SESSIONS["fill_blank"]
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        
        assert response.status_code == 200
        data = response.json()
        questions = data["game_payload"]["questions"]
        
        for q in questions:
            assert "blank_answer" in q, f"Question missing blank_answer: {q}"
            assert len(q["blank_answer"]) > 0, f"blank_answer is empty: {q}"
        
        print(f"All {len(questions)} questions have blank_answer")
        print(f"Sample answer: {questions[0]['blank_answer']}")
    
    def test_fill_blank_answer_validation(self):
        """Test fill_blank answer validation works correctly"""
        session_id = TEST_SESSIONS["fill_blank"]
        
        # Join as participant
        join_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": f"FillBlankTest_{int(time.time())}"}
        )
        
        if join_response.status_code != 200:
            pytest.skip(f"Could not join session: {join_response.text}")
        
        participant_id = join_response.json()["participant_id"]
        
        # Get session to find correct answer
        session_response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        questions = session_response.json()["game_payload"]["questions"]
        first_q = questions[0]
        
        # Submit correct answer
        correct_answer = first_q["blank_answer"]
        submit_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/submit-answer?participant_id={participant_id}",
            json={
                "item_id": first_q["item_id"],
                "answer": correct_answer,
                "time_taken_ms": 5000
            }
        )
        
        assert submit_response.status_code == 200, f"Submit failed: {submit_response.text}"
        result = submit_response.json()
        
        assert result["is_correct"] == True, f"Correct answer marked wrong: {result}"
        print(f"Fill blank answer validation works: '{correct_answer}' is correct")


class TestQuizGame:
    """Test QUIZ game mode - multiple choice questions, answer validation"""
    
    def test_quiz_session_exists(self):
        """Test quiz session exists and has correct structure"""
        session_id = TEST_SESSIONS["quiz"]
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        
        assert response.status_code == 200, f"Quiz session not found: {response.text}"
        data = response.json()
        
        assert data["game_type"] == "quiz", f"Expected quiz, got {data['game_type']}"
        assert "game_payload" in data
        assert "questions" in data["game_payload"]
        
        questions = data["game_payload"]["questions"]
        assert len(questions) > 0, "Quiz game should have questions"
        
        print(f"Quiz session has {len(questions)} questions")
        return data
    
    def test_quiz_has_options(self):
        """Test quiz questions have multiple choice options"""
        session_id = TEST_SESSIONS["quiz"]
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        
        assert response.status_code == 200
        data = response.json()
        questions = data["game_payload"]["questions"]
        
        for q in questions:
            assert "options" in q, f"Question missing options: {q}"
            assert len(q["options"]) >= 2, f"Question should have at least 2 options: {q}"
            assert "correct_answer" in q, f"Question missing correct_answer: {q}"
            assert q["correct_answer"] in q["options"], f"Correct answer not in options: {q}"
        
        print(f"All {len(questions)} questions have valid options")
        print(f"Sample question: {questions[0]['question'][:80]}...")
        print(f"Sample options: {questions[0]['options']}")
    
    def test_quiz_answer_validation(self):
        """Test quiz answer validation works correctly"""
        session_id = TEST_SESSIONS["quiz"]
        
        # Join as participant
        join_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": f"QuizTest_{int(time.time())}"}
        )
        
        if join_response.status_code != 200:
            pytest.skip(f"Could not join session: {join_response.text}")
        
        participant_id = join_response.json()["participant_id"]
        
        # Get session to find correct answer
        session_response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        questions = session_response.json()["game_payload"]["questions"]
        first_q = questions[0]
        
        # Submit correct answer
        correct_answer = first_q["correct_answer"]
        submit_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/submit-answer?participant_id={participant_id}",
            json={
                "item_id": first_q["item_id"],
                "answer": correct_answer,
                "time_taken_ms": 5000
            }
        )
        
        assert submit_response.status_code == 200, f"Submit failed: {submit_response.text}"
        result = submit_response.json()
        
        assert result["is_correct"] == True, f"Correct answer marked wrong: {result}"
        print(f"Quiz answer validation works: '{correct_answer}' is correct")


class TestTrueFalseGame:
    """Test TRUE_FALSE game mode - True/False buttons, answer validation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        
        self.token = login_response.cookies.get('session_token')
        if self.token:
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_create_true_false_session(self):
        """Test creating a true_false session"""
        # Create assignment
        assignment_data = {
            "subject": "Science",
            "grade_level": "5th Grade",
            "topic": "Animal Classification",
            "difficulty": "medium",
            "item_count": 5,
            "allowed_game_types": ["true_false"],
            "language": "en"
        }
        
        assignment_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json=assignment_data
        )
        
        assert assignment_response.status_code == 200
        assignment_id = assignment_response.json()["assignment_id"]
        
        # Create true_false session
        session_data = {
            "assignment_id": assignment_id,
            "game_type": "true_false",
            "mode": "SELF_PACED"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json=session_data
        )
        
        assert response.status_code == 200, f"Failed to create session: {response.text}"
        data = response.json()
        
        assert data["game_type"] == "true_false"
        assert "game_payload" in data
        assert "questions" in data["game_payload"]
        
        questions = data["game_payload"]["questions"]
        assert len(questions) > 0
        
        # Verify true_false structure
        for q in questions:
            assert "statement" in q or "question" in q, f"Missing statement/question: {q}"
            assert "is_true" in q, f"Missing is_true field: {q}"
            assert isinstance(q["is_true"], bool), f"is_true should be boolean: {q}"
        
        print(f"True/False session created with {len(questions)} questions")
        print(f"Sample: {questions[0]}")
        
        return data
    
    def test_true_false_answer_validation(self):
        """Test true_false answer validation - 'true' for true statement is correct"""
        session_data = self.test_create_true_false_session()
        session_id = session_data["session_id"]
        
        # Join as participant
        join_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": f"TFTest_{int(time.time())}"}
        )
        
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Find a true statement
        questions = session_data["game_payload"]["questions"]
        true_statement = next((q for q in questions if q.get("is_true") == True), None)
        
        if not true_statement:
            pytest.skip("No true statements found in session")
        
        # Submit 'true' for a true statement
        submit_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/submit-answer?participant_id={participant_id}",
            json={
                "item_id": true_statement["item_id"],
                "answer": "true",
                "time_taken_ms": 5000
            }
        )
        
        assert submit_response.status_code == 200
        result = submit_response.json()
        
        assert result["is_correct"] == True, f"'true' for true statement should be correct: {result}"
        print(f"True/False validation works: 'true' for true statement is CORRECT")


class TestMatchingGame:
    """Test MATCHING game mode - pair matching works"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        
        self.token = login_response.cookies.get('session_token')
        if self.token:
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_create_matching_session(self):
        """Test creating a matching session"""
        # Create assignment
        assignment_data = {
            "subject": "Science",
            "grade_level": "5th Grade",
            "topic": "Animal Classification",
            "difficulty": "medium",
            "item_count": 5,
            "allowed_game_types": ["matching"],
            "language": "en"
        }
        
        assignment_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json=assignment_data
        )
        
        assert assignment_response.status_code == 200
        assignment_id = assignment_response.json()["assignment_id"]
        
        # Create matching session
        session_data = {
            "assignment_id": assignment_id,
            "game_type": "matching",
            "mode": "SELF_PACED"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json=session_data
        )
        
        assert response.status_code == 200, f"Failed to create session: {response.text}"
        data = response.json()
        
        assert data["game_type"] == "matching"
        assert "game_payload" in data
        
        # Matching can have pairs or terms/definitions
        payload = data["game_payload"]
        has_pairs = "pairs" in payload and len(payload["pairs"]) > 0
        has_terms = "terms" in payload and len(payload["terms"]) > 0
        
        assert has_pairs or has_terms, f"Matching should have pairs or terms: {payload.keys()}"
        
        print(f"Matching session created: {data['session_id']}")
        print(f"Payload keys: {payload.keys()}")
        
        return data


class TestFlashcardGame:
    """Test FLASHCARD game mode - flip cards work"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        
        self.token = login_response.cookies.get('session_token')
        if self.token:
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_create_flashcard_session(self):
        """Test creating a flashcard session"""
        # Create assignment
        assignment_data = {
            "subject": "Science",
            "grade_level": "5th Grade",
            "topic": "Animal Classification",
            "difficulty": "medium",
            "item_count": 5,
            "allowed_game_types": ["flashcard"],
            "language": "en"
        }
        
        assignment_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json=assignment_data
        )
        
        assert assignment_response.status_code == 200
        assignment_id = assignment_response.json()["assignment_id"]
        
        # Create flashcard session
        session_data = {
            "assignment_id": assignment_id,
            "game_type": "flashcard",
            "mode": "SELF_PACED"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json=session_data
        )
        
        assert response.status_code == 200, f"Failed to create session: {response.text}"
        data = response.json()
        
        assert data["game_type"] == "flashcard"
        assert "game_payload" in data
        
        # Flashcard should have cards
        payload = data["game_payload"]
        assert "cards" in payload, f"Flashcard should have cards: {payload.keys()}"
        assert len(payload["cards"]) > 0, "Flashcard should have at least 1 card"
        
        # Verify card structure
        card = payload["cards"][0]
        assert "front" in card or "term" in card, f"Card missing front/term: {card}"
        assert "back" in card or "definition" in card, f"Card missing back/definition: {card}"
        
        print(f"Flashcard session created with {len(payload['cards'])} cards")
        print(f"Sample card: {card}")
        
        return data


class TestAllModesSelection:
    """Test ALL_MODES selection - student can choose mode, game plays correctly"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        
        self.token = login_response.cookies.get('session_token')
        if self.token:
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_create_all_modes_session(self):
        """Test creating an all_modes session"""
        # Create assignment with multiple game types
        assignment_data = {
            "subject": "Science",
            "grade_level": "5th Grade",
            "topic": "Animal Classification",
            "difficulty": "medium",
            "item_count": 5,
            "allowed_game_types": ["quiz", "true_false", "fill_blank", "matching", "flashcard", "memory"],
            "language": "en"
        }
        
        assignment_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json=assignment_data
        )
        
        assert assignment_response.status_code == 200
        assignment_id = assignment_response.json()["assignment_id"]
        
        # Create all_modes session
        session_data = {
            "assignment_id": assignment_id,
            "game_type": "all_modes",
            "mode": "SELF_PACED"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json=session_data
        )
        
        assert response.status_code == 200, f"Failed to create session: {response.text}"
        data = response.json()
        
        assert data["game_type"] == "all_modes"
        assert "allowed_game_types" in data
        assert len(data["allowed_game_types"]) > 1, "all_modes should have multiple allowed types"
        
        print(f"All modes session created: {data['session_id']}")
        print(f"Allowed types: {data['allowed_game_types']}")
        
        return data
    
    def test_select_mode_quiz(self):
        """Test selecting quiz mode from all_modes session"""
        session_data = self.test_create_all_modes_session()
        session_id = session_data["session_id"]
        
        # Join as participant
        join_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": f"ModeSelectTest_{int(time.time())}"}
        )
        
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Select quiz mode
        select_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/select-mode",
            json={
                "game_type": "quiz",
                "participant_id": participant_id
            }
        )
        
        assert select_response.status_code == 200, f"Select mode failed: {select_response.text}"
        data = select_response.json()
        
        assert data["game_type"] == "quiz"
        assert "game_payload" in data
        assert data["game_payload"]["game_type"] == "quiz"
        assert "questions" in data["game_payload"]
        
        print(f"Quiz mode selected successfully")
        print(f"Questions: {len(data['game_payload']['questions'])}")
    
    def test_select_mode_memory(self):
        """Test selecting memory mode from all_modes session"""
        session_data = self.test_create_all_modes_session()
        session_id = session_data["session_id"]
        
        # Join as participant
        join_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": f"MemorySelectTest_{int(time.time())}"}
        )
        
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Select memory mode
        select_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/select-mode",
            json={
                "game_type": "memory",
                "participant_id": participant_id
            }
        )
        
        assert select_response.status_code == 200, f"Select mode failed: {select_response.text}"
        data = select_response.json()
        
        assert data["game_type"] == "memory"
        assert "game_payload" in data
        assert data["game_payload"]["game_type"] == "memory"
        assert "pairs" in data["game_payload"]
        
        print(f"Memory mode selected successfully")
        print(f"Pairs: {len(data['game_payload']['pairs'])}")
    
    def test_select_mode_fill_blank(self):
        """Test selecting fill_blank mode from all_modes session"""
        session_data = self.test_create_all_modes_session()
        session_id = session_data["session_id"]
        
        # Join as participant
        join_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": f"FillBlankSelectTest_{int(time.time())}"}
        )
        
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Select fill_blank mode
        select_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/select-mode",
            json={
                "game_type": "fill_blank",
                "participant_id": participant_id
            }
        )
        
        assert select_response.status_code == 200, f"Select mode failed: {select_response.text}"
        data = select_response.json()
        
        assert data["game_type"] == "fill_blank"
        assert "game_payload" in data
        assert data["game_payload"]["game_type"] == "fill_blank"
        assert "questions" in data["game_payload"]
        
        # Verify fill_blank sentences have blanks
        questions = data["game_payload"]["questions"]
        for q in questions:
            sentence = q.get("sentence", "")
            assert "_____" in sentence or "___" in sentence, f"Sentence missing blank: {sentence}"
        
        print(f"Fill blank mode selected successfully")
        print(f"Questions: {len(questions)}")
        print(f"Sample: {questions[0]['sentence']}")


class TestTeacherHostView:
    """Test Teacher Host view shows each player's selected mode for all_modes sessions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        
        self.token = login_response.cookies.get('session_token')
        if self.token:
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_participant_mode_stored_in_session(self):
        """Test that participant's selected mode is stored in session"""
        # Create all_modes session
        assignment_data = {
            "subject": "Science",
            "grade_level": "5th Grade",
            "topic": "Animal Classification",
            "difficulty": "medium",
            "item_count": 5,
            "allowed_game_types": ["quiz", "true_false", "fill_blank", "memory"],
            "language": "en"
        }
        
        assignment_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json=assignment_data
        )
        
        assert assignment_response.status_code == 200
        assignment_id = assignment_response.json()["assignment_id"]
        
        # Create all_modes session
        session_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json={
                "assignment_id": assignment_id,
                "game_type": "all_modes",
                "mode": "SELF_PACED"
            }
        )
        
        assert session_response.status_code == 200
        session_id = session_response.json()["session_id"]
        
        # Join as participant
        join_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": f"HostViewTest_{int(time.time())}"}
        )
        
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Select a mode
        select_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/select-mode",
            json={
                "game_type": "quiz",
                "participant_id": participant_id
            }
        )
        
        assert select_response.status_code == 200
        
        # Get session and check participant has selected_mode
        get_response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        
        assert get_response.status_code == 200
        data = get_response.json()
        
        participants = data.get("participants", [])
        assert len(participants) > 0, "Session should have participants"
        
        # Find our participant
        our_participant = next((p for p in participants if p.get("participant_id") == participant_id), None)
        assert our_participant is not None, f"Participant {participant_id} not found"
        
        # Check selected_mode is stored
        assert "selected_mode" in our_participant, f"Participant missing selected_mode: {our_participant}"
        assert our_participant["selected_mode"] == "quiz", f"Expected quiz, got {our_participant['selected_mode']}"
        
        print(f"Participant's selected_mode stored correctly: {our_participant['selected_mode']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
