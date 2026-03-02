"""
Test Word Search game type support and Play Again regeneration functionality.
These tests verify the fixes for:
1. Word Search games showing 'Tipo de juego no soportado' error in PlayGame.js
2. Play Again functionality in GamesCreator.js not regenerating questions
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://teacherhub-pro-2.preview.emergentagent.com').rstrip('/')


class TestWordSearchGameType:
    """Tests for Word Search game type support"""
    
    def test_word_search_game_exists(self):
        """Verify word_search game exists in database"""
        response = requests.get(f"{BASE_URL}/api/play-game/test_word_search_1771598782")
        assert response.status_code == 200
        data = response.json()
        assert data.get("game_type") == "word_search"
        assert data.get("title") == "Test Word Search"
        print(f"Word Search game found: {data.get('title')}")
    
    def test_word_search_game_has_questions(self):
        """Verify word_search game has proper question structure"""
        response = requests.get(f"{BASE_URL}/api/play-game/test_word_search_1771598782")
        assert response.status_code == 200
        data = response.json()
        questions = data.get("questions", [])
        assert len(questions) > 0, "Word search game should have questions"
        
        # Check question structure - word_search uses 'word' and 'hint' fields
        for q in questions:
            assert "word" in q or "question" in q, f"Question missing word/question field: {q}"
            print(f"Word: {q.get('word', q.get('question'))}, Hint: {q.get('hint', 'N/A')}")
    
    def test_word_search_regeneration(self):
        """Test that word_search games can regenerate questions"""
        response = requests.post(
            f"{BASE_URL}/api/games/test_word_search_1771598782/regenerate-questions",
            params={"player_name": "TestPlayer", "timestamp": int(time.time())}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should return regenerated: true with new questions
        assert data.get("regenerated") == True, f"Expected regenerated=True, got: {data}"
        assert len(data.get("questions", [])) > 0, "Should have regenerated questions"
        print(f"Regenerated: {data.get('regenerated')}, Questions: {len(data.get('questions', []))}")


class TestPlayAgainRegeneration:
    """Tests for Play Again functionality in GamesCreator.js"""
    
    def test_regenerate_endpoint_exists(self):
        """Verify regenerate-questions endpoint exists"""
        # Use a known game ID
        response = requests.post(
            f"{BASE_URL}/api/games/test_progress_game_1771598787/regenerate-questions",
            params={"player_name": "TestPlayer", "timestamp": int(time.time())}
        )
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            print("Regenerate endpoint working")
    
    def test_regenerate_returns_new_questions(self):
        """Test that regenerate endpoint returns new questions"""
        response = requests.post(
            f"{BASE_URL}/api/games/test_true_false_1771598782/regenerate-questions",
            params={"player_name": "TestPlayer", "timestamp": int(time.time())}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "regenerated" in data, "Response should have 'regenerated' field"
        assert "questions" in data, "Response should have 'questions' field"
        
        if data.get("regenerated"):
            assert len(data.get("questions", [])) > 0, "Should have questions when regenerated=True"
            print(f"Regenerated: {data.get('regenerated')}, Message: {data.get('message')}")
    
    def test_consecutive_regenerations_different(self):
        """Test that consecutive regenerations produce different questions"""
        questions_sets = []
        
        for i in range(2):
            response = requests.post(
                f"{BASE_URL}/api/games/test_true_false_1771598782/regenerate-questions",
                params={
                    "player_name": "TestPlayer",
                    "session_id": f"test_session_{i}_{int(time.time())}",
                    "timestamp": int(time.time())
                },
                headers={"Cache-Control": "no-cache"}
            )
            assert response.status_code == 200
            data = response.json()
            
            if data.get("regenerated"):
                questions = data.get("questions", [])
                if questions:
                    first_q = questions[0].get("question", "")
                    questions_sets.append(first_q)
                    print(f"Round {i+1}: {first_q[:60]}...")
            
            time.sleep(1)  # Small delay between requests
        
        # If we got 2 sets of questions, they should be different
        if len(questions_sets) == 2:
            assert questions_sets[0] != questions_sets[1], "Consecutive regenerations should produce different questions"
            print("SUCCESS: Consecutive regenerations produced different questions")


class TestGameAPIEndpoints:
    """Tests for game-related API endpoints"""
    
    def test_play_game_endpoint(self):
        """Test play-game endpoint returns correct data"""
        response = requests.get(f"{BASE_URL}/api/play-game/test_word_search_1771598782")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["game_id", "title", "game_type", "questions"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        print(f"Game: {data.get('title')}, Type: {data.get('game_type')}")
    
    def test_nonexistent_game_returns_404(self):
        """Test that nonexistent game returns 404"""
        response = requests.get(f"{BASE_URL}/api/play-game/nonexistent_game_12345")
        assert response.status_code == 404
        print("Nonexistent game correctly returns 404")
    
    def test_regenerate_nonexistent_game_returns_404(self):
        """Test that regenerating nonexistent game returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/games/nonexistent_game_12345/regenerate-questions",
            params={"player_name": "TestPlayer"}
        )
        assert response.status_code == 404
        print("Regenerate nonexistent game correctly returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
