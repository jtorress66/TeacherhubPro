"""
Test suite for:
1. Parent Portal Language Selection (es, en, fr, pt)
2. Educational Games Creator API

Test credentials:
- Teacher: test@school.edu / testpassword
- Student: student_40da2916 (Maria Garcia)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPortalLanguageSelection:
    """Test Parent Portal multi-language support"""
    
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
        self.student_id = "student_40da2916"
    
    def test_generate_portal_token_spanish(self):
        """Test generating portal token with Spanish language"""
        response = self.session.post(
            f"{BASE_URL}/api/students/{self.student_id}/homeschool-portal-token",
            json={"language": "es"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert data.get("language") == "es"
        assert "portal_url" in data
        self.spanish_token = data["token"]
    
    def test_generate_portal_token_english(self):
        """Test generating portal token with English language"""
        response = self.session.post(
            f"{BASE_URL}/api/students/{self.student_id}/homeschool-portal-token",
            json={"language": "en"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert data.get("language") == "en"
    
    def test_generate_portal_token_french(self):
        """Test generating portal token with French language"""
        response = self.session.post(
            f"{BASE_URL}/api/students/{self.student_id}/homeschool-portal-token",
            json={"language": "fr"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert data.get("language") == "fr"
    
    def test_generate_portal_token_portuguese(self):
        """Test generating portal token with Portuguese language"""
        response = self.session.post(
            f"{BASE_URL}/api/students/{self.student_id}/homeschool-portal-token",
            json={"language": "pt"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert data.get("language") == "pt"
    
    def test_portal_returns_stored_language(self):
        """Test that GET portal endpoint returns the language stored with token"""
        # First generate a token with English
        gen_response = self.session.post(
            f"{BASE_URL}/api/students/{self.student_id}/homeschool-portal-token",
            json={"language": "en"}
        )
        assert gen_response.status_code == 200
        token = gen_response.json()["token"]
        
        # Now fetch portal data (no auth required)
        portal_response = requests.get(f"{BASE_URL}/api/homeschool-portal/{token}")
        assert portal_response.status_code == 200, f"Expected 200, got {portal_response.status_code}: {portal_response.text}"
        data = portal_response.json()
        
        # Verify language is returned
        assert "language" in data, "Response should include language field"
        assert data["language"] == "en", f"Expected language 'en', got '{data.get('language')}'"
        
        # Verify student data is present
        assert "student" in data
        assert "progress" in data


class TestEducationalGamesAPI:
    """Test Educational Games Creator endpoints"""
    
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
    
    def test_get_games_empty_or_list(self):
        """Test GET /api/games returns list (empty or with games)"""
        response = self.session.get(f"{BASE_URL}/api/games")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_save_game(self):
        """Test POST /api/games/save - saves a game"""
        test_game = {
            "title": "Test Quiz Game",
            "game_type": "quiz",
            "difficulty": "easy",
            "questions": [
                {
                    "question": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "correct_answer": "4"
                },
                {
                    "question": "What color is the sky?",
                    "options": ["Red", "Green", "Blue", "Yellow"],
                    "correct_answer": "Blue"
                }
            ]
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/games/save",
            json=test_game
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "game_id" in data, "Response should include game_id"
        assert data.get("message") == "Game saved"
        self.saved_game_id = data["game_id"]
    
    def test_get_saved_game_by_id(self):
        """Test GET /api/games/{game_id} - retrieves specific game"""
        # First save a game
        test_game = {
            "title": "Retrieval Test Game",
            "game_type": "true_false",
            "difficulty": "medium",
            "questions": [
                {
                    "question": "The Earth is round",
                    "options": ["True", "False"],
                    "correct_answer": "True"
                }
            ]
        }
        
        save_response = self.session.post(
            f"{BASE_URL}/api/games/save",
            json=test_game
        )
        assert save_response.status_code == 200
        game_id = save_response.json()["game_id"]
        
        # Now retrieve it (public endpoint - no auth needed)
        get_response = requests.get(f"{BASE_URL}/api/games/{game_id}")
        assert get_response.status_code == 200, f"Expected 200, got {get_response.status_code}: {get_response.text}"
        data = get_response.json()
        
        assert data.get("game_id") == game_id
        assert data.get("title") == "Retrieval Test Game"
        assert data.get("game_type") == "true_false"
        assert "questions" in data
    
    def test_get_nonexistent_game_returns_404(self):
        """Test GET /api/games/{game_id} returns 404 for non-existent game"""
        response = requests.get(f"{BASE_URL}/api/games/nonexistent_game_12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_games_list_includes_saved_game(self):
        """Test that saved games appear in GET /api/games list"""
        # Save a uniquely named game
        unique_title = f"Unique Test Game {os.urandom(4).hex()}"
        test_game = {
            "title": unique_title,
            "game_type": "matching",
            "difficulty": "hard",
            "questions": [
                {
                    "question": "Match the capitals",
                    "left": ["France", "Spain"],
                    "right": ["Paris", "Madrid"]
                }
            ]
        }
        
        save_response = self.session.post(
            f"{BASE_URL}/api/games/save",
            json=test_game
        )
        assert save_response.status_code == 200
        
        # Get all games
        list_response = self.session.get(f"{BASE_URL}/api/games")
        assert list_response.status_code == 200
        games = list_response.json()
        
        # Find our game
        found = any(g.get("title") == unique_title for g in games)
        assert found, f"Saved game '{unique_title}' not found in games list"


class TestGameGenerationEndpoint:
    """Test the AI game generation endpoint (may take 30-45 seconds)"""
    
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
    
    def test_generate_game_endpoint_exists(self):
        """Test POST /api/games/generate endpoint exists and accepts requests"""
        # Test with minimal content - just verify endpoint works
        response = self.session.post(
            f"{BASE_URL}/api/games/generate",
            json={
                "content": "The water cycle: evaporation, condensation, precipitation",
                "game_type": "quiz",
                "difficulty": "easy",
                "question_count": 3,
                "language": "en"
            },
            timeout=60  # AI generation can take time
        )
        
        # Should return 200 with game data, or 403 if subscription expired
        assert response.status_code in [200, 403], f"Expected 200 or 403, got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert "title" in data, "Response should include title"
            assert "questions" in data, "Response should include questions"
            assert "game_type" in data, "Response should include game_type"


class TestPortalLanguageIntegration:
    """Integration tests for portal language feature"""
    
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
        self.student_id = "student_40da2916"
    
    def test_different_languages_create_different_tokens(self):
        """Test that different languages can have different tokens"""
        # Generate Spanish token
        es_response = self.session.post(
            f"{BASE_URL}/api/students/{self.student_id}/homeschool-portal-token",
            json={"language": "es"}
        )
        assert es_response.status_code == 200
        es_token = es_response.json()["token"]
        
        # Generate French token
        fr_response = self.session.post(
            f"{BASE_URL}/api/students/{self.student_id}/homeschool-portal-token",
            json={"language": "fr"}
        )
        assert fr_response.status_code == 200
        fr_token = fr_response.json()["token"]
        
        # Verify both tokens work and return correct language
        es_portal = requests.get(f"{BASE_URL}/api/homeschool-portal/{es_token}")
        fr_portal = requests.get(f"{BASE_URL}/api/homeschool-portal/{fr_token}")
        
        assert es_portal.status_code == 200
        assert fr_portal.status_code == 200
        
        assert es_portal.json().get("language") == "es"
        assert fr_portal.json().get("language") == "fr"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
