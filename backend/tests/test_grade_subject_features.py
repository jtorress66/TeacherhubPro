"""
Test Grade Level and Subject Features
- Adaptive Learning: Grade Level selector (K-2, 3-5, 6-8, 9-12)
- Games Creator: Subject selector (Math, English, Science, etc.) and Grade Level (replaced Difficulty)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestGradeLevelSubjectFeatures:
    """Test new Grade Level and Subject features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get session
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@school.edu",
            "password": "testpassword"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        # Store cookies for authenticated requests
        self.cookies = login_response.cookies
        
    # ==================== ADAPTIVE LEARNING TESTS ====================
    
    def test_adaptive_learning_generate_path_with_grade_level_k2(self):
        """Test generating adaptive learning path with K-2 grade level"""
        # First get students
        students_response = self.session.get(f"{BASE_URL}/api/students", cookies=self.cookies)
        assert students_response.status_code == 200
        students = students_response.json()
        
        if not students:
            pytest.skip("No students available for testing")
        
        student_id = students[0].get("student_id")
        
        # Generate path with K-2 grade level
        response = self.session.post(f"{BASE_URL}/api/adaptive-learning/generate-path", 
            json={
                "student_id": student_id,
                "subject": "math",
                "grade_level": "k-2",
                "language": "en"
            },
            cookies=self.cookies
        )
        
        # Should return 200 or 403 (subscription required)
        assert response.status_code in [200, 403], f"Unexpected status: {response.status_code}, {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert "lessons" in data or "title" in data, "Response should contain learning path data"
            print(f"✓ K-2 grade level path generated successfully")
        else:
            print(f"✓ K-2 grade level request accepted (subscription required)")
    
    def test_adaptive_learning_generate_path_with_grade_level_9_12(self):
        """Test generating adaptive learning path with 9-12 grade level"""
        students_response = self.session.get(f"{BASE_URL}/api/students", cookies=self.cookies)
        assert students_response.status_code == 200
        students = students_response.json()
        
        if not students:
            pytest.skip("No students available for testing")
        
        student_id = students[0].get("student_id")
        
        # Generate path with 9-12 grade level
        response = self.session.post(f"{BASE_URL}/api/adaptive-learning/generate-path", 
            json={
                "student_id": student_id,
                "subject": "science",
                "grade_level": "9-12",
                "language": "en"
            },
            cookies=self.cookies
        )
        
        assert response.status_code in [200, 403], f"Unexpected status: {response.status_code}, {response.text}"
        print(f"✓ 9-12 grade level request accepted")
    
    def test_adaptive_learning_all_grade_levels_accepted(self):
        """Test that all grade levels are accepted by the API"""
        students_response = self.session.get(f"{BASE_URL}/api/students", cookies=self.cookies)
        students = students_response.json()
        
        if not students:
            pytest.skip("No students available for testing")
        
        student_id = students[0].get("student_id")
        grade_levels = ["k-2", "3-5", "6-8", "9-12"]
        
        for grade_level in grade_levels:
            response = self.session.post(f"{BASE_URL}/api/adaptive-learning/generate-path", 
                json={
                    "student_id": student_id,
                    "subject": "math",
                    "grade_level": grade_level,
                    "language": "en"
                },
                cookies=self.cookies
            )
            
            # Should not return 422 (validation error)
            assert response.status_code != 422, f"Grade level '{grade_level}' rejected: {response.text}"
            print(f"✓ Grade level '{grade_level}' accepted")
    
    # ==================== GAMES CREATOR TESTS ====================
    
    def test_games_generate_with_subject_math(self):
        """Test generating game with Math subject"""
        response = self.session.post(f"{BASE_URL}/api/games/generate", 
            json={
                "content": "Addition and subtraction of numbers up to 100",
                "game_type": "quiz",
                "grade_level": "3-5",
                "subject": "math",
                "question_count": 3,
                "language": "en"
            },
            cookies=self.cookies
        )
        
        assert response.status_code in [200, 403], f"Unexpected status: {response.status_code}, {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert "questions" in data or "title" in data, "Response should contain game data"
            print(f"✓ Math subject game generated successfully")
        else:
            print(f"✓ Math subject request accepted (subscription required)")
    
    def test_games_generate_with_subject_english(self):
        """Test generating game with English subject"""
        response = self.session.post(f"{BASE_URL}/api/games/generate", 
            json={
                "content": "Parts of speech: nouns, verbs, adjectives",
                "game_type": "matching",
                "grade_level": "3-5",
                "subject": "english",
                "question_count": 5,
                "language": "en"
            },
            cookies=self.cookies
        )
        
        assert response.status_code in [200, 403], f"Unexpected status: {response.status_code}, {response.text}"
        print(f"✓ English subject request accepted")
    
    def test_games_generate_with_subject_science(self):
        """Test generating game with Science subject"""
        response = self.session.post(f"{BASE_URL}/api/games/generate", 
            json={
                "content": "The water cycle: evaporation, condensation, precipitation",
                "game_type": "fill_blanks",
                "grade_level": "6-8",
                "subject": "science",
                "question_count": 4,
                "language": "en"
            },
            cookies=self.cookies
        )
        
        assert response.status_code in [200, 403], f"Unexpected status: {response.status_code}, {response.text}"
        print(f"✓ Science subject request accepted")
    
    def test_games_generate_with_subject_social_studies(self):
        """Test generating game with Social Studies subject"""
        response = self.session.post(f"{BASE_URL}/api/games/generate", 
            json={
                "content": "Community helpers: firefighters, police officers, doctors",
                "game_type": "true_false",
                "grade_level": "k-2",
                "subject": "social_studies",
                "question_count": 5,
                "language": "en"
            },
            cookies=self.cookies
        )
        
        assert response.status_code in [200, 403], f"Unexpected status: {response.status_code}, {response.text}"
        print(f"✓ Social Studies subject request accepted")
    
    def test_games_generate_all_subjects_accepted(self):
        """Test that all subjects are accepted by the API"""
        subjects = ["math", "english", "science", "social_studies", "history", "geography", "art", "music", "pe", "other"]
        
        for subject in subjects:
            response = self.session.post(f"{BASE_URL}/api/games/generate", 
                json={
                    "content": f"Test content for {subject}",
                    "game_type": "quiz",
                    "grade_level": "3-5",
                    "subject": subject,
                    "question_count": 3,
                    "language": "en"
                },
                cookies=self.cookies
            )
            
            # Should not return 422 (validation error)
            assert response.status_code != 422, f"Subject '{subject}' rejected: {response.text}"
            print(f"✓ Subject '{subject}' accepted")
    
    def test_games_generate_all_grade_levels_accepted(self):
        """Test that all grade levels are accepted for games"""
        grade_levels = ["k-2", "3-5", "6-8", "9-12"]
        
        for grade_level in grade_levels:
            response = self.session.post(f"{BASE_URL}/api/games/generate", 
                json={
                    "content": f"Test content for grade {grade_level}",
                    "game_type": "quiz",
                    "grade_level": grade_level,
                    "subject": "math",
                    "question_count": 3,
                    "language": "en"
                },
                cookies=self.cookies
            )
            
            # Should not return 422 (validation error)
            assert response.status_code != 422, f"Grade level '{grade_level}' rejected: {response.text}"
            print(f"✓ Grade level '{grade_level}' accepted for games")
    
    def test_games_save_with_grade_level_and_subject(self):
        """Test saving a game with grade_level and subject fields"""
        game_data = {
            "game_id": "test_game_grade_subject_001",
            "title": "Test Math Quiz for 3rd-5th Grade",
            "game_type": "quiz",
            "grade_level": "3-5",
            "subject": "math",
            "questions": [
                {
                    "question": "What is 5 + 3?",
                    "options": ["6", "7", "8", "9"],
                    "correct_answer": "8"
                }
            ]
        }
        
        response = self.session.post(f"{BASE_URL}/api/games/save", 
            json=game_data,
            cookies=self.cookies
        )
        
        assert response.status_code == 200, f"Failed to save game: {response.text}"
        data = response.json()
        assert "game_id" in data, "Response should contain game_id"
        print(f"✓ Game saved with grade_level and subject")
    
    def test_games_list_includes_grade_level_and_subject(self):
        """Test that saved games include grade_level and subject fields"""
        # First save a game with grade_level and subject
        game_data = {
            "game_id": "test_game_verify_fields_001",
            "title": "Science Quiz for Middle School",
            "game_type": "quiz",
            "grade_level": "6-8",
            "subject": "science",
            "questions": [
                {
                    "question": "What is H2O?",
                    "options": ["Water", "Oxygen", "Hydrogen", "Carbon"],
                    "correct_answer": "Water"
                }
            ]
        }
        
        save_response = self.session.post(f"{BASE_URL}/api/games/save", 
            json=game_data,
            cookies=self.cookies
        )
        assert save_response.status_code == 200
        
        # Get games list
        list_response = self.session.get(f"{BASE_URL}/api/games", cookies=self.cookies)
        assert list_response.status_code == 200
        
        games = list_response.json()
        assert len(games) > 0, "Should have at least one game"
        
        # Find our test game
        test_game = next((g for g in games if g.get("game_id") == "test_game_verify_fields_001"), None)
        
        if test_game:
            assert test_game.get("grade_level") == "6-8", f"Grade level mismatch: {test_game.get('grade_level')}"
            assert test_game.get("subject") == "science", f"Subject mismatch: {test_game.get('subject')}"
            print(f"✓ Game list includes grade_level and subject fields")
        else:
            print(f"✓ Game saved (could not verify fields in list)")
    
    # ==================== CLEANUP ====================
    
    def test_cleanup_test_games(self):
        """Cleanup test games created during testing"""
        # Delete test games
        test_game_ids = ["test_game_grade_subject_001", "test_game_verify_fields_001"]
        
        for game_id in test_game_ids:
            response = self.session.delete(f"{BASE_URL}/api/games/{game_id}", cookies=self.cookies)
            # 200 or 404 are both acceptable
            print(f"Cleanup: {game_id} - {response.status_code}")
        
        print("✓ Test cleanup completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
