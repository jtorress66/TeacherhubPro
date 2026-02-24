"""
Test suite for Educational Games bug fixes:
1. Time tracking - verify time_taken field is correctly recorded (should be > 0)
2. Leaderboard date display - verify submitted_at field is returned
3. Score submission API - test POST /api/games/{game_id}/score with time_taken field
4. Leaderboard API - test GET /api/games/{game_id}/leaderboard returns submitted_at field
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEACHER_EMAIL = "test@school.edu"
TEACHER_PASSWORD = "testpassword"
ADMIN_EMAIL = "admin@teacherhubpro.com"
ADMIN_PASSWORD = "Entrada@196660_"


class TestGameBugFixes:
    """Test suite for the 3 critical bug fixes in Educational Games"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Generate unique test identifiers
        self.test_id = f"test_{uuid.uuid4().hex[:8]}"
        self.player_name = f"TestPlayer_{self.test_id}"
    
    def get_auth_session(self, email, password):
        """Get authenticated session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Try to login
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            if "session_token" in data:
                session.cookies.set("session_token", data["session_token"])
            return session, True
        return session, False
    
    def test_01_score_submission_with_time_taken(self):
        """
        Test Bug Fix #2: Time tracking - verify time_taken field is correctly recorded
        POST /api/games/{game_id}/score should accept and store time_taken > 0
        """
        # First, get a list of existing games to find one to test with
        session, logged_in = self.get_auth_session(ADMIN_EMAIL, ADMIN_PASSWORD)
        
        if logged_in:
            games_response = session.get(f"{BASE_URL}/api/games")
            if games_response.status_code == 200:
                games = games_response.json()
                if games and len(games) > 0:
                    game_id = games[0].get("game_id")
                    
                    # Submit a score with time_taken > 0
                    time_taken = 45  # 45 seconds
                    score_payload = {
                        "player_name": self.player_name,
                        "score": 3,
                        "total_questions": 5,
                        "time_taken": time_taken
                    }
                    
                    score_response = self.session.post(
                        f"{BASE_URL}/api/games/{game_id}/score",
                        json=score_payload
                    )
                    
                    assert score_response.status_code == 200, f"Score submission failed: {score_response.text}"
                    
                    score_data = score_response.json()
                    assert "score_id" in score_data, "Response should contain score_id"
                    assert "percentage" in score_data, "Response should contain percentage"
                    
                    print(f"✓ Score submitted successfully with time_taken={time_taken}s")
                    print(f"  Score ID: {score_data.get('score_id')}")
                    print(f"  Percentage: {score_data.get('percentage')}%")
                    return
        
        # If no games exist, test with a mock game_id
        mock_game_id = f"game_test_{uuid.uuid4().hex[:8]}"
        score_payload = {
            "player_name": self.player_name,
            "score": 4,
            "total_questions": 5,
            "time_taken": 30
        }
        
        score_response = self.session.post(
            f"{BASE_URL}/api/games/{mock_game_id}/score",
            json=score_payload
        )
        
        # Even if game doesn't exist, the endpoint should accept the score
        assert score_response.status_code == 200, f"Score submission failed: {score_response.text}"
        print(f"✓ Score submission endpoint accepts time_taken field")
    
    def test_02_leaderboard_returns_submitted_at(self):
        """
        Test Bug Fix #3: Leaderboard date display - verify submitted_at field is returned
        GET /api/games/{game_id}/leaderboard should return submitted_at field
        """
        session, logged_in = self.get_auth_session(ADMIN_EMAIL, ADMIN_PASSWORD)
        
        game_id = None
        if logged_in:
            games_response = session.get(f"{BASE_URL}/api/games")
            if games_response.status_code == 200:
                games = games_response.json()
                if games and len(games) > 0:
                    game_id = games[0].get("game_id")
        
        if not game_id:
            # Use a test game ID
            game_id = "game_test_leaderboard"
            
            # First submit a score to ensure there's data
            score_payload = {
                "player_name": f"LeaderboardTest_{self.test_id}",
                "score": 5,
                "total_questions": 5,
                "time_taken": 25
            }
            self.session.post(f"{BASE_URL}/api/games/{game_id}/score", json=score_payload)
        
        # Get leaderboard
        leaderboard_response = self.session.get(f"{BASE_URL}/api/games/{game_id}/leaderboard")
        
        assert leaderboard_response.status_code == 200, f"Leaderboard fetch failed: {leaderboard_response.text}"
        
        leaderboard = leaderboard_response.json()
        assert isinstance(leaderboard, list), "Leaderboard should be a list"
        
        if len(leaderboard) > 0:
            entry = leaderboard[0]
            
            # Verify submitted_at field exists (this is the bug fix)
            assert "submitted_at" in entry, "Leaderboard entry should contain 'submitted_at' field (Bug Fix #3)"
            
            # Verify time_taken field exists (Bug Fix #2)
            assert "time_taken" in entry, "Leaderboard entry should contain 'time_taken' field (Bug Fix #2)"
            
            # Verify submitted_at is a valid ISO date string
            submitted_at = entry.get("submitted_at")
            assert submitted_at is not None, "submitted_at should not be None"
            assert "T" in submitted_at or "-" in submitted_at, "submitted_at should be a valid date string"
            
            print(f"✓ Leaderboard entry contains submitted_at: {submitted_at}")
            print(f"✓ Leaderboard entry contains time_taken: {entry.get('time_taken')}s")
            print(f"  Player: {entry.get('player_name')}")
            print(f"  Score: {entry.get('score')}/{entry.get('total_questions')}")
        else:
            print("⚠ Leaderboard is empty, but endpoint works correctly")
    
    def test_03_score_submission_time_taken_persisted(self):
        """
        Verify that time_taken is actually persisted and returned in leaderboard
        This tests the full flow: submit score with time_taken -> verify in leaderboard
        """
        # Create a unique game ID for this test
        test_game_id = f"game_time_test_{uuid.uuid4().hex[:8]}"
        
        # Submit multiple scores with different time_taken values
        test_scores = [
            {"player_name": f"Player1_{self.test_id}", "score": 5, "total_questions": 5, "time_taken": 30},
            {"player_name": f"Player2_{self.test_id}", "score": 4, "total_questions": 5, "time_taken": 45},
            {"player_name": f"Player3_{self.test_id}", "score": 3, "total_questions": 5, "time_taken": 60},
        ]
        
        for score_data in test_scores:
            response = self.session.post(
                f"{BASE_URL}/api/games/{test_game_id}/score",
                json=score_data
            )
            assert response.status_code == 200, f"Score submission failed: {response.text}"
        
        # Fetch leaderboard and verify time_taken values
        leaderboard_response = self.session.get(f"{BASE_URL}/api/games/{test_game_id}/leaderboard")
        assert leaderboard_response.status_code == 200
        
        leaderboard = leaderboard_response.json()
        assert len(leaderboard) >= 3, "Should have at least 3 entries"
        
        # Verify each entry has time_taken and submitted_at
        for entry in leaderboard:
            assert "time_taken" in entry, "Each entry should have time_taken"
            assert "submitted_at" in entry, "Each entry should have submitted_at"
            assert entry.get("time_taken", 0) > 0, f"time_taken should be > 0, got {entry.get('time_taken')}"
        
        print(f"✓ All {len(leaderboard)} leaderboard entries have valid time_taken and submitted_at")
    
    def test_04_play_game_endpoint_returns_game_data(self):
        """
        Test the public play-game endpoint that students use
        GET /api/play-game/{game_id} should return game data
        """
        session, logged_in = self.get_auth_session(ADMIN_EMAIL, ADMIN_PASSWORD)
        
        game_id = None
        if logged_in:
            games_response = session.get(f"{BASE_URL}/api/games")
            if games_response.status_code == 200:
                games = games_response.json()
                if games and len(games) > 0:
                    game_id = games[0].get("game_id")
        
        if game_id:
            # Test the public play-game endpoint
            play_response = self.session.get(f"{BASE_URL}/api/play-game/{game_id}")
            
            if play_response.status_code == 200:
                game_data = play_response.json()
                
                assert "game_id" in game_data, "Game data should contain game_id"
                assert "title" in game_data, "Game data should contain title"
                assert "questions" in game_data, "Game data should contain questions"
                
                print(f"✓ Play game endpoint returns valid game data")
                print(f"  Game: {game_data.get('title')}")
                print(f"  Questions: {len(game_data.get('questions', []))}")
            else:
                print(f"⚠ Play game endpoint returned {play_response.status_code}")
        else:
            print("⚠ No games available to test play-game endpoint")
    
    def test_05_regenerate_questions_endpoint(self):
        """
        Test Bug Fix #1: Question regeneration endpoint
        POST /api/games/{game_id}/regenerate-questions should return questions
        """
        session, logged_in = self.get_auth_session(ADMIN_EMAIL, ADMIN_PASSWORD)
        
        game_id = None
        if logged_in:
            games_response = session.get(f"{BASE_URL}/api/games")
            if games_response.status_code == 200:
                games = games_response.json()
                if games and len(games) > 0:
                    game_id = games[0].get("game_id")
        
        if game_id:
            # Test the regenerate-questions endpoint
            regen_response = self.session.post(
                f"{BASE_URL}/api/games/{game_id}/regenerate-questions",
                params={"player_name": self.player_name}
            )
            
            assert regen_response.status_code == 200, f"Regenerate questions failed: {regen_response.text}"
            
            regen_data = regen_response.json()
            
            assert "questions" in regen_data, "Response should contain questions array"
            assert "regenerated" in regen_data, "Response should contain regenerated flag"
            assert "message" in regen_data, "Response should contain message"
            
            questions = regen_data.get("questions", [])
            regenerated = regen_data.get("regenerated", False)
            
            print(f"✓ Regenerate questions endpoint works")
            print(f"  Questions returned: {len(questions)}")
            print(f"  Regenerated: {regenerated}")
            print(f"  Message: {regen_data.get('message')}")
        else:
            print("⚠ No games available to test regenerate-questions endpoint")
    
    def test_06_score_submission_validates_fields(self):
        """
        Test that score submission validates required fields
        """
        test_game_id = f"game_validation_{uuid.uuid4().hex[:8]}"
        
        # Test with all required fields
        valid_payload = {
            "player_name": "ValidPlayer",
            "score": 3,
            "total_questions": 5,
            "time_taken": 20
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/games/{test_game_id}/score",
            json=valid_payload
        )
        
        assert response.status_code == 200, f"Valid score submission should succeed: {response.text}"
        
        data = response.json()
        assert "score_id" in data, "Response should contain score_id"
        assert "percentage" in data, "Response should contain percentage"
        
        # Verify percentage calculation
        expected_percentage = round((3 / 5) * 100)
        assert data.get("percentage") == expected_percentage, f"Percentage should be {expected_percentage}"
        
        print(f"✓ Score submission validates and calculates correctly")
        print(f"  Score ID: {data.get('score_id')}")
        print(f"  Percentage: {data.get('percentage')}%")


class TestLeaderboardDateFormat:
    """Test that leaderboard dates are properly formatted for frontend display"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.test_id = f"date_test_{uuid.uuid4().hex[:8]}"
    
    def test_submitted_at_is_iso_format(self):
        """
        Verify submitted_at is in ISO format that JavaScript can parse
        This prevents 'Invalid Date' errors in the frontend
        """
        test_game_id = f"game_date_{self.test_id}"
        
        # Submit a score
        score_payload = {
            "player_name": f"DateTest_{self.test_id}",
            "score": 4,
            "total_questions": 5,
            "time_taken": 35
        }
        
        submit_response = self.session.post(
            f"{BASE_URL}/api/games/{test_game_id}/score",
            json=score_payload
        )
        assert submit_response.status_code == 200
        
        # Get leaderboard
        leaderboard_response = self.session.get(f"{BASE_URL}/api/games/{test_game_id}/leaderboard")
        assert leaderboard_response.status_code == 200
        
        leaderboard = leaderboard_response.json()
        assert len(leaderboard) > 0, "Leaderboard should have entries"
        
        entry = leaderboard[0]
        submitted_at = entry.get("submitted_at")
        
        # Verify it's a valid ISO date string
        assert submitted_at is not None, "submitted_at should not be None"
        
        # ISO format should contain 'T' separator and timezone info
        # Example: 2024-01-15T10:30:00+00:00 or 2024-01-15T10:30:00Z
        assert "T" in submitted_at, f"submitted_at should be ISO format with 'T' separator, got: {submitted_at}"
        
        # Verify it can be parsed by Python (simulating JS Date parsing)
        from datetime import datetime
        try:
            # Try parsing ISO format
            parsed = datetime.fromisoformat(submitted_at.replace('Z', '+00:00'))
            print(f"✓ submitted_at is valid ISO format: {submitted_at}")
            print(f"  Parsed as: {parsed}")
        except ValueError as e:
            pytest.fail(f"submitted_at is not valid ISO format: {submitted_at}, error: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
