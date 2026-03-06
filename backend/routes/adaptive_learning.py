"""
Adaptive Learning Routes
Handles personalized learning paths for students
"""
from fastapi import APIRouter, HTTPException, Depends, Body, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid
import json
import logging
import asyncio

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/adaptive-learning", tags=["adaptive-learning"])

# Configuration
AI_TIMEOUT_SECONDS = 90
MAX_RETRIES = 2
RETRY_DELAY = 1.0

# These will be set by the main app
db = None
_get_current_user_func = None
EMERGENT_LLM_KEY = None
FREE_TRIAL_DAYS = 7

def init_adaptive_learning_routes(database, auth_dependency, llm_key, trial_days):
    """Initialize the adaptive learning routes with dependencies"""
    global db, _get_current_user_func, EMERGENT_LLM_KEY, FREE_TRIAL_DAYS
    db = database
    _get_current_user_func = auth_dependency
    EMERGENT_LLM_KEY = llm_key
    FREE_TRIAL_DAYS = trial_days

async def get_current_user(request: Request):
    """Wrapper to call the actual auth dependency"""
    return await _get_current_user_func(request)


class AdaptiveLearningRequest(BaseModel):
    student_id: str
    subject: str
    grade_level: str = "3-5"
    language: str = "es"


class CompleteLessonRequest(BaseModel):
    student_id: str
    lesson_id: str
    subject: str


class StudentLearningLinkRequest(BaseModel):
    student_id: str
    subject: str
    path_id: Optional[str] = None


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


@router.post("/generate-path")
async def generate_adaptive_learning_path(
    request: AdaptiveLearningRequest,
    user: dict = Depends(get_current_user)
):
    """Generate a personalized adaptive learning path for a student using AI"""
    
    if not await check_ai_access(user):
        raise HTTPException(status_code=403, detail="AI features require an active subscription or trial period")
    
    # Get student info
    student = await db.students.find_one({"student_id": request.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student_name = student.get("name") or f"{student.get('first_name', '')} {student.get('last_name', '')}".strip()
    
    # Get prior learning data
    prior_progress = await db.adaptive_learning_progress.find_one({
        "student_id": request.student_id,
        "subject": request.subject
    }, {"_id": 0})
    
    completed_lessons = prior_progress.get("completed_lessons", []) if prior_progress else []
    current_level = prior_progress.get("current_level", 1) if prior_progress else 1
    
    # Subject and grade level mappings
    subject_names = {
        "math": {"en": "Mathematics", "es": "Matemáticas"},
        "language": {"en": "Language Arts", "es": "Lenguaje"},
        "science": {"en": "Science", "es": "Ciencias"},
        "reading": {"en": "Reading", "es": "Lectura"}
    }
    
    grade_level_descriptions = {
        "k-2": {"en": "Kindergarten to 2nd Grade (ages 5-7)", "es": "Kínder a 2do Grado (5-7 años)"},
        "3-5": {"en": "3rd to 5th Grade (ages 8-10)", "es": "3ro a 5to Grado (8-10 años)"},
        "6-8": {"en": "6th to 8th Grade (ages 11-13)", "es": "6to a 8vo Grado (11-13 años)"},
        "9-12": {"en": "9th to 12th Grade (ages 14-18)", "es": "9no a 12vo Grado (14-18 años)"}
    }
    
    subject_display = subject_names.get(request.subject, {"en": request.subject.title(), "es": request.subject.title()})
    grade_display = grade_level_descriptions.get(request.grade_level, grade_level_descriptions["3-5"])
    lang_key = "es" if request.language == "es" else "en"
    
    language_instruction = "Responde completamente en español." if request.language == "es" else "Respond entirely in English."
    
    system_prompt = f"""You are an expert adaptive learning curriculum designer for homeschool education. 
Your task is to create a personalized learning path that adapts to the student's pace and level.

{language_instruction}

Return ONLY a valid JSON object with no additional text."""

    user_prompt = f"""Create an adaptive learning path for:
- Student: {student_name}
- Subject: {subject_display[lang_key]}
- Grade Level: {grade_display[lang_key]}
- Current Level: {current_level}
- Completed Lessons: {len(completed_lessons)}

Generate a personalized learning path with 5-6 lessons that are APPROPRIATE FOR THE GRADE LEVEL.

Return JSON in this exact format:
{{
  "title": "Learning path title",
  "description": "Brief description",
  "level": {current_level},
  "grade_level": "{request.grade_level}",
  "lessons": [
    {{
      "id": "lesson_1",
      "title": "Lesson title",
      "objective": "What the student will learn",
      "duration": "15 min",
      "level": 1,
      "completed": false,
      "content": "Educational content paragraphs...",
      "questions": [
        {{
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_answer": "Option A"
        }}
      ]
    }}
  ]
}}

IMPORTANT: Each question MUST include a "correct_answer" field that matches exactly one of the options."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"adaptive_{request.student_id}_{uuid.uuid4().hex[:8]}",
            system_message=system_prompt
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
        user_message = UserMessage(text=user_prompt)
        
        # Apply 90-second timeout with retry logic
        response = None
        last_error = None
        
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = await asyncio.wait_for(
                    chat.send_message(user_message),
                    timeout=AI_TIMEOUT_SECONDS
                )
                break
            except asyncio.TimeoutError:
                last_error = "AI timed out after 90 seconds"
                logger.warning(f"Adaptive learning attempt {attempt + 1} timed out")
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY)
            except Exception as e:
                last_error = str(e)
                logger.warning(f"Adaptive learning attempt {attempt + 1} failed: {str(e)}")
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY)
        
        if response is None:
            raise HTTPException(
                status_code=503,
                detail="AI learning path generation timed out. Please try again."
            )
        
        response_text = response.text.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
        
        learning_path = json.loads(response_text)
        
        # Add metadata
        path_id = f"path_{uuid.uuid4().hex[:12]}"
        learning_path["path_id"] = path_id
        learning_path["student_id"] = request.student_id
        learning_path["subject"] = request.subject
        learning_path["created_at"] = datetime.now(timezone.utc).isoformat()
        
        # Save to database
        await db.adaptive_learning_paths.update_one(
            {"student_id": request.student_id, "subject": request.subject},
            {"$set": learning_path},
            upsert=True
        )
        
        return learning_path
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse learning path JSON: {e}")
        raise HTTPException(status_code=500, detail="Error parsing AI response")
    except Exception as e:
        logger.error(f"Error generating learning path: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating learning path: {str(e)}")


@router.post("/complete-lesson")
async def complete_lesson(
    request: CompleteLessonRequest,
    user: dict = Depends(get_current_user)
):
    """Mark a lesson as completed and update progress"""
    now = datetime.now(timezone.utc).isoformat()
    
    # Get or create progress record
    progress = await db.adaptive_learning_progress.find_one({
        "student_id": request.student_id,
        "subject": request.subject
    })
    
    if progress:
        completed_lessons = progress.get("completed_lessons", [])
        if request.lesson_id not in completed_lessons:
            completed_lessons.append(request.lesson_id)
            
            await db.adaptive_learning_progress.update_one(
                {"student_id": request.student_id, "subject": request.subject},
                {"$set": {
                    "completed_lessons": completed_lessons,
                    "last_completed_at": now,
                    "current_level": len(completed_lessons) // 3 + 1
                }}
            )
    else:
        await db.adaptive_learning_progress.insert_one({
            "student_id": request.student_id,
            "subject": request.subject,
            "current_level": 1,
            "completed_lessons": [request.lesson_id],
            "last_completed_at": now,
            "created_at": now
        })
    
    # Update lesson in learning path
    await db.adaptive_learning_paths.update_one(
        {"student_id": request.student_id, "subject": request.subject, "lessons.id": request.lesson_id},
        {"$set": {"lessons.$.completed": True}}
    )
    
    return {"message": "Lesson completed", "lesson_id": request.lesson_id}


@router.get("/progress/{student_id}")
async def get_student_progress(
    student_id: str,
    user: dict = Depends(get_current_user)
):
    """Get learning progress for a student across all subjects"""
    progress_list = await db.adaptive_learning_progress.find(
        {"student_id": student_id},
        {"_id": 0}
    ).to_list(10)
    
    paths = await db.adaptive_learning_paths.find(
        {"student_id": student_id},
        {"_id": 0}
    ).to_list(10)
    
    return {
        "student_id": student_id,
        "progress": progress_list,
        "learning_paths": paths
    }


@router.get("/dashboard/{student_id}")
async def get_adaptive_dashboard(
    student_id: str,
    user: dict = Depends(get_current_user)
):
    """Get comprehensive dashboard data for a student's adaptive learning"""
    student = await db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get all progress
    progress_list = await db.adaptive_learning_progress.find(
        {"student_id": student_id},
        {"_id": 0}
    ).to_list(10)
    
    # Get all paths
    paths = await db.adaptive_learning_paths.find(
        {"student_id": student_id},
        {"_id": 0}
    ).to_list(10)
    
    # Calculate statistics
    total_lessons = sum(len(p.get("lessons", [])) for p in paths)
    completed_lessons = sum(len(pr.get("completed_lessons", [])) for pr in progress_list)
    
    return {
        "student": {
            "name": student.get("name") or f"{student.get('first_name', '')} {student.get('last_name', '')}",
            "student_id": student_id
        },
        "statistics": {
            "total_subjects": len(paths),
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "completion_percentage": round((completed_lessons / total_lessons * 100) if total_lessons > 0 else 0, 1)
        },
        "progress_by_subject": progress_list,
        "learning_paths": paths
    }


@router.post("/generate-student-link")
async def generate_student_learning_link(
    request: StudentLearningLinkRequest,
    user: dict = Depends(get_current_user)
):
    """Generate a shareable link for students to access their learning path"""
    
    student = await db.students.find_one({"student_id": request.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check for existing valid token
    existing = await db.student_learning_tokens.find_one({
        "student_id": request.student_id,
        "subject": request.subject
    }, {"_id": 0})
    
    if existing:
        expires_at = existing.get("expires_at", "")
        if expires_at:
            try:
                exp_date = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                if exp_date > datetime.now(timezone.utc):
                    return {
                        "token": existing["token"],
                        "student_id": request.student_id,
                        "subject": request.subject,
                        "expires_at": expires_at,
                        "message": "Existing token still valid"
                    }
            except ValueError:
                pass
        await db.student_learning_tokens.delete_one({"token": existing["token"]})
    
    # Generate new token
    token = f"slt_{uuid.uuid4().hex}"
    expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    
    await db.student_learning_tokens.insert_one({
        "token": token,
        "student_id": request.student_id,
        "subject": request.subject,
        "path_id": request.path_id,
        "teacher_id": user.get("user_id"),
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "token": token,
        "student_id": request.student_id,
        "subject": request.subject,
        "expires_at": expires_at
    }


# Public endpoints (no auth required)
@router.get("/student/{token}")
async def get_student_learning_by_token(token: str):
    """Public endpoint - Get student learning path by token"""
    
    token_doc = await db.student_learning_tokens.find_one({"token": token}, {"_id": 0})
    if not token_doc:
        raise HTTPException(status_code=404, detail="Invalid or expired token")
    
    # Check expiration
    expires_at = token_doc.get("expires_at", "")
    if expires_at:
        try:
            exp_date = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            if exp_date <= datetime.now(timezone.utc):
                raise HTTPException(status_code=410, detail="Token has expired")
        except ValueError:
            pass
    
    student_id = token_doc.get("student_id")
    subject = token_doc.get("subject")
    
    student = await db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    learning_path = await db.adaptive_learning_paths.find_one({
        "student_id": student_id,
        "subject": subject
    }, {"_id": 0})
    
    progress = await db.adaptive_learning_progress.find_one({
        "student_id": student_id,
        "subject": subject
    }, {"_id": 0})
    
    return {
        "student": {
            "name": student.get("name") or f"{student.get('first_name', '')} {student.get('last_name', '')}".strip(),
            "student_id": student_id
        },
        "subject": subject,
        "learning_path": learning_path,
        "progress": progress,
        "token": token
    }


@router.post("/student/{token}/complete-lesson")
async def student_complete_lesson_by_token(token: str, lesson_id: str = Body(..., embed=True)):
    """Public endpoint - Mark a lesson as complete via token"""
    
    token_doc = await db.student_learning_tokens.find_one({"token": token}, {"_id": 0})
    if not token_doc:
        raise HTTPException(status_code=404, detail="Invalid or expired token")
    
    # Check expiration
    expires_at = token_doc.get("expires_at", "")
    if expires_at:
        try:
            exp_date = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            if exp_date <= datetime.now(timezone.utc):
                raise HTTPException(status_code=410, detail="Token has expired")
        except ValueError:
            pass
    
    student_id = token_doc.get("student_id")
    subject = token_doc.get("subject")
    now = datetime.now(timezone.utc).isoformat()
    
    progress = await db.adaptive_learning_progress.find_one({
        "student_id": student_id,
        "subject": subject
    })
    
    if progress:
        completed_lessons = progress.get("completed_lessons", [])
        if lesson_id not in completed_lessons:
            completed_lessons.append(lesson_id)
            
            await db.adaptive_learning_progress.update_one(
                {"student_id": student_id, "subject": subject},
                {"$set": {
                    "completed_lessons": completed_lessons,
                    "last_completed_at": now
                }}
            )
    else:
        await db.adaptive_learning_progress.insert_one({
            "student_id": student_id,
            "subject": subject,
            "current_level": 1,
            "completed_lessons": [lesson_id],
            "last_completed_at": now,
            "created_at": now
        })
    
    # Update learning path
    await db.adaptive_learning_paths.update_one(
        {"student_id": student_id, "subject": subject, "lessons.id": lesson_id},
        {"$set": {"lessons.$.completed": True}}
    )
    
    return {"success": True, "lesson_id": lesson_id, "completed_at": now}
