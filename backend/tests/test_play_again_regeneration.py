"""
Test Play Again Question Regeneration Feature
Tests that AI generates COMPLETELY NEW questions on each Play Again, NOT shuffled existing questions.
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPlayAgainRegeneration:
    """Test that Play Again generates completely new questions via AI"""
    
    def test_true_false_regeneration_returns_regenerated_true(self):
        """Test True/False game returns regenerated: true"""
        response = requests.post(
            f"{BASE_URL}/api/games/test_true_false_1771598782/regenerate-questions",
            params={"player_name": "TestPlayer", "timestamp": int(time.time())},
            headers={"Cache-Control": "no-cache"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify regenerated flag is true
        assert data.get("regenerated") == True, "Expected regenerated: true"
        assert data.get("message") == "New questions generated successfully"
        assert len(data.get("questions", [])) == 2, "Expected 2 questions for True/False game"
    
    def test_quiz_regeneration_returns_regenerated_true(self):
        """Test Quiz game returns regenerated: true"""
        response = requests.post(
            f"{BASE_URL}/api/games/game_f1ca4b814708/regenerate-questions",
            params={"player_name": "TestPlayer", "timestamp": int(time.time())},
            headers={"Cache-Control": "no-cache"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify regenerated flag is true
        assert data.get("regenerated") == True, "Expected regenerated: true"
        assert data.get("message") == "New questions generated successfully"
        assert len(data.get("questions", [])) == 5, "Expected 5 questions for Quiz game"
    
    def test_true_false_consecutive_regenerations_different(self):
        """Test that consecutive True/False regenerations produce DIFFERENT questions"""
        questions_sets = []
        
        for i in range(3):
            time.sleep(2)  # Wait between requests
            response = requests.post(
                f"{BASE_URL}/api/games/test_true_false_1771598782/regenerate-questions",
                params={"player_name": "TestPlayer", "timestamp": int(time.time())},
                headers={"Cache-Control": "no-cache"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data.get("regenerated") == True
            
            # Extract first question text
            first_q = data.get("questions", [{}])[0].get("question", "")
            questions_sets.append(first_q)
            print(f"Round {i+1}: {first_q[:60]}...")
        
        # Verify at least 2 out of 3 rounds have different first questions
        unique_questions = set(questions_sets)
        assert len(unique_questions) >= 2, f"Expected different questions across rounds, got: {questions_sets}"
    
    def test_quiz_consecutive_regenerations_different(self):
        """Test that consecutive Quiz regenerations produce DIFFERENT questions"""
        questions_sets = []
        
        for i in range(3):
            time.sleep(2)  # Wait between requests
            response = requests.post(
                f"{BASE_URL}/api/games/game_f1ca4b814708/regenerate-questions",
                params={"player_name": "TestPlayer", "timestamp": int(time.time())},
                headers={"Cache-Control": "no-cache"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data.get("regenerated") == True
            
            # Extract first question text
            first_q = data.get("questions", [{}])[0].get("question", "")
            questions_sets.append(first_q)
            print(f"Round {i+1}: {first_q[:60]}...")
        
        # Verify at least 2 out of 3 rounds have different first questions
        unique_questions = set(questions_sets)
        assert len(unique_questions) >= 2, f"Expected different questions across rounds, got: {questions_sets}"
    
    def test_regeneration_no_subscription_required(self):
        """Test that regeneration works without subscription (public endpoint)"""
        # This endpoint should work without authentication
        response = requests.post(
            f"{BASE_URL}/api/games/test_true_false_1771598782/regenerate-questions",
            params={"player_name": "PublicUser", "timestamp": int(time.time())},
            headers={"Cache-Control": "no-cache"}
        )
        
        # Should NOT return 401 or 403
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("regenerated") == True, "Regeneration should work without subscription"
    
    def test_true_false_question_structure(self):
        """Test True/False questions have correct structure"""
        response = requests.post(
            f"{BASE_URL}/api/games/test_true_false_1771598782/regenerate-questions",
            params={"player_name": "TestPlayer", "timestamp": int(time.time())},
            headers={"Cache-Control": "no-cache"}
        )
        assert response.status_code == 200
        data = response.json()
        
        for q in data.get("questions", []):
            assert "question" in q, "Question must have 'question' field"
            assert "options" in q, "Question must have 'options' field"
            assert "correct_answer" in q, "Question must have 'correct_answer' field"
            assert q["options"] == ["True", "False"], "True/False options must be ['True', 'False']"
            assert q["correct_answer"] in ["True", "False"], "correct_answer must be 'True' or 'False'"
    
    def test_quiz_question_structure(self):
        """Test Quiz questions have correct structure"""
        response = requests.post(
            f"{BASE_URL}/api/games/game_f1ca4b814708/regenerate-questions",
            params={"player_name": "TestPlayer", "timestamp": int(time.time())},
            headers={"Cache-Control": "no-cache"}
        )
        assert response.status_code == 200
        data = response.json()
        
        for q in data.get("questions", []):
            assert "question" in q, "Question must have 'question' field"
            assert "options" in q, "Question must have 'options' field"
            assert "correct_answer" in q, "Question must have 'correct_answer' field"
            assert len(q["options"]) == 4, "Quiz must have 4 options"
            assert q["correct_answer"] in q["options"], "correct_answer must be one of the options"


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
