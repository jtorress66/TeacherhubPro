"""
Test Play to Learn - Fill in the Blank format and Practice Insights
Tests the rewritten fill_blank transformation with single-word answers
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session token - will be created in setup
SESSION_TOKEN = None


@pytest.fixture(scope="module", autouse=True)
def setup_session():
    """Setup test session token"""
    global SESSION_TOKEN
    # Use existing test session
    SESSION_TOKEN = "test_session_1772142043317"
    yield


class TestFillBlankFormat:
    """Test Fill in the Blank question format"""
    
    def test_fill_blank_session_exists(self):
        """Verify the test fill_blank session exists"""
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/sessions/ps_edfe4e031ad14f88",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["game_type"] == "fill_blank"
        assert data["status"] == "ACTIVE"
        print(f"SUCCESS: Fill blank session found with status {data['status']}")
    
    def test_fill_blank_sentence_format(self):
        """Verify fill_blank sentences have proper format with _____ placeholder"""
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/sessions/ps_edfe4e031ad14f88",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        questions = data.get("game_payload", {}).get("questions", [])
        assert len(questions) > 0, "No questions found in game payload"
        
        for i, q in enumerate(questions):
            # Check sentence has blank placeholder
            assert "_____" in q.get("sentence", ""), f"Question {i+1} missing _____ placeholder"
            
            # Check sentence is a proper sentence (not just "Fill in: _____")
            sentence = q.get("sentence", "")
            assert len(sentence) > 30, f"Question {i+1} sentence too short: {sentence}"
            
            print(f"Q{i+1} sentence: {sentence[:80]}...")
        
        print(f"SUCCESS: All {len(questions)} questions have proper sentence format")
    
    def test_fill_blank_single_word_answers(self):
        """Verify fill_blank answers are single words, not full sentences"""
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/sessions/ps_edfe4e031ad14f88",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        questions = data.get("game_payload", {}).get("questions", [])
        
        for i, q in enumerate(questions):
            blank_answer = q.get("blank_answer", "")
            assert blank_answer, f"Question {i+1} missing blank_answer"
            
            # Single word answers should not have many spaces
            word_count = len(blank_answer.split())
            assert word_count <= 3, f"Question {i+1} answer has too many words ({word_count}): {blank_answer}"
            
            print(f"Q{i+1} answer: {blank_answer} ({word_count} word(s))")
        
        print(f"SUCCESS: All answers are single words or short phrases")
    
    def test_fill_blank_hint_format(self):
        """Verify hints show 'Starts with X, N letters' format"""
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/sessions/ps_edfe4e031ad14f88",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        questions = data.get("game_payload", {}).get("questions", [])
        
        for i, q in enumerate(questions):
            hint = q.get("hint", "")
            assert hint, f"Question {i+1} missing hint"
            
            # Check hint format
            assert "Starts with" in hint, f"Question {i+1} hint missing 'Starts with': {hint}"
            assert "letters" in hint, f"Question {i+1} hint missing 'letters': {hint}"
            
            # Verify hint matches answer
            blank_answer = q.get("blank_answer", "")
            if blank_answer:
                expected_first_letter = blank_answer[0].upper()
                expected_length = len(blank_answer)
                assert f"'{expected_first_letter}'" in hint, f"Hint first letter mismatch: {hint}"
                assert str(expected_length) in hint, f"Hint length mismatch: {hint}"
            
            print(f"Q{i+1} hint: {hint}")
        
        print(f"SUCCESS: All hints have correct format")


class TestPracticeInsights:
    """Test Practice Insights API"""
    
    def test_insights_endpoint_exists(self):
        """Verify insights endpoint returns data"""
        # Get first assignment
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/assignments",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        assignments = response.json().get("assignments", [])
        assert len(assignments) > 0, "No assignments found"
        
        assignment_id = assignments[0]["assignment_id"]
        
        # Get insights
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/insights/{assignment_id}",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        print(f"SUCCESS: Insights endpoint returns 200 for assignment {assignment_id}")
    
    def test_insights_has_participant_count(self):
        """Verify insights includes participant count"""
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/assignments",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assignments = response.json().get("assignments", [])
        assignment_id = assignments[0]["assignment_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/insights/{assignment_id}",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        data = response.json()
        
        assert "total_participants" in data, "Missing total_participants field"
        assert isinstance(data["total_participants"], int), "total_participants should be int"
        print(f"SUCCESS: Participant count: {data['total_participants']}")
    
    def test_insights_has_session_count(self):
        """Verify insights includes session count"""
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/assignments",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assignments = response.json().get("assignments", [])
        assignment_id = assignments[0]["assignment_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/insights/{assignment_id}",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        data = response.json()
        
        assert "total_sessions" in data, "Missing total_sessions field"
        assert isinstance(data["total_sessions"], int), "total_sessions should be int"
        print(f"SUCCESS: Session count: {data['total_sessions']}")
    
    def test_insights_has_answers_count(self):
        """Verify insights includes total answers count"""
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/assignments",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assignments = response.json().get("assignments", [])
        assignment_id = assignments[0]["assignment_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/insights/{assignment_id}",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        data = response.json()
        
        assert "total_answers" in data, "Missing total_answers field"
        assert isinstance(data["total_answers"], int), "total_answers should be int"
        print(f"SUCCESS: Answers count: {data['total_answers']}")
    
    def test_insights_has_accuracy(self):
        """Verify insights includes accuracy percentage"""
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/assignments",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assignments = response.json().get("assignments", [])
        assignment_id = assignments[0]["assignment_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/insights/{assignment_id}",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        data = response.json()
        
        assert "overall_accuracy_percent" in data, "Missing overall_accuracy_percent field"
        assert isinstance(data["overall_accuracy_percent"], (int, float)), "accuracy should be numeric"
        print(f"SUCCESS: Accuracy: {data['overall_accuracy_percent']}%")
    
    def test_insights_has_game_type_breakdown(self):
        """Verify insights includes game type breakdown"""
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/assignments",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assignments = response.json().get("assignments", [])
        assignment_id = assignments[0]["assignment_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/insights/{assignment_id}",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        data = response.json()
        
        assert "game_type_breakdown" in data, "Missing game_type_breakdown field"
        assert isinstance(data["game_type_breakdown"], dict), "game_type_breakdown should be dict"
        print(f"SUCCESS: Game type breakdown: {data['game_type_breakdown']}")
    
    def test_insights_has_most_missed_items(self):
        """Verify insights includes most missed items"""
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/assignments",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assignments = response.json().get("assignments", [])
        assignment_id = assignments[0]["assignment_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/play-to-learn/insights/{assignment_id}",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        data = response.json()
        
        assert "most_missed_items" in data, "Missing most_missed_items field"
        assert isinstance(data["most_missed_items"], list), "most_missed_items should be list"
        
        # Check structure of missed items
        for item in data["most_missed_items"]:
            assert "item_id" in item, "Missed item missing item_id"
            assert "miss_count" in item, "Missed item missing miss_count"
        
        print(f"SUCCESS: Most missed items: {len(data['most_missed_items'])} items")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
