"""
Test Play Again Question Regeneration - Banned Tokens Validation
Tests that AI no longer generates TODO/FIXME/PLACEHOLDER tokens which caused validation failures.
"""
import pytest
import requests
import os
import time
import re

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Banned tokens that should NEVER appear in AI responses
BANNED_TOKENS = ['TODO', 'FIXME', 'PLACEHOLDER', 'coming soon', 'to be added', 'example']


class TestBannedTokensRegeneration:
    """Test that AI regeneration does NOT produce banned tokens"""
    
    def test_true_false_no_banned_tokens(self):
        """Test True/False regeneration contains no banned tokens"""
        response = requests.post(
            f"{BASE_URL}/api/games/test_true_false_1771598782/regenerate-questions",
            params={"player_name": "TestPlayer", "timestamp": int(time.time())},
            headers={"Cache-Control": "no-cache"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check regenerated flag
        assert data.get("regenerated") == True, f"Expected regenerated: true, got: {data}"
        
        # Check all questions for banned tokens
        questions = data.get("questions", [])
        assert len(questions) > 0, "Expected at least 1 question"
        
        for i, q in enumerate(questions):
            question_text = q.get("question", "")
            correct_answer = q.get("correct_answer", "")
            full_text = f"{question_text} {correct_answer}".upper()
            
            for banned in BANNED_TOKENS:
                assert banned.upper() not in full_text, \
                    f"Question {i+1} contains banned token '{banned}': {question_text}"
            
            print(f"Question {i+1}: {question_text[:60]}... - CLEAN")
    
    def test_consecutive_regenerations_no_banned_tokens(self):
        """Test 3 consecutive regenerations all produce clean content"""
        for round_num in range(3):
            time.sleep(2)  # Wait between requests
            
            response = requests.post(
                f"{BASE_URL}/api/games/test_true_false_1771598782/regenerate-questions",
                params={"player_name": "TestPlayer", "timestamp": int(time.time())},
                headers={"Cache-Control": "no-cache"}
            )
            assert response.status_code == 200
            data = response.json()
            
            # Must be regenerated
            assert data.get("regenerated") == True, f"Round {round_num+1}: Expected regenerated: true"
            
            # Check for banned tokens
            questions = data.get("questions", [])
            for i, q in enumerate(questions):
                question_text = q.get("question", "")
                full_text = question_text.upper()
                
                for banned in BANNED_TOKENS:
                    assert banned.upper() not in full_text, \
                        f"Round {round_num+1}, Q{i+1} contains banned token '{banned}'"
            
            print(f"Round {round_num+1}: {len(questions)} questions - ALL CLEAN")
    
    def test_regeneration_returns_new_questions(self):
        """Test that regeneration returns regenerated: true with NEW questions"""
        response = requests.post(
            f"{BASE_URL}/api/games/test_true_false_1771598782/regenerate-questions",
            params={"player_name": "TestPlayer", "timestamp": int(time.time())},
            headers={"Cache-Control": "no-cache"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "regenerated" in data, "Response must contain 'regenerated' field"
        assert "questions" in data, "Response must contain 'questions' field"
        assert "message" in data, "Response must contain 'message' field"
        
        # Verify regenerated is True
        assert data["regenerated"] == True, f"Expected regenerated: true, got: {data['regenerated']}"
        
        # Verify message indicates success
        assert "success" in data["message"].lower() or "generated" in data["message"].lower(), \
            f"Expected success message, got: {data['message']}"
        
        print(f"Regeneration successful: {data['message']}")
    
    def test_three_consecutive_play_again_different_questions(self):
        """Test that 3 consecutive Play Again attempts generate DIFFERENT questions"""
        all_questions = []
        
        for round_num in range(3):
            time.sleep(3)  # Wait between requests for AI to generate different content
            
            response = requests.post(
                f"{BASE_URL}/api/games/test_true_false_1771598782/regenerate-questions",
                params={
                    "player_name": "TestPlayer", 
                    "timestamp": int(time.time()),
                    "force_new": "true"
                },
                headers={"Cache-Control": "no-cache"}
            )
            assert response.status_code == 200
            data = response.json()
            
            assert data.get("regenerated") == True, f"Round {round_num+1}: Expected regenerated: true"
            
            questions = data.get("questions", [])
            first_question = questions[0].get("question", "") if questions else ""
            all_questions.append(first_question)
            
            print(f"Round {round_num+1}: {first_question[:70]}...")
        
        # Verify at least 2 out of 3 rounds have different first questions
        unique_questions = set(all_questions)
        assert len(unique_questions) >= 2, \
            f"Expected at least 2 different questions across 3 rounds, got {len(unique_questions)}: {all_questions}"
        
        print(f"\nUnique questions: {len(unique_questions)}/3 - PASS")
    
    def test_error_handling_nonexistent_game(self):
        """Test proper error handling when game doesn't exist"""
        response = requests.post(
            f"{BASE_URL}/api/games/nonexistent_game_12345/regenerate-questions",
            params={"player_name": "TestPlayer"},
            headers={"Cache-Control": "no-cache"}
        )
        
        # Should return 404 for non-existent game
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Error handling for non-existent game: PASS")
    
    def test_question_structure_valid(self):
        """Test that regenerated questions have valid structure"""
        response = requests.post(
            f"{BASE_URL}/api/games/test_true_false_1771598782/regenerate-questions",
            params={"player_name": "TestPlayer", "timestamp": int(time.time())},
            headers={"Cache-Control": "no-cache"}
        )
        assert response.status_code == 200
        data = response.json()
        
        questions = data.get("questions", [])
        for i, q in enumerate(questions):
            # Required fields
            assert "question" in q, f"Q{i+1}: Missing 'question' field"
            assert "options" in q, f"Q{i+1}: Missing 'options' field"
            assert "correct_answer" in q, f"Q{i+1}: Missing 'correct_answer' field"
            
            # Non-empty values
            assert len(q["question"]) > 10, f"Q{i+1}: Question too short"
            assert len(q["options"]) >= 2, f"Q{i+1}: Not enough options"
            assert q["correct_answer"] in q["options"], f"Q{i+1}: correct_answer not in options"
            
            # No empty strings
            assert q["question"].strip() != "", f"Q{i+1}: Empty question"
            assert q["correct_answer"].strip() != "", f"Q{i+1}: Empty correct_answer"
            
            print(f"Q{i+1}: Structure valid - {q['question'][:50]}...")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
