"""
AI Grading and Assignment Generation Routes
Handles AI-powered assignment creation and grading for TeacherHubPro
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import os
import json
import logging
import asyncio

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-grading", tags=["ai-grading"])

# Configuration
AI_TIMEOUT_SECONDS = 90  # 90 second timeout as recommended by support
MAX_RETRIES = 2
RETRY_DELAY = 1.0

db = None
_get_current_user_func = None

def init_ai_grading_routes(database, auth_dependency=None):
    """Initialize routes with database connection and auth dependency"""
    global db, _get_current_user_func
    db = database
    _get_current_user_func = auth_dependency

async def get_current_user(request: Request):
    """Wrapper to call the actual auth dependency"""
    if _get_current_user_func:
        return await _get_current_user_func(request)
    return None

# Pydantic Models
class QuestionOption(BaseModel):
    text: str
    is_correct: bool = False

class Question(BaseModel):
    question_id: str = ""
    question_type: str  # multiple_choice, short_answer, essay, fill_blank, matching, true_false
    question_text: str
    points: int = 10
    options: Optional[List[QuestionOption]] = None
    correct_answer: Optional[str] = None
    matching_pairs: Optional[Dict[str, str]] = None
    rubric_criteria: Optional[List[str]] = None

class AIAssignmentRequest(BaseModel):
    topic: str
    grade_level: str  # K, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
    subject: str
    question_types: List[str]  # multiple_choice, short_answer, essay, fill_blank, matching, true_false
    num_questions: int = 5
    difficulty: str = "medium"  # easy, medium, hard
    language: str = "en"
    additional_instructions: Optional[str] = None

class AIAssignmentCreate(BaseModel):
    class_id: str
    category_id: str
    title: str
    description: Optional[str] = ""
    instructions: str
    questions: List[Dict[str, Any]]
    points: int = 100
    due_date: Optional[str] = None
    grade_level: str
    grading_mode: str = "ai_suggest"  # auto, ai_suggest, manual
    ai_generated: bool = False

class StudentSubmissionCreate(BaseModel):
    student_name: str
    student_email: str
    answers: Dict[str, Any]

class AIGradeRequest(BaseModel):
    auto_approve: bool = False

class ManualGradeUpdate(BaseModel):
    final_score: float
    teacher_feedback: Optional[str] = None

# Grade level rubric configurations
GRADE_LEVEL_RUBRICS = {
    "K": {"leniency": "very_high", "focus": "effort and participation", "spelling_matters": False},
    "1": {"leniency": "very_high", "focus": "basic understanding", "spelling_matters": False},
    "2": {"leniency": "high", "focus": "basic understanding", "spelling_matters": False},
    "3": {"leniency": "high", "focus": "comprehension", "spelling_matters": False},
    "4": {"leniency": "medium_high", "focus": "comprehension and expression", "spelling_matters": True},
    "5": {"leniency": "medium_high", "focus": "comprehension and expression", "spelling_matters": True},
    "6": {"leniency": "medium", "focus": "analysis and expression", "spelling_matters": True},
    "7": {"leniency": "medium", "focus": "analysis and critical thinking", "spelling_matters": True},
    "8": {"leniency": "medium", "focus": "analysis and critical thinking", "spelling_matters": True},
    "9": {"leniency": "standard", "focus": "critical analysis", "spelling_matters": True},
    "10": {"leniency": "standard", "focus": "critical analysis", "spelling_matters": True},
    "11": {"leniency": "strict", "focus": "advanced analysis", "spelling_matters": True},
    "12": {"leniency": "strict", "focus": "college-level analysis", "spelling_matters": True},
}

def get_llm_chat(session_id: str, system_message: str) -> LlmChat:
    """Initialize LLM chat with Claude Sonnet 4.6"""
    api_key = os.environ.get('EMERGENT_LLM_KEY', '')
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=system_message
    ).with_model("anthropic", "claude-sonnet-4-6")
    
    return chat

# ==================== AI Assignment Generation ====================

@router.post("/generate-assignment")
async def generate_assignment(request: AIAssignmentRequest, user: dict = Depends(get_current_user)):
    """Generate an AI-powered assignment"""
    try:
        question_types_str = ", ".join(request.question_types)
        
        system_message = f"""You are an expert educational content creator. Generate high-quality, age-appropriate assignments for grade {request.grade_level} students.
        
Your assignments should:
- Be engaging and educational
- Match the difficulty level: {request.difficulty}
- Be appropriate for grade {request.grade_level}
- Include clear instructions
- Have well-structured questions with unambiguous answers for objective questions
- For essays, provide clear rubric criteria

Always respond with valid JSON only, no additional text."""

        prompt = f"""Create an assignment about "{request.topic}" for {request.subject} class.

Requirements:
- Grade Level: {request.grade_level}
- Number of Questions: {request.num_questions}
- Question Types to include: {question_types_str}
- Difficulty: {request.difficulty}
- Language: {"Spanish" if request.language == "es" else "English"}
{f"- Additional Instructions: {request.additional_instructions}" if request.additional_instructions else ""}

Return a JSON object with this exact structure:
{{
    "title": "Assignment title",
    "description": "Brief description of the assignment",
    "instructions": "Clear instructions for students",
    "questions": [
        {{
            "question_id": "q1",
            "question_type": "multiple_choice|short_answer|essay|fill_blank|matching|true_false",
            "question_text": "The question text",
            "points": 10,
            "options": [
                {{"text": "Option A", "is_correct": true}},
                {{"text": "Option B", "is_correct": false}}
            ],
            "correct_answer": "For short answer/fill_blank/true_false questions",
            "matching_pairs": {{"left1": "right1", "left2": "right2"}},
            "rubric_criteria": ["Criterion 1", "Criterion 2"]
        }}
    ],
    "total_points": 100
}}

For multiple_choice: include "options" array with is_correct flags
For short_answer/fill_blank: include "correct_answer" 
For true_false: include "correct_answer" as "true" or "false"
For essay: include "rubric_criteria" array
For matching: include "matching_pairs" object"""

        chat = get_llm_chat(
            session_id=f"assign_gen_{uuid.uuid4().hex[:8]}",
            system_message=system_message
        )
        
        # Apply 90-second timeout with retry logic
        response = None
        last_error = None
        
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = await asyncio.wait_for(
                    chat.send_message(UserMessage(text=prompt)),
                    timeout=AI_TIMEOUT_SECONDS
                )
                break
            except asyncio.TimeoutError:
                last_error = "AI generation timed out after 90 seconds"
                logger.warning(f"AI assignment generation attempt {attempt + 1} timed out")
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY)
            except Exception as e:
                last_error = str(e)
                logger.warning(f"AI assignment generation attempt {attempt + 1} failed: {str(e)}")
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY)
        
        if response is None:
            raise HTTPException(
                status_code=503,
                detail="AI assignment generation timed out. Please try again."
            )
        
        # Parse the JSON response
        response_text = response.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()
        
        assignment_data = json.loads(response_text)
        assignment_data["ai_generated"] = True
        assignment_data["grade_level"] = request.grade_level
        
        return assignment_data
            
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to parse AI-generated assignment")
    except Exception as e:
        logger.error(f"Assignment generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate assignment: {str(e)}")


@router.post("/assignments")
async def create_ai_assignment(assignment: AIAssignmentCreate, user: dict = Depends(get_current_user)):
    """Create and save an AI-generated assignment"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Verify class exists
    class_doc = await db.classes.find_one({"class_id": assignment.class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    assignment_id = f"aiassign_{uuid.uuid4().hex[:8]}"
    public_token = uuid.uuid4().hex[:12]
    
    # Process questions and add IDs
    questions_with_ids = []
    total_points = 0
    for i, q in enumerate(assignment.questions):
        q_dict = dict(q) if not isinstance(q, dict) else q
        if not q_dict.get("question_id"):
            q_dict["question_id"] = f"q{i+1}"
        total_points += q_dict.get("points", 10)
        questions_with_ids.append(q_dict)
    
    assignment_doc = {
        "assignment_id": assignment_id,
        "class_id": assignment.class_id,
        "category_id": assignment.category_id,
        "teacher_id": user["user_id"] if user else None,
        "title": assignment.title,
        "description": assignment.description,
        "instructions": assignment.instructions,
        "questions": questions_with_ids,
        "points": total_points,
        "due_date": assignment.due_date,
        "grade_level": assignment.grade_level,
        "grading_mode": assignment.grading_mode,
        "ai_generated": assignment.ai_generated,
        "public_token": public_token,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "submission_count": 0,
        "graded_count": 0
    }
    
    logger.info(f"Saving AI assignment: {assignment.title} with token: {public_token}")
    result = await db.ai_assignments.insert_one(assignment_doc)
    logger.info(f"AI assignment saved with id: {result.inserted_id}")
    
    # Remove MongoDB _id before returning
    assignment_doc.pop("_id", None)
    return assignment_doc


@router.get("/assignments")
async def get_ai_assignments(class_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    """Get all AI assignments for a teacher"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    query = {}
    
    # If class_id provided, filter by it
    if class_id:
        query["class_id"] = class_id
    elif user:
        # Get all classes owned by this teacher first
        teacher_classes = await db.classes.find(
            {"teacher_id": user["user_id"]}, 
            {"class_id": 1}
        ).to_list(100)
        class_ids = [c["class_id"] for c in teacher_classes]
        
        # Get assignments either by teacher_id OR by class_id
        if class_ids:
            query["$or"] = [
                {"teacher_id": user["user_id"]},
                {"class_id": {"$in": class_ids}}
            ]
        else:
            query["teacher_id"] = user["user_id"]
    
    assignments = await db.ai_assignments.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return assignments


@router.get("/assignments/{assignment_id}")
async def get_ai_assignment(assignment_id: str, user: dict = Depends(get_current_user)):
    """Get a specific AI assignment"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    assignment = await db.ai_assignments.find_one({"assignment_id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    return assignment


@router.delete("/assignments/{assignment_id}")
async def delete_ai_assignment(assignment_id: str, user: dict = Depends(get_current_user)):
    """Delete an AI assignment"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    result = await db.ai_assignments.delete_one({"assignment_id": assignment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    await db.ai_submissions.delete_many({"assignment_id": assignment_id})
    
    return {"message": "Assignment deleted"}


# ==================== Student Submission (Public - No Auth) ====================

@router.get("/student/{token}")
async def get_student_assignment(token: str):
    """Get assignment for student submission (PUBLIC - no auth required)"""
    if db is None:
        logger.error("Database not initialized for student assignment lookup")
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    logger.info(f"Looking up assignment with public_token: {token}")
    
    try:
        assignment = await db.ai_assignments.find_one({"public_token": token}, {"_id": 0})
        
        # Also check regular assignments collection
        is_manual = False
        if not assignment:
            assignment = await db.assignments.find_one({"public_token": token}, {"_id": 0})
            if assignment:
                is_manual = True
        
        if not assignment:
            # Log all tokens for debugging
            all_tokens = await db.ai_assignments.find({}, {"public_token": 1, "title": 1, "_id": 0}).to_list(20)
            logger.warning(f"Assignment not found for token: {token}. Available tokens: {[a.get('public_token') for a in all_tokens]}")
            raise HTTPException(status_code=404, detail="Assignment not found or link expired")
        
        logger.info(f"Found assignment: {assignment.get('title')}")
        
        # Get class info for display (optional, won't fail if class doesn't exist)
        class_doc = None
        school_doc = None
        if assignment.get("class_id"):
            class_doc = await db.classes.find_one({"class_id": assignment["class_id"]}, {"_id": 0, "name": 1, "school_id": 1})
            if class_doc and class_doc.get("school_id"):
                school_doc = await db.schools.find_one({"school_id": class_doc["school_id"]}, {"_id": 0, "name": 1, "logo_url": 1})
        
        # Return assignment without answers for students - use .get() for safety
        student_assignment = {
            "assignment_id": assignment.get("assignment_id", ""),
            "title": assignment.get("title", "Untitled Assignment"),
            "description": assignment.get("description", ""),
            "instructions": assignment.get("instructions", ""),
            "class_name": class_doc.get("name", "") if class_doc else "",
            "school_name": school_doc.get("name", "") if school_doc else "",
            "school_logo_url": school_doc.get("logo_url", "") if school_doc else "",
            "due_date": assignment.get("due_date"),
            "total_points": assignment.get("points", 100),
            "questions": [],
            "attachments": assignment.get("attachments", []),
            "is_manual": is_manual
        }
        
        # Remove correct answers from questions
        questions = assignment.get("questions", [])
        for i, q in enumerate(questions):
            student_q = {
                "question_id": q.get("question_id", f"q{i+1}"),
                "question_type": q.get("question_type", "short_answer"),
                "question_text": q.get("question_text", ""),
                "points": q.get("points", 10)
            }
            question_type = q.get("question_type", "")
            if question_type == "multiple_choice":
                student_q["options"] = [{"text": opt.get("text", "")} for opt in q.get("options", [])]
            elif question_type == "matching":
                pairs = q.get("matching_pairs", {})
                student_q["left_items"] = list(pairs.keys()) if pairs else []
                student_q["right_items"] = list(pairs.values()) if pairs else []
            elif question_type == "true_false":
                # Manual assignments may already have True/False options
                opts = q.get("options", [])
                if opts:
                    student_q["options"] = [{"text": opt.get("text", "")} for opt in opts]
                else:
                    student_q["options"] = [{"text": "True"}, {"text": "False"}]
            
            student_assignment["questions"].append(student_q)
        
        return student_assignment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing student assignment request for token {token}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error loading assignment: {str(e)}")


@router.post("/student/{token}/submit")
async def submit_student_assignment(token: str, submission: StudentSubmissionCreate):
    """Submit assignment answers (PUBLIC - no auth required)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    assignment = await db.ai_assignments.find_one({"public_token": token}, {"_id": 0})
    is_manual = False
    if not assignment:
        assignment = await db.assignments.find_one({"public_token": token}, {"_id": 0})
        if assignment:
            is_manual = True
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check for duplicate submission from same email
    existing = await db.ai_submissions.find_one({
        "assignment_id": assignment["assignment_id"],
        "student_email": submission.student_email.lower()
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted this assignment")
    
    submission_id = f"sub_{uuid.uuid4().hex[:8]}"
    
    submission_doc = {
        "submission_id": submission_id,
        "assignment_id": assignment["assignment_id"],
        "class_id": assignment["class_id"],
        "teacher_id": assignment.get("teacher_id"),
        "student_name": submission.student_name,
        "student_email": submission.student_email.lower(),
        "answers": submission.answers,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "status": "pending",
        "ai_score": None,
        "ai_feedback": None,
        "ai_question_scores": None,
        "final_score": None,
        "teacher_feedback": None,
        "graded_at": None
    }
    
    await db.ai_submissions.insert_one(submission_doc)
    
    # Update assignment submission count
    collection = db.assignments if is_manual else db.ai_assignments
    await collection.update_one(
        {"assignment_id": assignment["assignment_id"]},
        {"$inc": {"submission_count": 1}}
    )
    
    return {"message": "Assignment submitted successfully", "submission_id": submission_id}


# ==================== AI Grading ====================

@router.get("/submissions")
async def get_submissions(
    assignment_id: Optional[str] = None, 
    status: Optional[str] = None, 
    user: dict = Depends(get_current_user)
):
    """Get submissions for grading"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    query = {}
    
    if assignment_id:
        query["assignment_id"] = assignment_id
    elif user:
        # Get all classes owned by this teacher
        teacher_classes = await db.classes.find(
            {"teacher_id": user["user_id"]}, 
            {"class_id": 1}
        ).to_list(100)
        class_ids = [c["class_id"] for c in teacher_classes]
        
        if class_ids:
            query["$or"] = [
                {"teacher_id": user["user_id"]},
                {"class_id": {"$in": class_ids}}
            ]
        else:
            query["teacher_id"] = user["user_id"]
    
    if status:
        query["status"] = status
    
    submissions = await db.ai_submissions.find(query, {"_id": 0}).sort("submitted_at", -1).to_list(500)
    return submissions
    return submissions


@router.get("/submissions/{submission_id}")
async def get_submission(submission_id: str, user: dict = Depends(get_current_user)):
    """Get a specific submission with full details"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    submission = await db.ai_submissions.find_one({"submission_id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Get assignment for context
    assignment = await db.ai_assignments.find_one(
        {"assignment_id": submission["assignment_id"]}, 
        {"_id": 0}
    )
    
    return {
        "submission": submission,
        "assignment": assignment
    }


@router.post("/submissions/{submission_id}/grade")
async def ai_grade_submission(
    submission_id: str, 
    request: AIGradeRequest = None, 
    user: dict = Depends(get_current_user)
):
    """Grade a submission using AI"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    submission = await db.ai_submissions.find_one({"submission_id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    assignment = await db.ai_assignments.find_one(
        {"assignment_id": submission["assignment_id"]}, 
        {"_id": 0}
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Update status to grading
    await db.ai_submissions.update_one(
        {"submission_id": submission_id},
        {"$set": {"status": "grading"}}
    )
    
    try:
        # Get grade level rubric
        grade_level = assignment.get("grade_level", "6")
        rubric = GRADE_LEVEL_RUBRICS.get(grade_level, GRADE_LEVEL_RUBRICS["6"])
        
        system_message = f"""You are an expert teacher grading student work. 
Grade Level: {grade_level}
Grading Leniency: {rubric['leniency']}
Focus: {rubric['focus']}
Spelling Strictness: {"Consider spelling errors" if rubric['spelling_matters'] else "Be lenient with spelling for this grade level"}

Be encouraging and constructive in your feedback. For younger students (K-3), focus on effort and participation.
Always respond with valid JSON only."""

        # Build grading prompt
        questions_text = ""
        for q in assignment["questions"]:
            q_id = q["question_id"]
            student_answer = submission["answers"].get(q_id, "No answer provided")
            
            questions_text += f"""
Question {q_id} ({q.get('points', 10)} points) - Type: {q['question_type']}
Question: {q['question_text']}
"""
            if q["question_type"] == "multiple_choice":
                correct = [opt["text"] for opt in q.get("options", []) if opt.get("is_correct")]
                questions_text += f"Correct Answer: {correct[0] if correct else 'N/A'}\n"
            elif q["question_type"] in ["short_answer", "fill_blank", "true_false"]:
                questions_text += f"Correct Answer: {q.get('correct_answer', 'N/A')}\n"
            elif q["question_type"] == "matching":
                questions_text += f"Correct Pairs: {q.get('matching_pairs', {})}\n"
            elif q["question_type"] == "essay":
                questions_text += f"Rubric Criteria: {q.get('rubric_criteria', [])}\n"
            
            questions_text += f"Student's Answer: {student_answer}\n"

        prompt = f"""Grade this student submission:

Student: {submission['student_name']}
Assignment: {assignment['title']}
Total Points: {assignment['points']}

{questions_text}

Return a JSON object with this structure:
{{
    "total_score": <number>,
    "percentage": <number>,
    "letter_grade": "A/B/C/D/F",
    "overall_feedback": "Encouraging overall feedback for the student",
    "question_scores": {{
        "q1": {{
            "score": <number>,
            "max_points": <number>,
            "feedback": "Specific feedback for this question",
            "is_correct": true/false
        }}
    }}
}}

Be age-appropriate in your feedback. For elementary students, be very encouraging."""

        chat = get_llm_chat(
            session_id=f"grade_{submission_id}",
            system_message=system_message
        )
        
        # Apply 90-second timeout with retry logic
        response = None
        last_error = None
        
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = await asyncio.wait_for(
                    chat.send_message(UserMessage(text=prompt)),
                    timeout=AI_TIMEOUT_SECONDS
                )
                break
            except asyncio.TimeoutError:
                last_error = "AI grading timed out after 90 seconds"
                logger.warning(f"AI grading attempt {attempt + 1} timed out")
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY)
            except Exception as e:
                last_error = str(e)
                logger.warning(f"AI grading attempt {attempt + 1} failed: {str(e)}")
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY)
        
        if response is None:
            raise HTTPException(
                status_code=503,
                detail="AI grading timed out. Please try again."
            )
        
        # Parse response
        response_text = response.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()
        
        grade_result = json.loads(response_text)
        
        # Determine final score based on grading mode
        auto_approve = request.auto_approve if request else False
        grading_mode = assignment.get("grading_mode", "ai_suggest")
        
        update_data = {
            "ai_score": grade_result["total_score"],
            "ai_feedback": grade_result["overall_feedback"],
            "ai_question_scores": grade_result["question_scores"],
            "ai_percentage": grade_result["percentage"],
            "ai_letter_grade": grade_result["letter_grade"]
        }
        
        if grading_mode == "auto" or auto_approve:
            update_data["status"] = "graded"
            update_data["final_score"] = grade_result["total_score"]
            update_data["graded_at"] = datetime.now(timezone.utc).isoformat()
            
            # Update graded count
            await db.ai_assignments.update_one(
                {"assignment_id": submission["assignment_id"]},
                {"$inc": {"graded_count": 1}}
            )
        else:
            update_data["status"] = "pending_review"
        
        await db.ai_submissions.update_one(
            {"submission_id": submission_id},
            {"$set": update_data}
        )
        
        return {
            "message": "Grading complete",
            "grade_result": grade_result,
            "status": update_data["status"]
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI grading response: {str(e)}")
        await db.ai_submissions.update_one(
            {"submission_id": submission_id},
            {"$set": {"status": "grading_failed"}}
        )
        raise HTTPException(status_code=500, detail="AI grading failed to parse response")
    except Exception as e:
        logger.error(f"AI grading error: {str(e)}")
        await db.ai_submissions.update_one(
            {"submission_id": submission_id},
            {"$set": {"status": "grading_failed"}}
        )
        raise HTTPException(status_code=500, detail=f"AI grading failed: {str(e)}")


@router.put("/submissions/{submission_id}/approve")
async def approve_grade(submission_id: str, update: ManualGradeUpdate, user: dict = Depends(get_current_user)):
    """Approve or adjust AI-suggested grade"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    submission = await db.ai_submissions.find_one({"submission_id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    was_not_graded = submission["status"] != "graded"
    
    await db.ai_submissions.update_one(
        {"submission_id": submission_id},
        {"$set": {
            "final_score": update.final_score,
            "teacher_feedback": update.teacher_feedback,
            "status": "graded",
            "graded_at": datetime.now(timezone.utc).isoformat(),
            "graded_by": user["user_id"] if user else None
        }}
    )
    
    # Update graded count if this was newly graded
    if was_not_graded:
        await db.ai_assignments.update_one(
            {"assignment_id": submission["assignment_id"]},
            {"$inc": {"graded_count": 1}}
        )
    
    return {"message": "Grade approved"}


# ==================== Statistics ====================

@router.get("/stats")
async def get_grading_stats(user: dict = Depends(get_current_user)):
    """Get AI grading statistics for dashboard"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    query = {}
    if user:
        # Get all classes owned by this teacher
        teacher_classes = await db.classes.find(
            {"teacher_id": user["user_id"]}, 
            {"class_id": 1}
        ).to_list(100)
        class_ids = [c["class_id"] for c in teacher_classes]
        
        if class_ids:
            query["$or"] = [
                {"teacher_id": user["user_id"]},
                {"class_id": {"$in": class_ids}}
            ]
        else:
            query["teacher_id"] = user["user_id"]
    
    total_assignments = await db.ai_assignments.count_documents(query)
    total_submissions = await db.ai_submissions.count_documents(query)
    pending_grading = await db.ai_submissions.count_documents({**query, "status": "pending"})
    pending_review = await db.ai_submissions.count_documents({**query, "status": "pending_review"})
    graded = await db.ai_submissions.count_documents({**query, "status": "graded"})
    
    return {
        "total_assignments": total_assignments,
        "total_submissions": total_submissions,
        "pending_grading": pending_grading,
        "pending_review": pending_review,
        "graded": graded
    }


# ==================== Debug Endpoint ====================

@router.get("/debug/tokens")
async def debug_list_tokens():
    """Debug endpoint to list all assignment tokens"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    assignments = await db.ai_assignments.find({}, {"_id": 0, "public_token": 1, "title": 1, "created_at": 1}).to_list(50)
    return {
        "count": len(assignments),
        "assignments": assignments
    }

@router.get("/debug/assignment/{token}")
async def debug_get_assignment(token: str):
    """Debug endpoint to get raw assignment data by token"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    assignment = await db.ai_assignments.find_one({"public_token": token}, {"_id": 0})
    if not assignment:
        return {"found": False, "token": token, "message": "Assignment not found"}
    
    return {
        "found": True,
        "token": token,
        "assignment_id": assignment.get("assignment_id"),
        "title": assignment.get("title"),
        "class_id": assignment.get("class_id"),
        "has_questions": len(assignment.get("questions", [])) > 0,
        "question_count": len(assignment.get("questions", [])),
        "has_description": bool(assignment.get("description")),
        "has_instructions": bool(assignment.get("instructions")),
        "fields": list(assignment.keys())
    }

