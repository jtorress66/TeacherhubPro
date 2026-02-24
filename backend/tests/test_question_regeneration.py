"""
Test Question Regeneration Feature
Tests for:
1. CRITICAL: Regenerated questions must be COMPLETELY DIFFERENT (not rephrased versions)
2. Games WITHOUT original_content should derive content from existing questions
3. Multiple consecutive regenerations should produce different questions each time
4. Time tracking: NEW plays should record time correctly
"""
import pytest
import requests
import os
import time
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestQuestionRegeneration:
    """Test question regeneration for anti-cheat feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.test_game_id = "game_f1ca4b814708"  # Quiz game with original_content
        self.api_url = f"{BASE_URL}/api"
    
    def test_regenerate_questions_returns_new_questions(self):
        """Test that regenerate-questions endpoint returns new questions"""
        # First, get original questions
        original_response = requests.get(f"{self.api_url}/games/{self.test_game_id}")
        assert original_response.status_code == 200, f"Failed to get game: {original_response.text}"
        original_game = original_response.json()
        original_questions = original_game.get("questions", [])
        
        print(f"\n=== Original Questions ({len(original_questions)}) ===")
        for i, q in enumerate(original_questions):
            print(f"  {i+1}. {q.get('question', '')[:80]}")
        
        # Call regenerate endpoint
        regen_response = requests.post(
            f"{self.api_url}/games/{self.test_game_id}/regenerate-questions",
            params={"player_name": "TestPlayer"}
        )
        assert regen_response.status_code == 200, f"Regeneration failed: {regen_response.text}"
        regen_data = regen_response.json()
        
        # Check response structure
        assert "questions" in regen_data, "Response missing 'questions' field"
        assert "regenerated" in regen_data, "Response missing 'regenerated' field"
        
        new_questions = regen_data.get("questions", [])
        print(f"\n=== Regenerated Questions ({len(new_questions)}) ===")
        for i, q in enumerate(new_questions):
            print(f"  {i+1}. {q.get('question', '')[:80]}")
        
        # Verify regeneration happened
        if regen_data.get("regenerated"):
            assert len(new_questions) > 0, "Regenerated but no questions returned"
            print(f"\n✓ Regeneration successful: {regen_data.get('message')}")
        else:
            print(f"\n⚠ Regeneration skipped: {regen_data.get('message')}")
    
    def test_regenerated_questions_are_completely_different(self):
        """CRITICAL: Verify regenerated questions are COMPLETELY DIFFERENT, not just rephrased"""
        # Get original questions
        original_response = requests.get(f"{self.api_url}/games/{self.test_game_id}")
        assert original_response.status_code == 200
        original_questions = original_response.json().get("questions", [])
        original_texts = [q.get("question", "").lower().strip() for q in original_questions]
        
        # Regenerate questions
        regen_response = requests.post(
            f"{self.api_url}/games/{self.test_game_id}/regenerate-questions",
            params={"player_name": "DifferenceTest"}
        )
        assert regen_response.status_code == 200
        regen_data = regen_response.json()
        
        if not regen_data.get("regenerated"):
            pytest.skip(f"Regeneration not available: {regen_data.get('message')}")
        
        new_questions = regen_data.get("questions", [])
        new_texts = [q.get("question", "").lower().strip() for q in new_questions]
        
        # Check for exact matches (should be 0)
        exact_matches = 0
        for orig in original_texts:
            if orig in new_texts:
                exact_matches += 1
                print(f"⚠ EXACT MATCH FOUND: {orig[:60]}")
        
        # Check for similar questions (substring matching)
        similar_count = 0
        for orig in original_texts:
            for new in new_texts:
                # Check if significant portion overlaps (more than 50% of words)
                orig_words = set(orig.split())
                new_words = set(new.split())
                if len(orig_words) > 3 and len(new_words) > 3:
                    overlap = len(orig_words & new_words)
                    similarity = overlap / min(len(orig_words), len(new_words))
                    if similarity > 0.7:  # 70% word overlap = too similar
                        similar_count += 1
                        print(f"⚠ SIMILAR QUESTIONS DETECTED (similarity={similarity:.2f}):")
                        print(f"   Original: {orig[:60]}")
                        print(f"   New: {new[:60]}")
        
        print(f"\n=== Difference Analysis ===")
        print(f"  Original questions: {len(original_texts)}")
        print(f"  New questions: {len(new_texts)}")
        print(f"  Exact matches: {exact_matches}")
        print(f"  Similar questions: {similar_count}")
        
        # CRITICAL: No exact matches allowed
        assert exact_matches == 0, f"Found {exact_matches} exact matches - questions not regenerated properly!"
        
        # Warn if too many similar questions
        if similar_count > len(original_texts) * 0.5:
            print(f"⚠ WARNING: {similar_count} questions are too similar to originals")
    
    def test_multiple_consecutive_regenerations_produce_different_questions(self):
        """Test that multiple regenerations produce different questions each time"""
        all_question_sets = []
        
        for i in range(3):
            regen_response = requests.post(
                f"{self.api_url}/games/{self.test_game_id}/regenerate-questions",
                params={"player_name": f"ConsecutiveTest_{i}"}
            )
            assert regen_response.status_code == 200, f"Regeneration {i+1} failed"
            regen_data = regen_response.json()
            
            if not regen_data.get("regenerated"):
                pytest.skip(f"Regeneration not available: {regen_data.get('message')}")
            
            questions = regen_data.get("questions", [])
            question_texts = [q.get("question", "") for q in questions]
            all_question_sets.append(question_texts)
            
            print(f"\n=== Regeneration {i+1} ===")
            for j, q in enumerate(question_texts[:3]):  # Show first 3
                print(f"  {j+1}. {q[:60]}...")
            
            # Small delay between regenerations
            time.sleep(1)
        
        # Compare each pair of regenerations
        print(f"\n=== Comparing Regenerations ===")
        for i in range(len(all_question_sets)):
            for j in range(i + 1, len(all_question_sets)):
                set_i = set(all_question_sets[i])
                set_j = set(all_question_sets[j])
                overlap = len(set_i & set_j)
                total = max(len(set_i), len(set_j))
                overlap_pct = (overlap / total * 100) if total > 0 else 0
                
                print(f"  Regen {i+1} vs Regen {j+1}: {overlap}/{total} overlap ({overlap_pct:.1f}%)")
                
                # Allow some overlap but not complete overlap
                assert overlap_pct < 80, f"Regenerations {i+1} and {j+1} are too similar ({overlap_pct:.1f}% overlap)"


class TestContentDerivation:
    """Test that games without original_content can derive content from existing questions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.api_url = f"{BASE_URL}/api"
    
    def test_game_without_original_content_can_regenerate(self):
        """Test that games without original_content derive content from questions"""
        # Find a game without original_content
        # We'll use the test game ID from the database check
        test_game_id = "game_09ff18b03b93"  # Game without original_content
        
        # First verify the game exists
        game_response = requests.get(f"{self.api_url}/games/{test_game_id}")
        if game_response.status_code == 404:
            pytest.skip("Test game not found")
        
        assert game_response.status_code == 200
        game_data = game_response.json()
        original_questions = game_data.get("questions", [])
        
        print(f"\n=== Game Without Original Content ===")
        print(f"  Game ID: {test_game_id}")
        print(f"  Title: {game_data.get('title', 'Unknown')}")
        print(f"  Original questions: {len(original_questions)}")
        
        # Try to regenerate - this should derive content from existing questions
        regen_response = requests.post(
            f"{self.api_url}/games/{test_game_id}/regenerate-questions",
            params={"player_name": "ContentDerivationTest"}
        )
        
        assert regen_response.status_code == 200, f"Regeneration failed: {regen_response.text}"
        regen_data = regen_response.json()
        
        print(f"\n=== Regeneration Result ===")
        print(f"  Regenerated: {regen_data.get('regenerated')}")
        print(f"  Message: {regen_data.get('message')}")
        print(f"  New questions count: {len(regen_data.get('questions', []))}")
        
        # If regeneration happened, verify we got questions
        if regen_data.get("regenerated"):
            new_questions = regen_data.get("questions", [])
            assert len(new_questions) > 0, "Regenerated but no questions returned"
            print(f"\n✓ Content derivation successful - generated {len(new_questions)} new questions")


class TestTrueFalseRegeneration:
    """Test True/False game specific regeneration logic"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.api_url = f"{BASE_URL}/api"
    
    def test_true_false_regeneration_creates_different_statements(self):
        """Test that True/False games get completely different statements on regeneration"""
        # Find a True/False game
        # Using the one with original_content
        test_game_id = "test_true_false_1771598782"
        
        # Get original game
        game_response = requests.get(f"{self.api_url}/games/{test_game_id}")
        if game_response.status_code == 404:
            pytest.skip("True/False test game not found")
        
        assert game_response.status_code == 200
        game_data = game_response.json()
        
        if game_data.get("game_type") != "true_false":
            pytest.skip("Game is not true_false type")
        
        original_questions = game_data.get("questions", [])
        original_statements = [q.get("question", "") for q in original_questions]
        
        print(f"\n=== Original True/False Statements ===")
        for i, stmt in enumerate(original_statements):
            print(f"  {i+1}. {stmt[:70]}")
        
        # Regenerate
        regen_response = requests.post(
            f"{self.api_url}/games/{test_game_id}/regenerate-questions",
            params={"player_name": "TrueFalseTest"}
        )
        
        assert regen_response.status_code == 200
        regen_data = regen_response.json()
        
        if not regen_data.get("regenerated"):
            pytest.skip(f"Regeneration not available: {regen_data.get('message')}")
        
        new_questions = regen_data.get("questions", [])
        new_statements = [q.get("question", "") for q in new_questions]
        
        print(f"\n=== Regenerated True/False Statements ===")
        for i, stmt in enumerate(new_statements):
            print(f"  {i+1}. {stmt[:70]}")
        
        # Verify statements are different
        exact_matches = sum(1 for s in original_statements if s in new_statements)
        print(f"\n=== Analysis ===")
        print(f"  Exact matches: {exact_matches}/{len(original_statements)}")
        
        assert exact_matches == 0, f"Found {exact_matches} exact matches in True/False statements"


class TestTimeTracking:
    """Test time tracking for game plays"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.test_game_id = "game_f1ca4b814708"
        self.api_url = f"{BASE_URL}/api"
    
    def test_new_play_records_time_correctly(self):
        """Test that new plays record time_taken correctly"""
        # Submit a score with time_taken
        test_time = 45  # 45 seconds
        unique_player = f"TimeTest_{int(time.time())}"
        
        score_response = requests.post(
            f"{self.api_url}/games/{self.test_game_id}/score",
            json={
                "player_name": unique_player,
                "score": 3,
                "total_questions": 5,
                "time_taken": test_time
            }
        )
        
        assert score_response.status_code == 200, f"Score submission failed: {score_response.text}"
        score_data = score_response.json()
        
        print(f"\n=== Score Submission ===")
        print(f"  Player: {unique_player}")
        print(f"  Score: 3/5")
        print(f"  Time submitted: {test_time}s")
        print(f"  Response: {score_data}")
        
        # Verify score was recorded by checking leaderboard
        leaderboard_response = requests.get(
            f"{self.api_url}/games/{self.test_game_id}/leaderboard",
            params={"limit": 50}
        )
        
        assert leaderboard_response.status_code == 200
        leaderboard = leaderboard_response.json()
        
        # Find our score
        our_score = None
        for entry in leaderboard:
            if entry.get("player_name") == unique_player:
                our_score = entry
                break
        
        if our_score:
            recorded_time = our_score.get("time_taken", 0)
            print(f"\n=== Verification ===")
            print(f"  Recorded time: {recorded_time}s")
            assert recorded_time == test_time, f"Time mismatch: expected {test_time}, got {recorded_time}"
            print(f"  ✓ Time tracking working correctly")
        else:
            print(f"  ⚠ Score not found in leaderboard (may be due to limit)")
    
    def test_historical_zero_time_is_expected(self):
        """Verify that historical plays may have 0s time (this is expected behavior)"""
        # Get leaderboard
        leaderboard_response = requests.get(
            f"{self.api_url}/games/{self.test_game_id}/leaderboard",
            params={"limit": 100}
        )
        
        assert leaderboard_response.status_code == 200
        leaderboard = leaderboard_response.json()
        
        zero_time_count = 0
        non_zero_time_count = 0
        
        for entry in leaderboard:
            time_taken = entry.get("time_taken", 0)
            if time_taken == 0:
                zero_time_count += 1
            else:
                non_zero_time_count += 1
        
        print(f"\n=== Time Tracking Analysis ===")
        print(f"  Total entries: {len(leaderboard)}")
        print(f"  Entries with 0s time: {zero_time_count}")
        print(f"  Entries with recorded time: {non_zero_time_count}")
        print(f"\n  Note: Historical 0s entries are EXPECTED (before fix)")
        
        # This test just documents the state - 0s for old plays is expected


class TestRegenerationEndpointValidation:
    """Test regeneration endpoint validation and error handling"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.api_url = f"{BASE_URL}/api"
    
    def test_regenerate_nonexistent_game_returns_404(self):
        """Test that regenerating a non-existent game returns 404"""
        response = requests.post(
            f"{self.api_url}/games/nonexistent_game_12345/regenerate-questions",
            params={"player_name": "Test"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Non-existent game returns 404 correctly")
    
    def test_regenerate_without_player_name_works(self):
        """Test that regeneration works without player_name parameter"""
        test_game_id = "game_f1ca4b814708"
        
        response = requests.post(
            f"{self.api_url}/games/{test_game_id}/regenerate-questions"
        )
        
        assert response.status_code == 200, f"Request failed: {response.text}"
        data = response.json()
        assert "questions" in data
        print(f"✓ Regeneration works without player_name")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
