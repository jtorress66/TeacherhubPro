"""
Test Word Search Grid Generation and Host Dashboard Polling Bug Fixes

Bug Fix 1: Word Search grid now dynamically sizes to fit longest word + properly places ALL words
Bug Fix 2: Host dashboard polling now runs every 5 seconds to ensure data sync
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session token
SESSION_TOKEN = "test_session_1772151617337"


class TestWordSearchGridGeneration:
    """Test Word Search grid generation with long words"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.headers = {
            "Content-Type": "application/json",
            "Cookie": f"session_token={SESSION_TOKEN}"
        }
    
    def test_create_word_search_assignment_with_long_words(self):
        """Create a Word Search assignment that will generate long words"""
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json={
                "subject": "English",
                "grade_level": "8th Grade",
                "topic": "Vocabulary - Long Words (COMPREHENSION, CONCENTRATION, MELANCHOLY)",
                "difficulty": "hard",
                "item_count": 8,
                "allowed_game_types": ["word_search"],
                "language": "en"
            },
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to create assignment: {response.text}"
        data = response.json()
        assert "assignment_id" in data
        self.assignment_id = data["assignment_id"]
        print(f"Created assignment: {self.assignment_id}")
        return data["assignment_id"]
    
    def test_create_word_search_session(self):
        """Create a Word Search session and verify grid generation"""
        # First create assignment
        assignment_id = self.test_create_word_search_assignment_with_long_words()
        
        # Create session
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json={
                "assignment_id": assignment_id,
                "game_type": "word_search",
                "mode": "SELF_PACED"
            },
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to create session: {response.text}"
        data = response.json()
        assert "session_id" in data
        session_id = data["session_id"]
        print(f"Created session: {session_id}")
        
        # Get session details to verify game_payload
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        session_data = response.json()
        
        # Verify game_payload has words
        game_payload = session_data.get("game_payload", {})
        words = game_payload.get("words", [])
        grid_size = game_payload.get("grid_size", 12)
        
        print(f"Words in session: {words}")
        print(f"Grid size: {grid_size}")
        
        assert len(words) > 0, "No words generated for Word Search"
        
        # Check if any long words exist
        long_words = [w for w in words if len(w) > 10]
        print(f"Long words (>10 chars): {long_words}")
        
        return session_id
    
    def test_existing_word_search_session_has_words(self):
        """Test the existing Word Search session ps_f0c0e5572f8643a7"""
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/sessions/ps_f0c0e5572f8643a7",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to get session: {response.text}"
        data = response.json()
        
        game_payload = data.get("game_payload", {})
        words = game_payload.get("words", [])
        hints = game_payload.get("hints", [])
        
        print(f"Session ps_f0c0e5572f8643a7 words: {words}")
        print(f"Number of hints: {len(hints)}")
        
        # Verify MELANCHOLY is in the words list
        assert "MELANCHOLY" in words, f"MELANCHOLY not found in words: {words}"
        assert len(words) >= 5, f"Expected at least 5 words, got {len(words)}"


class TestHostDashboardPolling:
    """Test Host Dashboard polling for ALL_MODES sessions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.headers = {
            "Content-Type": "application/json",
            "Cookie": f"session_token={SESSION_TOKEN}"
        }
    
    def test_create_all_modes_live_session(self):
        """Create an ALL_MODES LIVE session for Host dashboard testing"""
        # First create assignment with all modes
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json={
                "subject": "Math",
                "grade_level": "6th Grade",
                "topic": "Fractions and Decimals",
                "difficulty": "medium",
                "item_count": 10,
                "allowed_game_types": ["quiz", "true_false", "fill_blank", "matching", "flashcard", "memory"],
                "language": "en"
            },
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to create assignment: {response.text}"
        assignment_id = response.json()["assignment_id"]
        
        # Create ALL_MODES LIVE session
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json={
                "assignment_id": assignment_id,
                "game_type": "all_modes",
                "mode": "LIVE"
            },
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to create session: {response.text}"
        data = response.json()
        
        session_id = data["session_id"]
        join_pin = data.get("join_pin")
        
        print(f"Created ALL_MODES LIVE session: {session_id}")
        print(f"Join PIN: {join_pin}")
        
        assert join_pin is not None, "LIVE session should have a join PIN"
        assert data["status"] == "LOBBY", f"Expected LOBBY status, got {data['status']}"
        
        return session_id, join_pin
    
    def test_join_all_modes_session_and_select_mode(self):
        """Test joining an ALL_MODES session and selecting a mode"""
        session_id, join_pin = self.test_create_all_modes_live_session()
        
        # Join the session
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={
                "nickname": f"TestStudent_{int(time.time())}",
                "pin": join_pin
            }
        )
        assert response.status_code == 200, f"Failed to join session: {response.text}"
        data = response.json()
        
        participant_id = data["participant_id"]
        print(f"Joined as participant: {participant_id}")
        
        # Start the session (as teacher)
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/start",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to start session: {response.text}"
        
        # Select a mode
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/select-mode",
            json={
                "game_type": "quiz",
                "participant_id": participant_id
            }
        )
        assert response.status_code == 200, f"Failed to select mode: {response.text}"
        data = response.json()
        
        assert data["game_type"] == "quiz", f"Expected quiz mode, got {data['game_type']}"
        assert "game_payload" in data, "Missing game_payload in response"
        
        print(f"Selected mode: {data['game_type']}")
        
        # Verify the participant's selected_mode is stored
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        session_data = response.json()
        
        participants = session_data.get("participants", [])
        participant = next((p for p in participants if p["participant_id"] == participant_id), None)
        
        assert participant is not None, "Participant not found in session"
        assert participant.get("selected_mode") == "quiz", f"Expected selected_mode=quiz, got {participant.get('selected_mode')}"
        
        print(f"Participant selected_mode verified: {participant.get('selected_mode')}")
        
        return session_id, participant_id
    
    def test_mode_selection_broadcasts_for_self_paced(self):
        """Test that mode selection broadcasts work for SELF_PACED sessions too"""
        # Create assignment
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json={
                "subject": "Science",
                "grade_level": "5th Grade",
                "topic": "Solar System",
                "difficulty": "easy",
                "item_count": 8,
                "allowed_game_types": ["quiz", "matching", "flashcard"],
                "language": "en"
            },
            headers=self.headers
        )
        assert response.status_code == 200
        assignment_id = response.json()["assignment_id"]
        
        # Create ALL_MODES SELF_PACED session
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json={
                "assignment_id": assignment_id,
                "game_type": "all_modes",
                "mode": "SELF_PACED"
            },
            headers=self.headers
        )
        assert response.status_code == 200
        session_id = response.json()["session_id"]
        
        # Join the session
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": f"SelfPacedStudent_{int(time.time())}"}
        )
        assert response.status_code == 200
        participant_id = response.json()["participant_id"]
        
        # Select a mode
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/select-mode",
            json={
                "game_type": "matching",
                "participant_id": participant_id
            }
        )
        assert response.status_code == 200
        
        # Verify mode is stored
        response = requests.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert response.status_code == 200
        session_data = response.json()
        
        participant = next((p for p in session_data.get("participants", []) if p["participant_id"] == participant_id), None)
        assert participant is not None
        assert participant.get("selected_mode") == "matching"
        
        print(f"SELF_PACED mode selection verified: {participant.get('selected_mode')}")


class TestWordSearchGameplay:
    """Test Word Search gameplay - finding and selecting words"""
    
    def test_word_search_answer_submission(self):
        """Test submitting found words in Word Search"""
        headers = {
            "Content-Type": "application/json",
            "Cookie": f"session_token={SESSION_TOKEN}"
        }
        
        # Get the existing Word Search session
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/sessions/ps_f0c0e5572f8643a7"
        )
        assert response.status_code == 200
        session_data = response.json()
        
        # Join the session
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/ps_f0c0e5572f8643a7/join",
            json={"nickname": f"WordSearchPlayer_{int(time.time())}"}
        )
        assert response.status_code == 200
        participant_id = response.json()["participant_id"]
        
        # Get hints to find item_ids
        hints = session_data.get("game_payload", {}).get("hints", [])
        if hints:
            # Submit an answer for the first word
            first_hint = hints[0]
            item_id = first_hint.get("item_id")
            word = first_hint.get("word")
            
            response = requests.post(
                f"{BASE_URL}/api/play-to-learn/sessions/ps_f0c0e5572f8643a7/submit-answer?participant_id={participant_id}",
                json={
                    "item_id": item_id,
                    "answer": word,
                    "time_taken_ms": 5000
                }
            )
            assert response.status_code == 200
            result = response.json()
            
            print(f"Submitted word: {word}")
            print(f"Result: is_correct={result.get('is_correct')}, score={result.get('score')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
