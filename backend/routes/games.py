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
from utils.game_validator import validate_game, simulate_game_smoke_test, create_validation_report, run_full_validation

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
    student_id: Optional[str] = None  # Optional student ID for grade linking


class GameGradeSettings(BaseModel):
    count_as_grade: bool = False
    grade_points: int = 100
    grade_method: str = "best"  # "first", "best", "average"
    class_id: Optional[str] = None
    assignment_name: Optional[str] = None


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
            
            # Parse response - handle both string and object responses
            if isinstance(response, str):
                response_text = response.strip()
            elif hasattr(response, 'text'):
                response_text = response.text.strip()
            elif hasattr(response, 'content'):
                response_text = response.content.strip()
            else:
                response_text = str(response).strip()
            
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
            # Store original content for question regeneration
            game_data["original_content"] = request.content
            game_data["language"] = request.language
            game_data["question_count"] = request.question_count
            
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
    """Validate a game without saving it - runs full validation suite"""
    report = run_full_validation(game)
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


@router.post("/full-validation")
async def full_validation_endpoint(game: dict):
    """
    Run comprehensive validation including smoke test
    Returns detailed report with pass/fail status
    """
    report = run_full_validation(game)
    return {
        "valid": report.get("fully_valid", False),
        "validation_passed": report.get("is_valid", False),
        "smoke_test_passed": report.get("smoke_test_passed", False),
        "errors": report.get("errors", []),
        "smoke_test_errors": report.get("smoke_test_errors", []),
        "game_type": report.get("game_type", "unknown"),
        "question_count": report.get("question_count", 0)
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
    
    # Extract grade settings if provided
    grade_settings = game.get("grade_settings", {})
    
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
            # Store original content for question regeneration
            "original_content": game.get("original_content", ""),
            "language": game.get("language", "es"),
            "question_count": len(game.get("questions", [])),
            # Grade settings
            "count_as_grade": grade_settings.get("count_as_grade", False),
            "grade_points": grade_settings.get("grade_points", 100),
            "grade_method": grade_settings.get("grade_method", "best"),
            "class_id": grade_settings.get("class_id"),
            "assignment_name": grade_settings.get("assignment_name"),
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
        "validation_status": game.get("validation_status", "unknown"),
        # Grade settings for frontend display
        "count_as_grade": game.get("count_as_grade", False),
        "grade_points": game.get("grade_points", 100),
        "grade_method": game.get("grade_method", "best")
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
    percentage = round((request.score / request.total_questions) * 100) if request.total_questions > 0 else 0
    
    score_entry = {
        "score_id": f"score_{uuid.uuid4().hex[:12]}",
        "game_id": game_id,
        "player_name": request.player_name,
        "student_id": request.student_id,  # Can be None for unlinked plays
        "score": request.score,
        "total_questions": request.total_questions,
        "percentage": percentage,
        "time_taken": request.time_taken,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.game_scores.insert_one(score_entry)
    
    # Check if this game should count as a grade
    game = await db.educational_games.find_one({"game_id": game_id}, {"_id": 0})
    grade_created = False
    
    if game and game.get("count_as_grade") and request.student_id:
        grade_method = game.get("grade_method", "best")
        grade_points = game.get("grade_points", 100)
        class_id = game.get("class_id")
        
        if class_id:
            # Calculate the grade based on method
            existing_scores = await db.game_scores.find({
                "game_id": game_id,
                "student_id": request.student_id
            }).to_list(100)
            
            if grade_method == "first":
                # Only count the first attempt
                if len(existing_scores) == 1:  # This is the first
                    final_grade = percentage
                else:
                    final_grade = None  # Don't update
            elif grade_method == "best":
                # Use the best score
                all_percentages = [s.get("percentage", 0) for s in existing_scores]
                final_grade = max(all_percentages) if all_percentages else percentage
            elif grade_method == "average":
                # Use the average
                all_percentages = [s.get("percentage", 0) for s in existing_scores]
                final_grade = round(sum(all_percentages) / len(all_percentages)) if all_percentages else percentage
            else:
                final_grade = percentage
            
            if final_grade is not None:
                # Create or update the grade
                assignment_name = game.get("assignment_name") or f"Game: {game.get('title', 'Educational Game')}"
                assignment_id = f"game_assign_{game_id}"
                
                # Check if assignment exists, if not create it
                existing_assignment = await db.assignments.find_one({"assignment_id": assignment_id})
                if not existing_assignment:
                    await db.assignments.insert_one({
                        "assignment_id": assignment_id,
                        "class_id": class_id,
                        "title": assignment_name,
                        "description": f"Educational Game - {game.get('game_type', 'quiz').title()}",
                        "points": grade_points,
                        "due_date": None,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "game_id": game_id,
                        "is_game_assignment": True
                    })
                
                # Create or update the grade
                grade_value = round((final_grade / 100) * grade_points, 1)
                await db.grades.update_one(
                    {
                        "assignment_id": assignment_id,
                        "student_id": request.student_id
                    },
                    {"$set": {
                        "grade_id": f"grade_{uuid.uuid4().hex[:12]}",
                        "assignment_id": assignment_id,
                        "student_id": request.student_id,
                        "score": grade_value,
                        "percentage": final_grade,
                        "grade_method": grade_method,
                        "attempts": len(existing_scores),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }},
                    upsert=True
                )
                grade_created = True
    
    return {
        "message": "Score submitted", 
        "score_id": score_entry["score_id"],
        "percentage": percentage,
        "grade_created": grade_created
    }


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
        {"_id": 0, "game_id": 1, "title": 1, "game_type": 1, "count_as_grade": 1, "grade_points": 1}
    ).to_list(100)
    
    game_ids = [g["game_id"] for g in games]
    
    scores = await db.game_scores.find(
        {"game_id": {"$in": game_ids}},
        {"_id": 0}
    ).to_list(10000)
    
    # Calculate unique players across all games
    all_players = set()
    for score in scores:
        player_key = score.get("student_id") or score.get("player_name")
        if player_key:
            all_players.add(player_key)
    
    analytics = {
        "total_games": len(games),
        "total_plays": len(scores),
        "average_score": round(sum(s.get("percentage", 0) for s in scores) / len(scores), 1) if scores else 0,
        "unique_players": len(all_players),
        "games_by_type": {},
        "top_games": [],
        "game_stats": []  # Detailed per-game statistics
    }
    
    for game in games:
        game_type = game.get("game_type", "quiz")
        analytics["games_by_type"][game_type] = analytics["games_by_type"].get(game_type, 0) + 1
    
    # Calculate per-game statistics
    plays_by_game = {}
    scores_by_game = {}
    players_by_game = {}
    
    for score in scores:
        gid = score.get("game_id")
        plays_by_game[gid] = plays_by_game.get(gid, 0) + 1
        
        if gid not in scores_by_game:
            scores_by_game[gid] = []
        scores_by_game[gid].append(score.get("percentage", 0))
        
        if gid not in players_by_game:
            players_by_game[gid] = set()
        player_key = score.get("student_id") or score.get("player_name")
        if player_key:
            players_by_game[gid].add(player_key)
    
    # Build game_stats array with detailed per-game statistics
    for game in games:
        gid = game["game_id"]
        game_scores = scores_by_game.get(gid, [])
        
        game_stat = {
            "game_id": gid,
            "title": game.get("title", "Unknown"),
            "game_type": game.get("game_type", "quiz"),
            "play_count": plays_by_game.get(gid, 0),
            "unique_players": len(players_by_game.get(gid, set())),
            "avg_score": round(sum(game_scores) / len(game_scores), 1) if game_scores else 0,
            "best_score": max(game_scores) if game_scores else 0,
            "worst_score": min(game_scores) if game_scores else 0,
            "count_as_grade": game.get("count_as_grade", False),
            "grade_points": game.get("grade_points", 100)
        }
        analytics["game_stats"].append(game_stat)
    
    # Sort game_stats by play count descending
    analytics["game_stats"].sort(key=lambda x: x["play_count"], reverse=True)
    
    # Top games for backward compatibility
    analytics["top_games"] = [
        {"game_id": gs["game_id"], "title": gs["title"], "plays": gs["play_count"]}
        for gs in analytics["game_stats"][:5]
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


@router.put("/{game_id}/grade-settings")
async def update_game_grade_settings(
    game_id: str,
    settings: GameGradeSettings,
    user: dict = Depends(get_current_user)
):
    """Update grade settings for a game"""
    teacher_id = user.get("user_id")
    
    # Verify ownership
    game = await db.educational_games.find_one({
        "game_id": game_id,
        "teacher_id": teacher_id
    })
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found or unauthorized")
    
    await db.educational_games.update_one(
        {"game_id": game_id},
        {"$set": {
            "count_as_grade": settings.count_as_grade,
            "grade_points": settings.grade_points,
            "grade_method": settings.grade_method,
            "class_id": settings.class_id,
            "assignment_name": settings.assignment_name,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Grade settings updated", "game_id": game_id}


@router.post("/{game_id}/regenerate-questions")
async def regenerate_game_questions(
    game_id: str,
    player_name: str = None
):
    """
    Regenerate questions for a game to prevent memorization/cheating.
    Uses AI to create new questions based on the original content.
    Returns a new set of questions for this play session.
    """
    # Get the original game
    game = await db.educational_games.find_one({"game_id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    original_content = game.get("original_content", "")
    
    # If no original content stored, DERIVE content from existing questions
    if not original_content:
        existing_questions = game.get("questions", [])
        game_title = game.get("title", "Educational Game")
        game_type = game.get("game_type", "quiz")
        
        # Create derived content from the game title and questions
        if existing_questions:
            question_texts = []
            for q in existing_questions:
                if game_type == "true_false":
                    question_texts.append(q.get("question", ""))
                elif game_type == "quiz":
                    question_texts.append(f"{q.get('question', '')} Answer: {q.get('correct_answer', '')}")
                elif game_type == "flashcards":
                    question_texts.append(f"{q.get('question', q.get('term', ''))} = {q.get('correct_answer', q.get('definition', ''))}")
                elif game_type == "matching":
                    question_texts.append(f"{q.get('question', q.get('term', ''))} matches {q.get('correct_answer', q.get('match', ''))}")
                elif game_type == "fill_blanks":
                    question_texts.append(f"{q.get('question', '')} Answer: {q.get('correct_answer', '')}")
                else:
                    question_texts.append(q.get("question", ""))
            
            # Create derived content that describes the topic
            original_content = f"""Topic: {game_title}
Subject: {game.get('subject', 'general')}
Grade Level: {game.get('grade_level', '3-5')}

This game covers the following educational content:
{chr(10).join(question_texts)}

Use this information to create NEW and DIFFERENT questions about the same topic."""
            
            # Save the derived content for future regenerations
            await db.educational_games.update_one(
                {"game_id": game_id},
                {"$set": {"original_content": original_content}}
            )
            logger.info(f"Derived original_content for game {game_id} from existing questions")
        else:
            return {
                "questions": [],
                "regenerated": False,
                "message": "No questions available to derive content from"
            }
    
    # Check if AI access is available (this is a public endpoint, so we check game owner's access)
    teacher_id = game.get("teacher_id")
    if teacher_id:
        teacher = await db.users.find_one({"user_id": teacher_id}, {"_id": 0})
        if teacher:
            # Check if teacher has active subscription
            subscription = await db.subscriptions.find_one({"user_id": teacher_id, "status": "active"})
            if not subscription:
                # Check school subscription
                school_id = teacher.get("school_id")
                if school_id:
                    school_sub = await db.subscriptions.find_one({"school_id": school_id, "status": "active"})
                    if not school_sub:
                        # No active subscription, return existing questions
                        return {
                            "questions": game.get("questions", []),
                            "regenerated": False,
                            "message": "Subscription required for question regeneration"
                        }
    
    # Generate new questions using AI with AGGRESSIVE variation
    try:
        game_type = game.get("game_type", "quiz")
        grade_level = game.get("grade_level", "3-5")
        subject = game.get("subject", "other")
        question_count = game.get("question_count", len(game.get("questions", []))) or 5
        lang = game.get("language", "es")
        
        # Get ALL existing questions to COMPLETELY avoid
        existing_questions = game.get("questions", [])
        existing_q_texts = [q.get("question", "") for q in existing_questions]
        
        # Create AGGRESSIVE variation instructions based on game type
        if game_type == "true_false":
            variation_instructions = f"""
=== CRITICAL: TRUE/FALSE REGENERATION RULES ===
You MUST create COMPLETELY NEW and DIFFERENT true/false statements.

FORBIDDEN - DO NOT USE ANY OF THESE EXISTING STATEMENTS (or similar versions):
{chr(10).join(['- ' + q for q in existing_q_texts])}

REQUIREMENTS:
1. Create statements about ENTIRELY DIFFERENT facts from the topic
2. DO NOT rephrase or reword existing statements - create NEW ones
3. Cover DIFFERENT aspects: if existing questions are about dates, ask about people; if about people, ask about events
4. Use DIFFERENT sentence structures and vocabulary
5. Include some obscure/interesting facts not covered before
6. Mix TRUE and FALSE statements (not all true or all false)
7. Each statement MUST be verifiable and educationally accurate

If the topic is limited, expand to related sub-topics within the same subject area.
"""
        else:
            variation_instructions = f"""
=== CRITICAL: QUESTION REGENERATION RULES ===
You MUST create COMPLETELY NEW and DIFFERENT questions.

FORBIDDEN - DO NOT USE ANY OF THESE EXISTING QUESTIONS (or similar versions):
{chr(10).join(['- ' + q for q in existing_q_texts])}

REQUIREMENTS:
1. Ask about ENTIRELY DIFFERENT concepts within the topic
2. DO NOT rephrase existing questions - create completely NEW ones
3. Use DIFFERENT numbers, scenarios, and examples
4. If existing questions are about X, ask about Y instead
5. Vary difficulty levels (mix easy, medium, hard)
6. Use creative scenarios and real-world applications
"""
        
        # Create enhanced content with aggressive variation instructions
        variation_content = f"""{original_content}

{variation_instructions}
"""
        
        # Create a request for regeneration with variation emphasis
        regenerate_request = GameGenerateRequest(
            content=variation_content,
            game_type=game_type,
            grade_level=grade_level,
            subject=subject,
            question_count=question_count,
            language=lang
        )
        
        # Generate new questions
        new_game_data = await generate_game_with_validation(regenerate_request)
        
        # Track this regeneration for analytics
        await db.game_regenerations.insert_one({
            "game_id": game_id,
            "player_name": player_name,
            "regenerated_at": datetime.now(timezone.utc).isoformat(),
            "question_count": len(new_game_data.get("questions", []))
        })
        
        return {
            "questions": new_game_data.get("questions", []),
            "regenerated": True,
            "message": "New questions generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Question regeneration failed: {str(e)}")
        # Fallback to existing questions
        return {
            "questions": game.get("questions", []),
            "regenerated": False,
            "message": f"Regeneration failed, using existing questions: {str(e)}"
        }


@router.get("/{game_id}/student-stats")
async def get_game_student_stats(
    game_id: str,
    user: dict = Depends(get_current_user)
):
    """Get detailed student statistics for a specific game"""
    teacher_id = user.get("user_id")
    
    # Verify ownership
    game = await db.educational_games.find_one({
        "game_id": game_id,
        "teacher_id": teacher_id
    }, {"_id": 0})
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found or unauthorized")
    
    # Get all scores for this game
    scores = await db.game_scores.find(
        {"game_id": game_id},
        {"_id": 0}
    ).sort("submitted_at", -1).to_list(1000)
    
    # Group scores by player
    player_stats = {}
    for score in scores:
        player_key = score.get("student_id") or score.get("player_name")
        if player_key:
            if player_key not in player_stats:
                player_stats[player_key] = {
                    "player_name": score.get("player_name"),
                    "student_id": score.get("student_id"),
                    "attempts": [],
                    "best_score": 0,
                    "worst_score": 100,
                    "total_attempts": 0,
                    "first_attempt_date": score.get("submitted_at"),
                    "last_attempt_date": score.get("submitted_at")
                }
            
            pct = score.get("percentage", 0)
            player_stats[player_key]["attempts"].append({
                "score": score.get("score"),
                "percentage": pct,
                "time_taken": score.get("time_taken", 0),
                "submitted_at": score.get("submitted_at")
            })
            player_stats[player_key]["total_attempts"] += 1
            player_stats[player_key]["best_score"] = max(player_stats[player_key]["best_score"], pct)
            player_stats[player_key]["worst_score"] = min(player_stats[player_key]["worst_score"], pct)
            player_stats[player_key]["last_attempt_date"] = score.get("submitted_at")
    
    # Calculate averages
    for player_key in player_stats:
        attempts = player_stats[player_key]["attempts"]
        if attempts:
            player_stats[player_key]["average_score"] = round(
                sum(a["percentage"] for a in attempts) / len(attempts), 1
            )
            player_stats[player_key]["average_time"] = round(
                sum(a["time_taken"] for a in attempts) / len(attempts), 1
            )
    
    return {
        "game_id": game_id,
        "game_title": game.get("title", ""),
        "total_unique_players": len(player_stats),
        "total_plays": len(scores),
        "player_stats": list(player_stats.values()),
        "count_as_grade": game.get("count_as_grade", False),
        "grade_method": game.get("grade_method", "best")
    }

