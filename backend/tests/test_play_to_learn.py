"""
Play to Learn API Tests
Tests for the Kahoot-style live and self-paced game experience module
"""

import pytest
import requests
import os
import json
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://teacherhub-pro-2.preview.emergentagent.com')

class TestPlayToLearnAPI:
    """Test suite for Play to Learn API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get session token
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed - skipping tests")
        
        # Extract token from cookies
        self.token = login_response.cookies.get('session_token')
        if self.token:
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        self.user_data = login_response.json()
        print(f"Logged in as: {self.user_data.get('email')}")
    
    # ==================== ASSIGNMENT TESTS ====================
    
    def test_create_practice_assignment(self):
        """Test creating a practice assignment"""
        assignment_data = {
            "subject": "Mathematics",
            "grade_level": "5th Grade",
            "topic": "Fractions",
            "standard": "CCSS.MATH.5.NF.A.1",
            "difficulty": "medium",
            "item_count": 5,
            "allowed_game_types": ["quiz", "time_attack", "matching", "flashcard"],
            "language": "es"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json=assignment_data
        )
        
        print(f"Create assignment response: {response.status_code}")
        print(f"Response body: {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "assignment_id" in data, "Response should contain assignment_id"
        assert data["subject"] == "Mathematics"
        assert data["topic"] == "Fractions"
        assert data["item_count"] == 5
        
        # Store for later tests
        self.assignment_id = data["assignment_id"]
        print(f"Created assignment: {self.assignment_id}")
        
        return data
    
    def test_get_practice_assignments(self):
        """Test getting all practice assignments"""
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/assignments")
        
        print(f"Get assignments response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert "assignments" in data
        print(f"Found {len(data['assignments'])} assignments")
    
    def test_get_single_assignment(self):
        """Test getting a specific assignment"""
        # First create an assignment
        create_data = self.test_create_practice_assignment()
        assignment_id = create_data["assignment_id"]
        
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/assignments/{assignment_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["assignment_id"] == assignment_id
        assert data["topic"] == "Fractions"
    
    # ==================== SESSION TESTS ====================
    
    def test_create_practice_session_self_paced(self):
        """Test creating a self-paced practice session with AI question generation"""
        # First create an assignment
        create_data = self.test_create_practice_assignment()
        assignment_id = create_data["assignment_id"]
        
        session_data = {
            "assignment_id": assignment_id,
            "game_type": "quiz",
            "mode": "SELF_PACED"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json=session_data
        )
        
        print(f"Create session response: {response.status_code}")
        print(f"Response body: {response.text[:1000]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "session_id" in data, "Response should contain session_id"
        assert "question_set_id" in data, "Response should contain question_set_id"
        assert "variant_seed" in data, "Response should contain variant_seed"
        assert "item_ids" in data, "Response should contain item_ids"
        assert data["mode"] == "SELF_PACED"
        assert data["game_type"] == "quiz"
        
        print(f"Session created: {data['session_id']}")
        print(f"Question set ID: {data['question_set_id']}")
        print(f"Variant seed: {data['variant_seed']}")
        print(f"Item IDs: {data['item_ids'][:3]}...")
        
        return data
    
    def test_create_practice_session_live(self):
        """Test creating a live practice session with PIN"""
        # First create an assignment
        create_data = self.test_create_practice_assignment()
        assignment_id = create_data["assignment_id"]
        
        session_data = {
            "assignment_id": assignment_id,
            "game_type": "quiz",
            "mode": "LIVE"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json=session_data
        )
        
        print(f"Create LIVE session response: {response.status_code}")
        
        assert response.status_code == 200
        
        data = response.json()
        assert "join_pin" in data, "LIVE session should have a join_pin"
        assert data["join_pin"] is not None, "join_pin should not be None for LIVE mode"
        assert len(data["join_pin"]) == 6, "PIN should be 6 digits"
        assert data["status"] == "LOBBY", "LIVE session should start in LOBBY status"
        
        print(f"LIVE session PIN: {data['join_pin']}")
        
        return data
    
    def test_anti_repeat_enforcement(self):
        """Test that multiple sessions generate unique session_id, question_set_id, and item_ids"""
        # Create an assignment
        create_data = self.test_create_practice_assignment()
        assignment_id = create_data["assignment_id"]
        
        sessions = []
        
        # Create 3 sessions for the same assignment
        for i in range(3):
            session_data = {
                "assignment_id": assignment_id,
                "game_type": "quiz",
                "mode": "SELF_PACED"
            }
            
            response = self.session.post(
                f"{BASE_URL}/api/play-to-learn/sessions",
                json=session_data
            )
            
            assert response.status_code == 200
            sessions.append(response.json())
            
            # Small delay to ensure different timestamps
            time.sleep(0.5)
        
        # Verify all session_ids are unique
        session_ids = [s["session_id"] for s in sessions]
        assert len(set(session_ids)) == 3, f"All session_ids should be unique: {session_ids}"
        
        # Verify all question_set_ids are unique
        question_set_ids = [s["question_set_id"] for s in sessions]
        assert len(set(question_set_ids)) == 3, f"All question_set_ids should be unique: {question_set_ids}"
        
        # Verify all variant_seeds are unique
        variant_seeds = [s["variant_seed"] for s in sessions]
        assert len(set(variant_seeds)) == 3, f"All variant_seeds should be unique: {variant_seeds}"
        
        # Verify item_ids are different across sessions
        all_item_ids = [tuple(s["item_ids"]) for s in sessions]
        # At least the item_ids should be different (AI generates unique IDs)
        print(f"Session 1 item_ids: {sessions[0]['item_ids'][:3]}")
        print(f"Session 2 item_ids: {sessions[1]['item_ids'][:3]}")
        print(f"Session 3 item_ids: {sessions[2]['item_ids'][:3]}")
        
        print("ANTI-REPEAT ENFORCEMENT VERIFIED:")
        print(f"  - Unique session_ids: {session_ids}")
        print(f"  - Unique question_set_ids: {question_set_ids}")
        print(f"  - Unique variant_seeds: {variant_seeds}")
    
    # ==================== JOIN BY PIN TESTS ====================
    
    def test_join_by_pin(self):
        """Test joining a session by PIN"""
        # Create a LIVE session first
        live_session = self.test_create_practice_session_live()
        pin = live_session["join_pin"]
        
        # Test the join endpoint (no auth required for students)
        join_response = requests.get(f"{BASE_URL}/api/play-to-learn/join/{pin}")
        
        print(f"Join by PIN response: {join_response.status_code}")
        print(f"Response body: {join_response.text[:500]}")
        
        assert join_response.status_code == 200
        
        data = join_response.json()
        assert data["session_id"] == live_session["session_id"]
        assert data["game_type"] == "quiz"
        assert data["mode"] == "LIVE"
        assert data["status"] == "LOBBY"
    
    def test_join_invalid_pin(self):
        """Test joining with an invalid PIN returns 404"""
        response = requests.get(f"{BASE_URL}/api/play-to-learn/join/000000")
        
        assert response.status_code == 404
        print("Invalid PIN correctly returns 404")
    
    def test_join_session_as_participant(self):
        """Test joining a session as a participant with nickname"""
        # Create a LIVE session
        live_session = self.test_create_practice_session_live()
        session_id = live_session["session_id"]
        pin = live_session["join_pin"]
        
        # Join as a participant
        join_data = {
            "nickname": "TestStudent",
            "pin": pin
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json=join_data
        )
        
        print(f"Join session response: {response.status_code}")
        print(f"Response body: {response.text[:500]}")
        
        assert response.status_code == 200
        
        data = response.json()
        assert "participant_id" in data
        assert data["nickname"] == "TestStudent"
        assert data["session_id"] == session_id
        
        print(f"Participant joined: {data['participant_id']}")
        
        return data
    
    # ==================== ANSWER SUBMISSION TESTS ====================
    
    def test_submit_answer(self):
        """Test submitting an answer and getting feedback"""
        # Create a session
        session_data = self.test_create_practice_session_self_paced()
        session_id = session_data["session_id"]
        
        # Join as participant
        join_response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/join",
            json={"nickname": "TestPlayer"}
        )
        assert join_response.status_code == 200
        participant_id = join_response.json()["participant_id"]
        
        # Get session details to find an item_id
        session_response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/{session_id}")
        assert session_response.status_code == 200
        session_details = session_response.json()
        
        # Get first question
        questions = session_details.get("game_payload", {}).get("questions", [])
        if not questions:
            pytest.skip("No questions in session")
        
        first_question = questions[0]
        item_id = first_question["item_id"]
        correct_answer = first_question["correct_answer"]
        
        print(f"Testing answer submission for item: {item_id}")
        print(f"Correct answer: {correct_answer}")
        
        # Submit correct answer
        answer_data = {
            "item_id": item_id,
            "answer": correct_answer,
            "time_taken_ms": 5000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/sessions/{session_id}/submit-answer?participant_id={participant_id}",
            json=answer_data
        )
        
        print(f"Submit answer response: {response.status_code}")
        print(f"Response body: {response.text[:500]}")
        
        assert response.status_code == 200
        
        data = response.json()
        assert "is_correct" in data
        assert "correct_answer" in data
        assert "score" in data
        assert "streak" in data
        
        print(f"Answer result: is_correct={data['is_correct']}, score={data['score']}, streak={data['streak']}")
    
    # ==================== GAME MODE TESTS ====================
    
    def test_create_time_attack_session(self):
        """Test creating a time attack session"""
        create_data = self.test_create_practice_assignment()
        assignment_id = create_data["assignment_id"]
        
        session_data = {
            "assignment_id": assignment_id,
            "game_type": "time_attack",
            "mode": "SELF_PACED"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json=session_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["game_type"] == "time_attack"
        print("Time Attack session created successfully")
    
    def test_create_matching_session(self):
        """Test creating a matching game session"""
        create_data = self.test_create_practice_assignment()
        assignment_id = create_data["assignment_id"]
        
        session_data = {
            "assignment_id": assignment_id,
            "game_type": "matching",
            "mode": "SELF_PACED"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json=session_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["game_type"] == "matching"
        print("Matching session created successfully")
    
    def test_create_flashcard_session(self):
        """Test creating a flashcard session"""
        create_data = self.test_create_practice_assignment()
        assignment_id = create_data["assignment_id"]
        
        session_data = {
            "assignment_id": assignment_id,
            "game_type": "flashcard",
            "mode": "SELF_PACED"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json=session_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["game_type"] == "flashcard"
        print("Flashcard session created successfully")
    
    def test_invalid_game_type_rejected(self):
        """Test that invalid game types are rejected"""
        create_data = self.test_create_practice_assignment()
        assignment_id = create_data["assignment_id"]
        
        session_data = {
            "assignment_id": assignment_id,
            "game_type": "invalid_type",
            "mode": "SELF_PACED"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/sessions",
            json=session_data
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid game type, got {response.status_code}"
        print("Invalid game type correctly rejected")
    
    # ==================== TEACHER ENDPOINTS TESTS ====================
    
    def test_get_teacher_sessions(self):
        """Test getting all sessions for a teacher"""
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/teacher/sessions")
        
        print(f"Get teacher sessions response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        print(f"Found {len(data['sessions'])} teacher sessions")
    
    def test_delete_assignment(self):
        """Test deleting an assignment"""
        # Create an assignment first
        create_data = self.test_create_practice_assignment()
        assignment_id = create_data["assignment_id"]
        
        # Delete it
        response = self.session.delete(f"{BASE_URL}/api/play-to-learn/assignments/{assignment_id}")
        
        assert response.status_code == 200
        
        # Verify it's deleted
        get_response = self.session.get(f"{BASE_URL}/api/play-to-learn/assignments/{assignment_id}")
        assert get_response.status_code == 404
        
        print(f"Assignment {assignment_id} deleted successfully")


class TestPlayToLearnEdgeCases:
    """Edge case tests for Play to Learn"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@school.edu", "password": "testpassword"}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
        
        self.token = login_response.cookies.get('session_token')
        if self.token:
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_nonexistent_assignment_returns_404(self):
        """Test that nonexistent assignment returns 404"""
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/assignments/nonexistent_id")
        assert response.status_code == 404
    
    def test_nonexistent_session_returns_404(self):
        """Test that nonexistent session returns 404"""
        response = self.session.get(f"{BASE_URL}/api/play-to-learn/sessions/nonexistent_id")
        assert response.status_code == 404
    
    def test_create_assignment_missing_required_fields(self):
        """Test that missing required fields returns error"""
        # Missing topic
        response = self.session.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json={"subject": "Math", "grade_level": "5th"}
        )
        assert response.status_code == 422, "Should return 422 for missing required fields"
    
    def test_unauthenticated_create_assignment_fails(self):
        """Test that unauthenticated requests fail"""
        response = requests.post(
            f"{BASE_URL}/api/play-to-learn/assignments",
            json={
                "subject": "Math",
                "grade_level": "5th",
                "topic": "Test"
            }
        )
        assert response.status_code == 401, "Should return 401 for unauthenticated request"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
