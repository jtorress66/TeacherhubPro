"""Pydantic models for TeacherHubPro"""
from pydantic import BaseModel, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any


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
    activity_type: str
    checked: bool = False
    notes: Optional[str] = None


class PlanDayMaterial(BaseModel):
    material_type: str
    checked: bool = False


class PlanDay(BaseModel):
    date: str
    day_name: str
    theme: Optional[str] = None
    dok_levels: List[int] = []
    eca: Dict[str, bool] = {"E": False, "C": False, "A": False}
    activities: List[PlanDayActivity] = []
    materials: List[PlanDayMaterial] = []
    notes: Optional[str] = None


class PlanStandard(BaseModel):
    week_index: int
    domain: str
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
    subject_integration: List[str] = []
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
    status: str
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
    status: str
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
    status: str = "pending"
    comment: Optional[str] = None


class GradesBulkUpdate(BaseModel):
    assignment_id: str
    grades: List[GradeEntry]


# Subscription Models
class SubscriptionCreate(BaseModel):
    plan_id: str
    quantity: int = 1


class CheckoutRequest(BaseModel):
    plan_id: str
    quantity: int = 1
    origin_url: str


class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    subscription_id: str
    user_id: str
    plan_id: str
    status: str
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


# Substitute Packet Data
class SubPacketData(BaseModel):
    main_office_ext: str = "Ext. 100"
    nurse_ext: str = "Ext. 105"
    daily_routines: str = ""
    emergency_procedures: str = ""
    additional_notes: str = ""


# AI Assistant Models
class AIGenerationRequest(BaseModel):
    tool_type: str
    subject: str
    grade_level: str
    topic: str
    standards_framework: str = "common_core"
    language: str = "es"
    additional_instructions: Optional[str] = None
    difficulty_level: Optional[str] = "medium"
    num_questions: Optional[int] = 10
    duration_minutes: Optional[int] = 45


class AIChatRequest(BaseModel):
    message: str
    session_id: str
    language: str = "es"
    context: Optional[str] = None


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
    role: str
    content: str
    created_at: str
