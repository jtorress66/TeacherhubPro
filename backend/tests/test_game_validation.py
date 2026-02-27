"""
Test suite for Educational Games Validation Features
Tests game validation endpoints, smoke tests, and all 8 game types
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://classroom-game-hub-1.preview.emergentagent.com').rstrip('/')

# Admin credentials for AI access
ADMIN_EMAIL = "admin@teacherhubpro.com"
ADMIN_PASSWORD = "Entrada@196660_"


class TestValidationEndpoints:
    """Test the new validation endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login with admin account for AI access"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.session = requests.Session()
            self.session.cookies.update(response.cookies)
            self.session.headers.update({"Content-Type": "application/json"})
        else:
            pytest.skip("Admin login failed - skipping tests")
    
    def test_validate_endpoint_valid_quiz(self):
        """Test POST /api/games/validate with valid quiz game"""
        valid_quiz = {
            "title": "Math Quiz Test",
            "game_type": "quiz",
            "grade_level": "3-5",
            "subject": "math",
            "questions": [
                {
                    "question": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "correct_answer": "4"
                },
                {
                    "question": "What is 5 x 3?",
                    "options": ["10", "12", "15", "18"],
                    "correct_answer": "15"
                }
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/validate", json=valid_quiz)
        assert response.status_code == 200
        data = response.json()
        assert data.get("is_valid") == True
        assert data.get("error_count") == 0
        print(f"✓ POST /api/games/validate - valid quiz passed validation")
    
    def test_validate_endpoint_invalid_quiz(self):
        """Test POST /api/games/validate with invalid quiz (missing correct_answer in options)"""
        invalid_quiz = {
            "title": "Invalid Quiz",
            "game_type": "quiz",
            "questions": [
                {
                    "question": "What is 2 + 2?",
                    "options": ["3", "5", "6", "7"],  # 4 is missing!
                    "correct_answer": "4"  # Not in options
                }
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/validate", json=invalid_quiz)
        assert response.status_code == 200
        data = response.json()
        assert data.get("is_valid") == False
        assert len(data.get("errors", [])) > 0
        print(f"✓ POST /api/games/validate - invalid quiz detected: {data.get('errors')}")
    
    def test_smoke_test_endpoint_valid_game(self):
        """Test POST /api/games/smoke-test with valid game"""
        valid_game = {
            "title": "Smoke Test Quiz",
            "game_type": "quiz",
            "questions": [
                {
                    "question": "Test question?",
                    "options": ["A", "B", "C", "D"],
                    "correct_answer": "A"
                }
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/smoke-test", json=valid_game)
        assert response.status_code == 200
        data = response.json()
        assert data.get("passed") == True
        assert data.get("game_type") == "quiz"
        print(f"✓ POST /api/games/smoke-test - valid game passed smoke test")
    
    def test_smoke_test_endpoint_invalid_game(self):
        """Test POST /api/games/smoke-test with invalid game (empty options)"""
        invalid_game = {
            "title": "Invalid Smoke Test",
            "game_type": "quiz",
            "questions": [
                {
                    "question": "Test?",
                    "options": [],  # Empty options
                    "correct_answer": "A"
                }
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/smoke-test", json=invalid_game)
        assert response.status_code == 200
        data = response.json()
        assert data.get("passed") == False
        assert len(data.get("errors", [])) > 0
        print(f"✓ POST /api/games/smoke-test - invalid game detected: {data.get('errors')}")
    
    def test_full_validation_endpoint(self):
        """Test POST /api/games/full-validation endpoint"""
        valid_game = {
            "title": "Full Validation Test Quiz",
            "game_type": "quiz",
            "grade_level": "3-5",
            "subject": "math",
            "questions": [
                {
                    "question": "What is 10 / 2?",
                    "options": ["3", "4", "5", "6"],
                    "correct_answer": "5"
                }
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/full-validation", json=valid_game)
        assert response.status_code == 200
        data = response.json()
        assert "valid" in data
        assert "validation_passed" in data
        assert "smoke_test_passed" in data
        assert data.get("game_type") == "quiz"
        print(f"✓ POST /api/games/full-validation - valid: {data.get('valid')}, validation: {data.get('validation_passed')}, smoke: {data.get('smoke_test_passed')}")


class TestAllGameTypesValidation:
    """Test validation for all 8 game types"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login with admin account"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.session = requests.Session()
            self.session.cookies.update(response.cookies)
            self.session.headers.update({"Content-Type": "application/json"})
        else:
            pytest.skip("Admin login failed")
    
    def test_quiz_validation(self):
        """Test quiz game validation"""
        quiz = {
            "title": "Quiz Validation Test",
            "game_type": "quiz",
            "questions": [
                {"question": "Q1?", "options": ["A", "B", "C", "D"], "correct_answer": "A"},
                {"question": "Q2?", "options": ["X", "Y", "Z", "W"], "correct_answer": "Y"}
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/full-validation", json=quiz)
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") == True
        print(f"✓ Quiz validation passed")
    
    def test_true_false_validation(self):
        """Test true/false game validation"""
        tf_game = {
            "title": "True False Validation Test",
            "game_type": "true_false",
            "questions": [
                {"question": "The sky is blue.", "options": ["True", "False"], "correct_answer": "True"},
                {"question": "Water is dry.", "options": ["True", "False"], "correct_answer": "False"}
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/full-validation", json=tf_game)
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") == True
        print(f"✓ True/False validation passed")
    
    def test_fill_blanks_validation(self):
        """Test fill-in-the-blanks game validation"""
        fill_game = {
            "title": "Fill Blanks Validation Test",
            "game_type": "fill_blanks",
            "questions": [
                {"question": "The ___ is blue.", "correct_answer": "sky", "hint": "Look up"},
                {"question": "Water is ___.", "correct_answer": "wet"}
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/full-validation", json=fill_game)
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") == True
        print(f"✓ Fill-in-the-blanks validation passed")
    
    def test_matching_validation(self):
        """Test matching game validation"""
        matching = {
            "title": "Matching Validation Test",
            "game_type": "matching",
            "questions": [
                {"question": "H2O", "correct_answer": "Water"},
                {"question": "CO2", "correct_answer": "Carbon Dioxide"},
                {"question": "O2", "correct_answer": "Oxygen"}
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/full-validation", json=matching)
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") == True
        print(f"✓ Matching validation passed")
    
    def test_flashcards_validation(self):
        """Test flashcards game validation"""
        flashcards = {
            "title": "Flashcards Validation Test",
            "game_type": "flashcards",
            "questions": [
                {"question": "Apple", "correct_answer": "A red fruit"},
                {"question": "Dog", "correct_answer": "A pet animal"}
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/full-validation", json=flashcards)
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") == True
        print(f"✓ Flashcards validation passed")
    
    def test_word_search_validation(self):
        """Test word search game validation"""
        word_search = {
            "title": "Word Search Validation Test",
            "game_type": "word_search",
            "questions": [
                {"word": "PLANET", "hint": "Earth is one"},
                {"word": "STAR", "hint": "The sun is one"},
                {"word": "MOON", "hint": "Orbits Earth"}
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/full-validation", json=word_search)
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") == True
        print(f"✓ Word search validation passed")
    
    def test_crossword_validation(self):
        """Test crossword game validation"""
        crossword = {
            "title": "Crossword Validation Test",
            "game_type": "crossword",
            "questions": [
                {"clue": "Opposite of cold", "correct_answer": "HOT", "direction": "across", "number": 1},
                {"clue": "Opposite of up", "correct_answer": "DOWN", "direction": "down", "number": 1}
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/full-validation", json=crossword)
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") == True
        print(f"✓ Crossword validation passed")
    
    def test_drag_drop_validation(self):
        """Test drag and drop game validation"""
        drag_drop = {
            "title": "Drag Drop Validation Test",
            "game_type": "drag_drop",
            "questions": [
                {
                    "instruction": "Put numbers in order",
                    "items": ["5", "2", "8", "1"],
                    "correct_order": ["1", "2", "5", "8"]
                }
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/full-validation", json=drag_drop)
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") == True
        print(f"✓ Drag and drop validation passed")


class TestInvalidGameDetection:
    """Test that invalid games are properly detected"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login with admin account"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.session = requests.Session()
            self.session.cookies.update(response.cookies)
            self.session.headers.update({"Content-Type": "application/json"})
        else:
            pytest.skip("Admin login failed")
    
    def test_empty_questions_rejected(self):
        """Test that games with empty questions are rejected"""
        invalid_game = {
            "title": "Empty Questions Game",
            "game_type": "quiz",
            "questions": []
        }
        response = self.session.post(f"{BASE_URL}/api/games/validate", json=invalid_game)
        assert response.status_code == 200
        data = response.json()
        assert data.get("is_valid") == False
        print(f"✓ Empty questions rejected: {data.get('errors')}")
    
    def test_missing_title_rejected(self):
        """Test that games without title are rejected"""
        invalid_game = {
            "game_type": "quiz",
            "questions": [{"question": "Q?", "options": ["A", "B"], "correct_answer": "A"}]
        }
        response = self.session.post(f"{BASE_URL}/api/games/validate", json=invalid_game)
        assert response.status_code == 200
        data = response.json()
        assert data.get("is_valid") == False
        print(f"✓ Missing title rejected: {data.get('errors')}")
    
    def test_mismatched_correct_answer_rejected(self):
        """Test that quiz with correct_answer not in options is rejected"""
        invalid_game = {
            "title": "Mismatched Answer Quiz",
            "game_type": "quiz",
            "questions": [
                {
                    "question": "What is 2+2?",
                    "options": ["1", "2", "3", "5"],  # 4 is missing
                    "correct_answer": "4"  # Not in options!
                }
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/validate", json=invalid_game)
        assert response.status_code == 200
        data = response.json()
        assert data.get("is_valid") == False
        print(f"✓ Mismatched correct_answer rejected: {data.get('errors')}")
    
    def test_drag_drop_mismatched_order_rejected(self):
        """Test that drag_drop with mismatched items/correct_order is rejected"""
        invalid_game = {
            "title": "Invalid Drag Drop",
            "game_type": "drag_drop",
            "questions": [
                {
                    "instruction": "Order these",
                    "items": ["A", "B", "C"],
                    "correct_order": ["X", "Y", "Z"]  # Different items!
                }
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/full-validation", json=invalid_game)
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") == False
        print(f"✓ Mismatched drag_drop rejected: {data.get('errors')}")


class TestGameSaveWithValidation:
    """Test that saving games enforces validation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login with admin account"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.session = requests.Session()
            self.session.cookies.update(response.cookies)
            self.session.headers.update({"Content-Type": "application/json"})
        else:
            pytest.skip("Admin login failed")
    
    def test_save_valid_game_succeeds(self):
        """Test that valid games can be saved"""
        valid_game = {
            "game_id": f"test_valid_save_{int(time.time())}",
            "title": "Valid Save Test",
            "game_type": "quiz",
            "grade_level": "3-5",
            "subject": "math",
            "questions": [
                {"question": "What is 1+1?", "options": ["1", "2", "3", "4"], "correct_answer": "2"}
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/save", json=valid_game)
        assert response.status_code == 200
        data = response.json()
        assert data.get("validation_status") == "passed"
        print(f"✓ Valid game saved successfully with validation_status: passed")
    
    def test_save_invalid_game_rejected(self):
        """Test that invalid games are rejected on save"""
        invalid_game = {
            "game_id": f"test_invalid_save_{int(time.time())}",
            "title": "Invalid Save Test",
            "game_type": "quiz",
            "questions": [
                {"question": "Q?", "options": ["A", "B"], "correct_answer": "C"}  # C not in options
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/save", json=invalid_game)
        # Should return 400 for validation failure
        assert response.status_code == 400
        data = response.json()
        detail = data.get("detail", {})
        assert detail.get("error") == "VALIDATION_FAILED" or "errors" in detail
        print(f"✓ Invalid game rejected on save: {detail}")


class TestGameRestartFunctionality:
    """Test game restart clears state properly"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login with admin account"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.session = requests.Session()
            self.session.cookies.update(response.cookies)
            self.session.headers.update({"Content-Type": "application/json"})
        else:
            pytest.skip("Admin login failed")
    
    def test_progress_can_be_reset(self):
        """Test that game progress can be reset to initial state"""
        game_id = f"test_restart_{int(time.time())}"
        
        # Save a game
        game_data = {
            "game_id": game_id,
            "title": "Restart Test Game",
            "game_type": "quiz",
            "grade_level": "3-5",
            "subject": "math",
            "questions": [
                {"question": "Q1?", "options": ["A", "B", "C", "D"], "correct_answer": "A"},
                {"question": "Q2?", "options": ["A", "B", "C", "D"], "correct_answer": "B"}
            ]
        }
        self.session.post(f"{BASE_URL}/api/games/save", json=game_data)
        
        # Save some progress
        progress_data = {
            "current_question": 1,
            "score": 1,
            "answers": [{"answer": "A", "correct": True}]
        }
        self.session.post(f"{BASE_URL}/api/games/{game_id}/progress", json=progress_data)
        
        # Verify progress was saved
        response = self.session.get(f"{BASE_URL}/api/games/{game_id}/progress")
        assert response.status_code == 200
        data = response.json()
        assert data.get("current_question") == 1
        assert data.get("score") == 1
        
        # Reset progress (save with initial state)
        reset_data = {
            "current_question": 0,
            "score": 0,
            "answers": []
        }
        self.session.post(f"{BASE_URL}/api/games/{game_id}/progress", json=reset_data)
        
        # Verify reset
        response = self.session.get(f"{BASE_URL}/api/games/{game_id}/progress")
        assert response.status_code == 200
        data = response.json()
        assert data.get("current_question") == 0
        assert data.get("score") == 0
        print(f"✓ Game progress reset successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
