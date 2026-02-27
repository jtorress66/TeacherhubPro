"""
Test Word Search Scoring Bug Fixes
==================================
Tests for three critical bug fixes:
1. Backend answer validation: Submitting 'MELANCHOLY' should be marked correct when expected word is MELANCHOLY
2. Completion endpoint: total_questions equals number of words (5), not base_items (10)
3. Completion endpoint: accuracy_percent reflects actual words found vs total words
4. Completion endpoint: missed_count shows 0 when all words are found
5. Sequence answer validation: Submitting position index validates against correct_position
6. Memory game: Answer submissions marked as correct since client already validated
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWordSearchScoringBugFixes:
    """Test Word Search scoring bug fixes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session and authentication"""
        # Login as teacher
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@school.edu",
            "password": "testpassword"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json().get("token")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
    def test_01_create_word_search_assignment_and_session(self):
        """Create a Word Search assignment and session for testing"""
        # Create assignment with word_search game type
        assignment_data = {
            "subject": "English",
            "grade_level": "5th Grade",
            "topic": "Vocabulary Words",
            "difficulty": "medium",
            "item_count": 5,  # Only 5 items to test word count
            "allowed_game_types": ["word_search"],
            "language": "en"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json=assignment_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to create assignment: {response.text}"
        assignment = response.json()
        self.assignment_id = assignment["assignment_id"]
        
        # Create word_search session
        session_data = {
            "assignment_id": self.assignment_id,
            "game_type": "word_search",
            "mode": "SELF_PACED"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json=session_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to create session: {response.text}"
        session = response.json()
        self.session_id = session["session_id"]
        
        # Verify session has word_search game_type
        assert session["game_type"] == "word_search"
        
        # Store for other tests
        TestWordSearchScoringBugFixes.assignment_id = self.assignment_id
        TestWordSearchScoringBugFixes.session_id = self.session_id
        
        print(f"Created assignment: {self.assignment_id}")
        print(f"Created session: {self.session_id}")
        
    def test_02_verify_word_search_game_payload_structure(self):
        """Verify Word Search game payload has words and hints arrays"""
        session_id = getattr(TestWordSearchScoringBugFixes, 'session_id', None)
        if not session_id:
            pytest.skip("No session_id from previous test")
            
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert response.status_code == 200, f"Failed to get session: {response.text}"
        
        session = response.json()
        game_payload = session.get("game_payload", {})
        
        # Word Search should have 'words' array, not 'questions'
        assert "words" in game_payload, "Word Search game_payload should have 'words' array"
        assert "hints" in game_payload, "Word Search game_payload should have 'hints' array"
        
        words = game_payload.get("words", [])
        hints = game_payload.get("hints", [])
        
        # Verify words count matches item_count (limited to 8 max in transform)
        assert len(words) > 0, "Words array should not be empty"
        assert len(hints) > 0, "Hints array should not be empty"
        assert len(words) == len(hints), "Words and hints should have same count"
        
        # Store words for answer validation test
        TestWordSearchScoringBugFixes.words = words
        TestWordSearchScoringBugFixes.hints = hints
        
        print(f"Words in game: {words}")
        print(f"Hints count: {len(hints)}")
        
    def test_03_join_session_as_participant(self):
        """Join the session as a participant"""
        session_id = getattr(TestWordSearchScoringBugFixes, 'session_id', None)
        if not session_id:
            pytest.skip("No session_id from previous test")
            
        join_data = {
            "nickname": "TestPlayer_WordSearch"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json=join_data
        )
        assert response.status_code == 200, f"Failed to join session: {response.text}"
        
        result = response.json()
        self.participant_id = result["participant_id"]
        TestWordSearchScoringBugFixes.participant_id = self.participant_id
        
        print(f"Joined as participant: {self.participant_id}")
        
    def test_04_word_search_answer_validation_correct_word(self):
        """
        BUG FIX TEST: Word Search answer validation should match submitted word against game_payload.hints[].word
        Submitting 'MELANCHOLY' should be marked correct when the expected word is MELANCHOLY
        """
        session_id = getattr(TestWordSearchScoringBugFixes, 'session_id', None)
        participant_id = getattr(TestWordSearchScoringBugFixes, 'participant_id', None)
        hints = getattr(TestWordSearchScoringBugFixes, 'hints', [])
        
        if not session_id or not participant_id or not hints:
            pytest.skip("Missing session_id, participant_id, or hints from previous tests")
        
        # Get the first hint/word to test
        first_hint = hints[0]
        expected_word = first_hint["word"]
        item_id = first_hint["item_id"]
        
        print(f"Testing word validation for: {expected_word} (item_id: {item_id})")
        
        # Submit the exact word (uppercase as stored)
        answer_data = {
            "item_id": item_id,
            "answer": expected_word,  # Submit the exact word
            "time_taken_ms": 5000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/submit-answer?participant_id={participant_id}",
            json=answer_data
        )
        assert response.status_code == 200, f"Failed to submit answer: {response.text}"
        
        result = response.json()
        
        # BUG FIX VERIFICATION: The answer should be marked as correct
        assert result["is_correct"] == True, f"Word '{expected_word}' should be marked correct but got is_correct={result['is_correct']}"
        assert result["correct_answer"] == expected_word, f"Correct answer should be '{expected_word}' but got '{result['correct_answer']}'"
        
        print(f"✓ Word '{expected_word}' correctly validated as correct")
        print(f"  Score: {result['score']}, Streak: {result['streak']}")
        
    def test_05_word_search_answer_validation_lowercase(self):
        """Test that lowercase word submission is also validated correctly"""
        session_id = getattr(TestWordSearchScoringBugFixes, 'session_id', None)
        participant_id = getattr(TestWordSearchScoringBugFixes, 'participant_id', None)
        hints = getattr(TestWordSearchScoringBugFixes, 'hints', [])
        
        if not session_id or not participant_id or len(hints) < 2:
            pytest.skip("Missing data or not enough hints")
        
        # Get the second hint/word to test
        second_hint = hints[1]
        expected_word = second_hint["word"]
        item_id = second_hint["item_id"]
        
        print(f"Testing lowercase word validation for: {expected_word.lower()} (item_id: {item_id})")
        
        # Submit lowercase version
        answer_data = {
            "item_id": item_id,
            "answer": expected_word.lower(),  # Submit lowercase
            "time_taken_ms": 4000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/submit-answer?participant_id={participant_id}",
            json=answer_data
        )
        assert response.status_code == 200, f"Failed to submit answer: {response.text}"
        
        result = response.json()
        
        # Should still be correct (case-insensitive comparison)
        assert result["is_correct"] == True, f"Lowercase word '{expected_word.lower()}' should be marked correct"
        
        print(f"✓ Lowercase word '{expected_word.lower()}' correctly validated as correct")
        
    def test_06_submit_all_remaining_words(self):
        """Submit all remaining words to complete the game"""
        session_id = getattr(TestWordSearchScoringBugFixes, 'session_id', None)
        participant_id = getattr(TestWordSearchScoringBugFixes, 'participant_id', None)
        hints = getattr(TestWordSearchScoringBugFixes, 'hints', [])
        
        if not session_id or not participant_id or not hints:
            pytest.skip("Missing data from previous tests")
        
        # Submit remaining words (skip first 2 already submitted)
        for hint in hints[2:]:
            expected_word = hint["word"]
            item_id = hint["item_id"]
            
            answer_data = {
                "item_id": item_id,
                "answer": expected_word,
                "time_taken_ms": 3000
            }
            
            response = requests.post(
                f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/submit-answer?participant_id={participant_id}",
                json=answer_data
            )
            assert response.status_code == 200, f"Failed to submit answer for {expected_word}: {response.text}"
            
            result = response.json()
            assert result["is_correct"] == True, f"Word '{expected_word}' should be correct"
            
            print(f"✓ Submitted word: {expected_word}, Score: {result['score']}")
            
    def test_07_complete_session_total_questions_equals_words_count(self):
        """
        BUG FIX TEST: Completion endpoint should return total_questions = number of words, not base_items
        For Word Search with 5 words, total_questions should be 5
        """
        session_id = getattr(TestWordSearchScoringBugFixes, 'session_id', None)
        participant_id = getattr(TestWordSearchScoringBugFixes, 'participant_id', None)
        words = getattr(TestWordSearchScoringBugFixes, 'words', [])
        
        if not session_id or not participant_id:
            pytest.skip("Missing session_id or participant_id")
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/complete?participant_id={participant_id}"
        )
        assert response.status_code == 200, f"Failed to complete session: {response.text}"
        
        result = response.json()
        
        expected_total = len(words)
        actual_total = result.get("total_questions", 0)
        
        # BUG FIX VERIFICATION: total_questions should equal words count
        assert actual_total == expected_total, f"total_questions should be {expected_total} (words count) but got {actual_total}"
        
        print(f"✓ total_questions correctly equals words count: {actual_total}")
        
        # Store result for next test
        TestWordSearchScoringBugFixes.completion_result = result
        
    def test_08_complete_session_accuracy_and_missed_count(self):
        """
        BUG FIX TEST: Verify accuracy_percent and missed_count are calculated correctly
        When all words are found: accuracy_percent = 100%, missed_count = 0
        """
        result = getattr(TestWordSearchScoringBugFixes, 'completion_result', None)
        words = getattr(TestWordSearchScoringBugFixes, 'words', [])
        
        if not result:
            pytest.skip("No completion result from previous test")
        
        score = result.get("score", 0)
        total_questions = result.get("total_questions", 0)
        accuracy_percent = result.get("accuracy_percent", 0)
        missed_count = result.get("missed_count", 0)
        
        # All words were submitted correctly
        expected_score = len(words)
        expected_accuracy = 100.0
        expected_missed = 0
        
        # BUG FIX VERIFICATION
        assert score == expected_score, f"Score should be {expected_score} but got {score}"
        assert accuracy_percent == expected_accuracy, f"Accuracy should be {expected_accuracy}% but got {accuracy_percent}%"
        assert missed_count == expected_missed, f"Missed count should be {expected_missed} but got {missed_count}"
        
        print(f"✓ Score: {score}/{total_questions}")
        print(f"✓ Accuracy: {accuracy_percent}%")
        print(f"✓ Missed count: {missed_count}")


class TestSequenceAnswerValidation:
    """Test Sequence game answer validation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session and authentication"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@school.edu",
            "password": "testpassword"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json().get("token")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
    def test_01_create_sequence_session(self):
        """Create a Sequence game session"""
        # Create assignment
        assignment_data = {
            "subject": "Science",
            "grade_level": "5th Grade",
            "topic": "Solar System Order",
            "difficulty": "medium",
            "item_count": 5,
            "allowed_game_types": ["sequence"],
            "language": "en"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json=assignment_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to create assignment: {response.text}"
        assignment = response.json()
        
        # Create sequence session
        session_data = {
            "assignment_id": assignment["assignment_id"],
            "game_type": "sequence",
            "mode": "SELF_PACED"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json=session_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to create session: {response.text}"
        session = response.json()
        
        TestSequenceAnswerValidation.session_id = session["session_id"]
        print(f"Created sequence session: {session['session_id']}")
        
    def test_02_verify_sequence_game_payload(self):
        """Verify Sequence game payload has items with correct_position"""
        session_id = getattr(TestSequenceAnswerValidation, 'session_id', None)
        if not session_id:
            pytest.skip("No session_id")
            
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert response.status_code == 200
        
        session = response.json()
        game_payload = session.get("game_payload", {})
        
        assert "items" in game_payload, "Sequence game_payload should have 'items' array"
        items = game_payload.get("items", [])
        
        # Each item should have correct_position
        for item in items:
            assert "correct_position" in item, f"Item {item.get('item_id')} missing correct_position"
            assert "item_id" in item, "Item missing item_id"
            
        TestSequenceAnswerValidation.items = items
        print(f"Sequence items: {len(items)}")
        
    def test_03_join_sequence_session(self):
        """Join the sequence session"""
        session_id = getattr(TestSequenceAnswerValidation, 'session_id', None)
        if not session_id:
            pytest.skip("No session_id")
            
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": "TestPlayer_Sequence"}
        )
        assert response.status_code == 200
        
        TestSequenceAnswerValidation.participant_id = response.json()["participant_id"]
        print(f"Joined as: {TestSequenceAnswerValidation.participant_id}")
        
    def test_04_sequence_answer_validation_correct_position(self):
        """
        BUG FIX TEST: Sequence answer validation should check submitted position against correct_position
        """
        session_id = getattr(TestSequenceAnswerValidation, 'session_id', None)
        participant_id = getattr(TestSequenceAnswerValidation, 'participant_id', None)
        items = getattr(TestSequenceAnswerValidation, 'items', [])
        
        if not session_id or not participant_id or not items:
            pytest.skip("Missing data")
        
        # Test submitting correct position for first item
        first_item = items[0]
        item_id = first_item["item_id"]
        correct_position = first_item["correct_position"]
        
        print(f"Testing sequence validation: item_id={item_id}, correct_position={correct_position}")
        
        # Submit the correct position
        answer_data = {
            "item_id": item_id,
            "answer": str(correct_position),  # Position as string
            "time_taken_ms": 2000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/submit-answer?participant_id={participant_id}",
            json=answer_data
        )
        assert response.status_code == 200, f"Failed to submit: {response.text}"
        
        result = response.json()
        
        # Should be correct when position matches
        assert result["is_correct"] == True, f"Position {correct_position} should be correct"
        assert result["correct_answer"] == str(correct_position), f"Correct answer should be '{correct_position}'"
        
        print(f"✓ Sequence position {correct_position} correctly validated")
        
    def test_05_sequence_answer_validation_wrong_position(self):
        """Test that wrong position is marked incorrect"""
        session_id = getattr(TestSequenceAnswerValidation, 'session_id', None)
        participant_id = getattr(TestSequenceAnswerValidation, 'participant_id', None)
        items = getattr(TestSequenceAnswerValidation, 'items', [])
        
        if not session_id or not participant_id or len(items) < 2:
            pytest.skip("Missing data")
        
        # Test submitting wrong position for second item
        second_item = items[1]
        item_id = second_item["item_id"]
        correct_position = second_item["correct_position"]
        wrong_position = (correct_position + 1) % len(items)  # Different position
        
        print(f"Testing wrong position: item_id={item_id}, correct={correct_position}, submitting={wrong_position}")
        
        answer_data = {
            "item_id": item_id,
            "answer": str(wrong_position),
            "time_taken_ms": 2000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/submit-answer?participant_id={participant_id}",
            json=answer_data
        )
        assert response.status_code == 200
        
        result = response.json()
        
        # Should be incorrect when position doesn't match
        assert result["is_correct"] == False, f"Position {wrong_position} should be incorrect (correct is {correct_position})"
        
        print(f"✓ Wrong position {wrong_position} correctly marked as incorrect")


class TestMemoryGameAnswerValidation:
    """Test Memory game answer validation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session and authentication"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@school.edu",
            "password": "testpassword"
        })
        assert login_response.status_code == 200
        self.token = login_response.json().get("token")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
    def test_01_create_memory_session(self):
        """Create a Memory game session"""
        assignment_data = {
            "subject": "Vocabulary",
            "grade_level": "4th Grade",
            "topic": "Word Pairs",
            "difficulty": "easy",
            "item_count": 4,
            "allowed_game_types": ["memory"],
            "language": "en"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json=assignment_data,
            headers=self.headers
        )
        assert response.status_code == 200
        assignment = response.json()
        
        session_data = {
            "assignment_id": assignment["assignment_id"],
            "game_type": "memory",
            "mode": "SELF_PACED"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json=session_data,
            headers=self.headers
        )
        assert response.status_code == 200
        session = response.json()
        
        TestMemoryGameAnswerValidation.session_id = session["session_id"]
        print(f"Created memory session: {session['session_id']}")
        
    def test_02_verify_memory_game_payload(self):
        """Verify Memory game payload has pairs"""
        session_id = getattr(TestMemoryGameAnswerValidation, 'session_id', None)
        if not session_id:
            pytest.skip("No session_id")
            
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert response.status_code == 200
        
        session = response.json()
        game_payload = session.get("game_payload", {})
        
        assert "pairs" in game_payload, "Memory game_payload should have 'pairs' array"
        pairs = game_payload.get("pairs", [])
        
        assert len(pairs) > 0, "Pairs should not be empty"
        
        TestMemoryGameAnswerValidation.pairs = pairs
        print(f"Memory pairs: {len(pairs)}")
        
    def test_03_join_memory_session(self):
        """Join the memory session"""
        session_id = getattr(TestMemoryGameAnswerValidation, 'session_id', None)
        if not session_id:
            pytest.skip("No session_id")
            
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": "TestPlayer_Memory"}
        )
        assert response.status_code == 200
        
        TestMemoryGameAnswerValidation.participant_id = response.json()["participant_id"]
        
    def test_04_memory_answer_always_correct(self):
        """
        BUG FIX TEST: Memory game answers should always be marked correct
        (client-side validation already confirmed the match)
        """
        session_id = getattr(TestMemoryGameAnswerValidation, 'session_id', None)
        participant_id = getattr(TestMemoryGameAnswerValidation, 'participant_id', None)
        pairs = getattr(TestMemoryGameAnswerValidation, 'pairs', [])
        
        if not session_id or not participant_id or not pairs:
            pytest.skip("Missing data")
        
        # Submit a memory match (any answer should be correct)
        first_pair = pairs[0]
        pair_id = first_pair["pair_id"]
        
        answer_data = {
            "item_id": pair_id,
            "answer": "matched",  # Any answer
            "time_taken_ms": 3000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/submit-answer?participant_id={participant_id}",
            json=answer_data
        )
        assert response.status_code == 200, f"Failed to submit: {response.text}"
        
        result = response.json()
        
        # Memory game should always mark as correct (client validated)
        assert result["is_correct"] == True, "Memory game answers should always be correct"
        
        print(f"✓ Memory game answer correctly marked as correct")
        
    def test_05_memory_completion_total_equals_pairs(self):
        """Verify Memory game completion uses pairs count for total_questions"""
        session_id = getattr(TestMemoryGameAnswerValidation, 'session_id', None)
        participant_id = getattr(TestMemoryGameAnswerValidation, 'participant_id', None)
        pairs = getattr(TestMemoryGameAnswerValidation, 'pairs', [])
        
        if not session_id or not participant_id:
            pytest.skip("Missing data")
        
        # Submit remaining pairs
        for pair in pairs[1:]:
            answer_data = {
                "item_id": pair["pair_id"],
                "answer": "matched",
                "time_taken_ms": 2000
            }
            requests.post(
                f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/submit-answer?participant_id={participant_id}",
                json=answer_data
            )
        
        # Complete session
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/complete?participant_id={participant_id}"
        )
        assert response.status_code == 200
        
        result = response.json()
        
        # total_questions should equal pairs count
        expected_total = len(pairs)
        actual_total = result.get("total_questions", 0)
        
        assert actual_total == expected_total, f"total_questions should be {expected_total} (pairs count) but got {actual_total}"
        
        print(f"✓ Memory completion total_questions = {actual_total} (pairs count)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
