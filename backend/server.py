from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'teacherhub-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app
app = FastAPI(title="TeacherHub API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== PYDANTIC MODELS ====================

# User Models
class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    name: str
    role: str = "teacher"  # teacher, admin, parent
    school_id: Optional[str] = None
    picture: Optional[str] = None
    language: str = "es"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "teacher"
    school_id: Optional[str] = None
    language: str = "es"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    role: str
    school_id: Optional[str] = None
    picture: Optional[str] = None
    language: str = "es"
    created_at: Optional[str] = None

# School Models
class SchoolCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None

class SchoolResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    school_id: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: str

# Class Models
class ClassCreate(BaseModel):
    name: str
    grade: str
    section: str
    subject: Optional[str] = None
    year_term: str = "2024-2025"

class ClassResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    class_id: str
    school_id: str
    teacher_id: str
    name: str
    grade: str
    section: str
    subject: Optional[str] = None
    year_term: str
    created_at: str

# Student Models
class StudentCreate(BaseModel):
    first_name: str
    last_name: str
    student_number: Optional[str] = None
    email: Optional[str] = None
    parent_email: Optional[str] = None
    notes: Optional[str] = None
    accommodations: Optional[str] = None

class StudentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    student_id: str
    class_id: str
    first_name: str
    last_name: str
    student_number: Optional[str] = None
    email: Optional[str] = None
    parent_email: Optional[str] = None
    notes: Optional[str] = None
    accommodations: Optional[str] = None
    created_at: str

# Lesson Plan Models
class PlanDayActivity(BaseModel):
    activity_type: str  # brainstorming, building_background, vocabulary, read_pages, guided_reading, oral_questions, comprehension, exercise, other
    checked: bool = False
    notes: Optional[str] = None

class PlanDayMaterial(BaseModel):
    material_type: str  # book, notebook, teachers_guide, test_quiz, dictionary, handouts, other
    checked: bool = False

class PlanDay(BaseModel):
    date: str
    day_name: str  # Monday, Tuesday, etc.
    theme: Optional[str] = None
    dok_levels: List[int] = []  # 1=Memory, 2=Processing, 3=Strategic, 4=Extended
    eca: Dict[str, bool] = {"E": False, "C": False, "A": False}  # E=Enrichment, C=Core, A=Assessment
    activities: List[PlanDayActivity] = []
    materials: List[PlanDayMaterial] = []
    notes: Optional[str] = None

class PlanStandard(BaseModel):
    week_index: int  # 1 or 2
    domain: str  # Listening/Speaking, Foundational Skills, Reading, Writing, Language
    codes: List[str] = []

class PlanExpectation(BaseModel):
    week_index: int
    text: str

class LessonPlanCreate(BaseModel):
    class_id: str
    week_start: str
    week_end: str
    unit: Optional[str] = None
    story: Optional[str] = None
    teacher_name: Optional[str] = None
    objective: Optional[str] = None
    skills: List[str] = []
    days: List[PlanDay] = []
    standards: List[PlanStandard] = []
    expectations: List[PlanExpectation] = []
    subject_integration: List[str] = []  # Mathematics, Spanish, Social Studies, etc.
    is_template: bool = False
    template_name: Optional[str] = None

class LessonPlanResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    plan_id: str
    class_id: str
    teacher_id: str
    school_id: str
    week_start: str
    week_end: str
    unit: Optional[str] = None
    story: Optional[str] = None
    teacher_name: Optional[str] = None
    objective: Optional[str] = None
    skills: List[str] = []
    days: List[Dict] = []
    standards: List[Dict] = []
    expectations: List[Dict] = []
    subject_integration: List[str] = []
    is_template: bool = False
    template_name: Optional[str] = None
    created_at: str
    updated_at: str

# Attendance Models
class AttendanceRecord(BaseModel):
    student_id: str
    status: str  # present, absent, tardy, excused
    minutes_late: Optional[int] = None
    note: Optional[str] = None

class AttendanceSessionCreate(BaseModel):
    class_id: str
    date: str
    records: List[AttendanceRecord] = []

class AttendanceSessionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str
    class_id: str
    teacher_id: str
    date: str
    status: str  # open, submitted
    records: List[Dict] = []
    created_at: str
    updated_at: str

# Gradebook Models
class CategoryCreate(BaseModel):
    name: str
    weight_percent: float = 100.0

class CategoryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    category_id: str
    class_id: str
    name: str
    weight_percent: float
    created_at: str

class AssignmentCreate(BaseModel):
    class_id: str
    category_id: str
    title: str
    description: Optional[str] = None
    points: float = 100.0
    due_date: Optional[str] = None
    standards_refs: List[str] = []

class AssignmentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    assignment_id: str
    class_id: str
    category_id: str
    teacher_id: str
    title: str
    description: Optional[str] = None
    points: float
    due_date: Optional[str] = None
    standards_refs: List[str] = []
    created_at: str

class GradeEntry(BaseModel):
    student_id: str
    score: Optional[float] = None
    status: str = "pending"  # pending, graded, missing, late, excused
    comment: Optional[str] = None

class GradesBulkUpdate(BaseModel):
    assignment_id: str
    grades: List[GradeEntry]

# ==================== AUTHENTICATION HELPERS ====================

def generate_user_id():
    return f"user_{uuid.uuid4().hex[:12]}"

def generate_session_token():
    return f"sess_{uuid.uuid4().hex}"

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(user_id: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    payload = {"user_id": user_id, "exp": expires}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    """Extract and validate user from session token or JWT"""
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Check Authorization header as fallback
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
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
        payload = jwt.decode(session_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
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
    
    raise HTTPException(status_code=401, detail="Invalid authentication")

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, response: Response):
    """Register a new user with email/password"""
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = generate_user_id()
    now = datetime.now(timezone.utc).isoformat()
    
    # Create default school if needed
    school_id = user_data.school_id
    if not school_id:
        school_id = "school_default"
        existing_school = await db.schools.find_one({"school_id": school_id}, {"_id": 0})
        if not existing_school:
            await db.schools.insert_one({
                "school_id": school_id,
                "name": "Default School",
                "created_at": now
            })
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "school_id": school_id,
        "language": user_data.language,
        "picture": None,
        "created_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    # Create session
    token = create_jwt_token(user_id)
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRATION_DAYS * 24 * 60 * 60
    )
    
    return UserResponse(
        user_id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        school_id=school_id,
        language=user_data.language,
        created_at=now
    )

@api_router.post("/auth/login", response_model=UserResponse)
async def login(credentials: UserLogin, response: Response):
    """Login with email/password"""
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["user_id"])
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRATION_DAYS * 24 * 60 * 60
    )
    
    return UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        role=user.get("role", "teacher"),
        school_id=user.get("school_id"),
        picture=user.get("picture"),
        language=user.get("language", "es"),
        created_at=user.get("created_at")
    )

@api_router.post("/auth/session")
async def process_google_session(request: Request, response: Response):
    """Process Google OAuth session_id and create local session"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    now = datetime.now(timezone.utc).isoformat()
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
        school_id = existing_user.get("school_id", "school_default")
        role = existing_user.get("role", "teacher")
        language = existing_user.get("language", "es")
    else:
        user_id = generate_user_id()
        school_id = "school_default"
        role = "teacher"
        language = "es"
        
        # Create default school if needed
        existing_school = await db.schools.find_one({"school_id": school_id}, {"_id": 0})
        if not existing_school:
            await db.schools.insert_one({
                "school_id": school_id,
                "name": "Default School",
                "created_at": now
            })
        
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "school_id": school_id,
            "language": language,
            "created_at": now
        })
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": now
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "role": role,
        "school_id": school_id,
        "language": language
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    """Get current authenticated user"""
    return UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        role=user.get("role", "teacher"),
        school_id=user.get("school_id"),
        picture=user.get("picture"),
        language=user.get("language", "es"),
        created_at=user.get("created_at")
    )

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.put("/auth/profile", response_model=UserResponse)
async def update_profile(request: Request, user: dict = Depends(get_current_user)):
    """Update user profile"""
    body = await request.json()
    update_fields = {}
    
    if "name" in body:
        update_fields["name"] = body["name"]
    if "language" in body:
        update_fields["language"] = body["language"]
    
    if update_fields:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": update_fields}
        )
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return UserResponse(**updated_user)

# ==================== SCHOOL ENDPOINTS ====================

@api_router.get("/schools", response_model=List[SchoolResponse])
async def get_schools(user: dict = Depends(get_current_user)):
    """Get all schools (admin only)"""
    if user.get("role") != "admin":
        # Return only user's school
        school = await db.schools.find_one({"school_id": user.get("school_id")}, {"_id": 0})
        return [SchoolResponse(**school)] if school else []
    
    schools = await db.schools.find({}, {"_id": 0}).to_list(100)
    return [SchoolResponse(**s) for s in schools]

@api_router.post("/schools", response_model=SchoolResponse)
async def create_school(school_data: SchoolCreate, user: dict = Depends(get_current_user)):
    """Create a new school (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    school_id = f"school_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    
    school_doc = {
        "school_id": school_id,
        "name": school_data.name,
        "address": school_data.address,
        "phone": school_data.phone,
        "email": school_data.email,
        "logo_url": school_data.logo_url,
        "created_at": now
    }
    
    await db.schools.insert_one(school_doc)
    return SchoolResponse(**school_doc)

@api_router.put("/schools/{school_id}", response_model=SchoolResponse)
async def update_school(school_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Update school settings"""
    school = await db.schools.find_one({"school_id": school_id}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Allow teachers to update their own school's settings
    if user.get("school_id") != school_id and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    body = await request.json()
    update_fields = {}
    
    for field in ["name", "address", "phone", "email", "logo_url"]:
        if field in body:
            update_fields[field] = body[field]
    
    if update_fields:
        await db.schools.update_one({"school_id": school_id}, {"$set": update_fields})
    
    updated = await db.schools.find_one({"school_id": school_id}, {"_id": 0})
    return SchoolResponse(**updated)

@api_router.get("/schools/{school_id}", response_model=SchoolResponse)
async def get_school(school_id: str, user: dict = Depends(get_current_user)):
    """Get school by ID"""
    school = await db.schools.find_one({"school_id": school_id}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return SchoolResponse(**school)

# ==================== CLASS ENDPOINTS ====================

@api_router.get("/classes", response_model=List[ClassResponse])
async def get_classes(user: dict = Depends(get_current_user)):
    """Get classes for current teacher"""
    query = {"teacher_id": user["user_id"]}
    if user.get("role") == "admin":
        query = {"school_id": user.get("school_id")}
    
    classes = await db.classes.find(query, {"_id": 0}).to_list(100)
    return [ClassResponse(**c) for c in classes]

@api_router.post("/classes", response_model=ClassResponse)
async def create_class(class_data: ClassCreate, user: dict = Depends(get_current_user)):
    """Create a new class"""
    class_id = f"class_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    
    class_doc = {
        "class_id": class_id,
        "school_id": user.get("school_id", "school_default"),
        "teacher_id": user["user_id"],
        "name": class_data.name,
        "grade": class_data.grade,
        "section": class_data.section,
        "subject": class_data.subject,
        "year_term": class_data.year_term,
        "created_at": now
    }
    
    await db.classes.insert_one(class_doc)
    return ClassResponse(**class_doc)

@api_router.get("/classes/{class_id}", response_model=ClassResponse)
async def get_class(class_id: str, user: dict = Depends(get_current_user)):
    """Get a specific class"""
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return ClassResponse(**class_doc)

@api_router.put("/classes/{class_id}", response_model=ClassResponse)
async def update_class(class_id: str, class_data: ClassCreate, user: dict = Depends(get_current_user)):
    """Update a class"""
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = class_data.model_dump(exclude_unset=True)
    await db.classes.update_one({"class_id": class_id}, {"$set": update_data})
    
    updated = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    return ClassResponse(**updated)

@api_router.delete("/classes/{class_id}")
async def delete_class(class_id: str, user: dict = Depends(get_current_user)):
    """Delete a class"""
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.classes.delete_one({"class_id": class_id})
    return {"message": "Class deleted"}

# ==================== STUDENT ENDPOINTS ====================

@api_router.get("/classes/{class_id}/students", response_model=List[StudentResponse])
async def get_students(class_id: str, user: dict = Depends(get_current_user)):
    """Get students in a class"""
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    students = await db.students.find({"class_id": class_id}, {"_id": 0}).to_list(100)
    return [StudentResponse(**s) for s in students]

@api_router.post("/classes/{class_id}/students", response_model=StudentResponse)
async def create_student(class_id: str, student_data: StudentCreate, user: dict = Depends(get_current_user)):
    """Add a student to a class"""
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    student_id = f"student_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    
    student_doc = {
        "student_id": student_id,
        "class_id": class_id,
        "first_name": student_data.first_name,
        "last_name": student_data.last_name,
        "student_number": student_data.student_number,
        "email": student_data.email,
        "parent_email": student_data.parent_email,
        "notes": student_data.notes,
        "accommodations": student_data.accommodations,
        "created_at": now
    }
    
    await db.students.insert_one(student_doc)
    return StudentResponse(**student_doc)

@api_router.post("/classes/{class_id}/students/bulk")
async def bulk_import_students(class_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Bulk import students from CSV data"""
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    body = await request.json()
    students_data = body.get("students", [])
    
    now = datetime.now(timezone.utc).isoformat()
    created_count = 0
    
    for student in students_data:
        student_id = f"student_{uuid.uuid4().hex[:8]}"
        student_doc = {
            "student_id": student_id,
            "class_id": class_id,
            "first_name": student.get("first_name", ""),
            "last_name": student.get("last_name", ""),
            "student_number": student.get("student_number"),
            "email": student.get("email"),
            "parent_email": student.get("parent_email"),
            "notes": student.get("notes"),
            "accommodations": student.get("accommodations"),
            "created_at": now
        }
        await db.students.insert_one(student_doc)
        created_count += 1
    
    return {"message": f"Created {created_count} students"}

@api_router.put("/students/{student_id}", response_model=StudentResponse)
async def update_student(student_id: str, student_data: StudentCreate, user: dict = Depends(get_current_user)):
    """Update a student"""
    student = await db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    class_doc = await db.classes.find_one({"class_id": student["class_id"]}, {"_id": 0})
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = student_data.model_dump(exclude_unset=True)
    await db.students.update_one({"student_id": student_id}, {"$set": update_data})
    
    updated = await db.students.find_one({"student_id": student_id}, {"_id": 0})
    return StudentResponse(**updated)

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, user: dict = Depends(get_current_user)):
    """Delete a student"""
    student = await db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    class_doc = await db.classes.find_one({"class_id": student["class_id"]}, {"_id": 0})
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.students.delete_one({"student_id": student_id})
    return {"message": "Student deleted"}

# ==================== LESSON PLAN ENDPOINTS ====================

@api_router.get("/plans", response_model=List[LessonPlanResponse])
async def get_plans(
    class_id: Optional[str] = None,
    is_template: Optional[bool] = None,
    user: dict = Depends(get_current_user)
):
    """Get lesson plans"""
    query = {"teacher_id": user["user_id"]}
    
    if class_id:
        query["class_id"] = class_id
    if is_template is not None:
        query["is_template"] = is_template
    
    plans = await db.lesson_plans.find(query, {"_id": 0}).sort("week_start", -1).to_list(100)
    return [LessonPlanResponse(**p) for p in plans]

@api_router.post("/plans", response_model=LessonPlanResponse)
async def create_plan(plan_data: LessonPlanCreate, user: dict = Depends(get_current_user)):
    """Create a new lesson plan"""
    plan_id = f"plan_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    
    plan_doc = {
        "plan_id": plan_id,
        "class_id": plan_data.class_id,
        "teacher_id": user["user_id"],
        "school_id": user.get("school_id", "school_default"),
        "week_start": plan_data.week_start,
        "week_end": plan_data.week_end,
        "unit": plan_data.unit,
        "story": plan_data.story,
        "teacher_name": plan_data.teacher_name,
        "objective": plan_data.objective,
        "skills": plan_data.skills,
        "days": [d.model_dump() for d in plan_data.days],
        "standards": [s.model_dump() for s in plan_data.standards],
        "expectations": [e.model_dump() for e in plan_data.expectations],
        "subject_integration": plan_data.subject_integration,
        "is_template": plan_data.is_template,
        "template_name": plan_data.template_name,
        "created_at": now,
        "updated_at": now
    }
    
    await db.lesson_plans.insert_one(plan_doc)
    return LessonPlanResponse(**plan_doc)

@api_router.get("/plans/{plan_id}", response_model=LessonPlanResponse)
async def get_plan(plan_id: str, user: dict = Depends(get_current_user)):
    """Get a specific lesson plan"""
    plan = await db.lesson_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return LessonPlanResponse(**plan)

@api_router.put("/plans/{plan_id}", response_model=LessonPlanResponse)
async def update_plan(plan_id: str, plan_data: LessonPlanCreate, user: dict = Depends(get_current_user)):
    """Update a lesson plan"""
    plan = await db.lesson_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {
        "class_id": plan_data.class_id,
        "week_start": plan_data.week_start,
        "week_end": plan_data.week_end,
        "unit": plan_data.unit,
        "story": plan_data.story,
        "teacher_name": plan_data.teacher_name,
        "objective": plan_data.objective,
        "skills": plan_data.skills,
        "days": [d.model_dump() for d in plan_data.days],
        "standards": [s.model_dump() for s in plan_data.standards],
        "expectations": [e.model_dump() for e in plan_data.expectations],
        "subject_integration": plan_data.subject_integration,
        "is_template": plan_data.is_template,
        "template_name": plan_data.template_name,
        "updated_at": now
    }
    
    await db.lesson_plans.update_one({"plan_id": plan_id}, {"$set": update_data})
    updated = await db.lesson_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    return LessonPlanResponse(**updated)

@api_router.delete("/plans/{plan_id}")
async def delete_plan(plan_id: str, user: dict = Depends(get_current_user)):
    """Delete a lesson plan"""
    plan = await db.lesson_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.lesson_plans.delete_one({"plan_id": plan_id})
    return {"message": "Plan deleted"}

@api_router.post("/plans/{plan_id}/duplicate", response_model=LessonPlanResponse)
async def duplicate_plan(plan_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Duplicate a lesson plan to a new week"""
    plan = await db.lesson_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    body = await request.json()
    new_week_start = body.get("week_start")
    new_week_end = body.get("week_end")
    
    new_plan_id = f"plan_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    
    new_plan = {**plan}
    new_plan["plan_id"] = new_plan_id
    new_plan["week_start"] = new_week_start or plan["week_start"]
    new_plan["week_end"] = new_week_end or plan["week_end"]
    new_plan["is_template"] = False
    new_plan["template_name"] = None
    new_plan["created_at"] = now
    new_plan["updated_at"] = now
    
    await db.lesson_plans.insert_one(new_plan)
    return LessonPlanResponse(**new_plan)

# ==================== ATTENDANCE ENDPOINTS ====================

@api_router.get("/attendance", response_model=List[AttendanceSessionResponse])
async def get_attendance_sessions(
    class_id: Optional[str] = None,
    date: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get attendance sessions"""
    query = {"teacher_id": user["user_id"]}
    
    if class_id:
        query["class_id"] = class_id
    if date:
        query["date"] = date
    
    sessions = await db.attendance_sessions.find(query, {"_id": 0}).sort("date", -1).to_list(100)
    return [AttendanceSessionResponse(**s) for s in sessions]

@api_router.post("/attendance", response_model=AttendanceSessionResponse)
async def create_or_update_attendance(session_data: AttendanceSessionCreate, user: dict = Depends(get_current_user)):
    """Create or update attendance session"""
    # Check if session exists for this class and date
    existing = await db.attendance_sessions.find_one({
        "class_id": session_data.class_id,
        "date": session_data.date
    }, {"_id": 0})
    
    now = datetime.now(timezone.utc).isoformat()
    
    if existing:
        # Update existing session
        await db.attendance_sessions.update_one(
            {"session_id": existing["session_id"]},
            {"$set": {
                "records": [r.model_dump() for r in session_data.records],
                "updated_at": now
            }}
        )
        updated = await db.attendance_sessions.find_one({"session_id": existing["session_id"]}, {"_id": 0})
        return AttendanceSessionResponse(**updated)
    
    # Create new session
    session_id = f"att_{uuid.uuid4().hex[:8]}"
    
    session_doc = {
        "session_id": session_id,
        "class_id": session_data.class_id,
        "teacher_id": user["user_id"],
        "date": session_data.date,
        "status": "open",
        "records": [r.model_dump() for r in session_data.records],
        "created_at": now,
        "updated_at": now
    }
    
    await db.attendance_sessions.insert_one(session_doc)
    return AttendanceSessionResponse(**session_doc)

@api_router.get("/attendance/{session_id}", response_model=AttendanceSessionResponse)
async def get_attendance_session(session_id: str, user: dict = Depends(get_current_user)):
    """Get a specific attendance session"""
    session = await db.attendance_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return AttendanceSessionResponse(**session)

@api_router.put("/attendance/{session_id}/submit")
async def submit_attendance(session_id: str, user: dict = Depends(get_current_user)):
    """Submit/lock attendance session"""
    session = await db.attendance_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.attendance_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"status": "submitted", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Attendance submitted"}

@api_router.get("/attendance/report/{class_id}")
async def get_attendance_report(
    class_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get attendance report for a class"""
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {"class_id": class_id}
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}
    
    sessions = await db.attendance_sessions.find(query, {"_id": 0}).to_list(1000)
    students = await db.students.find({"class_id": class_id}, {"_id": 0}).to_list(100)
    
    # Build report by student
    report = {}
    for student in students:
        report[student["student_id"]] = {
            "student_id": student["student_id"],
            "name": f"{student['first_name']} {student['last_name']}",
            "present": 0,
            "absent": 0,
            "tardy": 0,
            "excused": 0,
            "total_days": len(sessions)
        }
    
    for session in sessions:
        for record in session.get("records", []):
            student_id = record.get("student_id")
            status = record.get("status", "absent")
            if student_id in report:
                report[student_id][status] = report[student_id].get(status, 0) + 1
    
    return {"class_id": class_id, "report": list(report.values())}

# ==================== GRADEBOOK ENDPOINTS ====================

@api_router.get("/classes/{class_id}/categories", response_model=List[CategoryResponse])
async def get_categories(class_id: str, user: dict = Depends(get_current_user)):
    """Get grade categories for a class"""
    categories = await db.grade_categories.find({"class_id": class_id}, {"_id": 0}).to_list(50)
    return [CategoryResponse(**c) for c in categories]

@api_router.post("/classes/{class_id}/categories", response_model=CategoryResponse)
async def create_category(class_id: str, category_data: CategoryCreate, user: dict = Depends(get_current_user)):
    """Create a grade category"""
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    category_id = f"cat_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    
    category_doc = {
        "category_id": category_id,
        "class_id": class_id,
        "name": category_data.name,
        "weight_percent": category_data.weight_percent,
        "created_at": now
    }
    
    await db.grade_categories.insert_one(category_doc)
    return CategoryResponse(**category_doc)

@api_router.get("/assignments", response_model=List[AssignmentResponse])
async def get_assignments(
    class_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get assignments"""
    query = {"teacher_id": user["user_id"]}
    if class_id:
        query["class_id"] = class_id
    
    assignments = await db.assignments.find(query, {"_id": 0}).sort("due_date", -1).to_list(100)
    return [AssignmentResponse(**a) for a in assignments]

@api_router.post("/assignments", response_model=AssignmentResponse)
async def create_assignment(assignment_data: AssignmentCreate, user: dict = Depends(get_current_user)):
    """Create an assignment"""
    class_doc = await db.classes.find_one({"class_id": assignment_data.class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    assignment_id = f"assign_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    
    assignment_doc = {
        "assignment_id": assignment_id,
        "class_id": assignment_data.class_id,
        "category_id": assignment_data.category_id,
        "teacher_id": user["user_id"],
        "title": assignment_data.title,
        "description": assignment_data.description,
        "points": assignment_data.points,
        "due_date": assignment_data.due_date,
        "standards_refs": assignment_data.standards_refs,
        "created_at": now
    }
    
    await db.assignments.insert_one(assignment_doc)
    return AssignmentResponse(**assignment_doc)

@api_router.get("/assignments/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(assignment_id: str, user: dict = Depends(get_current_user)):
    """Get a specific assignment"""
    assignment = await db.assignments.find_one({"assignment_id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return AssignmentResponse(**assignment)

@api_router.put("/assignments/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(assignment_id: str, assignment_data: AssignmentCreate, user: dict = Depends(get_current_user)):
    """Update an assignment"""
    assignment = await db.assignments.find_one({"assignment_id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = assignment_data.model_dump(exclude_unset=True)
    await db.assignments.update_one({"assignment_id": assignment_id}, {"$set": update_data})
    
    updated = await db.assignments.find_one({"assignment_id": assignment_id}, {"_id": 0})
    return AssignmentResponse(**updated)

@api_router.delete("/assignments/{assignment_id}")
async def delete_assignment(assignment_id: str, user: dict = Depends(get_current_user)):
    """Delete an assignment"""
    assignment = await db.assignments.find_one({"assignment_id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.assignments.delete_one({"assignment_id": assignment_id})
    await db.grades.delete_many({"assignment_id": assignment_id})
    return {"message": "Assignment deleted"}

@api_router.get("/assignments/{assignment_id}/grades")
async def get_grades(assignment_id: str, user: dict = Depends(get_current_user)):
    """Get grades for an assignment"""
    assignment = await db.assignments.find_one({"assignment_id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    grades = await db.grades.find({"assignment_id": assignment_id}, {"_id": 0}).to_list(100)
    return grades

@api_router.post("/grades/bulk")
async def bulk_update_grades(grades_data: GradesBulkUpdate, user: dict = Depends(get_current_user)):
    """Bulk update grades for an assignment"""
    assignment = await db.assignments.find_one({"assignment_id": grades_data.assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    now = datetime.now(timezone.utc).isoformat()
    
    for grade_entry in grades_data.grades:
        existing = await db.grades.find_one({
            "assignment_id": grades_data.assignment_id,
            "student_id": grade_entry.student_id
        }, {"_id": 0})
        
        if existing:
            await db.grades.update_one(
                {"assignment_id": grades_data.assignment_id, "student_id": grade_entry.student_id},
                {"$set": {
                    "score": grade_entry.score,
                    "status": grade_entry.status,
                    "comment": grade_entry.comment,
                    "updated_at": now
                }}
            )
        else:
            grade_id = f"grade_{uuid.uuid4().hex[:8]}"
            await db.grades.insert_one({
                "grade_id": grade_id,
                "assignment_id": grades_data.assignment_id,
                "student_id": grade_entry.student_id,
                "score": grade_entry.score,
                "status": grade_entry.status,
                "comment": grade_entry.comment,
                "created_at": now,
                "updated_at": now
            })
    
    return {"message": "Grades updated"}

@api_router.get("/gradebook/{class_id}")
async def get_gradebook(class_id: str, user: dict = Depends(get_current_user)):
    """Get full gradebook for a class"""
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    students = await db.students.find({"class_id": class_id}, {"_id": 0}).to_list(100)
    assignments = await db.assignments.find({"class_id": class_id}, {"_id": 0}).to_list(100)
    categories = await db.grade_categories.find({"class_id": class_id}, {"_id": 0}).to_list(50)
    
    # Get all grades for this class's assignments
    assignment_ids = [a["assignment_id"] for a in assignments]
    grades = await db.grades.find({"assignment_id": {"$in": assignment_ids}}, {"_id": 0}).to_list(10000)
    
    # Organize grades by student and assignment
    grades_map = {}
    for grade in grades:
        key = f"{grade['student_id']}_{grade['assignment_id']}"
        grades_map[key] = grade
    
    return {
        "class_id": class_id,
        "students": students,
        "assignments": assignments,
        "categories": categories,
        "grades": grades_map
    }

# ==================== DASHBOARD ENDPOINTS ====================

@api_router.get("/dashboard")
async def get_dashboard(user: dict = Depends(get_current_user)):
    """Get dashboard data for teacher"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Get classes
    classes = await db.classes.find({"teacher_id": user["user_id"]}, {"_id": 0}).to_list(50)
    class_ids = [c["class_id"] for c in classes]
    
    # Get today's attendance status
    attendance_today = await db.attendance_sessions.find({
        "class_id": {"$in": class_ids},
        "date": today
    }, {"_id": 0}).to_list(50)
    attendance_taken_ids = [a["class_id"] for a in attendance_today]
    
    # Get upcoming assignments
    upcoming_assignments = await db.assignments.find({
        "teacher_id": user["user_id"],
        "due_date": {"$gte": today}
    }, {"_id": 0}).sort("due_date", 1).to_list(10)
    
    # Get recent plans
    recent_plans = await db.lesson_plans.find({
        "teacher_id": user["user_id"],
        "is_template": False
    }, {"_id": 0}).sort("updated_at", -1).to_list(5)
    
    # Stats
    total_students = await db.students.count_documents({"class_id": {"$in": class_ids}})
    total_plans = await db.lesson_plans.count_documents({"teacher_id": user["user_id"], "is_template": False})
    
    # Get school info
    school = None
    if user.get("school_id"):
        school = await db.schools.find_one({"school_id": user.get("school_id")}, {"_id": 0})
    
    return {
        "user": {
            "name": user["name"],
            "role": user.get("role", "teacher")
        },
        "school": school,
        "today": today,
        "classes": classes,
        "attendance_pending": [c for c in classes if c["class_id"] not in attendance_taken_ids],
        "upcoming_assignments": upcoming_assignments,
        "recent_plans": recent_plans,
        "stats": {
            "total_classes": len(classes),
            "total_students": total_students,
            "total_plans": total_plans,
            "attendance_complete": len(attendance_today),
            "attendance_pending": len(classes) - len(attendance_today)
        }
    }

# ==================== TEMPLATES ENDPOINTS ====================

@api_router.get("/templates", response_model=List[LessonPlanResponse])
async def get_templates(user: dict = Depends(get_current_user)):
    """Get lesson plan templates"""
    # Get user's templates and school-wide templates
    templates = await db.lesson_plans.find({
        "$or": [
            {"teacher_id": user["user_id"], "is_template": True},
            {"school_id": user.get("school_id"), "is_template": True, "is_school_template": True}
        ]
    }, {"_id": 0}).to_list(100)
    
    return [LessonPlanResponse(**t) for t in templates]

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
