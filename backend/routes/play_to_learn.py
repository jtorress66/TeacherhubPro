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
    game_type: str  # quiz, time_attack, matching, flashcard, true_false, fill_blank, sequence, word_search, memory, all_modes
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
    """Generate unique base items for a practice session using AI"""
    question_set_id = f"qs_{uuid.uuid4().hex[:16]}"
    
    subject = assignment.get('subject', 'General')
    grade_level = assignment.get('grade_level', '5th Grade')
    topic = assignment.get('topic', 'General Knowledge')
    difficulty = assignment.get('difficulty', 'medium')
    item_count = assignment.get('item_count', 10)
    language = assignment.get('language', 'en')
    
    # EXPLICIT LANGUAGE DETERMINATION
    is_english = language != 'es'
    lang_name = "ENGLISH" if is_english else "SPANISH"
    lang_example = "What is 2+2? Answer: 4" if is_english else "¿Cuál es 2+2? Respuesta: 4"
    
    system_prompt = f"""You are a professional educational content creator. You MUST generate ALL content in {lang_name} ONLY.

CRITICAL LANGUAGE REQUIREMENT: Every single word, question, option, term, definition, and explanation MUST be in {lang_name}.
DO NOT use any other language. If the topic is from another language (like a Spanish topic for an English class), translate appropriately.

Example of {lang_name} content: "{lang_example}"

Generate exactly {item_count} unique educational items as a JSON array.
Topic: {topic}
Subject: {subject}
Grade Level: {grade_level}
Difficulty: {difficulty}

REQUIRED JSON FORMAT (ALL TEXT IN {lang_name}):
[
  {{
    "question": "{lang_name} question that contains the answer word somewhere in the sentence",
    "options": ["{lang_name} option A", "{lang_name} option B", "{lang_name} option C", "{lang_name} option D"],
    "correct_answer": "{lang_name} correct option (must match one of the options exactly)",
    "explanation": "{lang_name} explanation of why this is correct",
    "term": "{lang_name} key term or concept (a single word or short phrase)",
    "definition": "{lang_name} complete sentence definition of the term",
    "fill_sentence": "{lang_name} complete sentence with the answer word included naturally - example: 'The NOUN in the sentence is the word that names a person, place, or thing.'"
  }}
]

IMPORTANT RULES FOR QUALITY CONTENT:
1. ALL TEXT MUST BE IN {lang_name} - NO EXCEPTIONS
2. Each question must be unique with different content
3. Correct answer must exactly match one option
4. The "term" should be a key vocabulary word from the topic
5. The "definition" should define that term in a complete sentence
6. The "fill_sentence" MUST be a grammatically correct sentence that naturally contains the correct_answer
7. Make questions engaging and age-appropriate for {grade_level}
8. DO NOT include any text before or after the JSON array
9. If the subject or topic name is in a different language, generate questions ABOUT that topic but IN {lang_name}"""

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"ptl_{variant_seed}",
            system_message=system_prompt
        ).with_model("anthropic", "claude-sonnet-4-6")
        
        user_message = UserMessage(
            text=f"""Generate {item_count} educational questions about "{topic}" for {grade_level} {subject} students.

MANDATORY: Write EVERYTHING in {lang_name}. This includes:
- Questions
- All answer options
- Explanations
- Terms and definitions

Variant seed for uniqueness: {variant_seed}

Return ONLY a valid JSON array with no additional text."""
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
    language = assignment.get('language', 'en')  # Default to English
    
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
    
    elif game_type == "true_false":
        # True/False questions - convert MCQ to True/False statements
        return {
            "game_type": "true_false",
            "questions": [
                {
                    "item_id": item["item_id"],
                    "statement": f"{item['question']} The answer is {item['correct_answer']}.",
                    "is_true": True,  # We'll mix with false statements in the frontend
                    "explanation": item.get("explanation", ""),
                    "time_limit_seconds": 20
                }
                for item in base_items
            ]
        }
    
    elif game_type == "fill_blank":
        # Fill in the blank - MUST use single word answers
        # Strategy: Use the "term" as the blank answer, and create a sentence using the definition
        questions = []
        for item in base_items:
            # Prefer using term as the single-word answer
            term = item.get("term", "")
            definition = item.get("definition", "")
            answer = item["correct_answer"]
            
            # Try to use term as the blank answer (single word/phrase)
            if term and definition:
                # Check if term appears in definition - create sentence with blank
                if term.lower() in definition.lower():
                    import re
                    pattern = re.compile(re.escape(term), re.IGNORECASE)
                    sentence = pattern.sub("_____", definition, count=1)
                    blank_answer = term
                else:
                    # Definition doesn't contain term, use format: "The definition of _____ is: [definition]"
                    sentence = f"The word _____ is defined as: {definition[:100]}"
                    blank_answer = term
            elif term:
                # Has term but no definition - use the explanation
                explanation = item.get("explanation", "")
                if explanation and term.lower() in explanation.lower():
                    import re
                    pattern = re.compile(re.escape(term), re.IGNORECASE)
                    sentence = pattern.sub("_____", explanation[:150], count=1)
                    blank_answer = term
                else:
                    # Fallback: "What is the answer? _____"
                    sentence = f"The term is _____. ({explanation[:60]}...)"
                    blank_answer = term
            else:
                # No term available - try to extract a KEY WORD from the answer
                # If answer is a phrase, use the first significant word
                words = answer.split()
                if len(words) > 3:
                    # Answer is too long - use the first noun-like word
                    key_word = words[0]
                    blank_answer = key_word
                    sentence = f"Fill in: _____ ({item['question'][:80]})"
                else:
                    # Answer is short enough to use directly
                    blank_answer = answer
                    question = item["question"]
                    if answer.lower() in question.lower():
                        import re
                        pattern = re.compile(re.escape(answer), re.IGNORECASE)
                        sentence = pattern.sub("_____", question, count=1)
                    else:
                        sentence = f"Fill in: _____ ({question[:80]})"
            
            # Generate helpful hint - just the first letter + length
            hint_text = f"Starts with '{blank_answer[0].upper()}', {len(blank_answer)} letters"
            
            questions.append({
                "item_id": item["item_id"],
                "sentence": sentence,
                "blank_answer": blank_answer,
                "hint": hint_text,
                "explanation": item.get("explanation", ""),
                "time_limit_seconds": 30  # Give more time for fill in blank
            })
        
        return {
            "game_type": "fill_blank",
            "questions": questions
        }
    
    elif game_type == "sequence":
        # Sequence/Ordering - put items in correct order
        import random as seq_random
        shuffled_items = base_items.copy()
        seq_random.shuffle(shuffled_items)
        return {
            "game_type": "sequence",
            "items": [
                {
                    "item_id": item["item_id"],
                    "text": item.get("term", item["question"]),
                    "correct_position": idx
                }
                for idx, item in enumerate(base_items)
            ],
            "shuffled_order": [item["item_id"] for item in shuffled_items]
        }
    
    elif game_type == "word_search":
        # Word Search - find words in a grid
        words = [item.get("term", item["correct_answer"]).upper().replace(" ", "") for item in base_items[:8]]  # Limit to 8 words
        return {
            "game_type": "word_search",
            "words": words,
            "hints": [
                {
                    "item_id": item["item_id"],
                    "word": item.get("term", item["correct_answer"]).upper().replace(" ", ""),
                    "hint": item.get("definition", item["question"])
                }
                for item in base_items[:8]
            ],
            "grid_size": 12
        }
    
    elif game_type == "memory":
        # Memory/Concentration - flip cards to find matches
        pairs = []
        for item in base_items[:8]:  # Limit to 8 pairs (16 cards)
            pairs.append({
                "pair_id": item["item_id"],
                "card_a": item.get("term", item["question"]),
                "card_b": item.get("definition", item["correct_answer"])
            })
        return {
            "game_type": "memory",
            "pairs": pairs,
            "total_pairs": len(pairs)
        }
    
    else:
        raise ValueError(f"Unknown game type: {game_type}")

# ==================== DEPENDENCY INJECTION ====================

async def get_current_user(request: Request):
    """Get current user from session cookie or JWT token"""
    from datetime import datetime, timezone
    
    # Check cookie first (Google OAuth sessions)
    session_token = request.cookies.get("session_token")
    
    # Check Authorization header as fallback (JWT)
    if not session_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    JWT_SECRET = os.environ.get('JWT_SECRET', 'teacherhub-secret-key-change-in-production')
    
    # Try session token first (Google OAuth)
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if session_doc:
        # Check expiry
        expires_at = session_doc.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        
        user = await db.users.find_one(
            {"user_id": session_doc["user_id"]},
            {"_id": 0}
        )
        if user:
            return user
    
    # Try JWT token (email/password auth)
    try:
        import jwt
        payload = jwt.decode(session_token, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one(
            {"user_id": payload["user_id"]},
            {"_id": 0}
        )
        if user:
            return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        pass
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

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
    
    # Validate game type - "all_modes" is a special case
    allowed_types = assignment.get("allowed_game_types", [])
    is_all_modes = session.game_type == "all_modes"
    
    if not is_all_modes and session.game_type not in allowed_types:
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
    
    # For "all_modes", don't transform yet - student will choose
    # Use quiz as default payload but student will select mode
    effective_game_type = "quiz" if is_all_modes else session.game_type
    game_payload = transform_items_to_game_mode(base_items, effective_game_type)
    
    # Generate PIN for live mode
    join_pin = generate_pin() if session.mode == "LIVE" else None
    
    now = datetime.now(timezone.utc).isoformat()
    
    session_doc = {
        "session_id": session_id,
        "assignment_id": session.assignment_id,
        "teacher_id": user["user_id"],
        "school_id": user.get("school_id"),
        "game_type": session.game_type,  # Store original (could be "all_modes")
        "mode": session.mode,
        "question_set_id": question_set_id,
        "variant_seed": variant_seed,
        "join_pin": join_pin,
        "status": "LOBBY" if session.mode == "LIVE" else "ACTIVE",
        "base_items": base_items,
        "game_payload": game_payload,
        "allowed_game_types": allowed_types if is_all_modes else [session.game_type],  # For mode selection
        "participants": [],
        "current_question_index": 0,
        "created_at": now,
        "started_at": now if session.mode == "SELF_PACED" else None,
        "completed_at": None
    }
    
    await db.practice_sessions.insert_one(session_doc)
    
    # Log for anti-repeat verification
    print("[Play to Learn] NEW SESSION CREATED:")
    print(f"  - session_id: {session_id}")
    print(f"  - question_set_id: {question_set_id}")
    print(f"  - variant_seed: {variant_seed}")
    print(f"  - game_type: {session.game_type} (all_modes: {is_all_modes})")
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
        "allowed_game_types": session_doc["allowed_game_types"],
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
        "allowed_game_types": session.get("allowed_game_types", [session["game_type"]]),
        "join_pin": session.get("join_pin"),
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
        "subject": assignment.get("subject", "") if assignment else "",
        "allowed_game_types": session.get("allowed_game_types", [session["game_type"]])
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
    
    # Check if participant with same nickname already exists (prevent duplicates)
    existing_participants = session.get("participants", [])
    existing_participant = next(
        (p for p in existing_participants if p["nickname"].lower() == join_request.nickname.lower()),
        None
    )
    
    if existing_participant:
        # Return existing participant info instead of creating duplicate
        print(f"[Play to Learn] Participant '{join_request.nickname}' already exists, returning existing ID")
        return {
            "participant_id": existing_participant["participant_id"],
            "nickname": existing_participant["nickname"],
            "session_id": session_id,
            "status": session["status"],
            "game_type": session["game_type"],
            "allowed_game_types": session.get("allowed_game_types", [session["game_type"]])
        }
    
    # Create new participant record
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
        "game_type": session["game_type"],
        "allowed_game_types": session.get("allowed_game_types", [session["game_type"]])
    }

class SelectModeRequest(BaseModel):
    """Model for selecting game mode"""
    game_type: str
    participant_id: str

@router.post("/sessions/{session_id}/select-mode")
async def select_game_mode(session_id: str, mode_request: SelectModeRequest):
    """Select game mode for 'all_modes' sessions - stores mode per participant"""
    session = await db.practice_sessions.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    allowed_types = session.get("allowed_game_types", [])
    if mode_request.game_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Game type '{mode_request.game_type}' not allowed for this session"
        )
    
    # Transform base items to the selected game mode
    base_items = session.get("base_items", [])
    new_game_payload = transform_items_to_game_mode(base_items, mode_request.game_type)
    
    # Update the participant's selected mode (NOT the session's game_type)
    await db.practice_sessions.update_one(
        {"session_id": session_id, "participants.participant_id": mode_request.participant_id},
        {
            "$set": {
                "participants.$.selected_mode": mode_request.game_type,
                "participants.$.game_payload": new_game_payload,
                "participants.$.mode_selected_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Broadcast to live session that a player selected a mode
    if session["mode"] == "LIVE":
        participant = next((p for p in session.get("participants", []) if p["participant_id"] == mode_request.participant_id), None)
        if participant:
            await manager.send_to_host(session_id, {
                "type": "player_mode_selected",
                "participant_id": mode_request.participant_id,
                "nickname": participant.get("nickname", "Unknown"),
                "selected_mode": mode_request.game_type
            })
    
    return {
        "session_id": session_id,
        "game_type": mode_request.game_type,
        "game_payload": new_game_payload,
        "message": "Game mode selected"
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
    
    game_type = session.get("game_type", "quiz")
    game_payload = session.get("game_payload", {})
    
    # Find the correct answer based on game type
    base_items = session.get("base_items", [])
    item = next((i for i in base_items if i["item_id"] == answer.item_id), None)
    if not item:
        raise HTTPException(status_code=400, detail="Invalid item_id")
    
    # Check answer based on game type
    is_correct = False
    correct_answer = item["correct_answer"]
    
    if game_type == "true_false":
        # For True/False, the answer is "true" or "false"
        # The question statement says "The answer is X" which is always TRUE
        # So correct answer is always "true" for these transformed questions
        questions = game_payload.get("questions", [])
        q = next((q for q in questions if q["item_id"] == answer.item_id), None)
        if q:
            expected_answer = "true" if q.get("is_true", True) else "false"
            is_correct = answer.answer.lower().strip() == expected_answer
            correct_answer = "True" if q.get("is_true", True) else "False"
        else:
            is_correct = answer.answer.lower().strip() == "true"
            correct_answer = "True"
    elif game_type == "fill_blank":
        # For fill in the blank, check against blank_answer
        questions = game_payload.get("questions", [])
        q = next((q for q in questions if q["item_id"] == answer.item_id), None)
        if q:
            correct_answer = q.get("blank_answer", item["correct_answer"])
        is_correct = answer.answer.lower().strip() == correct_answer.lower().strip()
    elif game_type == "time_attack":
        # For time attack, accept any of the acceptable answers
        questions = game_payload.get("questions", [])
        q = next((q for q in questions if q["item_id"] == answer.item_id), None)
        if q:
            acceptable = q.get("acceptable_answers", [correct_answer.lower()])
            is_correct = answer.answer.lower().strip() in [a.lower().strip() for a in acceptable]
        else:
            is_correct = answer.answer.lower().strip() == correct_answer.lower().strip()
    else:
        # For quiz and other modes, check against correct_answer
        is_correct = answer.answer.lower().strip() == item["correct_answer"].lower().strip()
    
    # Update participant
    answer_record = {
        "item_id": answer.item_id,
        "answer": answer.answer,
        "correct_answer": correct_answer,
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
        "correct_answer": correct_answer,
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
async def get_teacher_sessions(request: Request):
    """Get all sessions created by the teacher"""
    user = await get_current_user(request)
    
    sessions = await db.practice_sessions.find(
        {"teacher_id": user["user_id"]},
        {"_id": 0, "base_items": 0}  # Don't return full question data
    ).sort("created_at", -1).to_list(50)
    
    return {"sessions": sessions}

@router.delete("/sessions/{session_id}")
async def delete_practice_session(session_id: str, request: Request):
    """Delete/close a practice session (Teacher only)"""
    user = await get_current_user(request)
    
    session = await db.practice_sessions.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Only the creator or admin can delete
    if session["teacher_id"] != user["user_id"] and user.get('role') not in ['admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Not authorized to delete this session")
    
    await db.practice_sessions.delete_one({"session_id": session_id})
    
    # Also delete related results
    await db.practice_results.delete_many({"session_id": session_id})
    
    return {"message": "Session deleted", "session_id": session_id}

@router.post("/sessions/{session_id}/close")
async def close_practice_session(session_id: str, request: Request):
    """Close/end a practice session (mark as COMPLETE)"""
    user = await get_current_user(request)
    
    session = await db.practice_sessions.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["teacher_id"] != user["user_id"] and user.get('role') not in ['admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.practice_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"status": "COMPLETE", "completed_at": now}}
    )
    
    return {"message": "Session closed", "session_id": session_id, "status": "COMPLETE"}

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
