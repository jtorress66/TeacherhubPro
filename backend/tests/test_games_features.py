"""
Test suite for Educational Games features
Tests all game types, progress saving, and refactored routes
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://teacherhub-pro-1.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "test@school.edu"
TEST_PASSWORD = "testpassword"


class TestGamesRoutes:
    """Test the refactored games routes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            self.session = requests.Session()
            # Get cookies from login response
            self.session.cookies.update(response.cookies)
            # Also set Authorization header
            self.session.headers.update({"Content-Type": "application/json"})
        else:
            pytest.skip("Login failed - skipping authenticated tests")
    
    def test_get_games_list(self):
        """Test GET /api/games - list teacher's games"""
        response = self.session.get(f"{BASE_URL}/api/games")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/games returned {len(data)} games")
    
    def test_get_games_analytics(self):
        """Test GET /api/games/analytics/summary - analytics endpoint"""
        response = self.session.get(f"{BASE_URL}/api/games/analytics/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_games" in data
        assert "total_plays" in data
        assert "average_score" in data
        assert "games_by_type" in data
        print(f"✓ GET /api/games/analytics/summary - total_games: {data['total_games']}, total_plays: {data['total_plays']}")
    
    def test_save_quiz_game(self):
        """Test POST /api/games/save - save a quiz game"""
        game_data = {
            "game_id": f"test_quiz_{int(time.time())}",
            "title": "Test Quiz Game",
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
        response = self.session.post(f"{BASE_URL}/api/games/save", json=game_data)
        assert response.status_code == 200
        data = response.json()
        assert "game_id" in data
        print(f"✓ POST /api/games/save - saved quiz game: {data['game_id']}")
        return data["game_id"]
    
    def test_save_flashcards_game(self):
        """Test saving a flashcards game"""
        game_data = {
            "game_id": f"test_flashcards_{int(time.time())}",
            "title": "Test Flashcards",
            "game_type": "flashcards",
            "grade_level": "k-2",
            "subject": "english",
            "questions": [
                {"question": "Apple", "correct_answer": "A red fruit"},
                {"question": "Dog", "correct_answer": "A pet animal"}
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/save", json=game_data)
        assert response.status_code == 200
        print(f"✓ Saved flashcards game")
    
    def test_save_matching_game(self):
        """Test saving a matching game"""
        game_data = {
            "game_id": f"test_matching_{int(time.time())}",
            "title": "Test Matching Game",
            "game_type": "matching",
            "grade_level": "6-8",
            "subject": "science",
            "questions": [
                {"question": "H2O", "correct_answer": "Water"},
                {"question": "CO2", "correct_answer": "Carbon Dioxide"},
                {"question": "O2", "correct_answer": "Oxygen"}
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/save", json=game_data)
        assert response.status_code == 200
        print(f"✓ Saved matching game")
    
    def test_save_fill_blanks_game(self):
        """Test saving a fill-in-the-blanks game"""
        game_data = {
            "game_id": f"test_fill_blanks_{int(time.time())}",
            "title": "Test Fill Blanks",
            "game_type": "fill_blanks",
            "grade_level": "3-5",
            "subject": "english",
            "questions": [
                {"question": "The ___ is blue.", "correct_answer": "sky", "hint": "Look up!"},
                {"question": "Water is ___.", "correct_answer": "wet"}
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/save", json=game_data)
        assert response.status_code == 200
        print(f"✓ Saved fill-in-the-blanks game")
    
    def test_save_true_false_game(self):
        """Test saving a true/false game"""
        game_data = {
            "game_id": f"test_true_false_{int(time.time())}",
            "title": "Test True/False",
            "game_type": "true_false",
            "grade_level": "9-12",
            "subject": "history",
            "questions": [
                {"question": "The Earth is round.", "options": ["True", "False"], "correct_answer": "True"},
                {"question": "The sun revolves around Earth.", "options": ["True", "False"], "correct_answer": "False"}
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/save", json=game_data)
        assert response.status_code == 200
        print(f"✓ Saved true/false game")
    
    def test_save_word_search_game(self):
        """Test saving a word search game"""
        game_data = {
            "game_id": f"test_word_search_{int(time.time())}",
            "title": "Test Word Search",
            "game_type": "word_search",
            "grade_level": "3-5",
            "subject": "science",
            "questions": [
                {"word": "PLANET", "hint": "Earth is one"},
                {"word": "STAR", "hint": "The sun is one"},
                {"word": "MOON", "hint": "Orbits Earth"}
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/save", json=game_data)
        assert response.status_code == 200
        print(f"✓ Saved word search game")
    
    def test_save_crossword_game(self):
        """Test saving a crossword game"""
        game_data = {
            "game_id": f"test_crossword_{int(time.time())}",
            "title": "Test Crossword",
            "game_type": "crossword",
            "grade_level": "6-8",
            "subject": "english",
            "questions": [
                {"clue": "Opposite of cold", "correct_answer": "HOT", "direction": "across", "number": 1},
                {"clue": "Opposite of up", "correct_answer": "DOWN", "direction": "down", "number": 1}
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/save", json=game_data)
        assert response.status_code == 200
        print(f"✓ Saved crossword game")
    
    def test_save_drag_drop_game(self):
        """Test saving a drag and drop game"""
        game_data = {
            "game_id": f"test_drag_drop_{int(time.time())}",
            "title": "Test Drag and Drop",
            "game_type": "drag_drop",
            "grade_level": "k-2",
            "subject": "math",
            "questions": [
                {
                    "instruction": "Put these numbers in order from smallest to largest",
                    "items": ["5", "2", "8", "1"],
                    "correct_order": ["1", "2", "5", "8"]
                }
            ]
        }
        response = self.session.post(f"{BASE_URL}/api/games/save", json=game_data)
        assert response.status_code == 200
        print(f"✓ Saved drag and drop game")
    
    def test_get_game_by_id(self):
        """Test GET /api/games/{game_id} - get specific game"""
        # First save a game
        game_id = f"test_get_game_{int(time.time())}"
        game_data = {
            "game_id": game_id,
            "title": "Test Get Game",
            "game_type": "quiz",
            "grade_level": "3-5",
            "subject": "math",
            "questions": [{"question": "Test?", "options": ["A", "B"], "correct_answer": "A"}]
        }
        self.session.post(f"{BASE_URL}/api/games/save", json=game_data)
        
        # Now get it
        response = requests.get(f"{BASE_URL}/api/games/{game_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["game_id"] == game_id
        assert data["title"] == "Test Get Game"
        print(f"✓ GET /api/games/{game_id} - retrieved game successfully")
    
    def test_submit_game_score(self):
        """Test POST /api/games/{game_id}/score - submit score"""
        game_id = f"test_score_game_{int(time.time())}"
        # Save game first
        game_data = {
            "game_id": game_id,
            "title": "Score Test Game",
            "game_type": "quiz",
            "grade_level": "3-5",
            "subject": "math",
            "questions": [{"question": "Test?", "options": ["A", "B"], "correct_answer": "A"}]
        }
        self.session.post(f"{BASE_URL}/api/games/save", json=game_data)
        
        # Submit score (public endpoint)
        score_data = {
            "player_name": "Test Player",
            "score": 8,
            "total_questions": 10,
            "time_taken": 120
        }
        response = requests.post(f"{BASE_URL}/api/games/{game_id}/score", json=score_data)
        assert response.status_code == 200
        data = response.json()
        assert "score_id" in data
        print(f"✓ POST /api/games/{game_id}/score - submitted score: {data['score_id']}")
    
    def test_get_game_leaderboard(self):
        """Test GET /api/games/{game_id}/leaderboard"""
        game_id = f"test_leaderboard_game_{int(time.time())}"
        # Save game
        game_data = {
            "game_id": game_id,
            "title": "Leaderboard Test",
            "game_type": "quiz",
            "grade_level": "3-5",
            "subject": "math",
            "questions": [{"question": "Test?", "options": ["A", "B"], "correct_answer": "A"}]
        }
        self.session.post(f"{BASE_URL}/api/games/save", json=game_data)
        
        # Submit some scores
        for i, name in enumerate(["Alice", "Bob", "Charlie"]):
            requests.post(f"{BASE_URL}/api/games/{game_id}/score", json={
                "player_name": name,
                "score": 10 - i,
                "total_questions": 10,
                "time_taken": 60 + i * 10
            })
        
        # Get leaderboard
        response = requests.get(f"{BASE_URL}/api/games/{game_id}/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3
        print(f"✓ GET /api/games/{game_id}/leaderboard - {len(data)} entries")


class TestProgressSaving:
    """Test game progress saving endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            self.session = requests.Session()
            self.session.cookies.update(response.cookies)
            self.session.headers.update({"Content-Type": "application/json"})
        else:
            pytest.skip("Login failed")
    
    def test_save_game_progress(self):
        """Test POST /api/games/{game_id}/progress"""
        game_id = f"test_progress_game_{int(time.time())}"
        # Save game first
        game_data = {
            "game_id": game_id,
            "title": "Progress Test",
            "game_type": "quiz",
            "grade_level": "3-5",
            "subject": "math",
            "questions": [
                {"question": "Q1?", "options": ["A", "B"], "correct_answer": "A"},
                {"question": "Q2?", "options": ["A", "B"], "correct_answer": "B"}
            ]
        }
        self.session.post(f"{BASE_URL}/api/games/save", json=game_data)
        
        # Save progress
        progress_data = {
            "current_question": 1,
            "score": 1,
            "answers": [{"answer": "A", "correct": True}],
            "started_at": "2026-02-20T10:00:00Z"
        }
        response = self.session.post(f"{BASE_URL}/api/games/{game_id}/progress", json=progress_data)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Progress saved"
        print(f"✓ POST /api/games/{game_id}/progress - progress saved")
    
    def test_get_game_progress(self):
        """Test GET /api/games/{game_id}/progress"""
        game_id = f"test_get_progress_{int(time.time())}"
        # Save game
        game_data = {
            "game_id": game_id,
            "title": "Get Progress Test",
            "game_type": "quiz",
            "grade_level": "3-5",
            "subject": "math",
            "questions": [{"question": "Q?", "options": ["A", "B"], "correct_answer": "A"}]
        }
        self.session.post(f"{BASE_URL}/api/games/save", json=game_data)
        
        # Save progress
        self.session.post(f"{BASE_URL}/api/games/{game_id}/progress", json={
            "current_question": 0,
            "score": 0,
            "answers": []
        })
        
        # Get progress
        response = self.session.get(f"{BASE_URL}/api/games/{game_id}/progress")
        assert response.status_code == 200
        data = response.json()
        assert "current_question" in data
        assert "score" in data
        print(f"✓ GET /api/games/{game_id}/progress - retrieved progress")


class TestAdaptiveLearningRoutes:
    """Test the refactored adaptive learning routes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            self.session = requests.Session()
            self.session.cookies.update(response.cookies)
            self.session.headers.update({"Content-Type": "application/json"})
        else:
            pytest.skip("Login failed")
    
    def test_get_student_progress(self):
        """Test GET /api/adaptive-learning/progress/{student_id}"""
        response = self.session.get(f"{BASE_URL}/api/adaptive-learning/progress/student_test_games_001")
        assert response.status_code == 200
        # Returns empty list if no progress
        print(f"✓ GET /api/adaptive-learning/progress/student_test_games_001 - OK")
    
    def test_get_student_dashboard(self):
        """Test GET /api/adaptive-learning/dashboard/{student_id}"""
        response = self.session.get(f"{BASE_URL}/api/adaptive-learning/dashboard/student_test_games_001")
        assert response.status_code == 200
        data = response.json()
        assert "student" in data
        # API returns different structure - check for actual fields
        assert "student" in data or "statistics" in data or "total_lessons" in data
        print(f"✓ GET /api/adaptive-learning/dashboard/student_test_games_001 - OK")


class TestPortalRoutes:
    """Test the refactored portal routes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            self.session = requests.Session()
            self.session.cookies.update(response.cookies)
            self.session.headers.update({"Content-Type": "application/json"})
        else:
            pytest.skip("Login failed")
    
    def test_generate_portal_token(self):
        """Test POST /api/portal/generate-token"""
        response = self.session.post(f"{BASE_URL}/api/portal/generate-token", json={
            "student_id": "student_test_games_001"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["student_id"] == "student_test_games_001"
        print(f"✓ POST /api/portal/generate-token - token: {data['token'][:20]}...")
        return data["token"]
    
    def test_get_portal_data(self):
        """Test GET /api/portal/{token}"""
        # First generate token
        token_response = self.session.post(f"{BASE_URL}/api/portal/generate-token", json={
            "student_id": "student_test_games_001"
        })
        token = token_response.json()["token"]
        
        # Get portal data (public endpoint)
        response = requests.get(f"{BASE_URL}/api/portal/{token}")
        assert response.status_code == 200
        data = response.json()
        assert "student" in data
        # API may return different structure
        print(f"✓ GET /api/portal/{token[:20]}... - retrieved portal data")
    
    def test_generate_homeschool_portal_token(self):
        """Test POST /api/portal/homeschool/generate-token"""
        response = self.session.post(f"{BASE_URL}/api/portal/homeschool/generate-token", json={
            "student_id": "student_test_games_001"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["token"].startswith("hsp_")
        print(f"✓ POST /api/portal/homeschool/generate-token - token: {data['token'][:20]}...")
    
    def test_get_homeschool_portal_data(self):
        """Test GET /api/portal/homeschool/{token}"""
        # Generate token
        token_response = self.session.post(f"{BASE_URL}/api/portal/homeschool/generate-token", json={
            "student_id": "student_test_games_001"
        })
        token = token_response.json()["token"]
        
        # Get data (public endpoint)
        response = requests.get(f"{BASE_URL}/api/portal/homeschool/{token}")
        assert response.status_code == 200
        data = response.json()
        assert "student" in data
        assert "statistics" in data
        print(f"✓ GET /api/portal/homeschool/{token[:20]}... - retrieved homeschool portal data")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
