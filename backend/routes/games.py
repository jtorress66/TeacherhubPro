"""
Educational Games Routes
Handles game generation, saving, playing, and analytics
WITH strict validation and quality enforcement
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid
import json
import logging

from emergentintegrations.llm.chat import LlmChat, UserMessage

# Import validation module
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.game_validator import validate_game, simulate_game_smoke_test, create_validation_report

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/games", tags=["games"])

# Configuration
MAX_GENERATION_ATTEMPTS = 3
db = None
_get_current_user_func = None
EMERGENT_LLM_KEY = None
FREE_TRIAL_DAYS = 7


def init_games_routes(database, auth_dependency, llm_key, trial_days):
    """Initialize the games routes with dependencies"""
    global db, _get_current_user_func, EMERGENT_LLM_KEY, FREE_TRIAL_DAYS
    db = database
    _get_current_user_func = auth_dependency
    EMERGENT_LLM_KEY = llm_key
    FREE_TRIAL_DAYS = trial_days


async def get_current_user(request: Request):
    """Wrapper to call the actual auth dependency"""
    return await _get_current_user_func(request)


class GameGenerateRequest(BaseModel):
    content: str
    game_type: str = "quiz"
    grade_level: str = "3-5"
    subject: str = "math"
    question_count: int = 5
    language: str = "es"


class GameScoreRequest(BaseModel):
    player_name: str
    score: int
    total_questions: int
    time_taken: int = 0


async def check_ai_access(user: dict) -> bool:
    """Check if user has access to AI features"""
    user_role = user.get("role", "teacher")
    if user_role in ["admin", "super_admin"]:
        return True
    
    user_id = user.get("user_id")
    subscription = await db.subscriptions.find_one({"user_id": user_id, "status": "active"})
    if subscription:
        return True
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if user_doc:
        school_id = user_doc.get("school_id")
        if school_id:
            school_sub = await db.subscriptions.find_one({"school_id": school_id, "status": "active"})
            if school_sub:
                return True
        
        created_at = user_doc.get("created_at", "")
        if created_at:
            try:
                created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                trial_end = created_date + timedelta(days=FREE_TRIAL_DAYS)
                if datetime.now(timezone.utc) < trial_end:
                    return True
            except ValueError:
                pass
    
    return False


def get_strict_system_prompt(language: str) -> str:
    """Generate the strict system prompt that enforces quality"""
    lang_instruction = "Responde completamente en español." if language == "es" else "Respond entirely in English."
    
    return f"""You are an expert educational game designer creating classroom-ready games.

{lang_instruction}

=== ABSOLUTE REQUIREMENTS - ZERO TOLERANCE ===

You MUST output ONLY valid JSON. No explanations, no markdown, no extra text.

=== FUNCTIONAL-ONLY CONTRACT ===
Your output MUST satisfy ALL of these requirements with ZERO exceptions:

1. COMPLETE CODE: No placeholders, TODOs, FIXMEs, "coming soon", or incomplete text
2. VALID DATA: Every field must be populated with real, educational content
3. EXACT MATCHING: For quiz/true_false, correct_answer MUST be character-for-character identical to one option
4. SAFE ASSETS: No external URLs, images, audio, or resources - content must be text-only
5. IMMEDIATELY PLAYABLE: Game must work with zero additional setup
6. PROPER INITIALIZATION: All arrays must have the requested number of items
7. NO UNDEFINED REFERENCES: Every referenced value must exist
8. RESTART CORRECTNESS: Game state can be reset without side effects
9. WIN/LOSE CONDITIONS: Clear scoring criteria in every question
10. SAFE DEFAULTS: All values must be explicitly set, no reliance on undefined behavior

=== SELF-TEST CHECKLIST (ALL MUST BE TRUE) ===
Before outputting, verify:
[ ] JSON is syntactically valid
[ ] Title is descriptive and educational
[ ] Exact number of questions/items as requested
[ ] Every question has all required fields populated
[ ] correct_answer values are valid and verifiable
[ ] No empty strings, nulls, or placeholder text
[ ] Content is age-appropriate for the grade level
[ ] Subject matter matches the requested subject

=== FAIL CLOSED INSTRUCTION ===
If you CANNOT generate a fully functional game meeting ALL requirements above,
you MUST output ONLY this JSON structure (do not output broken/partial games):
{{"error": "CANNOT_GENERATE", "reason": "Specific explanation of why generation failed"}}

DO NOT attempt to return partial data. Either return a 100% complete game or the error object.

=== OUTPUT FORMAT ===
Return ONLY valid JSON matching the specified schema. No backticks, no markdown, no explanations."""


def get_game_schema(game_type: str, grade_level: str, subject: str, question_count: int) -> str:
    """Get the strict JSON schema for each game type"""
    
    schemas = {
        "quiz": f'''{{
  "title": "Descriptive game title",
  "game_type": "quiz",
  "grade_level": "{grade_level}",
  "subject": "{subject}",
  "questions": [
    {{
      "question": "Clear question text ending with ?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "MUST be exactly one of the options above"
    }}
  ]
}}

REQUIREMENTS for quiz:
- Exactly {question_count} questions
- Each question has exactly 4 options
- correct_answer MUST be character-for-character identical to one option
- Options must be plausible but clearly distinguishable''',

        "true_false": f'''{{
  "title": "Descriptive game title",
  "game_type": "true_false",
  "grade_level": "{grade_level}",
  "subject": "{subject}",
  "questions": [
    {{
      "question": "Statement that is clearly true or false",
      "options": ["True", "False"],
      "correct_answer": "True" or "False"
    }}
  ]
}}

REQUIREMENTS for true_false:
- Exactly {question_count} statements
- Options are always ["True", "False"]
- correct_answer is always "True" or "False" exactly
- Statements should be clearly verifiable''',

        "fill_blanks": f'''{{
  "title": "Descriptive game title",
  "game_type": "fill_blanks",
  "grade_level": "{grade_level}",
  "subject": "{subject}",
  "questions": [
    {{
      "question": "Complete sentence with ___ where the answer goes",
      "correct_answer": "single word or short phrase",
      "hint": "Optional helpful hint"
    }}
  ]
}}

REQUIREMENTS for fill_blanks:
- Exactly {question_count} sentences
- Use ___ to mark the blank (3 underscores)
- correct_answer is a single word or very short phrase
- hint is optional but helpful''',

        "matching": f'''{{
  "title": "Descriptive game title",
  "game_type": "matching",
  "grade_level": "{grade_level}",
  "subject": "{subject}",
  "questions": [
    {{
      "question": "Term or concept to match",
      "correct_answer": "Matching definition or pair"
    }}
  ]
}}

REQUIREMENTS for matching:
- Exactly {question_count} pairs
- Each question is a term/concept
- Each correct_answer is its matching definition
- Terms and definitions should be clearly related''',

        "flashcards": f'''{{
  "title": "Descriptive game title",
  "game_type": "flashcards",
  "grade_level": "{grade_level}",
  "subject": "{subject}",
  "questions": [
    {{
      "question": "Front of card - term or question",
      "correct_answer": "Back of card - definition or answer"
    }}
  ]
}}

REQUIREMENTS for flashcards:
- Exactly {question_count} cards
- question is the front (what student sees first)
- correct_answer is the back (revealed on flip)
- Content should be memorable and educational''',

        "word_search": f'''{{
  "title": "Descriptive game title",
  "game_type": "word_search",
  "grade_level": "{grade_level}",
  "subject": "{subject}",
  "questions": [
    {{
      "word": "VOCABULARY",
      "hint": "Definition or clue for this word"
    }}
  ]
}}

REQUIREMENTS for word_search:
- Exactly {question_count} words
- word is uppercase, 3-12 letters, no spaces
- hint helps identify what word to look for
- Words should be from the lesson content''',

        "crossword": f'''{{
  "title": "Descriptive game title",
  "game_type": "crossword",
  "grade_level": "{grade_level}",
  "subject": "{subject}",
  "questions": [
    {{
      "clue": "Hint or definition for the answer",
      "correct_answer": "ANSWER",
      "direction": "across",
      "number": 1
    }}
  ]
}}

REQUIREMENTS for crossword:
- Exactly {question_count} clues
- correct_answer is uppercase, no spaces
- Alternate direction between "across" and "down"
- number starts at 1 and increments''',

        "drag_drop": f'''{{
  "title": "Descriptive game title",
  "game_type": "drag_drop",
  "grade_level": "{grade_level}",
  "subject": "{subject}",
  "questions": [
    {{
      "instruction": "Clear instruction on what to order/sort",
      "items": ["Item 1", "Item 2", "Item 3", "Item 4"],
      "correct_order": ["Item 2", "Item 4", "Item 1", "Item 3"]
    }}
  ]
}}

REQUIREMENTS for drag_drop:
- At least {min(question_count, 3)} ordering challenges
- items array has 4-6 items
- correct_order has same items in correct sequence
- instruction clearly explains the ordering criteria'''
    }
    
    return schemas.get(game_type, schemas['quiz'])


def get_grade_level_context(grade_level: str) -> str:
    """Get age-appropriate context for the grade level"""
    contexts = {
        "k-2": "Ages 5-7. Use very simple words (1-2 syllables). Short sentences. Basic concepts only. Fun and encouraging tone.",
        "3-5": "Ages 8-10. Use grade-appropriate vocabulary. Can include moderate complexity. Educational but engaging.",
        "6-8": "Ages 11-13. Middle school level. Can use more complex terms. Include real-world applications.",
        "9-12": "Ages 14-18. High school level. Advanced vocabulary acceptable. Include analytical thinking."
    }
    return contexts.get(grade_level, contexts['3-5'])


def get_subject_context(subject: str) -> str:
    """Get subject-specific guidance"""
    subjects = {
        "math": "Focus on numerical concepts, calculations, and problem-solving. Include numbers and operations.",
        "english": "Focus on grammar, vocabulary, reading comprehension. Include proper language usage.",
        "science": "Focus on scientific concepts, experiments, natural phenomena. Be factually accurate.",
        "social_studies": "Focus on society, communities, citizenship. Include cultural awareness.",
        "history": "Focus on historical events, people, dates. Be historically accurate.",
        "geography": "Focus on places, maps, cultures, environments. Include location-based content.",
        "art": "Focus on artistic concepts, techniques, creativity. Include visual/creative elements.",
        "music": "Focus on musical concepts, instruments, composition. Include rhythm/melody concepts.",
        "pe": "Focus on sports, health, fitness. Include physical activity concepts.",
        "other": "General educational content. Make it engaging and informative."
    }
    return subjects.get(subject, subjects['other'])


async def generate_game_with_validation(request: GameGenerateRequest) -> dict:
    """Generate a game with validation and retry logic"""
    
    system_prompt = get_strict_system_prompt(request.language)
    game_schema = get_game_schema(request.game_type, request.grade_level, request.subject, request.question_count)
    grade_context = get_grade_level_context(request.grade_level)
    subject_context = get_subject_context(request.subject)
    
    user_prompt = f"""Create an educational game based on this content:

=== LESSON CONTENT ===
{request.content}

=== GAME REQUIREMENTS ===
Type: {request.game_type}
Grade Level: {request.grade_level} - {grade_context}
Subject: {request.subject} - {subject_context}
Question Count: {request.question_count}

=== REQUIRED OUTPUT FORMAT ===
{game_schema}

=== FINAL CHECKLIST (all must be true) ===
- [ ] Valid JSON with no extra text
- [ ] Exactly {request.question_count} items
- [ ] All required fields populated
- [ ] Content is age-appropriate for {request.grade_level}
- [ ] No placeholders or TODOs
- [ ] correct_answer matches options exactly (for quiz/true_false)

Output ONLY the JSON. No explanations."""

    last_error = None
    
    for attempt in range(MAX_GENERATION_ATTEMPTS):
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"game_{uuid.uuid4().hex[:8]}",
                system_message=system_prompt
            ).with_model("anthropic", "claude-sonnet-4-20250514")
            
            user_message = UserMessage(text=user_prompt)
            response = await chat.send_message(user_message)
            
            # Parse response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]
                response_text = "\n".join(lines)
            
            # Parse JSON
            game_data = json.loads(response_text)
            
            # Check for AI-reported failure
            if game_data.get("error") == "CANNOT_GENERATE":
                last_error = f"AI cannot generate: {game_data.get('reason', 'Unknown reason')}"
                logger.warning(f"Attempt {attempt + 1}: {last_error}")
                continue
            
            # Validate the game
            is_valid, errors = validate_game(game_data)
            
            if not is_valid:
                last_error = f"Validation failed: {'; '.join(errors)}"
                logger.warning(f"Attempt {attempt + 1}: {last_error}")
                
                # Add error context to retry prompt
                if attempt < MAX_GENERATION_ATTEMPTS - 1:
                    user_prompt += f"\n\n=== PREVIOUS ATTEMPT FAILED ===\nErrors: {'; '.join(errors)}\nFix these issues in your next response."
                continue
            
            # Run smoke test
            smoke_pass, smoke_errors = simulate_game_smoke_test(game_data)
            if not smoke_pass:
                last_error = f"Smoke test failed: {'; '.join(smoke_errors)}"
                logger.warning(f"Attempt {attempt + 1}: {last_error}")
                continue
            
            # Add metadata
            game_data["game_id"] = f"game_{uuid.uuid4().hex[:12]}"
            game_data["created_at"] = datetime.now(timezone.utc).isoformat()
            game_data["grade_level"] = request.grade_level
            game_data["subject"] = request.subject
            game_data["validation_status"] = "passed"
            
            logger.info(f"Game generated successfully on attempt {attempt + 1}")
            return game_data
            
        except json.JSONDecodeError as e:
            last_error = f"Invalid JSON response: {str(e)}"
            logger.warning(f"Attempt {attempt + 1}: {last_error}")
        except Exception as e:
            last_error = f"Generation error: {str(e)}"
            logger.error(f"Attempt {attempt + 1}: {last_error}")
    
    # All attempts failed
    raise HTTPException(
        status_code=500, 
        detail={
            "error": "GAME_GENERATION_FAILED",
            "message": f"Failed to generate valid game after {MAX_GENERATION_ATTEMPTS} attempts",
            "last_error": last_error,
            "game_type": request.game_type
        }
    )


@router.post("/generate")
async def generate_educational_game(
    request: GameGenerateRequest,
    user: dict = Depends(get_current_user)
):
    """Generate an educational game from lesson content using AI with validation"""
    
    if not await check_ai_access(user):
        raise HTTPException(status_code=403, detail="AI features require an active subscription or trial period")
    
    return await generate_game_with_validation(request)


@router.post("/validate")
async def validate_game_endpoint(game: dict):
    """Validate a game without saving it"""
    report = create_validation_report(game)
    return report


@router.post("/smoke-test")
async def smoke_test_game(game: dict):
    """Run smoke test on a game"""
    is_valid, errors = simulate_game_smoke_test(game)
    return {
        "passed": is_valid,
        "errors": errors,
        "game_type": game.get("game_type", "unknown") if game else "unknown"
    }


@router.post("/save")
async def save_educational_game(
    game: dict,
    user: dict = Depends(get_current_user)
):
    """Save a generated educational game (with validation)"""
    
    # Validate before saving
    is_valid, errors = validate_game(game)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail={"error": "VALIDATION_FAILED", "errors": errors}
        )
    
    game_id = game.get("game_id") or f"game_{uuid.uuid4().hex[:12]}"
    
    await db.educational_games.update_one(
        {"game_id": game_id},
        {"$set": {
            "game_id": game_id,
            "teacher_id": user.get("user_id"),
            "title": game.get("title"),
            "game_type": game.get("game_type"),
            "grade_level": game.get("grade_level"),
            "subject": game.get("subject"),
            "questions": game.get("questions", []),
            "words": game.get("words", []),
            "hints": game.get("hints", []),
            "categories": game.get("categories", []),
            "validation_status": "passed",
            "created_at": game.get("created_at") or datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return {"message": "Game saved", "game_id": game_id, "validation_status": "passed"}


@router.get("")
async def get_teacher_games(user: dict = Depends(get_current_user)):
    """Get all games created by the current teacher"""
    games = await db.educational_games.find(
        {"teacher_id": user.get("user_id")},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return games


@router.get("/{game_id}")
async def get_game(game_id: str):
    """Get a specific game by ID (public endpoint for playing)"""
    game = await db.educational_games.find_one({"game_id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return {
        "game_id": game["game_id"],
        "title": game.get("title", ""),
        "game_type": game.get("game_type", "quiz"),
        "grade_level": game.get("grade_level", "3-5"),
        "subject": game.get("subject", "other"),
        "questions": game.get("questions", []),
        "words": game.get("words", []),
        "created_at": game.get("created_at"),
        "validation_status": game.get("validation_status", "unknown")
    }


@router.delete("/{game_id}")
async def delete_game(game_id: str, user: dict = Depends(get_current_user)):
    """Delete a game"""
    result = await db.educational_games.delete_one({
        "game_id": game_id,
        "teacher_id": user.get("user_id")
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Game not found or unauthorized")
    
    return {"message": "Game deleted"}


@router.post("/{game_id}/score")
async def submit_game_score(game_id: str, request: GameScoreRequest):
    """Submit a score for a game (public endpoint)"""
    score_entry = {
        "score_id": f"score_{uuid.uuid4().hex[:12]}",
        "game_id": game_id,
        "player_name": request.player_name,
        "score": request.score,
        "total_questions": request.total_questions,
        "percentage": round((request.score / request.total_questions) * 100) if request.total_questions > 0 else 0,
        "time_taken": request.time_taken,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.game_scores.insert_one(score_entry)
    
    return {"message": "Score submitted", "score_id": score_entry["score_id"]}


@router.get("/{game_id}/leaderboard")
async def get_game_leaderboard(game_id: str, limit: int = 10):
    """Get leaderboard for a game"""
    scores = await db.game_scores.find(
        {"game_id": game_id},
        {"_id": 0}
    ).sort("score", -1).limit(limit).to_list(limit)
    
    return scores


@router.get("/analytics/summary")
async def get_games_analytics(user: dict = Depends(get_current_user)):
    """Get analytics summary for all games created by the teacher"""
    teacher_id = user.get("user_id")
    
    games = await db.educational_games.find(
        {"teacher_id": teacher_id},
        {"_id": 0, "game_id": 1, "title": 1, "game_type": 1}
    ).to_list(100)
    
    game_ids = [g["game_id"] for g in games]
    
    scores = await db.game_scores.find(
        {"game_id": {"$in": game_ids}},
        {"_id": 0}
    ).to_list(1000)
    
    analytics = {
        "total_games": len(games),
        "total_plays": len(scores),
        "average_score": round(sum(s.get("percentage", 0) for s in scores) / len(scores), 1) if scores else 0,
        "games_by_type": {},
        "top_games": []
    }
    
    for game in games:
        game_type = game.get("game_type", "quiz")
        analytics["games_by_type"][game_type] = analytics["games_by_type"].get(game_type, 0) + 1
    
    plays_by_game = {}
    for score in scores:
        gid = score.get("game_id")
        plays_by_game[gid] = plays_by_game.get(gid, 0) + 1
    
    game_map = {g["game_id"]: g for g in games}
    analytics["top_games"] = [
        {"game_id": gid, "title": game_map.get(gid, {}).get("title", "Unknown"), "plays": count}
        for gid, count in sorted(plays_by_game.items(), key=lambda x: x[1], reverse=True)[:5]
    ]
    
    return analytics


@router.post("/{game_id}/progress")
async def save_game_progress(
    game_id: str,
    progress: dict,
    user: dict = Depends(get_current_user)
):
    """Save game progress for a user"""
    user_id = user.get("user_id")
    
    await db.game_progress.update_one(
        {"game_id": game_id, "user_id": user_id},
        {"$set": {
            "game_id": game_id,
            "user_id": user_id,
            "current_question": progress.get("current_question", 0),
            "score": progress.get("score", 0),
            "answers": progress.get("answers", {}),
            "started_at": progress.get("started_at"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return {"message": "Progress saved"}


@router.get("/{game_id}/progress")
async def get_game_progress(
    game_id: str,
    user: dict = Depends(get_current_user)
):
    """Get saved game progress for a user"""
    user_id = user.get("user_id")
    
    progress = await db.game_progress.find_one(
        {"game_id": game_id, "user_id": user_id},
        {"_id": 0}
    )
    
    return progress or {"current_question": 0, "score": 0, "answers": {}}
