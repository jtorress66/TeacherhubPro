"""
Educational Games Routes
Handles game generation, saving, playing, and analytics
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid
import json
import logging

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/games", tags=["games"])

# These will be set by the main app
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

async def get_current_user(request):
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
    
    # Check subscription
    subscription = await db.subscriptions.find_one({"user_id": user_id, "status": "active"})
    if subscription:
        return True
    
    # Check school subscription
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if user_doc:
        school_id = user_doc.get("school_id")
        if school_id:
            school_sub = await db.subscriptions.find_one({"school_id": school_id, "status": "active"})
            if school_sub:
                return True
        
        # Check trial period
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


@router.post("/generate")
async def generate_educational_game(
    request: GameGenerateRequest,
    user: dict = Depends(get_current_user)
):
    """Generate an educational game from lesson content using AI"""
    
    # Check AI access
    if not await check_ai_access(user):
        raise HTTPException(status_code=403, detail="AI features require an active subscription or trial period")
    
    # Game type specific prompts
    game_prompts = {
        "quiz": "multiple choice quiz with 4 options each",
        "matching": "matching game where students connect related concepts",
        "fill_blanks": "fill in the blanks exercise",
        "true_false": "true or false questions",
        "flashcards": "flashcards for memorization",
        "word_search": "word search puzzle with educational vocabulary",
        "crossword": "crossword puzzle with educational clues",
        "drag_drop": "drag and drop sorting/categorization exercise"
    }
    
    # Grade level descriptions
    grade_level_hints = {
        "k-2": "Use simple words, short sentences. Focus on basic concepts. Very beginner friendly for ages 5-7.",
        "3-5": "Use grade-appropriate vocabulary. Concepts should be intermediate level for ages 8-10.",
        "6-8": "Use middle-school vocabulary and concepts. Can include more complex ideas for ages 11-13.",
        "9-12": "Use high school level content. Can include advanced concepts for ages 14-18."
    }
    
    # Subject descriptions
    subject_hints = {
        "math": "Mathematics - focus on numerical concepts, calculations, problem-solving",
        "english": "English/Language Arts - focus on grammar, vocabulary, reading comprehension, writing",
        "science": "Science - focus on scientific concepts, experiments, natural phenomena",
        "social_studies": "Social Studies - focus on society, communities, citizenship",
        "history": "History - focus on historical events, people, and time periods",
        "geography": "Geography - focus on places, maps, cultures, and environments",
        "art": "Art - focus on artistic concepts, techniques, and creativity",
        "music": "Music - focus on musical concepts, instruments, and composition",
        "pe": "Physical Education - focus on sports, health, and fitness",
        "other": "General educational content"
    }
    
    lang_instruction = "Responde completamente en español." if request.language == "es" else "Respond entirely in English."
    
    system_prompt = f"""You are an expert educational game designer. Create engaging, age-appropriate educational games from lesson content.
{lang_instruction}
Return ONLY valid JSON with no additional text."""

    # Game-specific JSON templates
    game_templates = {
        "quiz": '''{{
  "title": "Game title",
  "game_type": "quiz",
  "grade_level": "{grade_level}",
  "subject": "{subject}",
  "questions": [
    {{
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "The correct option text"
    }}
  ]
}}''',
        "true_false": '''{{
  "title": "Game title",
  "game_type": "true_false",
  "grade_level": "{grade_level}",
  "subject": "{subject}",
  "questions": [
    {{
      "question": "Statement that is either true or false",
      "options": ["True", "False"],
      "correct_answer": "True or False"
    }}
  ]
}}''',
        "fill_blanks": '''{{
  "title": "Game title",
  "game_type": "fill_blanks",
  "grade_level": "{grade_level}",
  "subject": "{subject}",
  "questions": [
    {{
      "question": "Complete sentence with ___ where word should go",
      "correct_answer": "correct word",
      "hint": "Optional hint"
    }}
  ]
}}''',
        "matching": '''{{
  "title": "Game title",
  "game_type": "matching",
  "grade_level": "{grade_level}",
  "subject": "{subject}",
  "questions": [
    {{
      "question": "Term to match",
      "correct_answer": "Matching definition"
    }}
  ]
}}''',
        "flashcards": '''{{
  "title": "Game title",
  "game_type": "flashcards",
  "grade_level": "{grade_level}",
  "subject": "{subject}",
  "questions": [
    {{
      "question": "Front of card (term or question)",
      "correct_answer": "Back of card (definition or answer)"
    }}
  ]
}}''',
        "word_search": '''{{
  "title": "Game title",
  "game_type": "word_search",
  "grade_level": "{grade_level}",
  "subject": "{subject}",
  "questions": [
    {{
      "word": "VOCABULARY",
      "hint": "Hint about the word"
    }}
  ]
}}''',
        "crossword": '''{{
  "title": "Game title",
  "game_type": "crossword",
  "grade_level": "{grade_level}",
  "subject": "{subject}",
  "questions": [
    {{
      "clue": "Clue text",
      "correct_answer": "ANSWER",
      "direction": "across or down",
      "number": 1
    }}
  ]
}}''',
        "drag_drop": '''{{
  "title": "Game title",
  "game_type": "drag_drop",
  "grade_level": "{grade_level}",
  "subject": "{subject}",
  "questions": [
    {{
      "instruction": "Put these in the correct order",
      "items": ["Item 1", "Item 2", "Item 3", "Item 4"],
      "correct_order": ["Item 2", "Item 1", "Item 4", "Item 3"]
    }}
  ]
}}'''
    }

    user_prompt = f"""Create a {game_prompts.get(request.game_type, 'quiz')} based on this lesson content:

{request.content}

Requirements:
- Create exactly {request.question_count} questions/items
- Grade Level: {grade_level_hints.get(request.grade_level, grade_level_hints['3-5'])}
- Subject: {subject_hints.get(request.subject, 'General educational content')}
- Make it educational, engaging and interactive
- Use language and concepts appropriate for the grade level

{game_templates.get(request.game_type, game_templates['quiz']).format(grade_level=request.grade_level, subject=request.subject)}"""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"game_{uuid.uuid4().hex[:8]}",
            system_message=system_prompt
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
        user_message = UserMessage(text=user_prompt)
        response = await chat.send_message(user_message)
        
        # Parse AI response
        response_text = response.text.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
        
        game_data = json.loads(response_text)
        game_data["game_id"] = f"game_{uuid.uuid4().hex[:12]}"
        game_data["created_at"] = datetime.now(timezone.utc).isoformat()
        game_data["grade_level"] = request.grade_level
        game_data["subject"] = request.subject
        
        return game_data
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse game JSON: {e}")
        raise HTTPException(status_code=500, detail="Error parsing AI response")
    except Exception as e:
        logger.error(f"Error generating game: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating game: {str(e)}")


@router.post("/save")
async def save_educational_game(
    game: dict,
    user: dict = Depends(get_current_user)
):
    """Save a generated educational game"""
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
            "created_at": game.get("created_at") or datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return {"message": "Game saved", "game_id": game_id}


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
        "created_at": game.get("created_at")
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
    
    # Get all teacher's games
    games = await db.educational_games.find(
        {"teacher_id": teacher_id},
        {"_id": 0, "game_id": 1, "title": 1, "game_type": 1}
    ).to_list(100)
    
    game_ids = [g["game_id"] for g in games]
    
    # Get scores for these games
    scores = await db.game_scores.find(
        {"game_id": {"$in": game_ids}},
        {"_id": 0}
    ).to_list(1000)
    
    # Calculate analytics
    analytics = {
        "total_games": len(games),
        "total_plays": len(scores),
        "average_score": round(sum(s.get("percentage", 0) for s in scores) / len(scores), 1) if scores else 0,
        "games_by_type": {},
        "top_games": []
    }
    
    # Games by type
    for game in games:
        game_type = game.get("game_type", "quiz")
        analytics["games_by_type"][game_type] = analytics["games_by_type"].get(game_type, 0) + 1
    
    # Top games by plays
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


# Progress saving endpoint
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
