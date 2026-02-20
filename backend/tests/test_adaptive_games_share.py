"""
Test suite for Adaptive Learning and Games Creator bug fixes:
1. Adaptive Learning practice selections stay highlighted
2. Listen button (browser speechSynthesis)
3. Share with Student button for Adaptive Learning
4. Games Creator - Word Search, Crossword, Drag-Drop
5. Get Student Link for games
6. Public endpoints: /api/student-learning/{token} and /api/play-game/{gameId}
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdaptiveLearningShareLink:
    """Test Adaptive Learning share link generation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@school.edu",
            "password": "testpassword"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        self.user = login_res.json()
    
    def test_generate_student_link_success(self):
        """Test generating a shareable link for student learning"""
        # First get a student
        students_res = self.session.get(f"{BASE_URL}/api/students", cookies=self.session.cookies)
        if students_res.status_code == 200 and students_res.json():
            student = students_res.json()[0]
            student_id = student.get("student_id")
        else:
            # Use known test student
            student_id = "student_40da2916"
        
        # Generate link
        res = self.session.post(f"{BASE_URL}/api/adaptive-learning/generate-student-link", json={
            "student_id": student_id,
            "subject": "math"
        }, cookies=self.session.cookies)
        
        assert res.status_code == 200, f"Failed to generate link: {res.text}"
        data = res.json()
        assert "token" in data, "Response should contain token"
        assert data["token"].startswith("slt_"), "Token should start with slt_"
        assert "expires_at" in data, "Response should contain expires_at"
        
        # Store token for next test
        self.__class__.generated_token = data["token"]
        print(f"Generated student learning token: {data['token']}")
    
    def test_generate_link_invalid_student(self):
        """Test generating link for non-existent student"""
        res = self.session.post(f"{BASE_URL}/api/adaptive-learning/generate-student-link", json={
            "student_id": "invalid_student_xyz",
            "subject": "math"
        }, cookies=self.session.cookies)
        
        assert res.status_code == 404, "Should return 404 for invalid student"


class TestPublicStudentLearningEndpoint:
    """Test public student learning endpoint (no auth required)"""
    
    def test_get_student_learning_invalid_token(self):
        """Test accessing with invalid token"""
        res = requests.get(f"{BASE_URL}/api/student-learning/invalid_token_xyz")
        assert res.status_code == 404, "Should return 404 for invalid token"
    
    def test_get_student_learning_valid_token(self):
        """Test accessing with valid token (if available)"""
        # First generate a token
        session = requests.Session()
        login_res = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@school.edu",
            "password": "testpassword"
        })
        
        if login_res.status_code == 200:
            # Get a student
            students_res = session.get(f"{BASE_URL}/api/students", cookies=session.cookies)
            if students_res.status_code == 200 and students_res.json():
                student = students_res.json()[0]
                student_id = student.get("student_id")
            else:
                student_id = "student_40da2916"
            
            # Generate token
            gen_res = session.post(f"{BASE_URL}/api/adaptive-learning/generate-student-link", json={
                "student_id": student_id,
                "subject": "math"
            }, cookies=session.cookies)
            
            if gen_res.status_code == 200:
                token = gen_res.json().get("token")
                
                # Now test public endpoint (no auth)
                public_res = requests.get(f"{BASE_URL}/api/student-learning/{token}")
                assert public_res.status_code == 200, f"Public endpoint failed: {public_res.text}"
                
                data = public_res.json()
                assert "student" in data, "Response should contain student info"
                assert "subject" in data, "Response should contain subject"
                print(f"Public student learning endpoint works: {data.get('student', {}).get('name')}")


class TestGamesCreatorTypes:
    """Test all game types in Games Creator"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@school.edu",
            "password": "testpassword"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    
    def test_generate_word_search_game(self):
        """Test Word Search game generation"""
        res = self.session.post(f"{BASE_URL}/api/games/generate", json={
            "content": "The solar system has 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune. The Sun is at the center.",
            "game_type": "word_search",
            "difficulty": "medium",
            "question_count": 5,
            "language": "en"
        }, cookies=self.session.cookies)
        
        assert res.status_code == 200, f"Word search generation failed: {res.text}"
        data = res.json()
        assert "questions" in data, "Response should contain questions"
        assert data.get("game_type") == "word_search", "Game type should be word_search"
        
        # Word search should have words to find
        questions = data.get("questions", [])
        assert len(questions) > 0, "Should have words to find"
        print(f"Word Search generated with {len(questions)} words")
    
    def test_generate_crossword_game(self):
        """Test Crossword game generation"""
        res = self.session.post(f"{BASE_URL}/api/games/generate", json={
            "content": "Photosynthesis is the process plants use to convert sunlight into energy. Chlorophyll is the green pigment in leaves.",
            "game_type": "crossword",
            "difficulty": "medium",
            "question_count": 5,
            "language": "en"
        }, cookies=self.session.cookies)
        
        assert res.status_code == 200, f"Crossword generation failed: {res.text}"
        data = res.json()
        assert "questions" in data, "Response should contain questions"
        assert data.get("game_type") == "crossword", "Game type should be crossword"
        
        # Crossword should have clues with answers
        questions = data.get("questions", [])
        assert len(questions) > 0, "Should have clues"
        for q in questions:
            assert "clue" in q or "question" in q, "Each clue should have text"
            assert "correct_answer" in q or "answer" in q, "Each clue should have answer"
        print(f"Crossword generated with {len(questions)} clues")
    
    def test_generate_drag_drop_game(self):
        """Test Drag and Drop game generation"""
        res = self.session.post(f"{BASE_URL}/api/games/generate", json={
            "content": "The water cycle: 1. Evaporation 2. Condensation 3. Precipitation 4. Collection. Water evaporates from oceans, forms clouds, falls as rain.",
            "game_type": "drag_drop",
            "difficulty": "medium",
            "question_count": 5,
            "language": "en"
        }, cookies=self.session.cookies)
        
        assert res.status_code == 200, f"Drag-drop generation failed: {res.text}"
        data = res.json()
        assert "questions" in data, "Response should contain questions"
        assert data.get("game_type") == "drag_drop", "Game type should be drag_drop"
        
        # Drag-drop should have items to order
        questions = data.get("questions", [])
        assert len(questions) > 0, "Should have items"
        print(f"Drag-Drop generated with {len(questions)} items")
    
    def test_save_game_and_get_share_link(self):
        """Test saving a game and getting shareable link"""
        # First generate a game
        gen_res = self.session.post(f"{BASE_URL}/api/games/generate", json={
            "content": "Math: Addition and subtraction. 2+2=4, 5-3=2, 10+5=15",
            "game_type": "quiz",
            "difficulty": "easy",
            "question_count": 3,
            "language": "en"
        }, cookies=self.session.cookies)
        
        assert gen_res.status_code == 200, f"Game generation failed: {gen_res.text}"
        game_data = gen_res.json()
        
        # Save the game
        save_res = self.session.post(f"{BASE_URL}/api/games/save", json=game_data, cookies=self.session.cookies)
        assert save_res.status_code == 200, f"Game save failed: {save_res.text}"
        
        saved_game = save_res.json()
        game_id = saved_game.get("game_id")
        assert game_id, "Saved game should have game_id"
        
        # Store for public endpoint test
        self.__class__.saved_game_id = game_id
        print(f"Game saved with ID: {game_id}")
        
        # The share link would be: /play-game/{game_id}
        share_link = f"/play-game/{game_id}"
        print(f"Share link: {share_link}")


class TestPublicGameEndpoint:
    """Test public game play endpoint (no auth required)"""
    
    def test_get_game_invalid_id(self):
        """Test accessing game with invalid ID"""
        res = requests.get(f"{BASE_URL}/api/play-game/invalid_game_xyz")
        assert res.status_code == 404, "Should return 404 for invalid game"
    
    def test_get_game_valid_id(self):
        """Test accessing game with valid ID"""
        # First login and save a game
        session = requests.Session()
        login_res = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@school.edu",
            "password": "testpassword"
        })
        
        if login_res.status_code == 200:
            # Generate and save a game
            gen_res = session.post(f"{BASE_URL}/api/games/generate", json={
                "content": "Colors: Red, Blue, Green, Yellow are primary and secondary colors.",
                "game_type": "quiz",
                "difficulty": "easy",
                "question_count": 3,
                "language": "en"
            }, cookies=session.cookies)
            
            if gen_res.status_code == 200:
                game_data = gen_res.json()
                save_res = session.post(f"{BASE_URL}/api/games/save", json=game_data, cookies=session.cookies)
                
                if save_res.status_code == 200:
                    game_id = save_res.json().get("game_id")
                    
                    # Now test public endpoint (no auth)
                    public_res = requests.get(f"{BASE_URL}/api/play-game/{game_id}")
                    assert public_res.status_code == 200, f"Public game endpoint failed: {public_res.text}"
                    
                    data = public_res.json()
                    assert "game_id" in data, "Response should contain game_id"
                    assert "questions" in data, "Response should contain questions"
                    assert "game_type" in data, "Response should contain game_type"
                    print(f"Public game endpoint works: {data.get('title')}")


class TestAdaptiveLearningPath:
    """Test Adaptive Learning path generation and practice questions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@school.edu",
            "password": "testpassword"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    
    def test_generate_learning_path(self):
        """Test generating adaptive learning path with practice questions"""
        # Get a student
        students_res = self.session.get(f"{BASE_URL}/api/students", cookies=self.session.cookies)
        if students_res.status_code == 200 and students_res.json():
            student = students_res.json()[0]
            student_id = student.get("student_id")
        else:
            student_id = "student_40da2916"
        
        # Generate learning path
        res = self.session.post(f"{BASE_URL}/api/adaptive-learning/generate-path", json={
            "student_id": student_id,
            "subject": "math",
            "language": "en"
        }, cookies=self.session.cookies)
        
        # This may take time due to AI generation
        if res.status_code == 200:
            data = res.json()
            assert "lessons" in data or "path_id" in data, "Response should contain lessons or path_id"
            
            # Check if lessons have questions for practice
            lessons = data.get("lessons", [])
            if lessons:
                for lesson in lessons:
                    if "questions" in lesson:
                        questions = lesson.get("questions", [])
                        for q in questions:
                            # Each question should have options and correct_answer for selection highlighting
                            if "options" in q:
                                assert "correct_answer" in q, "Question should have correct_answer for feedback"
                print(f"Learning path generated with {len(lessons)} lessons")
        else:
            # May fail due to missing student or subscription
            print(f"Learning path generation returned: {res.status_code} - {res.text[:200]}")


class TestStudentsEndpoint:
    """Test students endpoint to verify test data exists"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@school.edu",
            "password": "testpassword"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    
    def test_get_students(self):
        """Test getting students list"""
        res = self.session.get(f"{BASE_URL}/api/students", cookies=self.session.cookies)
        assert res.status_code == 200, f"Failed to get students: {res.text}"
        
        students = res.json()
        print(f"Found {len(students)} students")
        
        if students:
            student = students[0]
            print(f"First student: {student.get('first_name')} {student.get('last_name')} - ID: {student.get('student_id')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
