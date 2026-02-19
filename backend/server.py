from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import base64
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import jwt
from passlib.context import CryptContext
import resend
from emergentintegrations.llm.openai import OpenAITextToSpeech
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Import modular routes
from routes.auth import router as auth_router
from routes.ai import router as ai_router

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

# Resend Configuration
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

# OpenAI TTS Configuration (using Emergent Key)
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
tts_client = None
if EMERGENT_LLM_KEY:
    tts_client = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Subscription Plans
SUBSCRIPTION_PLANS = {
    "individual_monthly": {
        "name": "Individual Monthly",
        "price": 9.99,
        "interval": "month",
        "description": "Full access for individual teachers",
        "features": ["Lesson Planner", "Attendance Tracker", "Gradebook", "PDF Export", "Templates"]
    },
    "individual_yearly": {
        "name": "Individual Yearly",
        "price": 79.00,
        "interval": "year",
        "description": "Save $40 with annual billing",
        "features": ["Lesson Planner", "Attendance Tracker", "Gradebook", "PDF Export", "Templates", "Priority Support"]
    },
    "school": {
        "name": "School Plan",
        "price_per_teacher": 6.00,
        "interval": "year",
        "min_teachers": 10,
        "description": "$6/teacher/month billed yearly",
        "features": ["All Individual Features", "Admin Dashboard", "School Branding", "Bulk Import", "Reports"]
    },
    "district": {
        "name": "District Plan",
        "price_per_teacher": 4.00,
        "interval": "year",
        "min_teachers": 100,
        "description": "$4/teacher/month billed yearly",
        "features": ["All School Features", "District Analytics", "SSO Integration", "Dedicated Support"]
    }
}

FREE_TRIAL_DAYS = 7

# Create the main app
app = FastAPI(title="TeacherHubPro API", version="1.0.0")

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
    # Onboarding fields
    onboarding_status: Optional[str] = "not_started"  # not_started, in_progress, completed, dismissed
    first_login_at: Optional[str] = None
    settings_completed_at: Optional[str] = None

class OnboardingUpdate(BaseModel):
    onboarding_status: Optional[str] = None
    onboarding_step: Optional[str] = None

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
    semester_id: Optional[str] = None

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
    semester_id: Optional[str] = None
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
    week2_start: Optional[str] = None
    week2_end: Optional[str] = None
    unit: Optional[str] = None
    story: Optional[str] = None
    teacher_name: Optional[str] = None
    objective: Optional[str] = None
    objective_week2: Optional[str] = None
    skills: List[str] = []
    skills_week2: List[str] = []
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
    week2_start: Optional[str] = None
    week2_end: Optional[str] = None
    unit: Optional[str] = None
    story: Optional[str] = None
    teacher_name: Optional[str] = None
    objective: Optional[str] = None
    objective_week2: Optional[str] = None
    skills: List[str] = []
    skills_week2: List[str] = []
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
    name_es: Optional[str] = None
    weight_percent: float = 100.0

class CategoryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    category_id: str
    class_id: str
    name: str
    name_es: Optional[str] = None
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

# Subscription Models
class SubscriptionCreate(BaseModel):
    plan_id: str
    quantity: int = 1  # For school/district plans, this is number of teachers

class CheckoutRequest(BaseModel):
    plan_id: str
    quantity: int = 1
    origin_url: str

class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    subscription_id: str
    user_id: str
    plan_id: str
    status: str  # active, trialing, past_due, canceled, expired
    quantity: int = 1
    current_period_start: str
    current_period_end: str
    trial_end: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    created_at: str

# Semester Models
class SemesterCreate(BaseModel):
    name: str
    name_es: Optional[str] = None
    start_date: str
    end_date: str
    year_term: str = "2024-2025"
    is_active: bool = False

class SemesterResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    semester_id: str
    school_id: str
    name: str
    name_es: Optional[str] = None
    start_date: str
    end_date: str
    year_term: str
    is_active: bool
    created_at: str

# Portal Email Request
class PortalEmailRequest(BaseModel):
    student_id: str
    parent_email: EmailStr
    expires_days: int = 30

# ==================== AI ASSISTANT MODELS ====================

class AIGenerationRequest(BaseModel):
    tool_type: str  # lesson_plan, quiz, summary, activities, worksheet, chat
    subject: str
    grade_level: str
    topic: str
    standards_framework: str = "common_core"  # common_core, pr_core, both
    language: str = "es"  # es or en
    additional_instructions: Optional[str] = None
    difficulty_level: Optional[str] = "medium"  # easy, medium, hard
    num_questions: Optional[int] = 10  # for quizzes
    duration_minutes: Optional[int] = 45  # for lesson plans

class AIChatRequest(BaseModel):
    message: str
    session_id: str
    language: str = "es"
    context: Optional[str] = None  # Optional context like current lesson plan

class AIGenerationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    generation_id: str
    tool_type: str
    content: str
    metadata: Dict[str, Any] = {}
    created_at: str

class AIChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str
    session_id: str
    role: str  # user or assistant
    content: str
    created_at: str

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
    
    # Create a UNIQUE school for each new user (not shared default)
    school_id = user_data.school_id
    if not school_id:
        # Generate unique school ID for this user
        school_id = f"school_{user_id.replace('user_', '')}"
        await db.schools.insert_one({
            "school_id": school_id,
            "name": "My School",  # Generic name - user will customize
            "address": "",
            "phone": "",
            "email": "",
            "logo_url": "",
            "created_at": now,
            "owner_user_id": user_id  # Track who owns this school
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
        "created_at": now,
        # Onboarding fields
        "onboarding_status": "not_started",
        "first_login_at": now,
        "settings_completed_at": None
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
    emergent_auth_url = os.environ.get('EMERGENT_AUTH_URL', 'https://demobackend.emergentagent.com')
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                f"{emergent_auth_url}/auth/v1/env/oauth/session-data",
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
        school_id = existing_user.get("school_id")
        # If user has no school, create one for them
        if not school_id:
            school_id = f"school_{user_id.replace('user_', '')}"
            await db.schools.insert_one({
                "school_id": school_id,
                "name": "My School",
                "address": "",
                "phone": "",
                "email": "",
                "logo_url": "",
                "created_at": now,
                "owner_user_id": user_id
            })
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"school_id": school_id}}
            )
        role = existing_user.get("role", "teacher")
        language = existing_user.get("language", "es")
    else:
        user_id = generate_user_id()
        # Create a UNIQUE school for this new user
        school_id = f"school_{user_id.replace('user_', '')}"
        role = "teacher"
        language = "es"
        
        # Create unique school for this user
        await db.schools.insert_one({
            "school_id": school_id,
            "name": "My School",
            "address": "",
            "phone": "",
            "email": "",
            "logo_url": "",
            "created_at": now,
            "owner_user_id": user_id
        })
        
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "school_id": school_id,
            "language": language,
            "created_at": now,
            # Onboarding fields
            "onboarding_status": "not_started",
            "first_login_at": now,
            "settings_completed_at": None
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
        created_at=user.get("created_at"),
        onboarding_status=user.get("onboarding_status", "not_started"),
        first_login_at=user.get("first_login_at"),
        settings_completed_at=user.get("settings_completed_at")
    )

@api_router.get("/auth/onboarding-status")
async def get_onboarding_status(user: dict = Depends(get_current_user)):
    """Get user's onboarding status with setup completion check"""
    user_id = user["user_id"]
    school_id = user.get("school_id")
    user_role = user.get("role")
    
    # Super Admin skips onboarding entirely - they manage the platform
    if user_role == "super_admin":
        return {
            "onboarding_status": "completed",
            "setup_items": {},
            "completed_count": 0,
            "total_count": 0,
            "show_welcome": False,
            "is_super_admin": True
        }
    
    # Check actual setup completion (Option C - detect "not configured yet")
    school = await db.schools.find_one({"school_id": school_id}, {"_id": 0}) if school_id else None
    classes = await db.classes.find({"teacher_id": user_id}, {"_id": 0}).to_list(10)
    # Note: lesson_plans uses teacher_id, not user_id
    plans = await db.lesson_plans.find({"teacher_id": user_id}, {"_id": 0}).to_list(10)
    
    # Check what's configured
    school_configured = bool(school and school.get("name") and school.get("name") != "My School")
    classes_configured = len(classes) > 0
    planners_configured = len(plans) > 0
    
    # Calculate overall completion
    setup_items = {
        "school_info": {
            "completed": school_configured,
            "label_en": "School Information",
            "label_es": "Información de la Escuela",
            "route": "/settings"
        },
        "first_class": {
            "completed": classes_configured,
            "label_en": "Create Your First Class",
            "label_es": "Crear Tu Primera Clase",
            "route": "/classes"
        },
        "first_planner": {
            "completed": planners_configured,
            "label_en": "Create Your First Planner",
            "label_es": "Crear Tu Primer Plan",
            "route": "/planner/new"
        }
    }
    
    completed_count = sum(1 for item in setup_items.values() if item["completed"])
    total_count = len(setup_items)
    all_completed = completed_count == total_count
    
    # Get stored onboarding status
    stored_status = user.get("onboarding_status", "not_started")
    
    # If all items are completed but status isn't updated, mark as completed
    if all_completed and stored_status not in ["completed", "dismissed"]:
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "onboarding_status": "completed",
                "settings_completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        stored_status = "completed"
    
    return {
        "onboarding_status": stored_status,
        "first_login_at": user.get("first_login_at"),
        "settings_completed_at": user.get("settings_completed_at"),
        "setup_items": setup_items,
        "completed_count": completed_count,
        "total_count": total_count,
        "all_completed": all_completed,
        "show_onboarding": stored_status in ["not_started", "in_progress"] and not all_completed
    }

@api_router.put("/auth/onboarding-status")
async def update_onboarding_status(request: Request, user: dict = Depends(get_current_user)):
    """Update user's onboarding status"""
    body = await request.json()
    update_fields = {}
    
    if "onboarding_status" in body:
        status = body["onboarding_status"]
        if status in ["not_started", "in_progress", "completed", "dismissed"]:
            update_fields["onboarding_status"] = status
            if status == "completed":
                update_fields["settings_completed_at"] = datetime.now(timezone.utc).isoformat()
    
    if update_fields:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": update_fields}
        )
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {
        "onboarding_status": updated_user.get("onboarding_status"),
        "settings_completed_at": updated_user.get("settings_completed_at")
    }

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
    if user.get("role") not in ["admin", "super_admin"]:
        # Return only user's school
        school = await db.schools.find_one({"school_id": user.get("school_id")}, {"_id": 0})
        return [SchoolResponse(**school)] if school else []
    
    schools = await db.schools.find({}, {"_id": 0}).to_list(100)
    return [SchoolResponse(**s) for s in schools]

@api_router.post("/schools", response_model=SchoolResponse)
async def create_school(school_data: SchoolCreate, user: dict = Depends(get_current_user)):
    """Create a new school (admin only)"""
    if user.get("role") not in ["admin", "super_admin"]:
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
    if user.get("school_id") != school_id and user.get("role") not in ["admin", "super_admin"]:
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
    if user.get("role") in ["admin", "super_admin"]:
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
        "semester_id": class_data.semester_id,
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
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return ClassResponse(**class_doc)

@api_router.put("/classes/{class_id}", response_model=ClassResponse)
async def update_class(class_id: str, class_data: ClassCreate, user: dict = Depends(get_current_user)):
    """Update a class"""
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
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
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.classes.delete_one({"class_id": class_id})
    return {"message": "Class deleted"}


# ==================== SUBSTITUTE PACKET DATA ====================

class SubPacketData(BaseModel):
    main_office_ext: str = "Ext. 100"
    nurse_ext: str = "Ext. 105"
    daily_routines: str = ""
    emergency_procedures: str = ""
    additional_notes: str = ""

@api_router.get("/classes/{class_id}/sub-packet")
async def get_sub_packet(class_id: str, user: dict = Depends(get_current_user)):
    """Get saved substitute packet data for a class"""
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    packet = await db.sub_packets.find_one({"class_id": class_id}, {"_id": 0})
    return packet

@api_router.put("/classes/{class_id}/sub-packet")
async def save_sub_packet(class_id: str, data: SubPacketData, user: dict = Depends(get_current_user)):
    """Save substitute packet data for a class"""
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.sub_packets.update_one(
        {"class_id": class_id},
        {"$set": {
            "class_id": class_id,
            "teacher_id": user["user_id"],
            "main_office_ext": data.main_office_ext,
            "nurse_ext": data.nurse_ext,
            "daily_routines": data.daily_routines,
            "emergency_procedures": data.emergency_procedures,
            "additional_notes": data.additional_notes,
            "updated_at": now
        }},
        upsert=True
    )
    
    return {"message": "Packet data saved"}


# ==================== SEMESTER ENDPOINTS ====================

@api_router.get("/semesters")
async def get_semesters(user: dict = Depends(get_current_user)):
    """Get semesters for user's school"""
    school_id = user.get("school_id", "school_default")
    semesters = await db.semesters.find({"school_id": school_id}, {"_id": 0}).sort("start_date", -1).to_list(20)
    return semesters

@api_router.get("/semesters/active")
async def get_active_semester(user: dict = Depends(get_current_user)):
    """Get the currently active semester"""
    school_id = user.get("school_id", "school_default")
    semester = await db.semesters.find_one({"school_id": school_id, "is_active": True}, {"_id": 0})
    if not semester:
        # Return the most recent semester if none is active
        semester = await db.semesters.find_one({"school_id": school_id}, {"_id": 0}, sort=[("start_date", -1)])
    return semester

@api_router.post("/semesters", response_model=SemesterResponse)
async def create_semester(data: SemesterCreate, user: dict = Depends(get_current_user)):
    """Create a new semester (Teachers, Admins, and Super Admins can create)"""
    school_id = user.get("school_id", "school_default")
    semester_id = f"sem_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    
    # If this semester is active, deactivate others
    if data.is_active:
        await db.semesters.update_many(
            {"school_id": school_id},
            {"$set": {"is_active": False}}
        )
    
    semester_doc = {
        "semester_id": semester_id,
        "school_id": school_id,
        "name": data.name,
        "name_es": data.name_es or data.name,
        "start_date": data.start_date,
        "end_date": data.end_date,
        "year_term": data.year_term,
        "is_active": data.is_active,
        "created_by": user["user_id"],
        "created_at": now
    }
    
    await db.semesters.insert_one(semester_doc)
    return SemesterResponse(**semester_doc)

@api_router.put("/semesters/{semester_id}")
async def update_semester(semester_id: str, data: dict, user: dict = Depends(get_current_user)):
    """Update a semester (Teachers, Admins, and Super Admins can update)"""
    semester = await db.semesters.find_one({"semester_id": semester_id}, {"_id": 0})
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    
    school_id = user.get("school_id", "school_default")
    
    # If setting this as active, deactivate others
    if data.get("is_active"):
        await db.semesters.update_many(
            {"school_id": school_id, "semester_id": {"$ne": semester_id}},
            {"$set": {"is_active": False}}
        )
    
    update_data = {}
    for key in ["name", "name_es", "start_date", "end_date", "year_term", "is_active"]:
        if key in data:
            update_data[key] = data[key]
    
    if update_data:
        await db.semesters.update_one({"semester_id": semester_id}, {"$set": update_data})
    
    return {"message": "Semester updated"}

@api_router.delete("/semesters/{semester_id}")
async def delete_semester(semester_id: str, user: dict = Depends(get_current_user)):
    """Delete a semester (Teachers, Admins, and Super Admins can delete)"""
    # Check if semester has classes
    class_count = await db.classes.count_documents({"semester_id": semester_id})
    if class_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete semester with {class_count} classes")
    
    await db.semesters.delete_one({"semester_id": semester_id})
    return {"message": "Semester deleted"}

# ==================== STUDENT ENDPOINTS ====================

@api_router.get("/classes/{class_id}/students", response_model=List[StudentResponse])
async def get_students(class_id: str, user: dict = Depends(get_current_user)):
    """Get students in a class"""
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    students = await db.students.find({"class_id": class_id}, {"_id": 0}).to_list(100)
    return [StudentResponse(**s) for s in students]

@api_router.post("/classes/{class_id}/students", response_model=StudentResponse)
async def create_student(class_id: str, student_data: StudentCreate, user: dict = Depends(get_current_user)):
    """Add a student to a class"""
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
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
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
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
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
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
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
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
        "week2_start": plan_data.week2_start,
        "week2_end": plan_data.week2_end,
        "unit": plan_data.unit,
        "story": plan_data.story,
        "teacher_name": plan_data.teacher_name,
        "objective": plan_data.objective,
        "objective_week2": plan_data.objective_week2,
        "skills": plan_data.skills,
        "skills_week2": plan_data.skills_week2,
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
    
    if plan["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return LessonPlanResponse(**plan)

@api_router.put("/plans/{plan_id}", response_model=LessonPlanResponse)
async def update_plan(plan_id: str, plan_data: LessonPlanCreate, user: dict = Depends(get_current_user)):
    """Update a lesson plan"""
    plan = await db.lesson_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {
        "class_id": plan_data.class_id,
        "week_start": plan_data.week_start,
        "week_end": plan_data.week_end,
        "week2_start": plan_data.week2_start,
        "week2_end": plan_data.week2_end,
        "unit": plan_data.unit,
        "story": plan_data.story,
        "teacher_name": plan_data.teacher_name,
        "objective": plan_data.objective,
        "objective_week2": plan_data.objective_week2,
        "skills": plan_data.skills,
        "skills_week2": plan_data.skills_week2,
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
    
    if plan["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.lesson_plans.delete_one({"plan_id": plan_id})
    return {"message": "Plan deleted"}

@api_router.post("/plans/{plan_id}/duplicate", response_model=LessonPlanResponse)
async def duplicate_plan(plan_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Duplicate a lesson plan to a new week"""
    plan = await db.lesson_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
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

@api_router.get("/plans/{plan_id}/calendar")
async def export_plan_to_calendar(plan_id: str, user: dict = Depends(get_current_user)):
    """Export a lesson plan to .ics calendar format (compatible with Google, Microsoft, Apple)"""
    plan = await db.lesson_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get class info for better event titles
    class_info = await db.classes.find_one({"class_id": plan.get("class_id")}, {"_id": 0})
    class_name = class_info.get("name", "Class") if class_info else "Class"
    subject = class_info.get("subject", "") if class_info else ""
    
    # Get school info
    school = await db.schools.find_one({"school_id": plan.get("school_id")}, {"_id": 0})
    school_name = school.get("name", "School") if school else "School"
    
    # Build ICS content
    ics_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//TeacherHubPro//Lesson Planner//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{class_name} - Lesson Plan"
    ]
    
    # Helper function to format date for ICS (YYYYMMDD)
    def format_ics_date(date_str):
        if not date_str:
            return None
        try:
            # Handle various date formats
            if "T" in date_str:
                date_str = date_str.split("T")[0]
            return date_str.replace("-", "")
        except:
            return None
    
    # Helper to escape text for ICS
    def escape_ics(text):
        if not text:
            return ""
        return text.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n")
    
    # Generate unique ID for events
    def generate_uid(plan_id, day_index):
        return f"{plan_id}-day{day_index}@teacherhubpro.com"
    
    # Helper to calculate weekday dates from week_start
    def get_week_dates(week_start_str):
        from datetime import datetime, timedelta
        if not week_start_str:
            return []
        try:
            start_date = datetime.strptime(week_start_str.split("T")[0], "%Y-%m-%d")
            # Generate Mon-Fri dates
            dates = []
            for i in range(5):
                day_date = start_date + timedelta(days=i)
                dates.append(day_date.strftime("%Y-%m-%d"))
            return dates
        except:
            return []
    
    # Process days from the plan
    days = plan.get("days", [])
    day_names_en = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    day_names_es = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
    
    # If days array is empty or no dates, generate events from week_start/week_end
    if not days or not any(d.get("date") for d in days):
        # Generate events for Week 1
        week1_dates = get_week_dates(plan.get("week_start"))
        week2_dates = get_week_dates(plan.get("week2_start"))
        
        for week_num, week_dates in enumerate([week1_dates, week2_dates], 1):
            if not week_dates:
                continue
                
            objective = plan.get("objective") if week_num == 1 else plan.get("objective_week2", plan.get("objective"))
            skills = plan.get("skills") if week_num == 1 else plan.get("skills_week2", plan.get("skills"))
            
            for i, date_str in enumerate(week_dates):
                ics_date = format_ics_date(date_str)
                if not ics_date:
                    continue
                
                unit_title = plan.get("unit") or plan.get("story") or "Lesson"
                event_title = f"{class_name}: {unit_title}"
                if subject:
                    event_title = f"[{subject}] {event_title}"
                
                # Build description
                description_parts = []
                if objective:
                    description_parts.append(f"📎 OBJECTIVE: {objective}")
                if skills and any(s.strip() for s in skills if s):
                    description_parts.append("")
                    description_parts.append("🎓 SKILLS:")
                    for skill in skills:
                        if skill and skill.strip():
                            description_parts.append(f"  • {skill}")
                
                description_parts.append("")
                description_parts.append(f"📍 {school_name}")
                description_parts.append(f"Week {week_num} - {day_names_en[i]}")
                description_parts.append("---")
                description_parts.append("Generated by TeacherHubPro")
                
                full_description = "\\n".join(description_parts)
                now_stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
                
                ics_lines.extend([
                    "BEGIN:VEVENT",
                    f"UID:{generate_uid(plan_id, week_num * 10 + i)}",
                    f"DTSTAMP:{now_stamp}",
                    f"DTSTART;VALUE=DATE:{ics_date}",
                    f"DTEND;VALUE=DATE:{ics_date}",
                    f"SUMMARY:{escape_ics(event_title)}",
                    f"DESCRIPTION:{escape_ics(full_description)}",
                    f"LOCATION:{escape_ics(school_name)}",
                    "STATUS:CONFIRMED",
                    "TRANSP:TRANSPARENT",
                    "END:VEVENT"
                ])
    else:
        # Process actual days array
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        for i, day in enumerate(days):
            day_date = day.get("date")
            if not day_date:
                continue
            
            ics_date = format_ics_date(day_date)
            if not ics_date:
                continue
            
            # Determine week number for title
            week_num = day.get("week_index", 1)
            day_name = day.get("day_name", day_names[i % 5] if i < 10 else "Day").capitalize()
            
            # Build event title
            unit_title = plan.get("unit") or plan.get("story") or "Lesson"
            event_title = f"{class_name}: {unit_title}"
            if subject:
                event_title = f"[{subject}] {event_title}"
            
            # Build event description with full lesson details
            description_parts = []
            
            # Add objective
            objective = plan.get("objective") if week_num == 1 else plan.get("objective_week2")
            if objective:
                description_parts.append(f"📎 OBJECTIVE: {objective}")
            
            # Add theme for the day
            if day.get("theme"):
                description_parts.append(f"📌 THEME: {day.get('theme')}")
            
            # Add activities
            activities = day.get("activities", [])
            checked_activities = [a for a in activities if a.get("checked")]
            if checked_activities:
                description_parts.append("")
                description_parts.append("📋 ACTIVITIES:")
                for act in checked_activities:
                    act_type = act.get("activity_type", "").replace("_", " ").title()
                    notes = f" - {act.get('notes')}" if act.get("notes") else ""
                    description_parts.append(f"  • {act_type}{notes}")
            
            # Add materials
            materials = day.get("materials", [])
            checked_materials = [m for m in materials if m.get("checked")]
            if checked_materials:
                description_parts.append("")
                description_parts.append("📚 MATERIALS:")
                for mat in checked_materials:
                    mat_type = mat.get("material_type", "").replace("_", " ").title()
                    description_parts.append(f"  • {mat_type}")
            
            # Add DOK levels
            dok_levels = day.get("dok_levels", [])
            if dok_levels:
                dok_labels = {1: "Recall", 2: "Skill/Concept", 3: "Strategic Thinking", 4: "Extended Thinking"}
                dok_str = ", ".join([f"DOK {d}: {dok_labels.get(d, '')}" for d in dok_levels])
                description_parts.append(f"🎯 DOK LEVELS: {dok_str}")
            
            # Add notes
            if day.get("notes"):
                description_parts.append("")
                description_parts.append(f"📝 NOTES: {day.get('notes')[:500]}")
            
            # Add skills for the week
            skills = plan.get("skills") if week_num == 1 else plan.get("skills_week2")
            if skills and any(s.strip() for s in skills if s):
                description_parts.append("")
                description_parts.append("🎓 SKILLS:")
                for skill in skills:
                    if skill and skill.strip():
                        description_parts.append(f"  • {skill}")
            
            description_parts.append("")
            description_parts.append(f"📍 {school_name}")
            description_parts.append(f"Week {week_num} - {day_name}")
            description_parts.append("---")
            description_parts.append("Generated by TeacherHubPro")
            
            full_description = "\\n".join(description_parts)
            
            # Create the event
            now_stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            
            ics_lines.extend([
                "BEGIN:VEVENT",
                f"UID:{generate_uid(plan_id, i)}",
                f"DTSTAMP:{now_stamp}",
                f"DTSTART;VALUE=DATE:{ics_date}",
                f"DTEND;VALUE=DATE:{ics_date}",
                f"SUMMARY:{escape_ics(event_title)}",
                f"DESCRIPTION:{escape_ics(full_description)}",
                f"LOCATION:{escape_ics(school_name)}",
                "STATUS:CONFIRMED",
                "TRANSP:TRANSPARENT",
                "END:VEVENT"
            ])
    
    ics_lines.append("END:VCALENDAR")
    
    # Join with CRLF as per ICS spec
    ics_content = "\r\n".join(ics_lines)
    
    # Return as downloadable file
    filename = f"lesson_plan_{plan_id}.ics"
    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "text/calendar; charset=utf-8"
        }
    )

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
    
    if session["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return AttendanceSessionResponse(**session)

@api_router.put("/attendance/{session_id}/submit")
async def submit_attendance(session_id: str, user: dict = Depends(get_current_user)):
    """Submit/lock attendance session"""
    session = await db.attendance_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
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
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
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
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    category_id = f"cat_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    
    category_doc = {
        "category_id": category_id,
        "class_id": class_id,
        "name": category_data.name,
        "name_es": category_data.name_es or category_data.name,
        "weight_percent": category_data.weight_percent,
        "created_at": now
    }
    
    await db.grade_categories.insert_one(category_doc)
    return CategoryResponse(**category_doc)

@api_router.put("/categories/{category_id}")
async def update_category(category_id: str, data: dict, user: dict = Depends(get_current_user)):
    """Update a grade category"""
    category = await db.grade_categories.find_one({"category_id": category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    class_doc = await db.classes.find_one({"class_id": category["class_id"]}, {"_id": 0})
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {}
    if "name" in data:
        update_data["name"] = data["name"]
    if "name_es" in data:
        update_data["name_es"] = data["name_es"]
    if "weight_percent" in data:
        update_data["weight_percent"] = data["weight_percent"]
    
    if update_data:
        await db.grade_categories.update_one(
            {"category_id": category_id},
            {"$set": update_data}
        )
    
    return {"message": "Category updated"}

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, user: dict = Depends(get_current_user)):
    """Delete a grade category"""
    category = await db.grade_categories.find_one({"category_id": category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    class_doc = await db.classes.find_one({"class_id": category["class_id"]}, {"_id": 0})
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if category has assignments
    assignments_count = await db.assignments.count_documents({"category_id": category_id})
    if assignments_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete category with assignments")
    
    await db.grade_categories.delete_one({"category_id": category_id})
    return {"message": "Category deleted"}

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
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
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
    
    if assignment["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return AssignmentResponse(**assignment)

@api_router.put("/assignments/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(assignment_id: str, assignment_data: AssignmentCreate, user: dict = Depends(get_current_user)):
    """Update an assignment"""
    assignment = await db.assignments.find_one({"assignment_id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
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
    
    if assignment["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
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
    
    if assignment["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    grades = await db.grades.find({"assignment_id": assignment_id}, {"_id": 0}).to_list(100)
    return grades

@api_router.post("/grades/bulk")
async def bulk_update_grades(grades_data: GradesBulkUpdate, user: dict = Depends(get_current_user)):
    """Bulk update grades for an assignment"""
    assignment = await db.assignments.find_one({"assignment_id": grades_data.assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
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
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
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

@api_router.get("/gradebook/report/{class_id}")
async def get_gradebook_report(class_id: str, user: dict = Depends(get_current_user)):
    """Get gradebook report for a class with student averages"""
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    students = await db.students.find({"class_id": class_id}, {"_id": 0}).to_list(100)
    assignments = await db.assignments.find({"class_id": class_id}, {"_id": 0}).to_list(100)
    categories = await db.grade_categories.find({"class_id": class_id}, {"_id": 0}).to_list(50)
    
    # Get all grades
    assignment_ids = [a["assignment_id"] for a in assignments]
    grades = await db.grades.find({"assignment_id": {"$in": assignment_ids}}, {"_id": 0}).to_list(10000)
    
    # Build grades map
    grades_map = {}
    for grade in grades:
        key = f"{grade['student_id']}_{grade['assignment_id']}"
        grades_map[key] = grade
    
    # Calculate student averages
    student_reports = []
    for student in students:
        total_points = 0
        max_points = 0
        assignments_completed = 0
        
        for assignment in assignments:
            key = f"{student['student_id']}_{assignment['assignment_id']}"
            grade = grades_map.get(key)
            if grade and grade.get('score') is not None:
                total_points += grade['score']
                max_points += assignment['points']
                assignments_completed += 1
        
        average = (total_points / max_points * 100) if max_points > 0 else None
        
        student_reports.append({
            "student_id": student["student_id"],
            "first_name": student.get("first_name", ""),
            "last_name": student.get("last_name", ""),
            "assignments_completed": assignments_completed,
            "total_points": total_points,
            "max_points": max_points,
            "average": average
        })
    
    return {
        "class_id": class_id,
        "class_name": class_doc.get("name", ""),
        "students": student_reports,
        "total_assignments": len(assignments),
        "categories": categories
    }

# ==================== PARENT PORTAL ENDPOINTS ====================

@api_router.post("/students/{student_id}/portal-token")
async def generate_portal_token(student_id: str, expires_days: int = 30, user: dict = Depends(get_current_user)):
    """Generate or get portal access token for a student"""
    student = await db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check permission
    class_doc = await db.classes.find_one({"class_id": student["class_id"]}, {"_id": 0})
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if valid token already exists
    existing = await db.portal_tokens.find_one({"student_id": student_id}, {"_id": 0})
    if existing:
        # Check if expired
        if existing.get("expires_at"):
            expires_at = datetime.fromisoformat(existing["expires_at"].replace("Z", "+00:00"))
            if expires_at > datetime.now(timezone.utc):
                return {
                    "token": existing["token"],
                    "portal_url": f"/portal/{existing['token']}",
                    "created_at": existing["created_at"],
                    "expires_at": existing.get("expires_at")
                }
            else:
                # Token expired, delete it
                await db.portal_tokens.delete_one({"token": existing["token"]})
        else:
            return {
                "token": existing["token"],
                "portal_url": f"/portal/{existing['token']}",
                "created_at": existing["created_at"],
                "expires_at": existing.get("expires_at")
            }
    
    # Generate new token with expiration
    token = f"portal_{uuid.uuid4().hex}"
    now = datetime.now(timezone.utc)
    expires_at = (now + timedelta(days=expires_days)).isoformat()
    
    await db.portal_tokens.insert_one({
        "token": token,
        "student_id": student_id,
        "school_id": student.get("school_id"),
        "created_at": now.isoformat(),
        "expires_at": expires_at,
        "created_by": user["user_id"]
    })
    
    return {
        "token": token,
        "portal_url": f"/portal/{token}",
        "created_at": now.isoformat(),
        "expires_at": expires_at
    }

@api_router.post("/portal/email")
async def send_portal_email(data: PortalEmailRequest, user: dict = Depends(get_current_user)):
    """Send portal link to parent via email"""
    student = await db.students.find_one({"student_id": data.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check permission
    class_doc = await db.classes.find_one({"class_id": student["class_id"]}, {"_id": 0})
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Generate or get token with expiration
    token_result = await generate_portal_token(data.student_id, data.expires_days, user)
    
    # Get school info for branding
    school = await db.schools.find_one({"school_id": student.get("school_id")}, {"_id": 0})
    school_name = school.get("name", "TeacherHubPro") if school else "TeacherHubPro"
    
    # Build email HTML - use production URL 
    base_url = os.environ.get('FRONTEND_URL', 'https://teacherhubpro.com')
    portal_url = f"{base_url}/portal/{token_result['token']}"
    expires_date = datetime.fromisoformat(token_result['expires_at'].replace("Z", "+00:00")).strftime("%B %d, %Y")
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #65A30D 0%, #4A7C10 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">{school_name}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Portal del Estudiante / Student Portal</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #334155; font-size: 16px; margin: 0 0 15px 0;">
                Estimado padre/madre de familia,<br><br>
                Le compartimos el acceso al portal del estudiante para <strong>{student.get('first_name', '')} {student.get('last_name', '')}</strong>.
            </p>
            
            <p style="color: #64748b; font-size: 14px; margin: 0 0 20px 0;">
                Dear Parent/Guardian,<br><br>
                We are sharing the student portal access for <strong>{student.get('first_name', '')} {student.get('last_name', '')}</strong>.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{portal_url}" 
                   style="background: #65A30D; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Acceder al Portal / Access Portal
                </a>
            </div>
            
            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="color: #64748b; font-size: 12px; margin: 0 0 10px 0;">
                    O copie este enlace / Or copy this link:
                </p>
                <p style="color: #334155; font-size: 12px; word-break: break-all; margin: 0; font-family: monospace; background: #f1f5f9; padding: 10px; border-radius: 4px;">
                    {portal_url}
                </p>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="color: #92400e; font-size: 13px; margin: 0;">
                    ⚠️ Este enlace expira el <strong>{expires_date}</strong>.<br>
                    This link expires on <strong>{expires_date}</strong>.
                </p>
            </div>
            
            <p style="color: #64748b; font-size: 13px; margin: 20px 0 0 0;">
                Este portal es de solo lectura. Para cualquier pregunta, contacte al maestro.<br>
                <em>This portal is read-only. For any questions, please contact the teacher.</em>
            </p>
        </div>
        
        <div style="background: #334155; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Enviado desde {school_name} vía TeacherHubPro<br>
                Sent from {school_name} via TeacherHubPro
            </p>
        </div>
    </div>
    """
    
    params = {
        "from": SENDER_EMAIL,
        "to": [data.parent_email],
        "subject": f"Portal del Estudiante - {student.get('first_name', '')} {student.get('last_name', '')} | {school_name}",
        "html": html_content
    }
    
    try:
        logger.info(f"Attempting to send email from {SENDER_EMAIL} to {data.parent_email}")
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent successfully: {email}")
        return {
            "status": "success",
            "message": f"Email sent to {data.parent_email}",
            "email_id": email.get("id"),
            "portal_url": portal_url,
            "expires_at": token_result['expires_at']
        }
    except Exception as e:
        logger.error(f"Failed to send email from {SENDER_EMAIL} to {data.parent_email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@api_router.get("/portal/{token}")
async def get_portal_data(token: str):
    """Get student portal data (public endpoint, no auth required)"""
    # Find token
    token_doc = await db.portal_tokens.find_one({"token": token}, {"_id": 0})
    if not token_doc:
        raise HTTPException(status_code=404, detail="Invalid or expired access link")
    
    # Check expiration
    if token_doc.get("expires_at"):
        expires_at = datetime.fromisoformat(token_doc["expires_at"].replace("Z", "+00:00"))
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=410, detail="This access link has expired. Please contact the teacher for a new link.")
    
    student_id = token_doc["student_id"]
    
    # Get student info
    student = await db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get school info
    school = None
    if student.get("school_id"):
        school = await db.schools.find_one({"school_id": student["school_id"]}, {"_id": 0})
    
    # Get all classes the student is in
    classes_data = []
    classes = await db.classes.find({"class_id": student["class_id"]}, {"_id": 0}).to_list(20)
    
    for cls in classes:
        # Get assignments for this class
        assignments = await db.assignments.find({"class_id": cls["class_id"]}, {"_id": 0}).to_list(100)
        
        # Get grades for this student
        assignment_ids = [a["assignment_id"] for a in assignments]
        grades = await db.grades.find({
            "student_id": student_id,
            "assignment_id": {"$in": assignment_ids}
        }, {"_id": 0}).to_list(100)
        grades_map = {g["assignment_id"]: g for g in grades}
        
        # Calculate average
        total_points = 0
        max_points = 0
        assignments_with_grades = []
        
        for assignment in assignments:
            grade = grades_map.get(assignment["assignment_id"])
            score = grade.get("score") if grade else None
            
            assignments_with_grades.append({
                "assignment_id": assignment["assignment_id"],
                "title": assignment.get("title", ""),
                "points": assignment.get("points", 0),
                "due_date": assignment.get("due_date"),
                "score": score
            })
            
            if score is not None:
                total_points += score
                max_points += assignment.get("points", 0)
        
        average = (total_points / max_points * 100) if max_points > 0 else None
        
        # Get attendance for this class
        attendance_records = await db.attendance_records.find({
            "student_id": student_id,
            "class_id": cls["class_id"]
        }, {"_id": 0}).sort("date", -1).to_list(30)
        
        attendance_summary = {"present": 0, "absent": 0, "tardy": 0, "excused": 0, "total": 0}
        for record in attendance_records:
            status = record.get("status", "present")
            attendance_summary[status] = attendance_summary.get(status, 0) + 1
            attendance_summary["total"] += 1
        
        # Recent grades (last 5 graded assignments)
        recent_grades = [
            {
                "assignment_id": a["assignment_id"],
                "title": a["title"],
                "points": a["points"],
                "score": a["score"]
            }
            for a in assignments_with_grades if a["score"] is not None
        ][-5:]
        
        classes_data.append({
            "class_id": cls["class_id"],
            "name": cls.get("name", ""),
            "subject": cls.get("subject", ""),
            "grade": cls.get("grade", ""),
            "section": cls.get("section", ""),
            "average": average,
            "assignments": assignments_with_grades,
            "recent_grades": recent_grades,
            "attendance": attendance_summary,
            "attendance_history": [
                {"date": r.get("date"), "status": r.get("status")}
                for r in attendance_records[:10]
            ]
        })
    
    # Get upcoming assignments (next 7 days)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    week_from_now = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")
    
    upcoming = []
    for cls in classes_data:
        for a in cls["assignments"]:
            if a["due_date"] and today <= a["due_date"] <= week_from_now and a["score"] is None:
                upcoming.append({
                    "assignment_id": a["assignment_id"],
                    "title": a["title"],
                    "points": a["points"],
                    "due_date": a["due_date"],
                    "class_name": cls["name"]
                })
    
    upcoming.sort(key=lambda x: x["due_date"])
    
    return {
        "student": {
            "student_id": student["student_id"],
            "first_name": student.get("first_name", ""),
            "last_name": student.get("last_name", ""),
            "grade": student.get("grade", "")
        },
        "school": {
            "name": school.get("name") if school else None,
            "logo_url": school.get("logo_url") if school else None
        } if school else None,
        "classes": classes_data,
        "upcoming_assignments": upcoming[:5],
        "language": "es"
    }

@api_router.delete("/students/{student_id}/portal-token")
async def revoke_portal_token(student_id: str, user: dict = Depends(get_current_user)):
    """Revoke portal access token for a student"""
    student = await db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    class_doc = await db.classes.find_one({"class_id": student["class_id"]}, {"_id": 0})
    if class_doc["teacher_id"] != user["user_id"] and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.portal_tokens.delete_many({"student_id": student_id})
    return {"message": "Portal access revoked"}

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

# ==================== SUBSCRIPTION ENDPOINTS ====================

@api_router.get("/subscription/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    return SUBSCRIPTION_PLANS

@api_router.get("/subscription/status")
async def get_subscription_status(user: dict = Depends(get_current_user)):
    """Get current user's subscription status"""
    # Super Admins and Admins have full access without payment
    if user.get("role") in ["admin", "super_admin"]:
        return {
            "has_access": True,
            "status": "admin",
            "plan": "admin",
            "message": "Admin accounts have full access"
        }
    
    # Check for active subscription
    subscription = await db.subscriptions.find_one(
        {"user_id": user["user_id"], "status": {"$in": ["active", "trialing"]}},
        {"_id": 0}
    )
    
    if subscription:
        # Check if trial has expired
        if subscription.get("status") == "trialing" and subscription.get("trial_end"):
            trial_end = datetime.fromisoformat(subscription["trial_end"].replace('Z', '+00:00'))
            if datetime.now(timezone.utc) > trial_end:
                # Update subscription status
                await db.subscriptions.update_one(
                    {"subscription_id": subscription["subscription_id"]},
                    {"$set": {"status": "expired"}}
                )
                return {
                    "has_access": False,
                    "status": "trial_expired",
                    "plan": None,
                    "message": "Your free trial has expired. Please subscribe to continue."
                }
        
        return {
            "has_access": True,
            "status": subscription["status"],
            "plan": subscription["plan_id"],
            "subscription": subscription,
            "message": "Active subscription"
        }
    
    # No subscription - check if user is within initial trial period
    user_data = await db.users.find_one({"user_id": user["user_id"]})
    if user_data:
        created_at = datetime.fromisoformat(user_data["created_at"].replace('Z', '+00:00'))
        trial_end = created_at + timedelta(days=FREE_TRIAL_DAYS)
        now = datetime.now(timezone.utc)
        
        if now < trial_end:
            # Calculate days left (round up to show at least 1 if any time remains)
            time_left = trial_end - now
            days_left = time_left.days
            # If less than 1 day but still time left, show 1 day
            if days_left == 0 and time_left.total_seconds() > 0:
                days_left = 1
            
            return {
                "has_access": True,
                "status": "trialing",
                "plan": "free_trial",
                "trial_ends": trial_end.isoformat(),
                "days_left": days_left,
                "message": f"Free trial: {days_left} day{'s' if days_left != 1 else ''} remaining"
            }
    
    # Trial has expired - block access
    return {
        "has_access": False,
        "status": "trial_expired",
        "plan": None,
        "trial_ends": trial_end.isoformat() if user_data else None,
        "message": "Your free trial has expired. Please subscribe to continue using TeacherHubPro."
    }

@api_router.post("/subscription/checkout")
async def create_checkout_session(request: CheckoutRequest, user: dict = Depends(get_current_user)):
    """Create a Stripe checkout session for subscription"""
    import stripe
    stripe.api_key = STRIPE_API_KEY
    
    plan = SUBSCRIPTION_PLANS.get(request.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan ID")
    
    # Calculate price
    if request.plan_id in ["school", "district"]:
        min_teachers = plan["min_teachers"]
        if request.quantity < min_teachers:
            raise HTTPException(
                status_code=400, 
                detail=f"Minimum {min_teachers} teachers required for {plan['name']}"
            )
        # Price per teacher per month * 12 months * quantity
        total_price = int(plan["price_per_teacher"] * 12 * request.quantity * 100)  # In cents
    else:
        total_price = int(plan["price"] * 100)  # In cents
    
    try:
        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': plan["name"],
                        'description': plan["description"],
                    },
                    'unit_amount': total_price,
                    'recurring': {
                        'interval': plan["interval"],
                        'interval_count': 1,
                    },
                },
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{request.origin_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{request.origin_url}/pricing",
            customer_email=user.get("email"),
            metadata={
                'user_id': user["user_id"],
                'plan_id': request.plan_id,
                'quantity': str(request.quantity)
            },
            subscription_data={
                'trial_period_days': FREE_TRIAL_DAYS,
                'metadata': {
                    'user_id': user["user_id"],
                    'plan_id': request.plan_id,
                }
            }
        )
        
        return {"checkout_url": checkout_session.url, "session_id": checkout_session.id}
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail=f"Payment processing error: {str(e)}")

@api_router.get("/subscription/success")
async def subscription_success(session_id: str, user: dict = Depends(get_current_user)):
    """Handle successful subscription checkout"""
    import stripe
    stripe.api_key = STRIPE_API_KEY
    
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status == "paid" or session.status == "complete":
            # Create subscription record
            now = datetime.now(timezone.utc)
            subscription_id = f"sub_{uuid.uuid4().hex[:12]}"
            
            subscription_doc = {
                "subscription_id": subscription_id,
                "user_id": user["user_id"],
                "plan_id": session.metadata.get("plan_id", "individual_monthly"),
                "quantity": int(session.metadata.get("quantity", 1)),
                "status": "active",
                "stripe_subscription_id": session.subscription,
                "stripe_customer_id": session.customer,
                "current_period_start": now.isoformat(),
                "current_period_end": (now + timedelta(days=30)).isoformat(),
                "trial_end": (now + timedelta(days=FREE_TRIAL_DAYS)).isoformat() if session.subscription else None,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            
            # Upsert subscription
            await db.subscriptions.update_one(
                {"user_id": user["user_id"]},
                {"$set": subscription_doc},
                upsert=True
            )
            
            # Update user's subscription status
            await db.users.update_one(
                {"user_id": user["user_id"]},
                {"$set": {"subscription_status": "active", "subscription_plan": subscription_doc["plan_id"]}}
            )
            
            return {"status": "success", "subscription": subscription_doc}
        
        return {"status": "pending", "message": "Payment not yet confirmed"}
    except Exception as e:
        logger.error(f"Subscription success error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/subscription/cancel")
async def cancel_subscription(user: dict = Depends(get_current_user)):
    """Cancel user's subscription"""
    import stripe
    stripe.api_key = STRIPE_API_KEY
    
    subscription = await db.subscriptions.find_one(
        {"user_id": user["user_id"], "status": {"$in": ["active", "trialing"]}},
        {"_id": 0}
    )
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    try:
        # Cancel on Stripe if exists
        if subscription.get("stripe_subscription_id"):
            stripe.Subscription.modify(
                subscription["stripe_subscription_id"],
                cancel_at_period_end=True
            )
        
        # Update local record
        await db.subscriptions.update_one(
            {"subscription_id": subscription["subscription_id"]},
            {"$set": {"status": "canceled", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"subscription_status": "canceled"}}
        )
        
        return {"status": "canceled", "message": "Subscription will end at the current billing period"}
    except Exception as e:
        logger.error(f"Cancel subscription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/subscription/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks with signature verification"""
    import stripe
    stripe.api_key = STRIPE_API_KEY
    
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    # Verify webhook signature for security
    try:
        if STRIPE_WEBHOOK_SECRET and sig_header:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        else:
            # Fallback for development/testing without signature
            import json
            event = stripe.Event.construct_from(
                json.loads(payload), stripe.api_key
            )
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Webhook signature verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    # Handle the event
    if event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        user_id = subscription.get('metadata', {}).get('user_id')
        if user_id:
            status = subscription['status']
            await db.subscriptions.update_one(
                {"stripe_subscription_id": subscription['id']},
                {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        await db.subscriptions.update_one(
            {"stripe_subscription_id": subscription['id']},
            {"$set": {"status": "expired", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    elif event['type'] == 'invoice.payment_failed':
        invoice = event['data']['object']
        subscription_id = invoice.get('subscription')
        if subscription_id:
            await db.subscriptions.update_one(
                {"stripe_subscription_id": subscription_id},
                {"$set": {"status": "past_due", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
    
    return {"received": True}

# ==================== TRIAL REMINDER EMAILS ====================

def get_trial_reminder_email_html(user_name: str, days_left: int, language: str = "en") -> str:
    """Generate HTML email for trial expiration reminder"""
    
    if language == "es":
        subject_text = f"¡Tu prueba gratuita de TeacherHubPro termina en {days_left} días!"
        greeting = f"Hola {user_name},"
        message = f"""
        <p>Tu período de prueba gratuita de <strong>TeacherHubPro</strong> terminará en <strong>{days_left} días</strong>.</p>
        <p>No pierdas acceso a todas las herramientas que te ayudan a:</p>
        <ul>
            <li>📚 Planificar lecciones de manera eficiente</li>
            <li>📊 Llevar control de asistencia y calificaciones</li>
            <li>🎨 Crear presentaciones educativas con IA</li>
            <li>📄 Generar paquetes para sustitutos</li>
        </ul>
        <p><strong>Suscríbete hoy</strong> y continúa disfrutando de todas las funcionalidades sin interrupción.</p>
        """
        cta_text = "Ver Planes de Suscripción"
        footer = "Si tienes preguntas, no dudes en contactarnos."
    else:
        subject_text = f"Your TeacherHubPro free trial ends in {days_left} days!"
        greeting = f"Hi {user_name},"
        message = f"""
        <p>Your free trial of <strong>TeacherHubPro</strong> will end in <strong>{days_left} days</strong>.</p>
        <p>Don't lose access to all the tools that help you:</p>
        <ul>
            <li>📚 Plan lessons efficiently</li>
            <li>📊 Track attendance and grades</li>
            <li>🎨 Create AI-powered educational presentations</li>
            <li>📄 Generate substitute packets</li>
        </ul>
        <p><strong>Subscribe today</strong> and continue enjoying all features without interruption.</p>
        """
        cta_text = "View Subscription Plans"
        footer = "If you have any questions, don't hesitate to contact us."
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">TeacherHubPro</h1>
                                <p style="color: #cffafe; margin: 10px 0 0 0; font-size: 14px;">Your Digital Teaching Assistant</p>
                            </td>
                        </tr>
                        
                        <!-- Alert Banner -->
                        <tr>
                            <td style="background-color: #fef3c7; padding: 15px 30px; border-left: 4px solid #f59e0b;">
                                <p style="margin: 0; color: #92400e; font-weight: 600;">
                                    ⏰ {days_left} {"días restantes" if language == "es" else "days remaining"} {"en tu prueba gratuita" if language == "es" else "in your free trial"}
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 30px;">
                                <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 20px;">{greeting}</h2>
                                <div style="color: #475569; font-size: 16px; line-height: 1.6;">
                                    {message}
                                </div>
                                
                                <!-- CTA Button -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                    <tr>
                                        <td align="center">
                                            <a href="https://homeschool-platform.preview.emergentagent.com/pricing" 
                                               style="display: inline-block; background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                                {cta_text}
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="color: #64748b; font-size: 14px; margin-top: 20px;">{footer}</p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafc; padding: 20px 30px; border-radius: 0 0 12px 12px; text-align: center;">
                                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                                    © 2026 TeacherHubPro. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return html

async def send_trial_reminder_email(user_email: str, user_name: str, days_left: int, language: str = "en"):
    """Send trial expiration reminder email"""
    if language == "es":
        subject = f"⏰ Tu prueba gratuita termina en {days_left} días - TeacherHubPro"
    else:
        subject = f"⏰ Your free trial ends in {days_left} days - TeacherHubPro"
    
    html_content = get_trial_reminder_email_html(user_name, days_left, language)
    
    params = {
        "from": SENDER_EMAIL,
        "to": [user_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Trial reminder email sent to {user_email}: {email.get('id')}")
        return {"success": True, "email_id": email.get("id")}
    except Exception as e:
        logger.error(f"Failed to send trial reminder to {user_email}: {str(e)}")
        return {"success": False, "error": str(e)}

@api_router.post("/subscription/send-trial-reminders")
async def send_trial_reminders(request: Request):
    """Send trial expiration reminder emails to users (admin/super_admin only or cron job)"""
    # Check if this is an admin request or internal cron
    api_key = request.headers.get("X-API-Key")
    is_cron = api_key == os.environ.get("CRON_API_KEY", "internal-cron-key")
    
    if not is_cron:
        user = await get_current_user(request)
        if not user or user.get("role") not in ["admin", "super_admin"]:
            raise HTTPException(status_code=403, detail="Admin access required")
    
    # Find users whose trial expires in 2-3 days
    now = datetime.now(timezone.utc)
    reminder_start = now + timedelta(days=2)  # 2 days from now
    reminder_end = now + timedelta(days=4)    # Up to 3+ days from now
    
    # Get all teacher users
    users = await db.users.find({"role": "teacher"}, {"_id": 0}).to_list(1000)
    
    emails_sent = []
    emails_failed = []
    already_reminded = []
    
    for user_data in users:
        # Skip if user has active subscription
        subscription = await db.subscriptions.find_one({
            "user_id": user_data["user_id"],
            "status": {"$in": ["active", "trialing"]}
        })
        if subscription:
            continue
        
        # Calculate trial end date
        created_at = datetime.fromisoformat(user_data["created_at"].replace('Z', '+00:00'))
        trial_end = created_at + timedelta(days=FREE_TRIAL_DAYS)
        
        # Check if trial expires within reminder window (2-3 days)
        if reminder_start <= trial_end <= reminder_end:
            days_left = (trial_end - now).days
            if days_left < 1:
                days_left = 1
            
            # Check if we already sent a reminder recently (within 24 hours)
            recent_reminder = await db.trial_reminders.find_one({
                "user_id": user_data["user_id"],
                "sent_at": {"$gte": (now - timedelta(hours=24)).isoformat()}
            })
            
            if recent_reminder:
                already_reminded.append(user_data["email"])
                continue
            
            # Send reminder email
            result = await send_trial_reminder_email(
                user_data["email"],
                user_data.get("name", "Teacher"),
                days_left,
                user_data.get("language", "en")
            )
            
            if result["success"]:
                # Record that we sent this reminder
                await db.trial_reminders.insert_one({
                    "user_id": user_data["user_id"],
                    "email": user_data["email"],
                    "days_left": days_left,
                    "sent_at": now.isoformat(),
                    "email_id": result.get("email_id")
                })
                emails_sent.append({"email": user_data["email"], "days_left": days_left})
            else:
                emails_failed.append({"email": user_data["email"], "error": result.get("error")})
    
    return {
        "status": "completed",
        "emails_sent": len(emails_sent),
        "emails_failed": len(emails_failed),
        "already_reminded": len(already_reminded),
        "details": {
            "sent": emails_sent,
            "failed": emails_failed,
            "skipped": already_reminded
        }
    }

@api_router.post("/subscription/test-reminder-email")
async def test_reminder_email(request: Request):
    """Send a test trial reminder email to the current user (for testing)"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get user details
    user_data = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Send test email with 3 days left
    result = await send_trial_reminder_email(
        user_data["email"],
        user_data.get("name", "Teacher"),
        3,  # Test with 3 days
        user_data.get("language", "en")
    )
    
    if result["success"]:
        return {
            "status": "success",
            "message": f"Test reminder email sent to {user_data['email']}",
            "email_id": result.get("email_id")
        }
    else:
        # Return error info but don't crash - Resend test mode restriction
        error_msg = result.get("error", "Unknown error")
        if "only send testing emails to your own email" in error_msg:
            return {
                "status": "test_mode_restriction",
                "message": "Resend is in test mode. To send to other addresses, verify a domain at resend.com/domains",
                "attempted_recipient": user_data["email"],
                "note": "The email template is ready. Once domain is verified, emails will send successfully."
            }
        raise HTTPException(status_code=500, detail=f"Failed to send email: {error_msg}")

# ==================== ADMIN MANAGEMENT ENDPOINTS ====================

class UpdateUserRoleRequest(BaseModel):
    user_id: str
    role: str  # 'teacher' or 'admin'

@api_router.get("/admin/users")
async def get_all_users(request: Request):
    """Get all users (admin only)"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if user is admin
    if user.get('role') not in ['admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find(
        {},
        {"_id": 0, "user_id": 1, "email": 1, "name": 1, "role": 1, "school_id": 1, "created_at": 1}
    ).to_list(length=100)
    
    return {"users": users}

@api_router.put("/admin/users/role")
async def update_user_role(data: UpdateUserRoleRequest, request: Request):
    """Update a user's role (admin only)"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if user is admin
    if user.get('role') not in ['admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Validate role
    if data.role not in ['teacher', 'admin']:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'teacher' or 'admin'")
    
    # Prevent admin from demoting themselves
    if data.user_id == user.get('user_id') and data.role != 'admin':
        raise HTTPException(status_code=400, detail="Cannot demote yourself from admin")
    
    # Update user role
    result = await db.users.update_one(
        {"user_id": data.user_id},
        {"$set": {"role": data.role, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get updated user
    updated_user = await db.users.find_one(
        {"user_id": data.user_id},
        {"_id": 0, "user_id": 1, "email": 1, "name": 1, "role": 1}
    )
    
    return {"message": "User role updated successfully", "user": updated_user}

# ==================== ONE-TIME ADMIN SETUP ====================

class AdminSetupRequest(BaseModel):
    email: str
    setup_key: str

@api_router.post("/setup/first-admin")
async def setup_first_admin(data: AdminSetupRequest):
    """
    One-time endpoint to create the first super admin user.
    Only works if no super_admin exists yet.
    Requires the correct setup key for security.
    """
    # Security key - change this to something unique
    SETUP_KEY = "TeacherHubPro2026SecureSetup"
    
    # Verify setup key
    if data.setup_key != SETUP_KEY:
        raise HTTPException(status_code=403, detail="Invalid setup key")
    
    # Check if any super_admin already exists
    existing_admin = await db.users.find_one({"role": "super_admin"})
    if existing_admin:
        raise HTTPException(
            status_code=400, 
            detail="Super Admin already exists. This endpoint is disabled."
        )
    
    # Find the user by email
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail=f"User with email {data.email} not found. Please register/login first.")
    
    # Upgrade to super_admin
    await db.users.update_one(
        {"email": data.email},
        {"$set": {"role": "super_admin", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "success": True,
        "message": f"User {data.email} has been upgraded to Super Admin!",
        "note": "You now have full access to the Admin Panel."
    }

# ==================== SUPER ADMIN ENDPOINTS ====================

class SchoolCreate(BaseModel):
    name: str
    address: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    logo_url: Optional[str] = ""
    # Branding
    primary_color: Optional[str] = "#65A30D"  # Green default
    secondary_color: Optional[str] = "#334155"  # Slate default
    accent_color: Optional[str] = "#F59E0B"  # Amber default
    font_family: Optional[str] = "Manrope"

class SchoolUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    font_family: Optional[str] = None

class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    school_id: str
    role: Optional[str] = "teacher"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    school_id: Optional[str] = None
    role: Optional[str] = None

async def require_super_admin(request: Request):
    """Helper to check if user is super admin"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if user.get('role') != 'super_admin':
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return user

# --- Platform Overview ---
@api_router.get("/super-admin/overview")
async def get_platform_overview(request: Request):
    """Get platform-wide statistics"""
    await require_super_admin(request)
    
    total_schools = await db.schools.count_documents({})
    total_users = await db.users.count_documents({})
    total_teachers = await db.users.count_documents({"role": "teacher"})
    total_admins = await db.users.count_documents({"role": {"$in": ["admin", "super_admin"]}})
    total_classes = await db.classes.count_documents({})
    total_students = await db.students.count_documents({})
    total_plans = await db.lesson_plans.count_documents({})
    
    # Recent users
    recent_users = await db.users.find(
        {}, 
        {"_id": 0, "user_id": 1, "email": 1, "name": 1, "role": 1, "school_id": 1, "created_at": 1}
    ).sort("created_at", -1).limit(5).to_list(length=5)
    
    # Schools with user counts
    schools = await db.schools.find({}, {"_id": 0}).to_list(length=100)
    for school in schools:
        school['user_count'] = await db.users.count_documents({"school_id": school.get('school_id')})
        school['class_count'] = await db.classes.count_documents({"school_id": school.get('school_id')})
    
    return {
        "stats": {
            "total_schools": total_schools,
            "total_users": total_users,
            "total_teachers": total_teachers,
            "total_admins": total_admins,
            "total_classes": total_classes,
            "total_students": total_students,
            "total_plans": total_plans
        },
        "recent_users": recent_users,
        "schools": schools
    }

# --- School Management ---
@api_router.get("/super-admin/schools")
async def get_all_schools(request: Request):
    """Get all schools with details"""
    await require_super_admin(request)
    
    schools = await db.schools.find({}, {"_id": 0}).to_list(length=100)
    
    # Add user/class counts
    for school in schools:
        school['user_count'] = await db.users.count_documents({"school_id": school.get('school_id')})
        school['class_count'] = await db.classes.count_documents({"school_id": school.get('school_id')})
        school['student_count'] = await db.students.count_documents({"school_id": school.get('school_id')})
    
    return {"schools": schools}

@api_router.post("/super-admin/schools")
async def create_school(data: SchoolCreate, request: Request):
    """Create a new school"""
    await require_super_admin(request)
    
    school_id = f"school_{uuid.uuid4().hex[:12]}"
    
    school_doc = {
        "school_id": school_id,
        "name": data.name,
        "address": data.address,
        "phone": data.phone,
        "email": data.email,
        "logo_url": data.logo_url,
        "branding": {
            "primary_color": data.primary_color,
            "secondary_color": data.secondary_color,
            "accent_color": data.accent_color,
            "font_family": data.font_family
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.schools.insert_one(school_doc)
    
    # Return without _id
    school_doc.pop('_id', None)
    return {"message": "School created successfully", "school": school_doc}

@api_router.put("/super-admin/schools/{school_id}")
async def update_school(school_id: str, data: SchoolUpdate, request: Request):
    """Update a school"""
    await require_super_admin(request)
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if data.name is not None:
        update_data["name"] = data.name
    if data.address is not None:
        update_data["address"] = data.address
    if data.phone is not None:
        update_data["phone"] = data.phone
    if data.email is not None:
        update_data["email"] = data.email
    if data.logo_url is not None:
        update_data["logo_url"] = data.logo_url
    if data.primary_color is not None:
        update_data["branding.primary_color"] = data.primary_color
    if data.secondary_color is not None:
        update_data["branding.secondary_color"] = data.secondary_color
    if data.accent_color is not None:
        update_data["branding.accent_color"] = data.accent_color
    if data.font_family is not None:
        update_data["branding.font_family"] = data.font_family
    
    result = await db.schools.update_one(
        {"school_id": school_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="School not found")
    
    school = await db.schools.find_one({"school_id": school_id}, {"_id": 0})
    return {"message": "School updated successfully", "school": school}

@api_router.delete("/super-admin/schools/{school_id}")
async def delete_school(school_id: str, request: Request):
    """Delete a school and optionally its data"""
    await require_super_admin(request)
    
    # Check if school has users
    user_count = await db.users.count_documents({"school_id": school_id})
    if user_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete school with {user_count} users. Reassign or delete users first."
        )
    
    result = await db.schools.delete_one({"school_id": school_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="School not found")
    
    return {"message": "School deleted successfully"}

# --- User Management ---
@api_router.get("/super-admin/users")
async def get_all_users_super(request: Request):
    """Get all users across all schools"""
    await require_super_admin(request)
    
    users = await db.users.find(
        {},
        {"_id": 0, "password_hash": 0}
    ).to_list(length=500)
    
    # Add school names
    schools = {s['school_id']: s['name'] for s in await db.schools.find({}, {"_id": 0, "school_id": 1, "name": 1}).to_list(length=100)}
    
    for user in users:
        user['school_name'] = schools.get(user.get('school_id'), 'No School')
    
    return {"users": users}

@api_router.post("/super-admin/users")
async def create_user(data: UserCreate, request: Request):
    """Create a new user"""
    await require_super_admin(request)
    
    # Check if email exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Verify school exists
    school = await db.schools.find_one({"school_id": data.school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    password_hash = pwd_context.hash(data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "password_hash": password_hash,
        "school_id": data.school_id,
        "role": data.role,
        "language": "es",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Return without sensitive data
    user_doc.pop('_id', None)
    user_doc.pop('password_hash', None)
    user_doc['school_name'] = school['name']
    
    return {"message": "User created successfully", "user": user_doc}

@api_router.put("/super-admin/users/{user_id}")
async def update_user_super(user_id: str, data: UserUpdate, request: Request):
    """Update a user"""
    current_user = await require_super_admin(request)
    
    # Prevent changing own role
    if user_id == current_user['user_id'] and data.role and data.role != 'super_admin':
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if data.name is not None:
        update_data["name"] = data.name
    if data.email is not None:
        # Check email uniqueness
        existing = await db.users.find_one({"email": data.email, "user_id": {"$ne": user_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data["email"] = data.email
    if data.school_id is not None:
        # Verify school exists
        school = await db.schools.find_one({"school_id": data.school_id})
        if not school:
            raise HTTPException(status_code=404, detail="School not found")
        update_data["school_id"] = data.school_id
    if data.role is not None:
        if data.role not in ['teacher', 'admin', 'super_admin']:
            raise HTTPException(status_code=400, detail="Invalid role")
        update_data["role"] = data.role
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"message": "User updated successfully", "user": user}

@api_router.delete("/super-admin/users/{user_id}")
async def delete_user(user_id: str, request: Request):
    """Delete a user"""
    current_user = await require_super_admin(request)
    
    if user_id == current_user['user_id']:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

@api_router.post("/super-admin/users/{user_id}/reset-password")
async def reset_user_password(user_id: str, request: Request):
    """Reset a user's password to a temporary one"""
    await require_super_admin(request)
    
    # Generate temporary password
    temp_password = f"Temp{uuid.uuid4().hex[:8]}!"
    password_hash = pwd_context.hash(temp_password)
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"password_hash": password_hash, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "email": 1, "name": 1})
    
    return {
        "message": "Password reset successfully",
        "user": user,
        "temporary_password": temp_password,
        "note": "Please share this password securely with the user"
    }

# --- Bulk Operations ---
class BulkUserCreate(BaseModel):
    school_id: str
    users: list  # List of {email, name, password?, role?}

@api_router.post("/super-admin/users/bulk")
async def bulk_create_users(data: BulkUserCreate, request: Request):
    """Create multiple users at once"""
    await require_super_admin(request)
    
    # Verify school exists
    school = await db.schools.find_one({"school_id": data.school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    created = []
    errors = []
    
    for user_data in data.users:
        try:
            email = user_data.get('email')
            name = user_data.get('name', email.split('@')[0])
            password = user_data.get('password', f"Welcome{uuid.uuid4().hex[:6]}!")
            role = user_data.get('role', 'teacher')
            
            # Check if email exists
            existing = await db.users.find_one({"email": email})
            if existing:
                errors.append({"email": email, "error": "Email already exists"})
                continue
            
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            password_hash = pwd_context.hash(password)
            
            user_doc = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "password_hash": password_hash,
                "school_id": data.school_id,
                "role": role,
                "language": "es",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.users.insert_one(user_doc)
            created.append({"email": email, "name": name, "temp_password": password})
            
        except Exception as e:
            errors.append({"email": user_data.get('email', 'unknown'), "error": str(e)})
    
    return {
        "message": f"Created {len(created)} users",
        "created": created,
        "errors": errors
    }

# Bulk Import Models
class BulkTeacherImport(BaseModel):
    school_id: str
    data: List[dict]

class BulkStudentImport(BaseModel):
    school_id: str
    class_id: str
    data: List[dict]

@api_router.post("/super-admin/bulk-import/teachers")
async def bulk_import_teachers(payload: BulkTeacherImport, request: Request):
    """Bulk import teachers from CSV data"""
    await require_super_admin(request)
    
    # Verify school exists
    school = await db.schools.find_one({"school_id": payload.school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    imported_count = 0
    errors = []
    created_users = []
    
    for row in payload.data:
        try:
            email = row.get('email', '').strip()
            name = row.get('name', '').strip()
            password = row.get('password', f"Welcome{uuid.uuid4().hex[:6]}!")
            
            if not email or not name:
                errors.append(f"Missing name or email: {row}")
                continue
            
            # Check if email exists
            existing = await db.users.find_one({"email": email})
            if existing:
                errors.append(f"Email already exists: {email}")
                continue
            
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            password_hash = pwd_context.hash(password)
            
            user_doc = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "password_hash": password_hash,
                "school_id": payload.school_id,
                "role": "teacher",
                "language": "es",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.users.insert_one(user_doc)
            created_users.append({"email": email, "name": name, "temp_password": password})
            imported_count += 1
            
        except Exception as e:
            errors.append(f"Error importing {row.get('email', 'unknown')}: {str(e)}")
    
    return {
        "imported_count": imported_count,
        "created_users": created_users,
        "errors": errors,
        "message": f"Successfully imported {imported_count} teachers"
    }

@api_router.post("/super-admin/bulk-import/students")
async def bulk_import_students(payload: BulkStudentImport, request: Request):
    """Bulk import students from CSV data"""
    await require_super_admin(request)
    
    # Verify school exists
    school = await db.schools.find_one({"school_id": payload.school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Verify class exists
    class_doc = await db.classes.find_one({"class_id": payload.class_id})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    imported_count = 0
    errors = []
    
    for row in payload.data:
        try:
            first_name = row.get('first_name', '').strip()
            last_name = row.get('last_name', '').strip()
            student_number = row.get('student_number', row.get('student_id', '')).strip()
            email = row.get('email', '').strip()
            date_of_birth = row.get('date_of_birth', row.get('dob', '')).strip()
            gender = row.get('gender', '').strip().upper()
            
            if not first_name or not last_name:
                errors.append(f"Missing first_name or last_name: {row}")
                continue
            
            # Generate student_id if not provided
            if not student_number:
                student_number = f"STU{uuid.uuid4().hex[:8].upper()}"
            
            # Check if student with same number exists in this school
            existing = await db.students.find_one({
                "student_number": student_number,
                "school_id": payload.school_id
            })
            if existing:
                errors.append(f"Student number already exists: {student_number}")
                continue
            
            student_id = f"student_{uuid.uuid4().hex[:12]}"
            
            student_doc = {
                "student_id": student_id,
                "first_name": first_name,
                "last_name": last_name,
                "name": f"{first_name} {last_name}",
                "student_number": student_number,
                "email": email or None,
                "date_of_birth": date_of_birth or None,
                "gender": gender if gender in ['M', 'F', 'O'] else None,
                "school_id": payload.school_id,
                "class_ids": [payload.class_id],
                "teacher_id": class_doc.get("teacher_id"),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.students.insert_one(student_doc)
            imported_count += 1
            
        except Exception as e:
            errors.append(f"Error importing {row.get('first_name', 'unknown')}: {str(e)}")
    
    return {
        "imported_count": imported_count,
        "errors": errors,
        "message": f"Successfully imported {imported_count} students"
    }

@api_router.get("/super-admin/schools/{school_id}/classes")
async def get_school_classes(school_id: str, request: Request):
    """Get all classes for a specific school"""
    await require_super_admin(request)
    
    classes = await db.classes.find({"school_id": school_id}, {"_id": 0}).to_list(100)
    return {"classes": classes}

# ==================== REPORT CARD ENDPOINTS ====================

@api_router.get("/report-cards/generate")
async def generate_report_card(
    student_id: str,
    class_id: str,
    semester_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Generate a report card for a student"""
    
    # Get student info
    student = await db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get class info
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Get all grades for this student in this class
    grades_cursor = db.grades.find({
        "student_id": student_id,
        "class_id": class_id
    }, {"_id": 0})
    all_grades = await grades_cursor.to_list(500)
    
    # Calculate grade statistics by category
    grade_summary = {}
    total_points_earned = 0
    total_points_possible = 0
    
    for grade in all_grades:
        category = grade.get("category", "General")
        if category not in grade_summary:
            grade_summary[category] = {
                "category": category,
                "points_earned": 0,
                "points_possible": 0,
                "assignments": []
            }
        
        points = grade.get("grade", 0)
        max_points = grade.get("max_points", 100)
        
        grade_summary[category]["points_earned"] += points
        grade_summary[category]["points_possible"] += max_points
        grade_summary[category]["assignments"].append(grade)
        
        total_points_earned += points
        total_points_possible += max_points
    
    # Calculate percentages for each category
    grades_list = []
    for cat, data in grade_summary.items():
        if data["points_possible"] > 0:
            percentage = (data["points_earned"] / data["points_possible"]) * 100
        else:
            percentage = 0
        
        grades_list.append({
            "category": cat,
            "points_earned": data["points_earned"],
            "points_possible": data["points_possible"],
            "percentage": percentage,
            "assignment_count": len(data["assignments"])
        })
    
    # Calculate overall GPA (on 4.0 scale)
    if total_points_possible > 0:
        overall_percentage = (total_points_earned / total_points_possible) * 100
        # Convert to 4.0 GPA scale
        if overall_percentage >= 90:
            gpa = 4.0
        elif overall_percentage >= 80:
            gpa = 3.0 + ((overall_percentage - 80) / 10)
        elif overall_percentage >= 70:
            gpa = 2.0 + ((overall_percentage - 70) / 10)
        elif overall_percentage >= 60:
            gpa = 1.0 + ((overall_percentage - 60) / 10)
        else:
            gpa = overall_percentage / 60
    else:
        gpa = 0.0
        overall_percentage = 0
    
    # Get attendance data
    attendance_records = await db.attendance_sessions.find({
        "class_id": class_id
    }, {"_id": 0}).to_list(500)
    
    present_count = 0
    absent_count = 0
    tardy_count = 0
    excused_count = 0
    
    for session in attendance_records:
        students_attendance = session.get("students", [])
        for sa in students_attendance:
            if sa.get("student_id") == student_id:
                status = sa.get("status", "")
                if status == "present":
                    present_count += 1
                elif status == "absent":
                    absent_count += 1
                elif status == "tardy":
                    tardy_count += 1
                elif status == "excused":
                    excused_count += 1
    
    total_days = present_count + absent_count + tardy_count + excused_count
    attendance_rate = (present_count + tardy_count) / total_days * 100 if total_days > 0 else 0
    
    return {
        "student": {
            "student_id": student["student_id"],
            "name": student.get("name") or f"{student.get('first_name', '')} {student.get('last_name', '')}",
            "student_number": student.get("student_number"),
            "email": student.get("email")
        },
        "class": {
            "class_id": class_doc["class_id"],
            "name": class_doc.get("name"),
            "grade_level": class_doc.get("grade_level"),
            "subject": class_doc.get("subject")
        },
        "grades": grades_list,
        "overall_percentage": overall_percentage,
        "gpa": gpa,
        "attendance": {
            "present": present_count,
            "absent": absent_count,
            "tardy": tardy_count,
            "excused": excused_count,
            "total_days": total_days,
            "rate": attendance_rate
        },
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# TTS Request Model
class TTSRequest(BaseModel):
    text: str
    language: str = "en"  # "en" or "es"

@api_router.post("/tts/generate")
async def generate_tts(request: TTSRequest):
    """Generate text-to-speech audio using OpenAI TTS"""
    if not tts_client:
        raise HTTPException(status_code=500, detail="TTS not configured")
    
    try:
        # Use 'nova' voice - energetic and upbeat, good for tutorials
        # OpenAI TTS supports multiple languages automatically
        audio_base64 = await tts_client.generate_speech_base64(
            text=request.text,
            model="tts-1",
            voice="nova",  # Friendly, energetic voice
            speed=1.0,
            response_format="mp3"
        )
        
        return {
            "audio_url": f"data:audio/mpeg;base64,{audio_base64}",
            "text": request.text,
            "language": request.language
        }
        
    except Exception as e:
        logger.error(f"Error generating TTS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating TTS: {str(e)}")

# ==================== GLOBAL STUDENTS ENDPOINT (FOR ADAPTIVE LEARNING) ====================

@api_router.get("/students")
async def get_all_teacher_students(user: dict = Depends(get_current_user)):
    """Get all students across all classes for the current teacher (for homeschool adaptive learning)"""
    teacher_id = user["user_id"]
    
    # Get all classes for this teacher
    classes = await db.classes.find({"teacher_id": teacher_id}, {"_id": 0}).to_list(100)
    class_ids = [c["class_id"] for c in classes]
    
    # Get all students from these classes
    students = await db.students.find(
        {"class_id": {"$in": class_ids}},
        {"_id": 0}
    ).to_list(500)
    
    return students


# ==================== ADAPTIVE LEARNING ENDPOINTS (HOMESCHOOL FEATURES) ====================

class AdaptiveLearningRequest(BaseModel):
    student_id: str
    subject: str
    language: str = "es"

class CompleteLessonRequest(BaseModel):
    student_id: str
    lesson_id: str
    subject: str

@api_router.post("/adaptive-learning/generate-path")
async def generate_adaptive_learning_path(
    request: AdaptiveLearningRequest,
    user: dict = Depends(get_current_user)
):
    """Generate a personalized adaptive learning path for a student using AI"""
    # Check if user has AI access (trial or subscription)
    user_id = user.get("user_id")
    subscription = await db.subscriptions.find_one({"user_id": user_id, "status": "active"})
    
    if not subscription:
        # Check trial period
        user_doc = await db.users.find_one({"user_id": user_id})
        if user_doc:
            created_at = user_doc.get("created_at", "")
            if created_at:
                try:
                    created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    trial_end = created_date + timedelta(days=FREE_TRIAL_DAYS)
                    if datetime.now(timezone.utc) >= trial_end:
                        raise HTTPException(
                            status_code=403,
                            detail="AI features require an active subscription or trial period"
                        )
                except ValueError:
                    pass
    
    # Get student info
    student = await db.students.find_one({"student_id": request.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student_name = student.get("name") or f"{student.get('first_name', '')} {student.get('last_name', '')}".strip()
    
    # Get prior learning data for this student/subject if any
    prior_progress = await db.adaptive_learning_progress.find_one({
        "student_id": request.student_id,
        "subject": request.subject
    }, {"_id": 0})
    
    completed_lessons = prior_progress.get("completed_lessons", []) if prior_progress else []
    current_level = prior_progress.get("current_level", 1) if prior_progress else 1
    
    # Subject mapping for display
    subject_names = {
        "math": {"en": "Mathematics", "es": "Matemáticas"},
        "language": {"en": "Language Arts", "es": "Lenguaje"},
        "science": {"en": "Science", "es": "Ciencias"},
        "reading": {"en": "Reading", "es": "Lectura"}
    }
    
    subject_display = subject_names.get(request.subject, {"en": request.subject.title(), "es": request.subject.title()})
    lang_key = "es" if request.language == "es" else "en"
    
    # Build AI prompt
    language_instruction = "Responde completamente en español." if request.language == "es" else "Respond entirely in English."
    
    system_prompt = f"""You are an expert adaptive learning curriculum designer for homeschool education. 
Your task is to create a personalized learning path that adapts to the student's pace and level.

{language_instruction}

Return ONLY a valid JSON object with no additional text."""

    user_prompt = f"""Create an adaptive learning path for:
- Student: {student_name}
- Subject: {subject_display[lang_key]}
- Current Level: {current_level}
- Completed Lessons: {len(completed_lessons)}

Generate a personalized learning path with 5-6 lessons that progress in difficulty.
Each lesson should include:
- A clear title
- Learning objective
- Estimated duration (10-20 minutes)
- Lesson content (2-3 paragraphs of educational content)
- 2-3 practice questions with options

Return JSON in this exact format:
{{
  "title": "Learning path title",
  "description": "Brief description of what the student will learn",
  "level": {current_level},
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
          "options": ["Option A", "Option B", "Option C", "Option D"]
        }}
      ]
    }}
  ]
}}

Make the content engaging, age-appropriate, and educational. Start from the student's current level and gradually increase difficulty."""

    try:
        # Initialize AI chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"adaptive_{request.student_id}_{uuid.uuid4().hex[:8]}",
            system_message=system_prompt
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
        user_message = UserMessage(text=user_prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        
        # Clean response
        cleaned_response = response.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]
        cleaned_response = cleaned_response.strip()
        
        try:
            learning_path = json.loads(cleaned_response)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response: {e}")
            # Create a fallback learning path
            learning_path = {
                "title": f"{subject_display[lang_key]} - Level {current_level}",
                "description": "Personalized learning path" if request.language != "es" else "Ruta de aprendizaje personalizada",
                "level": current_level,
                "lessons": [
                    {
                        "id": "lesson_1",
                        "title": "Introduction" if request.language != "es" else "Introducción",
                        "objective": "Get started with the basics" if request.language != "es" else "Comenzar con los conceptos básicos",
                        "duration": "15 min",
                        "level": 1,
                        "completed": False,
                        "content": response[:1000],
                        "questions": []
                    }
                ]
            }
        
        # Mark already completed lessons
        for lesson in learning_path.get("lessons", []):
            if lesson.get("id") in completed_lessons:
                lesson["completed"] = True
        
        # Save the generated path to database for tracking
        path_id = f"path_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        
        await db.adaptive_learning_paths.update_one(
            {"student_id": request.student_id, "subject": request.subject},
            {"$set": {
                "path_id": path_id,
                "student_id": request.student_id,
                "subject": request.subject,
                "teacher_id": user_id,
                "title": learning_path.get("title"),
                "description": learning_path.get("description"),
                "level": learning_path.get("level", current_level),
                "lessons": learning_path.get("lessons", []),
                "generated_at": now,
                "updated_at": now
            }},
            upsert=True
        )
        
        return learning_path
        
    except Exception as e:
        logger.error(f"Error generating adaptive learning path: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating learning path: {str(e)}")


@api_router.post("/adaptive-learning/complete-lesson")
async def complete_adaptive_lesson(
    request: CompleteLessonRequest,
    user: dict = Depends(get_current_user)
):
    """Mark a lesson as completed and update student progress"""
    user_id = user.get("user_id")
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
        
        # Increment level after every 3 completed lessons
        new_level = max(1, (len(completed_lessons) // 3) + 1)
        
        await db.adaptive_learning_progress.update_one(
            {"student_id": request.student_id, "subject": request.subject},
            {"$set": {
                "completed_lessons": completed_lessons,
                "current_level": new_level,
                "last_completed_at": now,
                "updated_at": now
            }}
        )
    else:
        # Create new progress record
        await db.adaptive_learning_progress.insert_one({
            "progress_id": f"prog_{uuid.uuid4().hex[:12]}",
            "student_id": request.student_id,
            "subject": request.subject,
            "teacher_id": user_id,
            "completed_lessons": [request.lesson_id],
            "current_level": 1,
            "last_completed_at": now,
            "created_at": now,
            "updated_at": now
        })
    
    # Also update the lesson in the saved path
    await db.adaptive_learning_paths.update_one(
        {
            "student_id": request.student_id,
            "subject": request.subject,
            "lessons.id": request.lesson_id
        },
        {"$set": {
            "lessons.$.completed": True,
            "updated_at": now
        }}
    )
    
    return {"message": "Lesson completed successfully", "lesson_id": request.lesson_id}


@api_router.get("/adaptive-learning/progress/{student_id}")
async def get_student_adaptive_progress(
    student_id: str,
    user: dict = Depends(get_current_user)
):
    """Get adaptive learning progress for a student across all subjects"""
    progress_records = await db.adaptive_learning_progress.find(
        {"student_id": student_id},
        {"_id": 0}
    ).to_list(10)
    
    return progress_records


# ==================== AI ENDPOINTS MOVED TO routes/ai.py ====================
# The AI Teaching Assistant endpoints have been refactored to routes/ai.py

# Include modular routers in the api_router
api_router.include_router(auth_router)
api_router.include_router(ai_router)

# Include the main api_router in the app
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
