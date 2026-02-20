"""
Portal Routes
Handles parent and student portal access (public endpoints)
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/portal", tags=["portal"])

# These will be set by the main app
db = None
get_current_user = None

def init_portal_routes(database, auth_dependency):
    """Initialize the portal routes with dependencies"""
    global db, get_current_user
    db = database
    get_current_user = auth_dependency


class PortalTokenRequest(BaseModel):
    student_id: str
    parent_email: Optional[str] = None
    language: str = "es"


class HomeschoolPortalRequest(BaseModel):
    student_id: str
    language: str = "es"


@router.post("/generate-token")
async def generate_portal_token(
    request: PortalTokenRequest,
    user: dict = Depends(lambda: get_current_user)
):
    """Generate a portal access token for a student's parent"""
    
    student = await db.students.find_one({"student_id": request.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Generate token
    token = f"portal_{uuid.uuid4().hex}"
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    
    await db.portal_tokens.update_one(
        {"student_id": request.student_id},
        {"$set": {
            "token": token,
            "student_id": request.student_id,
            "parent_email": request.parent_email,
            "language": request.language,
            "teacher_id": user.get("user_id"),
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return {
        "token": token,
        "student_id": request.student_id,
        "expires_at": expires_at
    }


@router.get("/{token}")
async def get_portal_data(token: str):
    """Public endpoint - Get student data via portal token"""
    
    token_doc = await db.portal_tokens.find_one({"token": token}, {"_id": 0})
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
    language = token_doc.get("language", "es")
    
    # Get student info
    student = await db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get class info
    class_id = student.get("class_id")
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0}) if class_id else None
    
    # Get grades
    assignments = await db.assignments.find({"class_id": class_id}, {"_id": 0}).to_list(100) if class_id else []
    assignment_ids = [a["assignment_id"] for a in assignments]
    
    grades = []
    if assignment_ids:
        grades_cursor = db.grades.find({
            "student_id": student_id,
            "assignment_id": {"$in": assignment_ids}
        }, {"_id": 0})
        grades = await grades_cursor.to_list(100)
    
    # Get attendance
    attendance = await db.attendance_sessions.find(
        {"class_id": class_id} if class_id else {},
        {"_id": 0}
    ).to_list(100)
    
    # Calculate attendance stats
    present_count = 0
    absent_count = 0
    tardy_count = 0
    
    for session in attendance:
        records = session.get("records", session.get("students", []))
        for rec in records:
            if rec.get("student_id") == student_id:
                status = rec.get("status", "")
                if status == "present":
                    present_count += 1
                elif status == "absent":
                    absent_count += 1
                elif status == "tardy":
                    tardy_count += 1
    
    total_sessions = present_count + absent_count + tardy_count
    
    return {
        "student": {
            "name": student.get("name") or f"{student.get('first_name', '')} {student.get('last_name', '')}",
            "student_id": student_id,
            "grade": student.get("grade"),
            "photo": student.get("photo")
        },
        "class": {
            "name": class_doc.get("name") if class_doc else None,
            "subject": class_doc.get("subject") if class_doc else None
        } if class_doc else None,
        "grades": grades,
        "assignments": assignments,
        "attendance": {
            "present": present_count,
            "absent": absent_count,
            "tardy": tardy_count,
            "total_sessions": total_sessions,
            "attendance_rate": round((present_count / total_sessions * 100) if total_sessions > 0 else 0, 1)
        },
        "language": language
    }


# Homeschool Portal
@router.post("/homeschool/generate-token")
async def generate_homeschool_portal_token(
    request: HomeschoolPortalRequest,
    user: dict = Depends(lambda: get_current_user)
):
    """Generate a homeschool parent portal token"""
    
    student = await db.students.find_one({"student_id": request.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    token = f"hsp_{uuid.uuid4().hex}"
    expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    
    await db.homeschool_portal_tokens.update_one(
        {"student_id": request.student_id},
        {"$set": {
            "token": token,
            "student_id": request.student_id,
            "language": request.language,
            "parent_id": user.get("user_id"),
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return {
        "token": token,
        "student_id": request.student_id,
        "expires_at": expires_at
    }


@router.get("/homeschool/{token}")
async def get_homeschool_portal_data(token: str):
    """Public endpoint - Get homeschool student progress via token"""
    
    token_doc = await db.homeschool_portal_tokens.find_one({"token": token}, {"_id": 0})
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
    language = token_doc.get("language", "es")
    
    # Get student
    student = await db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get adaptive learning progress
    progress_list = await db.adaptive_learning_progress.find(
        {"student_id": student_id},
        {"_id": 0}
    ).to_list(10)
    
    # Get learning paths
    learning_paths = await db.adaptive_learning_paths.find(
        {"student_id": student_id},
        {"_id": 0}
    ).to_list(10)
    
    # Get game scores
    game_scores = await db.game_scores.find(
        {"player_name": {"$regex": student.get("first_name", ""), "$options": "i"}},
        {"_id": 0}
    ).sort("submitted_at", -1).limit(20).to_list(20)
    
    # Calculate statistics
    total_lessons = sum(len(p.get("lessons", [])) for p in learning_paths)
    completed_lessons = sum(len(pr.get("completed_lessons", [])) for pr in progress_list)
    
    return {
        "student": {
            "name": student.get("name") or f"{student.get('first_name', '')} {student.get('last_name', '')}",
            "student_id": student_id,
            "photo": student.get("photo")
        },
        "statistics": {
            "total_subjects": len(learning_paths),
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "completion_rate": round((completed_lessons / total_lessons * 100) if total_lessons > 0 else 0, 1),
            "games_played": len(game_scores),
            "average_game_score": round(sum(s.get("percentage", 0) for s in game_scores) / len(game_scores), 1) if game_scores else 0
        },
        "progress_by_subject": progress_list,
        "learning_paths": learning_paths,
        "recent_game_scores": game_scores[:10],
        "language": language
    }
