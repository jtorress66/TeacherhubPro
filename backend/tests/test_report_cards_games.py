"""
Test Report Cards and Educational Games Features
Tests:
1. Report Card API endpoint - verify it correctly fetches grades through assignments
2. Educational Games Creator - verify all 8 game types render properly
3. Game creation flow - create a flashcard game and verify it can be played
4. Gradebook to report card flow - add a grade then verify it appears in report card
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@school.edu"
TEST_PASSWORD = "testpassword"
CLASS_ID = "class_d79a6790"
STUDENT_ID = "student_40da2916"
ASSIGNMENT_ID = "assign_df53d246"


class TestAuthentication:
    """Test authentication and get session token"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        # Get session token from cookies
        session_token = response.cookies.get("session_token")
        assert session_token, "No session token in response"
        return session_token
    
    def test_login_success(self, auth_token):
        """Verify login works"""
        assert auth_token is not None
        print(f"✓ Login successful, got token")


class TestReportCards:
    """Test Report Card generation and grade fetching"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_report_card_endpoint_exists(self, auth_session):
        """Test that report card endpoint exists and returns data"""
        response = auth_session.get(
            f"{BASE_URL}/api/report-cards/generate",
            params={
                "student_id": STUDENT_ID,
                "class_id": CLASS_ID
            }
        )
        assert response.status_code == 200, f"Report card endpoint failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "student" in data, "Missing student info in response"
        assert "class" in data, "Missing class info in response"
        assert "grades" in data, "Missing grades in response"
        assert "gpa" in data, "Missing GPA in response"
        assert "attendance" in data, "Missing attendance in response"
        
        print(f"✓ Report card endpoint returns correct structure")
        print(f"  Student: {data['student'].get('name')}")
        print(f"  Class: {data['class'].get('name')}")
        print(f"  Grades count: {len(data['grades'])}")
        print(f"  GPA: {data['gpa']}")
    
    def test_add_grade_and_verify_in_report(self, auth_session):
        """Add a grade via gradebook and verify it appears in report card"""
        # First, add a grade for the student
        grade_data = {
            "assignment_id": ASSIGNMENT_ID,
            "grades": [
                {
                    "student_id": STUDENT_ID,
                    "score": 85.0,
                    "status": "graded",
                    "comment": "Good work!"
                }
            ]
        }
        
        # Submit grade
        response = auth_session.post(
            f"{BASE_URL}/api/grades/bulk",
            json=grade_data
        )
        assert response.status_code == 200, f"Failed to add grade: {response.text}"
        print(f"✓ Grade added successfully")
        
        # Now generate report card and verify grade appears
        response = auth_session.get(
            f"{BASE_URL}/api/report-cards/generate",
            params={
                "student_id": STUDENT_ID,
                "class_id": CLASS_ID
            }
        )
        assert response.status_code == 200, f"Report card failed: {response.text}"
        data = response.json()
        
        # Verify grades are present
        assert len(data["grades"]) > 0, "No grades found in report card after adding grade"
        print(f"✓ Report card shows {len(data['grades'])} grade categories")
        
        # Check that the grade we added is reflected
        total_points = sum(g.get("points_earned", 0) for g in data["grades"])
        assert total_points > 0, "No points earned found in report card"
        print(f"✓ Total points earned: {total_points}")
        print(f"✓ GPA: {data['gpa']}")
        
        return data
    
    def test_report_card_with_invalid_student(self, auth_session):
        """Test report card with invalid student ID"""
        response = auth_session.get(
            f"{BASE_URL}/api/report-cards/generate",
            params={
                "student_id": "invalid_student_id",
                "class_id": CLASS_ID
            }
        )
        assert response.status_code == 404, f"Expected 404 for invalid student, got {response.status_code}"
        print(f"✓ Correctly returns 404 for invalid student")
    
    def test_report_card_with_invalid_class(self, auth_session):
        """Test report card with invalid class ID"""
        response = auth_session.get(
            f"{BASE_URL}/api/report-cards/generate",
            params={
                "student_id": STUDENT_ID,
                "class_id": "invalid_class_id"
            }
        )
        assert response.status_code == 404, f"Expected 404 for invalid class, got {response.status_code}"
        print(f"✓ Correctly returns 404 for invalid class")


class TestEducationalGames:
    """Test Educational Games Creator - all 8 game types"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_games_list_endpoint(self, auth_session):
        """Test that games list endpoint works"""
        response = auth_session.get(f"{BASE_URL}/api/games")
        assert response.status_code == 200, f"Games list failed: {response.text}"
        games = response.json()
        print(f"✓ Games list endpoint works, found {len(games)} games")
    
    def test_generate_quiz_game(self, auth_session):
        """Test generating a quiz game"""
        game_data = {
            "content": "The water cycle includes evaporation, condensation, and precipitation. Water evaporates from oceans and lakes, forms clouds through condensation, and falls as rain or snow.",
            "game_type": "quiz",
            "difficulty": "medium",
            "question_count": 3,
            "language": "en"
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/games/generate",
            json=game_data
        )
        assert response.status_code == 200, f"Quiz generation failed: {response.text}"
        game = response.json()
        
        assert "title" in game, "Missing title in generated game"
        assert "questions" in game, "Missing questions in generated game"
        assert "game_type" in game, "Missing game_type in generated game"
        assert game["game_type"] == "quiz", f"Wrong game type: {game['game_type']}"
        
        # Verify quiz structure - questions should have options
        for q in game["questions"]:
            assert "question" in q or "prompt" in q, f"Question missing text: {q}"
            assert "options" in q or "correct_answer" in q, f"Question missing options/answer: {q}"
        
        print(f"✓ Quiz game generated with {len(game['questions'])} questions")
        return game
    
    def test_generate_flashcards_game(self, auth_session):
        """Test generating a flashcards game"""
        game_data = {
            "content": "Vocabulary: Photosynthesis - the process plants use to convert sunlight to energy. Chlorophyll - green pigment in plants. Glucose - sugar produced by photosynthesis.",
            "game_type": "flashcards",
            "difficulty": "easy",
            "question_count": 3,
            "language": "en"
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/games/generate",
            json=game_data
        )
        assert response.status_code == 200, f"Flashcards generation failed: {response.text}"
        game = response.json()
        
        assert game["game_type"] == "flashcards", f"Wrong game type: {game['game_type']}"
        assert len(game["questions"]) > 0, "No flashcards generated"
        
        # Verify flashcard structure - should have front/back or question/answer
        for card in game["questions"]:
            has_front = "front" in card or "question" in card or "term" in card
            has_back = "back" in card or "correct_answer" in card or "definition" in card
            assert has_front, f"Flashcard missing front/question: {card}"
            assert has_back, f"Flashcard missing back/answer: {card}"
        
        print(f"✓ Flashcards game generated with {len(game['questions'])} cards")
        return game
    
    def test_generate_matching_game(self, auth_session):
        """Test generating a matching game"""
        game_data = {
            "content": "Match the capitals: France - Paris, Germany - Berlin, Italy - Rome, Spain - Madrid",
            "game_type": "matching",
            "difficulty": "medium",
            "question_count": 4,
            "language": "en"
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/games/generate",
            json=game_data
        )
        assert response.status_code == 200, f"Matching generation failed: {response.text}"
        game = response.json()
        
        assert game["game_type"] == "matching", f"Wrong game type: {game['game_type']}"
        assert len(game["questions"]) > 0, "No matching pairs generated"
        
        # Verify matching structure
        for pair in game["questions"]:
            has_left = "question" in pair or "term" in pair or "left" in pair
            has_right = "correct_answer" in pair or "match" in pair or "right" in pair
            assert has_left, f"Matching pair missing left side: {pair}"
            assert has_right, f"Matching pair missing right side: {pair}"
        
        print(f"✓ Matching game generated with {len(game['questions'])} pairs")
        return game
    
    def test_generate_fill_blanks_game(self, auth_session):
        """Test generating a fill-in-the-blanks game"""
        game_data = {
            "content": "The Earth revolves around the Sun. The Moon revolves around the Earth. One year is 365 days.",
            "game_type": "fill_blanks",
            "difficulty": "medium",
            "question_count": 3,
            "language": "en"
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/games/generate",
            json=game_data
        )
        assert response.status_code == 200, f"Fill blanks generation failed: {response.text}"
        game = response.json()
        
        assert game["game_type"] == "fill_blanks", f"Wrong game type: {game['game_type']}"
        assert len(game["questions"]) > 0, "No fill-blank questions generated"
        
        # Verify fill-blank structure
        for q in game["questions"]:
            has_sentence = "question" in q or "sentence" in q
            has_answer = "correct_answer" in q or "answer" in q
            assert has_sentence, f"Fill-blank missing sentence: {q}"
            assert has_answer, f"Fill-blank missing answer: {q}"
        
        print(f"✓ Fill-in-blanks game generated with {len(game['questions'])} questions")
        return game
    
    def test_generate_true_false_game(self, auth_session):
        """Test generating a true/false game"""
        game_data = {
            "content": "Facts about animals: Dogs are mammals. Fish can breathe underwater. Birds have feathers. Snakes are warm-blooded.",
            "game_type": "true_false",
            "difficulty": "easy",
            "question_count": 4,
            "language": "en"
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/games/generate",
            json=game_data
        )
        assert response.status_code == 200, f"True/false generation failed: {response.text}"
        game = response.json()
        
        assert game["game_type"] == "true_false", f"Wrong game type: {game['game_type']}"
        assert len(game["questions"]) > 0, "No true/false questions generated"
        
        # Verify true/false structure - should have options with True/False
        for q in game["questions"]:
            assert "question" in q or "statement" in q, f"T/F missing question: {q}"
            assert "correct_answer" in q or "options" in q, f"T/F missing answer: {q}"
        
        print(f"✓ True/False game generated with {len(game['questions'])} questions")
        return game
    
    def test_generate_word_search_game(self, auth_session):
        """Test generating a word search game"""
        game_data = {
            "content": "Science vocabulary: atom, molecule, element, compound, reaction",
            "game_type": "word_search",
            "difficulty": "medium",
            "question_count": 5,
            "language": "en"
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/games/generate",
            json=game_data
        )
        assert response.status_code == 200, f"Word search generation failed: {response.text}"
        game = response.json()
        
        assert game["game_type"] == "word_search", f"Wrong game type: {game['game_type']}"
        assert len(game["questions"]) > 0, "No words generated for word search"
        
        # Verify word search structure
        for item in game["questions"]:
            has_word = "word" in item or "question" in item or "term" in item
            assert has_word, f"Word search item missing word: {item}"
        
        print(f"✓ Word search game generated with {len(game['questions'])} words")
        return game
    
    def test_generate_crossword_game(self, auth_session):
        """Test generating a crossword game"""
        game_data = {
            "content": "Math terms: Addition means combining numbers. Subtraction means taking away. Multiplication is repeated addition.",
            "game_type": "crossword",
            "difficulty": "medium",
            "question_count": 3,
            "language": "en"
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/games/generate",
            json=game_data
        )
        assert response.status_code == 200, f"Crossword generation failed: {response.text}"
        game = response.json()
        
        assert game["game_type"] == "crossword", f"Wrong game type: {game['game_type']}"
        assert len(game["questions"]) > 0, "No crossword clues generated"
        
        # Verify crossword structure
        for clue in game["questions"]:
            has_clue = "clue" in clue or "question" in clue
            has_answer = "answer" in clue or "correct_answer" in clue
            assert has_clue, f"Crossword missing clue: {clue}"
            assert has_answer, f"Crossword missing answer: {clue}"
        
        print(f"✓ Crossword game generated with {len(game['questions'])} clues")
        return game
    
    def test_generate_drag_drop_game(self, auth_session):
        """Test generating a drag and drop game"""
        game_data = {
            "content": "Sort these into categories - Fruits: apple, banana, orange. Vegetables: carrot, broccoli, spinach.",
            "game_type": "drag_drop",
            "difficulty": "easy",
            "question_count": 3,
            "language": "en"
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/games/generate",
            json=game_data
        )
        assert response.status_code == 200, f"Drag/drop generation failed: {response.text}"
        game = response.json()
        
        assert game["game_type"] == "drag_drop", f"Wrong game type: {game['game_type']}"
        assert len(game["questions"]) > 0, "No drag/drop items generated"
        
        # Verify drag/drop structure
        for item in game["questions"]:
            has_instruction = "instruction" in item or "question" in item
            has_items = "items" in item or "options" in item or "correct_answer" in item
            assert has_instruction or has_items, f"Drag/drop missing content: {item}"
        
        print(f"✓ Drag/drop game generated with {len(game['questions'])} items")
        return game


class TestGameSaveAndPlay:
    """Test saving and playing games"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_save_and_retrieve_game(self, auth_session):
        """Test saving a game and retrieving it"""
        # First generate a game
        game_data = {
            "content": "Test content for saving: The sky is blue. Grass is green. Water is wet.",
            "game_type": "flashcards",
            "difficulty": "easy",
            "question_count": 3,
            "language": "en"
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/games/generate",
            json=game_data
        )
        assert response.status_code == 200, f"Game generation failed: {response.text}"
        generated_game = response.json()
        
        # Save the game
        response = auth_session.post(
            f"{BASE_URL}/api/games/save",
            json=generated_game
        )
        assert response.status_code == 200, f"Game save failed: {response.text}"
        saved_game = response.json()
        
        assert "game_id" in saved_game, "Saved game missing game_id"
        game_id = saved_game["game_id"]
        print(f"✓ Game saved with ID: {game_id}")
        
        # Retrieve games list and verify our game is there
        response = auth_session.get(f"{BASE_URL}/api/games")
        assert response.status_code == 200, f"Games list failed: {response.text}"
        games = response.json()
        
        game_ids = [g["game_id"] for g in games]
        assert game_id in game_ids, f"Saved game not found in games list"
        print(f"✓ Saved game found in games list")
        
        return game_id
    
    def test_game_leaderboard(self, auth_session):
        """Test game leaderboard functionality"""
        # Get games list
        response = auth_session.get(f"{BASE_URL}/api/games")
        assert response.status_code == 200
        games = response.json()
        
        if len(games) == 0:
            pytest.skip("No games available for leaderboard test")
        
        game_id = games[0]["game_id"]
        
        # Submit a score
        score_data = {
            "player_name": "Test Player",
            "score": 3,
            "total_questions": 5,
            "time_taken": 45
        }
        
        response = requests.post(
            f"{BASE_URL}/api/games/{game_id}/score",
            json=score_data
        )
        assert response.status_code == 200, f"Score submission failed: {response.text}"
        print(f"✓ Score submitted successfully")
        
        # Get leaderboard
        response = requests.get(f"{BASE_URL}/api/games/{game_id}/leaderboard")
        assert response.status_code == 200, f"Leaderboard fetch failed: {response.text}"
        leaderboard = response.json()
        
        assert isinstance(leaderboard, list), "Leaderboard should be a list"
        print(f"✓ Leaderboard retrieved with {len(leaderboard)} entries")
    
    def test_game_analytics(self, auth_session):
        """Test game analytics endpoint"""
        response = auth_session.get(f"{BASE_URL}/api/games/analytics")
        assert response.status_code == 200, f"Analytics failed: {response.text}"
        analytics = response.json()
        
        # Verify analytics structure
        assert "total_games" in analytics, "Missing total_games in analytics"
        assert "total_plays" in analytics, "Missing total_plays in analytics"
        
        print(f"✓ Analytics retrieved:")
        print(f"  Total games: {analytics.get('total_games', 0)}")
        print(f"  Total plays: {analytics.get('total_plays', 0)}")
        print(f"  Average score: {analytics.get('average_score', 0)}%")


class TestGradebookIntegration:
    """Test gradebook to report card integration"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_get_assignments(self, auth_session):
        """Test getting assignments for a class"""
        response = auth_session.get(
            f"{BASE_URL}/api/assignments",
            params={"class_id": CLASS_ID}
        )
        assert response.status_code == 200, f"Assignments fetch failed: {response.text}"
        assignments = response.json()
        print(f"✓ Found {len(assignments)} assignments for class")
        return assignments
    
    def test_get_grades(self, auth_session):
        """Test getting grades for an assignment"""
        response = auth_session.get(
            f"{BASE_URL}/api/grades/{ASSIGNMENT_ID}"
        )
        assert response.status_code == 200, f"Grades fetch failed: {response.text}"
        grades = response.json()
        print(f"✓ Found {len(grades)} grades for assignment")
        return grades
    
    def test_full_grade_to_report_flow(self, auth_session):
        """Test complete flow: add grade -> verify in report card"""
        # 1. Add/update a grade
        grade_data = {
            "assignment_id": ASSIGNMENT_ID,
            "grades": [
                {
                    "student_id": STUDENT_ID,
                    "score": 92.0,
                    "status": "graded",
                    "comment": "Excellent work!"
                }
            ]
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/grades/bulk",
            json=grade_data
        )
        assert response.status_code == 200, f"Grade update failed: {response.text}"
        print(f"✓ Grade updated to 92.0")
        
        # 2. Generate report card
        response = auth_session.get(
            f"{BASE_URL}/api/report-cards/generate",
            params={
                "student_id": STUDENT_ID,
                "class_id": CLASS_ID
            }
        )
        assert response.status_code == 200, f"Report card failed: {response.text}"
        report = response.json()
        
        # 3. Verify grade appears in report
        assert len(report["grades"]) > 0, "No grades in report card"
        
        # Find the category with our grade
        found_grade = False
        for grade_cat in report["grades"]:
            if grade_cat.get("points_earned", 0) > 0:
                found_grade = True
                print(f"✓ Found grade in category '{grade_cat['category']}':")
                print(f"  Points: {grade_cat['points_earned']}/{grade_cat['points_possible']}")
                print(f"  Percentage: {grade_cat['percentage']:.1f}%")
        
        assert found_grade, "Grade not found in report card"
        print(f"✓ Overall GPA: {report['gpa']:.2f}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
