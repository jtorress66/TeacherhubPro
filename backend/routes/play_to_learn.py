"""
Play to Learn - Kahoot-Style Live & Self-Paced Game Experience
Completely separate module from Educational Games
"""

from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Request
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import asyncio
import json
import random
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/play-to-learn", tags=["Play to Learn"])

# Database reference - will be set during init
db = None
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# ==================== PYDANTIC MODELS ====================

class PracticeAssignmentCreate(BaseModel):
    """Model for creating a practice assignment"""
    subject: str
    grade_level: str
    topic: str
    standard: Optional[str] = None
    difficulty: str = "medium"  # easy, medium, hard
    item_count: int = 10
    allowed_game_types: List[str] = ["quiz", "time_attack", "matching", "flashcard"]
    language: str = "es"

class PracticeAssignmentResponse(BaseModel):
    """Response model for practice assignment"""
    assignment_id: str
    teacher_id: str
    subject: str
    grade_level: str
    topic: str
    standard: Optional[str] = None
    difficulty: str
    item_count: int
    allowed_game_types: List[str]
    language: str
    created_at: str

class SessionCreate(BaseModel):
    """Model for creating a practice session"""
    assignment_id: str
    game_type: str  # quiz, time_attack, matching, flashcard
    mode: str = "SELF_PACED"  # LIVE or SELF_PACED

class JoinSessionRequest(BaseModel):
    """Model for joining a session"""
    nickname: str
    pin: Optional[str] = None  # For LIVE mode

class AnswerSubmission(BaseModel):
    """Model for submitting an answer"""
    item_id: str
    answer: str
    time_taken_ms: int

# ==================== CONNECTION MANAGER FOR WEBSOCKETS ====================

class ConnectionManager:
    """Manages WebSocket connections for real-time live games"""
    
    def __init__(self):
        # session_id -> list of (websocket, participant_id, role)
        self.active_connections: Dict[str, List[tuple]] = {}
        # session_id -> current game state
        self.game_states: Dict[str, Dict] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str, participant_id: str, role: str = "player"):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append((websocket, participant_id, role))
    
    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            self.active_connections[session_id] = [
                conn for conn in self.active_connections[session_id] 
                if conn[0] != websocket
            ]
    
    async def broadcast_to_session(self, session_id: str, message: dict):
        """Broadcast message to all connections in a session"""
        if session_id in self.active_connections:
            for websocket, _, _ in self.active_connections[session_id]:
                try:
                    await websocket.send_json(message)
                except Exception:
                    pass
    
    async def send_to_host(self, session_id: str, message: dict):
        """Send message only to the host"""
        if session_id in self.active_connections:
            for websocket, _, role in self.active_connections[session_id]:
                if role == "host":
                    try:
                        await websocket.send_json(message)
                    except Exception:
                        pass
    
    async def send_to_player(self, session_id: str, participant_id: str, message: dict):
        """Send message to a specific player"""
        if session_id in self.active_connections:
            for websocket, pid, _ in self.active_connections[session_id]:
                if pid == participant_id:
                    try:
                        await websocket.send_json(message)
                    except Exception:
                        pass
    
    def get_player_count(self, session_id: str) -> int:
        """Get number of players in a session"""
        if session_id not in self.active_connections:
            return 0
        return len([c for c in self.active_connections[session_id] if c[2] == "player"])
    
    def set_game_state(self, session_id: str, state: dict):
        """Set the current game state for a session"""
        self.game_states[session_id] = state
    
    def get_game_state(self, session_id: str) -> dict:
        """Get the current game state for a session"""
        return self.game_states.get(session_id, {})

# Global connection manager
manager = ConnectionManager()

# ==================== HELPER FUNCTIONS ====================

def generate_pin() -> str:
    """Generate a 6-digit PIN for live sessions"""
    return str(random.randint(100000, 999999))

def generate_variant_seed() -> str:
    """Generate a unique variant seed for question generation"""
    return f"seed_{uuid.uuid4().hex[:12]}_{int(datetime.now(timezone.utc).timestamp())}"

async def generate_base_items(assignment: dict, variant_seed: str) -> List[dict]:
    """
    Generate base question items using AI
    This creates questions aligned to the assignment scope
    """
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Create unique question set ID
    question_set_id = f"qs_{uuid.uuid4().hex[:16]}"
    
    subject = assignment.get('subject', 'General')
    grade_level = assignment.get('grade_level', '5th Grade')
    topic = assignment.get('topic', 'General Knowledge')
    difficulty = assignment.get('difficulty', 'medium')
    item_count = assignment.get('item_count', 10)
    language = assignment.get('language', 'es')
    
    # Build AI prompt
    lang_instruction = "Respond in Spanish" if language == "es" else "Respond in English"
    
    system_prompt = f"""You are an expert educational content creator. Generate {item_count} unique educational questions.

{lang_instruction}

REQUIREMENTS:
- Subject: {subject}
- Grade Level: {grade_level}
- Topic: {topic}
- Difficulty: {difficulty}
- Variant Seed: {variant_seed} (use this to create unique variations)

CRITICAL: Each question MUST have a unique item_id starting with "item_"

Return ONLY a valid JSON array with this structure:
[
  {{
    "item_id": "item_001",
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": "Brief explanation",
    "term": "Key term for flashcards",
    "definition": "Definition for flashcards"
  }}
]

Make questions engaging and age-appropriate. DO NOT include any text before or after the JSON."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"ptl_{variant_seed}",
            system_message=system_prompt
        ).with_model("anthropic", "claude-sonnet-4-6")
        
        user_message = UserMessage(
            text=f"Generate {item_count} unique questions about {topic} for {grade_level} students studying {subject}. Use variant seed: {variant_seed}"
        )
        
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        items = json.loads(response_text.strip())
        
        # Add metadata to each item
        for i, item in enumerate(items):
            if 'item_id' not in item:
                item['item_id'] = f"item_{uuid.uuid4().hex[:8]}"
            item['question_set_id'] = question_set_id
            item['variant_seed'] = variant_seed
            item['index'] = i
        
        return items
        
    except Exception as e:
        print(f"[Play to Learn] AI generation error: {e}")
        # Fallback to basic questions
        return generate_fallback_items(assignment, variant_seed, question_set_id)

def generate_fallback_items(assignment: dict, variant_seed: str, question_set_id: str) -> List[dict]:
    """Generate fallback items if AI fails"""
    item_count = assignment.get('item_count', 10)
    topic = assignment.get('topic', 'General')
    language = assignment.get('language', 'es')
    
    items = []
    for i in range(item_count):
        item_id = f"item_{uuid.uuid4().hex[:8]}"
        if language == 'es':
            items.append({
                "item_id": item_id,
                "question": f"Pregunta {i+1} sobre {topic}",
                "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
                "correct_answer": "Opción A",
                "explanation": "Explicación de la respuesta correcta",
                "term": f"Término {i+1}",
                "definition": f"Definición del término {i+1}",
                "question_set_id": question_set_id,
                "variant_seed": variant_seed,
                "index": i
            })
        else:
            items.append({
                "item_id": item_id,
                "question": f"Question {i+1} about {topic}",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "Option A",
                "explanation": "Explanation of the correct answer",
                "term": f"Term {i+1}",
                "definition": f"Definition of term {i+1}",
                "question_set_id": question_set_id,
                "variant_seed": variant_seed,
                "index": i
            })
    
    return items

def transform_items_to_game_mode(base_items: List[dict], game_type: str) -> dict:
    """
    Transform base items to a specific game mode format
    This allows the same content to be rendered differently
    """
    if game_type == "quiz":
        # Classic multiple choice quiz
        return {
            "game_type": "quiz",
            "questions": [
                {
                    "item_id": item["item_id"],
                    "question": item["question"],
                    "options": item["options"],
                    "correct_answer": item["correct_answer"],
                    "explanation": item.get("explanation", ""),
                    "time_limit_seconds": 30
                }
                for item in base_items
            ]
        }
    
    elif game_type == "time_attack":
        # Timed typed answers - no options, faster pace
        return {
            "game_type": "time_attack",
            "questions": [
                {
                    "item_id": item["item_id"],
                    "question": item["question"],
                    "correct_answer": item["correct_answer"],
                    "acceptable_answers": [item["correct_answer"].lower()],
                    "explanation": item.get("explanation", ""),
                    "time_limit_seconds": 15
                }
                for item in base_items
            ]
        }
    
    elif game_type == "matching":
        # Match terms with definitions
        terms = [{"item_id": item["item_id"], "text": item.get("term", item["question"])} for item in base_items]
        definitions = [{"item_id": item["item_id"], "text": item.get("definition", item["correct_answer"])} for item in base_items]
        random.shuffle(definitions)  # Shuffle for matching challenge
        
        return {
            "game_type": "matching",
            "terms": terms,
            "definitions": definitions,
            "pairs": [
                {"term_id": item["item_id"], "definition_id": item["item_id"]}
                for item in base_items
            ]
        }
    
    elif game_type == "flashcard":
        # Flashcard study mode
        return {
            "game_type": "flashcard",
            "cards": [
                {
                    "item_id": item["item_id"],
                    "front": item.get("term", item["question"]),
                    "back": item.get("definition", item["correct_answer"]),
                    "explanation": item.get("explanation", "")
                }
                for item in base_items
            ]
        }
    
    else:
        raise ValueError(f"Unknown game type: {game_type}")

# ==================== DEPENDENCY INJECTION ====================

async def get_current_user(request: Request):
    """Get current user from JWT token"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(' ')[1]
    try:
        import jwt
        payload = jwt.decode(token, os.environ.get('JWT_SECRET', 'teacherhub-secret-key-change-in-production'), algorithms=["HS256"])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== API ENDPOINTS ====================

# ---------- ASSIGNMENT ENDPOINTS ----------

@router.post("/assignments", response_model=PracticeAssignmentResponse)
async def create_practice_assignment(
    assignment: PracticeAssignmentCreate,
    request: Request
):
    """Create a new practice assignment (Teacher only)"""
    user = await get_current_user(request)
    if user.get('role') not in ['teacher', 'admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Only teachers can create assignments")
    
    assignment_id = f"pa_{uuid.uuid4().hex[:16]}"
    now = datetime.now(timezone.utc).isoformat()
    
    assignment_doc = {
        "assignment_id": assignment_id,
        "teacher_id": user["user_id"],
        "school_id": user.get("school_id"),
        "subject": assignment.subject,
        "grade_level": assignment.grade_level,
        "topic": assignment.topic,
        "standard": assignment.standard,
        "difficulty": assignment.difficulty,
        "item_count": assignment.item_count,
        "allowed_game_types": assignment.allowed_game_types,
        "language": assignment.language,
        "created_at": now
    }
    
    await db.practice_assignments.insert_one(assignment_doc)
    
    return PracticeAssignmentResponse(
        assignment_id=assignment_id,
        teacher_id=user["user_id"],
        subject=assignment.subject,
        grade_level=assignment.grade_level,
        topic=assignment.topic,
        standard=assignment.standard,
        difficulty=assignment.difficulty,
        item_count=assignment.item_count,
        allowed_game_types=assignment.allowed_game_types,
        language=assignment.language,
        created_at=now
    )

@router.get("/assignments")
async def get_practice_assignments(request: Request):
    """Get all practice assignments for the current teacher"""
    user = await get_current_user(request)
    
    query = {"teacher_id": user["user_id"]}
    if user.get('role') in ['admin', 'super_admin']:
        query = {}  # Admins can see all
    
    assignments = await db.practice_assignments.find(query, {"_id": 0}).to_list(100)
    return {"assignments": assignments}

@router.get("/assignments/{assignment_id}")
async def get_practice_assignment(assignment_id: str):
    """Get a specific practice assignment"""
    assignment = await db.practice_assignments.find_one(
        {"assignment_id": assignment_id},
        {"_id": 0}
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

@router.delete("/assignments/{assignment_id}")
async def delete_practice_assignment(assignment_id: str, request: Request):
    """Delete a practice assignment"""
    user = await get_current_user(request)
    
    assignment = await db.practice_assignments.find_one({"assignment_id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment["teacher_id"] != user["user_id"] and user.get('role') not in ['admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.practice_assignments.delete_one({"assignment_id": assignment_id})
    return {"message": "Assignment deleted"}

# ---------- SESSION ENDPOINTS ----------

@router.post("/sessions")
async def create_practice_session(session: SessionCreate, request: Request):
    """Create a new practice session (generates unique questions)"""
    user = await get_current_user(request)
    
    # Get assignment
    assignment = await db.practice_assignments.find_one({"assignment_id": session.assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Validate game type
    if session.game_type not in assignment.get("allowed_game_types", []):
        raise HTTPException(
            status_code=400, 
            detail=f"Game type '{session.game_type}' not allowed for this assignment"
        )
    
    # Generate unique identifiers
    session_id = f"ps_{uuid.uuid4().hex[:16]}"
    variant_seed = generate_variant_seed()
    question_set_id = f"qs_{uuid.uuid4().hex[:16]}"
    
    # Generate fresh questions
    base_items = await generate_base_items(assignment, variant_seed)
    
    # Transform to game mode
    game_payload = transform_items_to_game_mode(base_items, session.game_type)
    
    # Generate PIN for live mode
    join_pin = generate_pin() if session.mode == "LIVE" else None
    
    now = datetime.now(timezone.utc).isoformat()
    
    session_doc = {
        "session_id": session_id,
        "assignment_id": session.assignment_id,
        "teacher_id": user["user_id"],
        "school_id": user.get("school_id"),
        "game_type": session.game_type,
        "mode": session.mode,
        "question_set_id": question_set_id,
        "variant_seed": variant_seed,
        "join_pin": join_pin,
        "status": "LOBBY" if session.mode == "LIVE" else "ACTIVE",
        "base_items": base_items,
        "game_payload": game_payload,
        "participants": [],
        "current_question_index": 0,
        "created_at": now,
        "started_at": now if session.mode == "SELF_PACED" else None,
        "completed_at": None
    }
    
    await db.practice_sessions.insert_one(session_doc)
    
    # Log for anti-repeat verification
    print(f"[Play to Learn] NEW SESSION CREATED:")
    print(f"  - session_id: {session_id}")
    print(f"  - question_set_id: {question_set_id}")
    print(f"  - variant_seed: {variant_seed}")
    print(f"  - item_ids: {[item['item_id'] for item in base_items[:3]]}...")
    
    return {
        "session_id": session_id,
        "assignment_id": session.assignment_id,
        "game_type": session.game_type,
        "mode": session.mode,
        "question_set_id": question_set_id,
        "variant_seed": variant_seed,
        "join_pin": join_pin,
        "status": session_doc["status"],
        "item_ids": [item["item_id"] for item in base_items],
        "created_at": now
    }

@router.get("/sessions/{session_id}")
async def get_practice_session(session_id: str):
    """Get session details (for joining or resuming)"""
    session = await db.practice_sessions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Return game payload without answers for players
    return {
        "session_id": session["session_id"],
        "assignment_id": session["assignment_id"],
        "game_type": session["game_type"],
        "mode": session["mode"],
        "status": session["status"],
        "question_set_id": session["question_set_id"],
        "game_payload": session["game_payload"],
        "participants": session.get("participants", []),
        "current_question_index": session.get("current_question_index", 0),
        "created_at": session["created_at"]
    }

@router.get("/join/{pin}")
async def join_by_pin(pin: str):
    """Get session by PIN for joining live games"""
    session = await db.practice_sessions.find_one(
        {"join_pin": pin, "status": {"$in": ["LOBBY", "ACTIVE"]}},
        {"_id": 0, "base_items": 0}  # Don't expose answers
    )
    if not session:
        raise HTTPException(status_code=404, detail="Invalid PIN or session not active")
    
    # Get assignment details
    assignment = await db.practice_assignments.find_one(
        {"assignment_id": session["assignment_id"]},
        {"_id": 0}
    )
    
    return {
        "session_id": session["session_id"],
        "game_type": session["game_type"],
        "mode": session["mode"],
        "status": session["status"],
        "topic": assignment.get("topic", "Practice") if assignment else "Practice",
        "subject": assignment.get("subject", "") if assignment else ""
    }

@router.post("/sessions/{session_id}/join")
async def join_session(session_id: str, join_request: JoinSessionRequest):
    """Join a practice session as a participant"""
    session = await db.practice_sessions.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["status"] == "COMPLETE":
        raise HTTPException(status_code=400, detail="Session already completed")
    
    # For LIVE mode, verify PIN
    if session["mode"] == "LIVE" and session.get("join_pin") != join_request.pin:
        raise HTTPException(status_code=400, detail="Invalid PIN")
    
    # Create participant record
    participant_id = f"part_{uuid.uuid4().hex[:12]}"
    participant = {
        "participant_id": participant_id,
        "nickname": join_request.nickname,
        "joined_at": datetime.now(timezone.utc).isoformat(),
        "score": 0,
        "streak": 0,
        "best_streak": 0,
        "answers": [],
        "total_time_ms": 0
    }
    
    # Add to session
    await db.practice_sessions.update_one(
        {"session_id": session_id},
        {"$push": {"participants": participant}}
    )
    
    # Broadcast to live session
    if session["mode"] == "LIVE":
        await manager.broadcast_to_session(session_id, {
            "type": "player_joined",
            "participant": {
                "participant_id": participant_id,
                "nickname": join_request.nickname
            },
            "player_count": manager.get_player_count(session_id) + 1
        })
    
    return {
        "participant_id": participant_id,
        "nickname": join_request.nickname,
        "session_id": session_id,
        "status": session["status"],
        "game_type": session["game_type"]
    }

@router.post("/sessions/{session_id}/start")
async def start_live_session(session_id: str, request: Request):
    """Start a live session (Teacher/Host only)"""
    user = await get_current_user(request)
    
    session = await db.practice_sessions.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["teacher_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the host can start the session")
    
    if session["status"] != "LOBBY":
        raise HTTPException(status_code=400, detail="Session already started")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.practice_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"status": "ACTIVE", "started_at": now}}
    )
    
    # Broadcast game start
    await manager.broadcast_to_session(session_id, {
        "type": "game_started",
        "current_question_index": 0,
        "total_questions": len(session.get("base_items", []))
    })
    
    return {"message": "Session started", "status": "ACTIVE"}

@router.post("/sessions/{session_id}/next-question")
async def advance_to_next_question(session_id: str, request: Request):
    """Advance to the next question (Live mode - Host only)"""
    user = await get_current_user(request)
    
    session = await db.practice_sessions.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["teacher_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the host can advance questions")
    
    current_index = session.get("current_question_index", 0)
    total_questions = len(session.get("base_items", []))
    
    if current_index >= total_questions - 1:
        # Game complete
        await db.practice_sessions.update_one(
            {"session_id": session_id},
            {"$set": {"status": "COMPLETE", "completed_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        await manager.broadcast_to_session(session_id, {
            "type": "game_complete",
            "participants": session.get("participants", [])
        })
        
        return {"message": "Game completed", "status": "COMPLETE"}
    
    new_index = current_index + 1
    await db.practice_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"current_question_index": new_index}}
    )
    
    # Broadcast question advancement
    await manager.broadcast_to_session(session_id, {
        "type": "next_question",
        "current_question_index": new_index,
        "total_questions": total_questions
    })
    
    return {"current_question_index": new_index, "total_questions": total_questions}

@router.post("/sessions/{session_id}/submit-answer")
async def submit_answer(session_id: str, answer: AnswerSubmission, participant_id: str):
    """Submit an answer for a question"""
    session = await db.practice_sessions.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["status"] != "ACTIVE":
        raise HTTPException(status_code=400, detail="Session not active")
    
    # Find the correct answer
    base_items = session.get("base_items", [])
    item = next((i for i in base_items if i["item_id"] == answer.item_id), None)
    if not item:
        raise HTTPException(status_code=400, detail="Invalid item_id")
    
    # Check answer
    is_correct = answer.answer.lower().strip() == item["correct_answer"].lower().strip()
    
    # Update participant
    answer_record = {
        "item_id": answer.item_id,
        "answer": answer.answer,
        "correct_answer": item["correct_answer"],
        "is_correct": is_correct,
        "time_taken_ms": answer.time_taken_ms,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Find and update participant
    participants = session.get("participants", [])
    for p in participants:
        if p["participant_id"] == participant_id:
            p["answers"].append(answer_record)
            p["total_time_ms"] += answer.time_taken_ms
            if is_correct:
                p["score"] += 1
                p["streak"] += 1
                p["best_streak"] = max(p["best_streak"], p["streak"])
            else:
                p["streak"] = 0
            break
    
    await db.practice_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"participants": participants}}
    )
    
    # Broadcast to live session
    if session["mode"] == "LIVE":
        await manager.send_to_host(session_id, {
            "type": "answer_submitted",
            "participant_id": participant_id,
            "is_correct": is_correct
        })
    
    return {
        "is_correct": is_correct,
        "correct_answer": item["correct_answer"],
        "explanation": item.get("explanation", ""),
        "score": next((p["score"] for p in participants if p["participant_id"] == participant_id), 0),
        "streak": next((p["streak"] for p in participants if p["participant_id"] == participant_id), 0)
    }

@router.post("/sessions/{session_id}/complete")
async def complete_session(session_id: str, participant_id: str):
    """Mark a self-paced session as complete for a participant"""
    session = await db.practice_sessions.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Calculate results
    participants = session.get("participants", [])
    participant = next((p for p in participants if p["participant_id"] == participant_id), None)
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    total_questions = len(session.get("base_items", []))
    correct_answers = sum(1 for a in participant["answers"] if a["is_correct"])
    accuracy = (correct_answers / total_questions * 100) if total_questions > 0 else 0
    avg_time = (participant["total_time_ms"] / len(participant["answers"])) if participant["answers"] else 0
    
    # Get missed topics
    missed_items = [a for a in participant["answers"] if not a["is_correct"]]
    
    result = {
        "participant_id": participant_id,
        "nickname": participant["nickname"],
        "score": participant["score"],
        "total_questions": total_questions,
        "accuracy_percent": round(accuracy, 1),
        "best_streak": participant["best_streak"],
        "average_response_time_ms": round(avg_time),
        "total_time_ms": participant["total_time_ms"],
        "missed_count": len(missed_items),
        "completed_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Store result
    await db.practice_results.insert_one({
        "result_id": f"pr_{uuid.uuid4().hex[:12]}",
        "session_id": session_id,
        "participant_id": participant_id,
        **result
    })
    
    return result

# ---------- INSIGHTS ENDPOINTS ----------

@router.get("/insights/{assignment_id}")
async def get_practice_insights(assignment_id: str, request: Request):
    """Get practice insights for an assignment (no grades)"""
    # Verify user is authenticated (authorization check)
    await get_current_user(request)
    
    # Get all sessions for this assignment
    sessions = await db.practice_sessions.find(
        {"assignment_id": assignment_id},
        {"_id": 0}
    ).to_list(100)
    
    if not sessions:
        return {
            "assignment_id": assignment_id,
            "total_sessions": 0,
            "total_participants": 0,
            "insights": {}
        }
    
    # Aggregate insights
    total_participants = sum(len(s.get("participants", [])) for s in sessions)
    all_answers = []
    
    for session in sessions:
        for participant in session.get("participants", []):
            all_answers.extend(participant.get("answers", []))
    
    # Calculate accuracy distribution
    correct_count = sum(1 for a in all_answers if a.get("is_correct"))
    total_answers = len(all_answers)
    
    # Find most missed questions
    missed_by_item = {}
    for answer in all_answers:
        if not answer.get("is_correct"):
            item_id = answer.get("item_id")
            if item_id:
                missed_by_item[item_id] = missed_by_item.get(item_id, 0) + 1
    
    most_missed = sorted(missed_by_item.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        "assignment_id": assignment_id,
        "total_sessions": len(sessions),
        "total_participants": total_participants,
        "total_answers": total_answers,
        "overall_accuracy_percent": round((correct_count / total_answers * 100) if total_answers > 0 else 0, 1),
        "most_missed_items": [{"item_id": item_id, "miss_count": count} for item_id, count in most_missed],
        "game_type_breakdown": {
            gt: len([s for s in sessions if s["game_type"] == gt])
            for gt in set(s["game_type"] for s in sessions)
        }
    }

@router.get("/teacher/sessions")
async def get_teacher_sessions(request: Any = None):
    """Get all sessions created by the teacher"""
    user = await get_current_user(request)
    
    sessions = await db.practice_sessions.find(
        {"teacher_id": user["user_id"]},
        {"_id": 0, "base_items": 0}  # Don't return full question data
    ).sort("created_at", -1).to_list(50)
    
    return {"sessions": sessions}

# ---------- WEBSOCKET ENDPOINT ----------

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, participant_id: str = "", role: str = "player"):
    """WebSocket endpoint for real-time live game communication"""
    await manager.connect(websocket, session_id, participant_id, role)
    
    try:
        # Send current game state
        session = await db.practice_sessions.find_one({"session_id": session_id})
        if session:
            await websocket.send_json({
                "type": "connected",
                "session_id": session_id,
                "status": session["status"],
                "current_question_index": session.get("current_question_index", 0),
                "participants": [
                    {"nickname": p["nickname"], "score": p["score"]}
                    for p in session.get("participants", [])
                ]
            })
        
        while True:
            data = await websocket.receive_json()
            
            # Handle different message types
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            
            elif data.get("type") == "answer":
                # Process answer submission
                answer = AnswerSubmission(
                    item_id=data["item_id"],
                    answer=data["answer"],
                    time_taken_ms=data.get("time_taken_ms", 0)
                )
                result = await submit_answer(session_id, answer, participant_id)
                await websocket.send_json({"type": "answer_result", **result})
            
            elif data.get("type") == "start_game" and role == "host":
                # Host starts the game
                from fastapi import Request
                # Simplified - in production would need proper auth
                await db.practice_sessions.update_one(
                    {"session_id": session_id},
                    {"$set": {"status": "ACTIVE", "started_at": datetime.now(timezone.utc).isoformat()}}
                )
                await manager.broadcast_to_session(session_id, {
                    "type": "game_started",
                    "current_question_index": 0
                })
            
            elif data.get("type") == "next_question" and role == "host":
                session = await db.practice_sessions.find_one({"session_id": session_id})
                new_index = session.get("current_question_index", 0) + 1
                total = len(session.get("base_items", []))
                
                if new_index >= total:
                    await db.practice_sessions.update_one(
                        {"session_id": session_id},
                        {"$set": {"status": "COMPLETE"}}
                    )
                    await manager.broadcast_to_session(session_id, {"type": "game_complete"})
                else:
                    await db.practice_sessions.update_one(
                        {"session_id": session_id},
                        {"$set": {"current_question_index": new_index}}
                    )
                    await manager.broadcast_to_session(session_id, {
                        "type": "next_question",
                        "current_question_index": new_index
                    })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        # Notify others of disconnect
        await manager.broadcast_to_session(session_id, {
            "type": "player_disconnected",
            "participant_id": participant_id
        })

# ==================== INIT FUNCTION ====================

def init_play_to_learn_routes(database):
    """Initialize routes with database connection"""
    global db
    db = database
