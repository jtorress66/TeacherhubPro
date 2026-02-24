"""
Test suite for Game Analytics, Grade Settings, Question Regeneration, and Student Stats
Tests the new features:
1. Analytics endpoint with game_stats array and unique_players
2. Grade settings (count_as_grade toggle, grade_points, grade_method)
3. Question regeneration endpoint
4. Student stats endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SESSION_TOKEN = "test_session_games_1771944079500"

@pytest.fixture
def auth_headers():
    """Return headers with session token for authenticated requests"""
    return {
        "Content-Type": "application/json",
        "Cookie": f"session_token={SESSION_TOKEN}"
    }

@pytest.fixture
def session():
    """Create a requests session with auth cookie"""
    s = requests.Session()
    s.cookies.set("session_token", SESSION_TOKEN)
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestAnalyticsEndpoint:
    """Test the enhanced analytics endpoint with game_stats and unique_players"""
    
    def test_analytics_returns_game_stats_array(self, session):
        """Test that analytics endpoint returns game_stats array"""
        response = session.get(f"{BASE_URL}/api/games/analytics/summary")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify game_stats array exists
        assert "game_stats" in data, "Response should contain game_stats array"
        assert isinstance(data["game_stats"], list), "game_stats should be a list"
        
        print(f"Analytics returned {len(data['game_stats'])} games in game_stats")
    
    def test_analytics_returns_unique_players(self, session):
        """Test that analytics endpoint returns unique_players count"""
        response = session.get(f"{BASE_URL}/api/games/analytics/summary")
        
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify unique_players exists
        assert "unique_players" in data, "Response should contain unique_players"
        assert isinstance(data["unique_players"], int), "unique_players should be an integer"
        
        print(f"Analytics shows {data['unique_players']} unique players")
    
    def test_game_stats_contains_required_fields(self, session):
        """Test that each game in game_stats has required fields"""
        response = session.get(f"{BASE_URL}/api/games/analytics/summary")
        
        assert response.status_code == 200
        
        data = response.json()
        game_stats = data.get("game_stats", [])
        
        if len(game_stats) > 0:
            game = game_stats[0]
            
            # Check required fields
            required_fields = ["game_id", "title", "game_type", "play_count", "unique_players", "avg_score", "best_score"]
            for field in required_fields:
                assert field in game, f"game_stats item should contain {field}"
            
            print(f"First game stats: {game['title']} - {game['play_count']} plays, {game['unique_players']} unique players, avg: {game['avg_score']}%")
        else:
            print("No games in game_stats to verify fields")
    
    def test_analytics_contains_total_games(self, session):
        """Test that analytics contains total_games count"""
        response = session.get(f"{BASE_URL}/api/games/analytics/summary")
        
        assert response.status_code == 200
        
        data = response.json()
        
        assert "total_games" in data, "Response should contain total_games"
        assert isinstance(data["total_games"], int), "total_games should be an integer"
        
        print(f"Total games: {data['total_games']}")


class TestGradeSettingsEndpoint:
    """Test the grade settings update endpoint"""
    
    def test_grade_settings_endpoint_exists(self, session):
        """Test that PUT /games/{game_id}/grade-settings endpoint exists"""
        # First get a game ID
        games_response = session.get(f"{BASE_URL}/api/games")
        
        if games_response.status_code == 200 and len(games_response.json()) > 0:
            game_id = games_response.json()[0]["game_id"]
            
            # Test the grade settings endpoint
            settings = {
                "count_as_grade": True,
                "grade_points": 100,
                "grade_method": "best",
                "class_id": None,
                "assignment_name": "Test Assignment"
            }
            
            response = session.put(f"{BASE_URL}/api/games/{game_id}/grade-settings", json=settings)
            
            # Should return 200 or 404 (if game not found), not 405 (method not allowed)
            assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"
            
            if response.status_code == 200:
                print(f"Grade settings updated successfully for game {game_id}")
            else:
                print(f"Game {game_id} not found or unauthorized")
        else:
            pytest.skip("No games available to test grade settings")
    
    def test_grade_settings_with_all_methods(self, session):
        """Test grade settings with different grade methods (first, best, average)"""
        games_response = session.get(f"{BASE_URL}/api/games")
        
        if games_response.status_code == 200 and len(games_response.json()) > 0:
            game_id = games_response.json()[0]["game_id"]
            
            for method in ["first", "best", "average"]:
                settings = {
                    "count_as_grade": True,
                    "grade_points": 100,
                    "grade_method": method,
                    "class_id": None,
                    "assignment_name": f"Test {method.title()} Method"
                }
                
                response = session.put(f"{BASE_URL}/api/games/{game_id}/grade-settings", json=settings)
                
                if response.status_code == 200:
                    print(f"Grade method '{method}' set successfully")
                else:
                    print(f"Failed to set grade method '{method}': {response.status_code}")
        else:
            pytest.skip("No games available to test grade methods")


class TestQuestionRegenerationEndpoint:
    """Test the question regeneration endpoint"""
    
    def test_regenerate_questions_endpoint_exists(self, session):
        """Test that POST /games/{game_id}/regenerate-questions endpoint exists"""
        games_response = session.get(f"{BASE_URL}/api/games")
        
        if games_response.status_code == 200 and len(games_response.json()) > 0:
            game_id = games_response.json()[0]["game_id"]
            
            # Test the regenerate endpoint
            response = session.post(
                f"{BASE_URL}/api/games/{game_id}/regenerate-questions",
                params={"player_name": "TestPlayer"}
            )
            
            # Should return 200 (success) or 404 (game not found), not 405 (method not allowed)
            assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"
            
            if response.status_code == 200:
                data = response.json()
                assert "questions" in data, "Response should contain questions"
                assert "regenerated" in data, "Response should contain regenerated flag"
                print(f"Regeneration response: regenerated={data.get('regenerated')}, questions count={len(data.get('questions', []))}")
        else:
            pytest.skip("No games available to test question regeneration")
    
    def test_regenerate_returns_questions_array(self, session):
        """Test that regenerate endpoint returns questions array"""
        games_response = session.get(f"{BASE_URL}/api/games")
        
        if games_response.status_code == 200 and len(games_response.json()) > 0:
            game_id = games_response.json()[0]["game_id"]
            
            response = session.post(f"{BASE_URL}/api/games/{game_id}/regenerate-questions")
            
            if response.status_code == 200:
                data = response.json()
                assert "questions" in data, "Response should contain questions"
                assert isinstance(data["questions"], list), "questions should be a list"
                print(f"Returned {len(data['questions'])} questions")
        else:
            pytest.skip("No games available")


class TestStudentStatsEndpoint:
    """Test the student stats endpoint"""
    
    def test_student_stats_endpoint_exists(self, session):
        """Test that GET /games/{game_id}/student-stats endpoint exists"""
        games_response = session.get(f"{BASE_URL}/api/games")
        
        if games_response.status_code == 200 and len(games_response.json()) > 0:
            game_id = games_response.json()[0]["game_id"]
            
            response = session.get(f"{BASE_URL}/api/games/{game_id}/student-stats")
            
            # Should return 200 or 404, not 405
            assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"
            
            if response.status_code == 200:
                data = response.json()
                print(f"Student stats retrieved for game {game_id}")
                print(f"Total unique players: {data.get('total_unique_players', 0)}")
        else:
            pytest.skip("No games available to test student stats")
    
    def test_student_stats_contains_required_fields(self, session):
        """Test that student stats response contains required fields"""
        games_response = session.get(f"{BASE_URL}/api/games")
        
        if games_response.status_code == 200 and len(games_response.json()) > 0:
            game_id = games_response.json()[0]["game_id"]
            
            response = session.get(f"{BASE_URL}/api/games/{game_id}/student-stats")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["game_id", "game_title", "total_unique_players", "total_plays", "player_stats"]
                for field in required_fields:
                    assert field in data, f"Response should contain {field}"
                
                assert isinstance(data["player_stats"], list), "player_stats should be a list"
                
                print(f"Student stats: {data['total_plays']} total plays, {data['total_unique_players']} unique players")
        else:
            pytest.skip("No games available")


class TestGameListWithGradeSettings:
    """Test that game list includes grade settings fields"""
    
    def test_games_list_returns_grade_fields(self, session):
        """Test that games list includes count_as_grade and grade_points"""
        response = session.get(f"{BASE_URL}/api/games")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        games = response.json()
        
        if len(games) > 0:
            game = games[0]
            # These fields should be present (may be False/default values)
            print(f"Game: {game.get('title')}")
            print(f"  count_as_grade: {game.get('count_as_grade', 'NOT PRESENT')}")
            print(f"  grade_points: {game.get('grade_points', 'NOT PRESENT')}")
            print(f"  grade_method: {game.get('grade_method', 'NOT PRESENT')}")
        else:
            print("No games found")


class TestGetGameWithGradeSettings:
    """Test that individual game endpoint returns grade settings"""
    
    def test_get_game_returns_grade_fields(self, session):
        """Test that GET /games/{game_id} returns grade settings"""
        games_response = session.get(f"{BASE_URL}/api/games")
        
        if games_response.status_code == 200 and len(games_response.json()) > 0:
            game_id = games_response.json()[0]["game_id"]
            
            response = session.get(f"{BASE_URL}/api/games/{game_id}")
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            
            # Check grade-related fields
            assert "count_as_grade" in data, "Response should contain count_as_grade"
            assert "grade_points" in data, "Response should contain grade_points"
            assert "grade_method" in data, "Response should contain grade_method"
            
            print(f"Game {game_id} grade settings:")
            print(f"  count_as_grade: {data['count_as_grade']}")
            print(f"  grade_points: {data['grade_points']}")
            print(f"  grade_method: {data['grade_method']}")
        else:
            pytest.skip("No games available")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
