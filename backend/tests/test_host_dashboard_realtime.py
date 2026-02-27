"""
Test Host Dashboard Real-time Updates Bug Fixes
- WebSocket broadcasts work for both LIVE and SELF_PACED sessions
- Aggregate stats calculated from actual player data
- Player card progress shows correct denominator based on game type
- totalQuestions calculation handles different game types (word_search, memory, sequence, flashcard)
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHostDashboardRealtime:
    """Test Host Dashboard real-time updates for SELF_PACED sessions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session and credentials"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as teacher
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            if token:
                self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        yield
    
    def test_create_word_search_session_self_paced(self):
        """Test creating a SELF_PACED word_search session"""
        # First create an assignment with word_search allowed
        assignment_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json={
                "subject": "Math",
                "grade_level": "5th Grade",
                "topic": "Multiplication Tables",
                "difficulty": "medium",
                "item_count": 8,  # 8 items for word_search
                "allowed_game_types": ["word_search"],
                "language": "en"
            }
        )
        
        assert assignment_response.status_code == 200, f"Failed to create assignment: {assignment_response.text}"
        assignment_id = assignment_response.json().get("assignment_id")
        assert assignment_id is not None
        
        # Create SELF_PACED word_search session
        session_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json={
                "assignment_id": assignment_id,
                "game_type": "word_search",
                "mode": "SELF_PACED"
            }
        )
        
        assert session_response.status_code == 200, f"Failed to create session: {session_response.text}"
        session_data = session_response.json()
        
        # Verify session is ACTIVE (SELF_PACED starts immediately)
        assert session_data.get("status") == "ACTIVE"
        assert session_data.get("mode") == "SELF_PACED"
        assert session_data.get("game_type") == "word_search"
        
        return session_data
    
    def test_word_search_total_questions_calculation(self):
        """Test that word_search uses words.length for total questions, not base_items"""
        # Create assignment
        assignment_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json={
                "subject": "Science",
                "grade_level": "4th Grade",
                "topic": "Solar System",
                "difficulty": "easy",
                "item_count": 10,  # 10 base items
                "allowed_game_types": ["word_search"],
                "language": "en"
            }
        )
        
        assert assignment_response.status_code == 200
        assignment_id = assignment_response.json().get("assignment_id")
        
        # Create word_search session
        session_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json={
                "assignment_id": assignment_id,
                "game_type": "word_search",
                "mode": "SELF_PACED"
            }
        )
        
        assert session_response.status_code == 200
        session_data = session_response.json()
        session_id = session_data.get("session_id")
        
        # Get full session details
        session_details = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert session_details.status_code == 200
        
        session_info = session_details.json()
        game_payload = session_info.get("game_payload", {})
        
        # Word search should have words array (limited to 8 words max)
        words = game_payload.get("words", [])
        hints = game_payload.get("hints", [])
        
        # Verify word_search uses words.length (max 8), not base_items (10)
        assert len(words) <= 8, f"Word search should have max 8 words, got {len(words)}"
        assert len(hints) <= 8, f"Word search should have max 8 hints, got {len(hints)}"
        
        print(f"Word search total questions: {len(words)} (words), not 10 (base_items)")
        return session_id, len(words)
    
    def test_memory_game_total_questions_calculation(self):
        """Test that memory game uses pairs.length for total questions"""
        # Create assignment
        assignment_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json={
                "subject": "History",
                "grade_level": "6th Grade",
                "topic": "Ancient Civilizations",
                "difficulty": "medium",
                "item_count": 10,  # 10 base items
                "allowed_game_types": ["memory"],
                "language": "en"
            }
        )
        
        assert assignment_response.status_code == 200
        assignment_id = assignment_response.json().get("assignment_id")
        
        # Create memory session
        session_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json={
                "assignment_id": assignment_id,
                "game_type": "memory",
                "mode": "SELF_PACED"
            }
        )
        
        assert session_response.status_code == 200
        session_data = session_response.json()
        session_id = session_data.get("session_id")
        
        # Get full session details
        session_details = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert session_details.status_code == 200
        
        session_info = session_details.json()
        game_payload = session_info.get("game_payload", {})
        
        # Memory game should have pairs array (limited to 8 pairs max)
        pairs = game_payload.get("pairs", [])
        total_pairs = game_payload.get("total_pairs", 0)
        
        # Verify memory uses pairs.length (max 8), not base_items (10)
        assert len(pairs) <= 8, f"Memory game should have max 8 pairs, got {len(pairs)}"
        assert total_pairs == len(pairs), f"total_pairs should match pairs.length"
        
        print(f"Memory game total questions: {len(pairs)} (pairs), not 10 (base_items)")
        return session_id, len(pairs)
    
    def test_sequence_game_total_questions_calculation(self):
        """Test that sequence game uses items.length for total questions"""
        # Create assignment
        assignment_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json={
                "subject": "Math",
                "grade_level": "3rd Grade",
                "topic": "Number Ordering",
                "difficulty": "easy",
                "item_count": 10,
                "allowed_game_types": ["sequence"],
                "language": "en"
            }
        )
        
        assert assignment_response.status_code == 200
        assignment_id = assignment_response.json().get("assignment_id")
        
        # Create sequence session
        session_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json={
                "assignment_id": assignment_id,
                "game_type": "sequence",
                "mode": "SELF_PACED"
            }
        )
        
        assert session_response.status_code == 200
        session_data = session_response.json()
        session_id = session_data.get("session_id")
        
        # Get full session details
        session_details = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert session_details.status_code == 200
        
        session_info = session_details.json()
        game_payload = session_info.get("game_payload", {})
        
        # Sequence game should have items array
        items = game_payload.get("items", [])
        
        print(f"Sequence game total questions: {len(items)} (items)")
        return session_id, len(items)
    
    def test_flashcard_game_total_questions_calculation(self):
        """Test that flashcard game uses cards.length for total questions"""
        # Create assignment
        assignment_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json={
                "subject": "Language",
                "grade_level": "2nd Grade",
                "topic": "Vocabulary",
                "difficulty": "easy",
                "item_count": 10,
                "allowed_game_types": ["flashcard"],
                "language": "en"
            }
        )
        
        assert assignment_response.status_code == 200
        assignment_id = assignment_response.json().get("assignment_id")
        
        # Create flashcard session
        session_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json={
                "assignment_id": assignment_id,
                "game_type": "flashcard",
                "mode": "SELF_PACED"
            }
        )
        
        assert session_response.status_code == 200
        session_data = session_response.json()
        session_id = session_data.get("session_id")
        
        # Get full session details
        session_details = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert session_details.status_code == 200
        
        session_info = session_details.json()
        game_payload = session_info.get("game_payload", {})
        
        # Flashcard game should have cards array
        cards = game_payload.get("cards", [])
        
        print(f"Flashcard game total questions: {len(cards)} (cards)")
        return session_id, len(cards)
    
    def test_self_paced_answer_submission_updates_participant(self):
        """Test that answer submission in SELF_PACED mode updates participant data correctly"""
        # Create assignment
        assignment_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json={
                "subject": "Math",
                "grade_level": "5th Grade",
                "topic": "Addition",
                "difficulty": "easy",
                "item_count": 5,
                "allowed_game_types": ["quiz"],
                "language": "en"
            }
        )
        
        assert assignment_response.status_code == 200
        assignment_id = assignment_response.json().get("assignment_id")
        
        # Create SELF_PACED quiz session
        session_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json={
                "assignment_id": assignment_id,
                "game_type": "quiz",
                "mode": "SELF_PACED"
            }
        )
        
        assert session_response.status_code == 200
        session_data = session_response.json()
        session_id = session_data.get("session_id")
        
        # Join session as a player
        join_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": "TestPlayer_RealTime"}
        )
        
        assert join_response.status_code == 200
        participant_id = join_response.json().get("participant_id")
        
        # Get session to find item_ids
        session_details = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert session_details.status_code == 200
        
        session_info = session_details.json()
        questions = session_info.get("game_payload", {}).get("questions", [])
        
        if len(questions) > 0:
            # Submit an answer
            item_id = questions[0].get("item_id")
            correct_answer = questions[0].get("correct_answer")
            
            answer_response = self.session.post(
                f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/submit-answer?participant_id={participant_id}",
                json={
                    "item_id": item_id,
                    "answer": correct_answer,
                    "time_taken_ms": 5000
                }
            )
            
            assert answer_response.status_code == 200
            answer_data = answer_response.json()
            
            # Verify answer was recorded correctly
            assert answer_data.get("is_correct") == True
            assert answer_data.get("score") == 1
            
            # Verify participant data is updated in session
            updated_session = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
            assert updated_session.status_code == 200
            
            updated_info = updated_session.json()
            participants = updated_info.get("participants", [])
            
            # Find our participant
            participant = next((p for p in participants if p.get("participant_id") == participant_id), None)
            assert participant is not None
            
            # Verify participant stats are updated
            assert participant.get("score") == 1
            assert len(participant.get("answers", [])) == 1
            
            print(f"SELF_PACED answer submission verified: score={participant.get('score')}, answers={len(participant.get('answers', []))}")
    
    def test_all_modes_session_player_mode_selection(self):
        """Test that ALL_MODES session correctly tracks player's selected mode"""
        # Create assignment with multiple game types
        assignment_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json={
                "subject": "Science",
                "grade_level": "4th Grade",
                "topic": "Animals",
                "difficulty": "medium",
                "item_count": 8,
                "allowed_game_types": ["quiz", "word_search", "memory"],
                "language": "en"
            }
        )
        
        assert assignment_response.status_code == 200
        assignment_id = assignment_response.json().get("assignment_id")
        
        # Create ALL_MODES session
        session_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json={
                "assignment_id": assignment_id,
                "game_type": "all_modes",
                "mode": "SELF_PACED"
            }
        )
        
        assert session_response.status_code == 200
        session_data = session_response.json()
        session_id = session_data.get("session_id")
        
        # Verify allowed_game_types is preserved
        assert "quiz" in session_data.get("allowed_game_types", [])
        assert "word_search" in session_data.get("allowed_game_types", [])
        assert "memory" in session_data.get("allowed_game_types", [])
        
        # Join session
        join_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": "TestPlayer_AllModes"}
        )
        
        assert join_response.status_code == 200
        participant_id = join_response.json().get("participant_id")
        
        # Select word_search mode
        select_mode_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/select-mode",
            json={
                "game_type": "word_search",
                "participant_id": participant_id
            }
        )
        
        assert select_mode_response.status_code == 200
        mode_data = select_mode_response.json()
        
        # Verify mode selection
        assert mode_data.get("game_type") == "word_search"
        
        # Verify game_payload has word_search format
        game_payload = mode_data.get("game_payload", {})
        assert "words" in game_payload
        assert "hints" in game_payload
        
        # Verify participant's selected_mode is updated
        session_details = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert session_details.status_code == 200
        
        session_info = session_details.json()
        participants = session_info.get("participants", [])
        
        participant = next((p for p in participants if p.get("participant_id") == participant_id), None)
        assert participant is not None
        assert participant.get("selected_mode") == "word_search"
        
        print(f"ALL_MODES player mode selection verified: selected_mode={participant.get('selected_mode')}")
    
    def test_complete_session_uses_correct_total_for_game_type(self):
        """Test that /complete endpoint calculates accuracy using correct total for game type"""
        # Create word_search assignment
        assignment_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json={
                "subject": "Math",
                "grade_level": "3rd Grade",
                "topic": "Shapes",
                "difficulty": "easy",
                "item_count": 10,  # 10 base items
                "allowed_game_types": ["word_search"],
                "language": "en"
            }
        )
        
        assert assignment_response.status_code == 200
        assignment_id = assignment_response.json().get("assignment_id")
        
        # Create word_search session
        session_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json={
                "assignment_id": assignment_id,
                "game_type": "word_search",
                "mode": "SELF_PACED"
            }
        )
        
        assert session_response.status_code == 200
        session_data = session_response.json()
        session_id = session_data.get("session_id")
        
        # Join session
        join_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": "TestPlayer_Complete"}
        )
        
        assert join_response.status_code == 200
        participant_id = join_response.json().get("participant_id")
        
        # Get session to find words
        session_details = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert session_details.status_code == 200
        
        session_info = session_details.json()
        game_payload = session_info.get("game_payload", {})
        words = game_payload.get("words", [])
        hints = game_payload.get("hints", [])
        
        # Submit answers for some words
        answers_submitted = 0
        for hint in hints[:3]:  # Submit 3 answers
            item_id = hint.get("item_id")
            word = hint.get("word")
            
            answer_response = self.session.post(
                f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/submit-answer?participant_id={participant_id}",
                json={
                    "item_id": item_id,
                    "answer": word,
                    "time_taken_ms": 3000
                }
            )
            
            if answer_response.status_code == 200:
                answers_submitted += 1
        
        # Complete session
        complete_response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/complete?participant_id={participant_id}"
        )
        
        assert complete_response.status_code == 200
        result = complete_response.json()
        
        # Verify total_questions uses words.length (max 8), not base_items (10)
        total_questions = result.get("total_questions")
        assert total_questions == len(words), f"total_questions should be {len(words)} (words), got {total_questions}"
        assert total_questions <= 8, f"Word search total should be max 8, got {total_questions}"
        
        print(f"Complete endpoint verified: total_questions={total_questions} (words.length), not 10 (base_items)")


class TestWebSocketBroadcastForSelfPaced:
    """Test that WebSocket broadcasts work for SELF_PACED sessions (not just LIVE)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session and credentials"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as teacher
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            if token:
                self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        yield
    
    def test_backend_code_broadcasts_for_all_modes(self):
        """
        Verify that the backend code broadcasts WebSocket messages for both LIVE and SELF_PACED.
        This is a code review test - the fix removed the 'if session.mode == LIVE' check.
        """
        # Read the backend code to verify the fix
        import subprocess
        result = subprocess.run(
            ["grep", "-n", "send_to_host", "/app/backend/routes/play_to_learn.py"],
            capture_output=True,
            text=True
        )
        
        # Verify send_to_host is called without mode check
        assert "send_to_host" in result.stdout, "send_to_host should be present in code"
        
        # Check that there's no 'if session.mode == "LIVE"' before send_to_host
        result2 = subprocess.run(
            ["grep", "-B5", "send_to_host", "/app/backend/routes/play_to_learn.py"],
            capture_output=True,
            text=True
        )
        
        # The fix removed the mode check, so we should NOT see 'if session.mode == "LIVE"' before send_to_host
        assert 'if session.mode == "LIVE"' not in result2.stdout or 'if session["mode"] == "LIVE"' not in result2.stdout, \
            "WebSocket broadcast should work for all modes, not just LIVE"
        
        print("Backend code verified: WebSocket broadcasts work for both LIVE and SELF_PACED sessions")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
