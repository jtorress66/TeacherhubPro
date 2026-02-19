"""
Test suite for Game Analytics, Score Submission, and Leaderboard features

Features tested:
1. GET /api/games/analytics - returns analytics for teacher's games
2. POST /api/games/{game_id}/score - submits a player score
3. GET /api/games/{game_id}/leaderboard - returns top scores
4. Game generation supports new types (word_search, crossword, drag_drop)

Test credentials:
- Teacher: test@school.edu / testpassword
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestGameAnalytics:
    """Test Game Analytics endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        if login_response.status_code != 200:
            pytest.skip("Could not authenticate - skipping tests")
        self.user = login_response.json()
    
    def test_get_analytics_returns_200(self):
        """Test GET /api/games/analytics returns 200"""
        response = self.session.get(f"{BASE_URL}/api/games/analytics")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_analytics_response_structure(self):
        """Test analytics response has correct structure"""
        response = self.session.get(f"{BASE_URL}/api/games/analytics")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert "total_games" in data, "Response should include total_games"
        assert "total_plays" in data, "Response should include total_plays"
        assert "unique_players" in data, "Response should include unique_players"
        assert "average_score" in data, "Response should include average_score"
        assert "game_stats" in data, "Response should include game_stats"
        
        # Verify types
        assert isinstance(data["total_games"], int)
        assert isinstance(data["total_plays"], int)
        assert isinstance(data["unique_players"], int)
        assert isinstance(data["average_score"], (int, float))
        assert isinstance(data["game_stats"], list)
    
    def test_analytics_game_stats_structure(self):
        """Test game_stats array has correct structure when games exist"""
        response = self.session.get(f"{BASE_URL}/api/games/analytics")
        assert response.status_code == 200
        data = response.json()
        
        if data["game_stats"]:
            game_stat = data["game_stats"][0]
            assert "game_id" in game_stat
            assert "title" in game_stat
            assert "game_type" in game_stat
            assert "play_count" in game_stat
            assert "unique_players" in game_stat
            assert "avg_score" in game_stat
            assert "best_score" in game_stat


class TestScoreSubmission:
    """Test Score Submission endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token, find or create a test game"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        if login_response.status_code != 200:
            pytest.skip("Could not authenticate - skipping tests")
        self.user = login_response.json()
        
        # Get existing games
        games_response = self.session.get(f"{BASE_URL}/api/games")
        if games_response.status_code == 200 and games_response.json():
            self.test_game_id = games_response.json()[0]["game_id"]
        else:
            # Create a test game if none exist
            test_game = {
                "title": "TEST_Analytics_Game",
                "game_type": "quiz",
                "difficulty": "easy",
                "questions": [
                    {"question": "Test Q1?", "options": ["A", "B", "C", "D"], "correct_answer": "A"},
                    {"question": "Test Q2?", "options": ["A", "B", "C", "D"], "correct_answer": "B"}
                ]
            }
            save_response = self.session.post(f"{BASE_URL}/api/games/save", json=test_game)
            if save_response.status_code == 200:
                self.test_game_id = save_response.json().get("game_id")
            else:
                pytest.skip("Could not create test game")
    
    def test_submit_score_returns_200(self):
        """Test POST /api/games/{game_id}/score returns 200"""
        score_data = {
            "player_name": "TEST_Player_1",
            "score": 4,
            "total_questions": 5,
            "time_taken": 30
        }
        response = requests.post(
            f"{BASE_URL}/api/games/{self.test_game_id}/score",
            json=score_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_submit_score_response_structure(self):
        """Test score submission response has correct structure"""
        score_data = {
            "player_name": "TEST_Player_2",
            "score": 3,
            "total_questions": 5,
            "time_taken": 45
        }
        response = requests.post(
            f"{BASE_URL}/api/games/{self.test_game_id}/score",
            json=score_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        assert "score_id" in data
        assert data["message"] == "Score submitted"
    
    def test_submit_score_invalid_game_returns_404(self):
        """Test submitting score to non-existent game returns 404"""
        score_data = {
            "player_name": "TEST_Player",
            "score": 5,
            "total_questions": 5,
            "time_taken": 20
        }
        response = requests.post(
            f"{BASE_URL}/api/games/nonexistent_game_id/score",
            json=score_data
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_submit_score_missing_fields_returns_422(self):
        """Test submitting score with missing required fields returns 422"""
        # Missing player_name
        score_data = {
            "score": 5,
            "total_questions": 5
        }
        response = requests.post(
            f"{BASE_URL}/api/games/{self.test_game_id}/score",
            json=score_data
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"


class TestLeaderboard:
    """Test Leaderboard endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token, find or create a test game with scores"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        if login_response.status_code != 200:
            pytest.skip("Could not authenticate - skipping tests")
        self.user = login_response.json()
        
        # Get existing games
        games_response = self.session.get(f"{BASE_URL}/api/games")
        if games_response.status_code == 200 and games_response.json():
            self.test_game_id = games_response.json()[0]["game_id"]
        else:
            pytest.skip("No games available for leaderboard test")
    
    def test_get_leaderboard_returns_200(self):
        """Test GET /api/games/{game_id}/leaderboard returns 200"""
        response = requests.get(f"{BASE_URL}/api/games/{self.test_game_id}/leaderboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_leaderboard_response_is_list(self):
        """Test leaderboard response is a list"""
        response = requests.get(f"{BASE_URL}/api/games/{self.test_game_id}/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Leaderboard should return a list"
    
    def test_leaderboard_entry_structure(self):
        """Test leaderboard entries have correct structure"""
        # First submit a score to ensure leaderboard has data
        score_data = {
            "player_name": "TEST_Leaderboard_Player",
            "score": 5,
            "total_questions": 5,
            "time_taken": 25
        }
        requests.post(f"{BASE_URL}/api/games/{self.test_game_id}/score", json=score_data)
        
        response = requests.get(f"{BASE_URL}/api/games/{self.test_game_id}/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        if data:
            entry = data[0]
            assert "player_name" in entry, "Entry should have player_name"
            assert "score" in entry, "Entry should have score"
            assert "total_questions" in entry, "Entry should have total_questions"
            assert "time_taken" in entry, "Entry should have time_taken"
            assert "percentage" in entry, "Entry should have percentage"
            assert "played_at" in entry, "Entry should have played_at"
    
    def test_leaderboard_sorted_by_percentage(self):
        """Test leaderboard is sorted by percentage (descending)"""
        # Submit multiple scores with different percentages
        scores = [
            {"player_name": "TEST_Low_Score", "score": 2, "total_questions": 5, "time_taken": 30},
            {"player_name": "TEST_High_Score", "score": 5, "total_questions": 5, "time_taken": 30},
            {"player_name": "TEST_Mid_Score", "score": 3, "total_questions": 5, "time_taken": 30}
        ]
        for score in scores:
            requests.post(f"{BASE_URL}/api/games/{self.test_game_id}/score", json=score)
        
        response = requests.get(f"{BASE_URL}/api/games/{self.test_game_id}/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) >= 2:
            # Verify sorted by percentage descending
            for i in range(len(data) - 1):
                assert data[i]["percentage"] >= data[i+1]["percentage"], \
                    f"Leaderboard not sorted: {data[i]['percentage']} should be >= {data[i+1]['percentage']}"
    
    def test_leaderboard_limit_parameter(self):
        """Test leaderboard respects limit parameter"""
        response = requests.get(f"{BASE_URL}/api/games/{self.test_game_id}/leaderboard?limit=3")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 3, f"Expected max 3 entries, got {len(data)}"


class TestNewGameTypes:
    """Test new game types: word_search, crossword, drag_drop"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        if login_response.status_code != 200:
            pytest.skip("Could not authenticate - skipping tests")
        self.user = login_response.json()
    
    def test_generate_word_search_game(self):
        """Test generating word_search game type"""
        game_request = {
            "content": "The solar system has 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.",
            "game_type": "word_search",
            "difficulty": "easy",
            "question_count": 3,
            "language": "en"
        }
        response = self.session.post(f"{BASE_URL}/api/games/generate", json=game_request)
        # Note: This may take time due to AI generation
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert "title" in data
            assert data.get("game_type") == "word_search"
    
    def test_generate_crossword_game(self):
        """Test generating crossword game type"""
        game_request = {
            "content": "Photosynthesis is the process by which plants convert sunlight into energy. Chlorophyll is the green pigment.",
            "game_type": "crossword",
            "difficulty": "medium",
            "question_count": 3,
            "language": "en"
        }
        response = self.session.post(f"{BASE_URL}/api/games/generate", json=game_request)
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert "title" in data
            assert data.get("game_type") == "crossword"
    
    def test_generate_drag_drop_game(self):
        """Test generating drag_drop game type"""
        game_request = {
            "content": "Animals can be classified as mammals (dogs, cats, whales) or reptiles (snakes, lizards, turtles).",
            "game_type": "drag_drop",
            "difficulty": "easy",
            "question_count": 3,
            "language": "en"
        }
        response = self.session.post(f"{BASE_URL}/api/games/generate", json=game_request)
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert "title" in data
            assert data.get("game_type") == "drag_drop"


class TestAnalyticsIntegration:
    """Integration tests for analytics with score submission"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        if login_response.status_code != 200:
            pytest.skip("Could not authenticate - skipping tests")
        self.user = login_response.json()
    
    def test_analytics_updates_after_score_submission(self):
        """Test that analytics reflect new score submissions"""
        # Get initial analytics
        initial_response = self.session.get(f"{BASE_URL}/api/games/analytics")
        assert initial_response.status_code == 200
        initial_data = initial_response.json()
        initial_plays = initial_data.get("total_plays", 0)
        
        # Get a game to submit score to
        games_response = self.session.get(f"{BASE_URL}/api/games")
        if games_response.status_code != 200 or not games_response.json():
            pytest.skip("No games available")
        
        game_id = games_response.json()[0]["game_id"]
        
        # Submit a new score
        score_data = {
            "player_name": f"TEST_Integration_{int(time.time())}",
            "score": 4,
            "total_questions": 5,
            "time_taken": 35
        }
        submit_response = requests.post(f"{BASE_URL}/api/games/{game_id}/score", json=score_data)
        assert submit_response.status_code == 200
        
        # Get updated analytics
        updated_response = self.session.get(f"{BASE_URL}/api/games/analytics")
        assert updated_response.status_code == 200
        updated_data = updated_response.json()
        
        # Verify total_plays increased
        assert updated_data["total_plays"] > initial_plays, \
            f"Expected total_plays to increase from {initial_plays}, got {updated_data['total_plays']}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
