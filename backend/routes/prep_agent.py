"""
Prep Agent Routes - Autonomous Lesson Prep Workflow
Completely isolated from existing app functionality
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime, timezone, timedelta
import uuid
import asyncio
import json
import os
import threading
import concurrent.futures

# LLM Integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

router = APIRouter(prefix="/prep-agent", tags=["prep-agent"])

# Database and auth will be injected from server.py
_db = None
_get_current_user = None

# Thread pool for running LLM calls without blocking the event loop
_thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=3, thread_name_prefix="prep_agent_")

def init_prep_agent_routes(database, auth_func):
    """Initialize routes with database and auth function from server.py"""
    global _db, _get_current_user
    _db = database
    _get_current_user = auth_func

def get_db():
    return _db

async def get_user(request: Request):
    """Dependency to get current user using the injected auth function"""
    if _get_current_user is None:
        raise HTTPException(status_code=500, detail="Auth not initialized")
    return await _get_current_user(request)

async def run_llm_in_executor(chat, message_text: str, timeout: int = 120) -> str:
    """Run LLM call in thread pool to avoid blocking the event loop"""
    loop = asyncio.get_event_loop()
    
    def sync_llm_call():
        """Synchronous wrapper for LLM call"""
        import asyncio as inner_asyncio
        inner_loop = inner_asyncio.new_event_loop()
        inner_asyncio.set_event_loop(inner_loop)
        try:
            result = inner_loop.run_until_complete(
                inner_asyncio.wait_for(
                    chat.send_message(UserMessage(text=message_text)),
                    timeout=timeout
                )
            )
            return result.content if hasattr(result, 'content') else str(result)
        finally:
            inner_loop.close()
    
    try:
        result = await loop.run_in_executor(_thread_pool, sync_llm_call)
        return result
    except Exception as e:
        raise e

# ==================== MODELS ====================

class PrepBatchCreate(BaseModel):
    prompt: str  # e.g., "Prep next week for Unit 3 History (Civil War)"
    class_id: str
    week_start: str  # ISO date string
    num_days: int = 5
    include_quiz: bool = True
    include_presentations: bool = True
    include_worksheets: bool = True
    include_calendar: bool = True
    include_parent_email: bool = True
    parent_email_content: Optional[str] = None  # Custom email content template

class PrepBatchResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    batch_id: str
    teacher_id: str
    class_id: str
    prompt: str
    status: str  # 'pending', 'processing', 'step_1', 'step_2', 'step_3', 'step_4', 'completed', 'failed'
    current_step: int
    total_steps: int
    progress_message: str
    week_start: str
    num_days: int
    # Generated content
    lesson_plans: List[Dict] = []
    presentations: List[Dict] = []
    worksheets: List[Dict] = []
    quiz: Optional[Dict] = None
    calendar_events: List[Dict] = []
    parent_email: Optional[Dict] = None
    # Metadata
    created_at: str
    updated_at: str
    completed_at: Optional[str] = None
    error: Optional[str] = None

class ApprovePublishRequest(BaseModel):
    publish_lessons: bool = True
    publish_presentations: bool = True
    publish_worksheets: bool = True
    publish_quiz: bool = True
    publish_calendar: bool = True
    send_parent_email: bool = True
    parent_email_content: Optional[str] = None

# ==================== COMMON CORE STANDARDS ====================

COMMON_CORE_STANDARDS = {
    "ELA": {
        "K": [
            {"code": "CCSS.ELA-LITERACY.RL.K.1", "description": "With prompting and support, ask and answer questions about key details in a text."},
            {"code": "CCSS.ELA-LITERACY.RL.K.2", "description": "With prompting and support, retell familiar stories, including key details."},
            {"code": "CCSS.ELA-LITERACY.RL.K.3", "description": "With prompting and support, identify characters, settings, and major events in a story."},
        ],
        "1st": [
            {"code": "CCSS.ELA-LITERACY.RL.1.1", "description": "Ask and answer questions about key details in a text."},
            {"code": "CCSS.ELA-LITERACY.RL.1.2", "description": "Retell stories, including key details, and demonstrate understanding of their central message or lesson."},
            {"code": "CCSS.ELA-LITERACY.RL.1.3", "description": "Describe characters, settings, and major events in a story, using key details."},
        ],
        "2nd": [
            {"code": "CCSS.ELA-LITERACY.RL.2.1", "description": "Ask and answer such questions as who, what, where, when, why, and how to demonstrate understanding of key details in a text."},
            {"code": "CCSS.ELA-LITERACY.RL.2.2", "description": "Recount stories, including fables and folktales from diverse cultures, and determine their central message, lesson, or moral."},
        ],
        "3rd": [
            {"code": "CCSS.ELA-LITERACY.RL.3.1", "description": "Ask and answer questions to demonstrate understanding of a text, referring explicitly to the text as the basis for the answers."},
            {"code": "CCSS.ELA-LITERACY.RL.3.2", "description": "Recount stories, including fables, folktales, and myths from diverse cultures; determine the central message, lesson, or moral."},
        ],
        "4th": [
            {"code": "CCSS.ELA-LITERACY.RL.4.1", "description": "Refer to details and examples in a text when explaining what the text says explicitly and when drawing inferences from the text."},
            {"code": "CCSS.ELA-LITERACY.RL.4.2", "description": "Determine a theme of a story, drama, or poem from details in the text; summarize the text."},
        ],
        "5th": [
            {"code": "CCSS.ELA-LITERACY.RL.5.1", "description": "Quote accurately from a text when explaining what the text says explicitly and when drawing inferences from the text."},
            {"code": "CCSS.ELA-LITERACY.RL.5.2", "description": "Determine a theme of a story, drama, or poem from details in the text, including how characters respond to challenges."},
        ],
        "6th-8th": [
            {"code": "CCSS.ELA-LITERACY.RL.6.1", "description": "Cite textual evidence to support analysis of what the text says explicitly as well as inferences drawn from the text."},
            {"code": "CCSS.ELA-LITERACY.RL.7.2", "description": "Determine a theme or central idea of a text and analyze its development over the course of the text."},
            {"code": "CCSS.ELA-LITERACY.RL.8.3", "description": "Analyze how particular lines of dialogue or incidents in a story or drama propel the action, reveal aspects of a character, or provoke a decision."},
        ],
        "9th-12th": [
            {"code": "CCSS.ELA-LITERACY.RL.9-10.1", "description": "Cite strong and thorough textual evidence to support analysis of what the text says explicitly as well as inferences drawn from the text."},
            {"code": "CCSS.ELA-LITERACY.RL.11-12.2", "description": "Determine two or more themes or central ideas of a text and analyze their development over the course of the text."},
        ],
    },
    "Math": {
        "K": [
            {"code": "CCSS.MATH.CONTENT.K.CC.A.1", "description": "Count to 100 by ones and by tens."},
            {"code": "CCSS.MATH.CONTENT.K.CC.A.2", "description": "Count forward beginning from a given number within the known sequence."},
            {"code": "CCSS.MATH.CONTENT.K.OA.A.1", "description": "Represent addition and subtraction with objects, fingers, mental images, drawings."},
        ],
        "1st": [
            {"code": "CCSS.MATH.CONTENT.1.OA.A.1", "description": "Use addition and subtraction within 20 to solve word problems."},
            {"code": "CCSS.MATH.CONTENT.1.NBT.A.1", "description": "Count to 120, starting at any number less than 120."},
        ],
        "2nd": [
            {"code": "CCSS.MATH.CONTENT.2.OA.A.1", "description": "Use addition and subtraction within 100 to solve one- and two-step word problems."},
            {"code": "CCSS.MATH.CONTENT.2.NBT.A.1", "description": "Understand that the three digits of a three-digit number represent amounts of hundreds, tens, and ones."},
        ],
        "3rd": [
            {"code": "CCSS.MATH.CONTENT.3.OA.A.1", "description": "Interpret products of whole numbers, e.g., interpret 5 × 7 as the total number of objects in 5 groups of 7 objects each."},
            {"code": "CCSS.MATH.CONTENT.3.NF.A.1", "description": "Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts."},
        ],
        "4th": [
            {"code": "CCSS.MATH.CONTENT.4.OA.A.1", "description": "Interpret a multiplication equation as a comparison."},
            {"code": "CCSS.MATH.CONTENT.4.NF.A.1", "description": "Explain why a fraction a/b is equivalent to a fraction (n × a)/(n × b)."},
        ],
        "5th": [
            {"code": "CCSS.MATH.CONTENT.5.NBT.A.1", "description": "Recognize that in a multi-digit number, a digit in one place represents 10 times as much as it represents in the place to its right."},
            {"code": "CCSS.MATH.CONTENT.5.NF.A.1", "description": "Add and subtract fractions with unlike denominators."},
        ],
        "6th-8th": [
            {"code": "CCSS.MATH.CONTENT.6.RP.A.1", "description": "Understand the concept of a ratio and use ratio language to describe a ratio relationship."},
            {"code": "CCSS.MATH.CONTENT.7.EE.A.1", "description": "Apply properties of operations as strategies to add, subtract, factor, and expand linear expressions."},
            {"code": "CCSS.MATH.CONTENT.8.EE.A.1", "description": "Know and apply the properties of integer exponents to generate equivalent numerical expressions."},
        ],
        "9th-12th": [
            {"code": "CCSS.MATH.CONTENT.HSA.SSE.A.1", "description": "Interpret expressions that represent a quantity in terms of its context."},
            {"code": "CCSS.MATH.CONTENT.HSF.IF.A.1", "description": "Understand that a function from one set (called the domain) to another set (called the range) assigns to each element of the domain exactly one element of the range."},
        ],
    },
    "Science": {
        "K-2": [
            {"code": "K-2-ETS1-1", "description": "Ask questions, make observations, and gather information about a situation people want to change."},
            {"code": "K-PS2-1", "description": "Plan and conduct an investigation to compare the effects of different strengths or different directions of pushes and pulls."},
        ],
        "3rd-5th": [
            {"code": "3-5-ETS1-1", "description": "Define a simple design problem reflecting a need or a want that includes specified criteria for success."},
            {"code": "4-PS3-1", "description": "Use evidence to construct an explanation relating the speed of an object to the energy of that object."},
            {"code": "5-PS1-1", "description": "Develop a model to describe that matter is made of particles too small to be seen."},
        ],
        "6th-8th": [
            {"code": "MS-PS1-1", "description": "Develop models to describe the atomic composition of simple molecules and extended structures."},
            {"code": "MS-LS1-1", "description": "Conduct an investigation to provide evidence that living things are made of cells."},
        ],
        "9th-12th": [
            {"code": "HS-PS1-1", "description": "Use the periodic table as a model to predict the relative properties of elements based on the patterns of electrons."},
            {"code": "HS-LS1-1", "description": "Construct an explanation based on evidence for how the structure of DNA determines the structure of proteins."},
        ],
    },
    "Social Studies": {
        "K-2": [
            {"code": "D2.His.1.K-2", "description": "Create a chronological sequence of multiple events."},
            {"code": "D2.Geo.1.K-2", "description": "Construct maps, graphs, and other representations of familiar places."},
        ],
        "3rd-5th": [
            {"code": "D2.His.1.3-5", "description": "Create and use a chronological sequence of related events to compare developments that happened at the same time."},
            {"code": "D2.His.2.3-5", "description": "Compare life in specific historical time periods to life today."},
            {"code": "D2.Civ.1.3-5", "description": "Distinguish the responsibilities and powers of government officials at various levels and branches of government."},
        ],
        "6th-8th": [
            {"code": "D2.His.1.6-8", "description": "Analyze connections among events and developments in broader historical contexts."},
            {"code": "D2.His.3.6-8", "description": "Use questions generated about individuals and groups to analyze why they, and the developments they shaped, are seen as historically significant."},
        ],
        "9th-12th": [
            {"code": "D2.His.1.9-12", "description": "Evaluate how historical events and developments were shaped by unique circumstances of time and place."},
            {"code": "D2.His.14.9-12", "description": "Analyze multiple and complex causes and effects of events in the past."},
        ],
    },
}

def get_standards_for_subject_grade(subject: str, grade: str) -> List[Dict]:
    """Get Common Core standards for a subject and grade level"""
    subject_standards = COMMON_CORE_STANDARDS.get(subject, COMMON_CORE_STANDARDS.get("ELA", {}))
    
    # Map grade to standard grade ranges
    grade_mapping = {
        "K": "K",
        "1st": "1st",
        "2nd": "2nd", 
        "3rd": "3rd",
        "4th": "4th",
        "5th": "5th",
        "6th": "6th-8th",
        "7th": "6th-8th",
        "8th": "6th-8th",
        "9th": "9th-12th",
        "10th": "9th-12th",
        "11th": "9th-12th",
        "12th": "9th-12th",
    }
    
    mapped_grade = grade_mapping.get(grade, grade)
    standards = subject_standards.get(mapped_grade, subject_standards.get("3rd-5th", []))
    
    # Also check for combined grade ranges
    if not standards:
        if grade in ["K", "1st", "2nd"]:
            standards = subject_standards.get("K-2", [])
        elif grade in ["3rd", "4th", "5th"]:
            standards = subject_standards.get("3rd-5th", [])
    
    return standards

# ==================== HELPER FUNCTIONS ====================

def get_llm_chat(session_id: str, system_prompt: str):
    """Get LLM chat instance"""
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_prompt
    ).with_model("anthropic", "claude-sonnet-4-6")

async def update_batch_status(batch_id: str, status: str, step: int, message: str, **kwargs):
    """Update batch status in database"""
    update_data = {
        "status": status,
        "current_step": step,
        "progress_message": message,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    update_data.update(kwargs)
    await get_db().prep_batches.update_one({"batch_id": batch_id}, {"$set": update_data})

# ==================== AGENT WORKFLOW ====================

async def run_prep_agent_workflow(batch_id: str, batch_data: dict):
    """
    Main agent workflow that executes all 4 steps
    """
    try:
        class_info = await get_db().classes.find_one({"class_id": batch_data["class_id"]}, {"_id": 0})
        if not class_info:
            await update_batch_status(batch_id, "failed", 0, "Class not found", error="Class not found")
            return
        
        teacher = await get_db().users.find_one({"user_id": batch_data["teacher_id"]}, {"_id": 0})
        school = await get_db().schools.find_one({"school_id": teacher.get("school_id", "school_default")}, {"_id": 0}) if teacher else None
        
        # Get last week's lessons for context
        last_week_plans = await get_db().lesson_plans.find({
            "class_id": batch_data["class_id"],
            "teacher_id": batch_data["teacher_id"]
        }).sort("created_at", -1).limit(5).to_list(5)
        
        last_week_context = ""
        if last_week_plans:
            last_week_context = f"\n\nRecent lessons covered:\n"
            for plan in last_week_plans:
                last_week_context += f"- {plan.get('unit', plan.get('lesson_topic', 'Untitled'))}: {plan.get('objective', plan.get('learning_objectives', ''))[:100]}\n"
        
        # Detect subject from prompt
        prompt_lower = batch_data["prompt"].lower()
        detected_subject = "ELA"
        if any(word in prompt_lower for word in ["math", "algebra", "geometry", "calculus", "arithmetic"]):
            detected_subject = "Math"
        elif any(word in prompt_lower for word in ["science", "biology", "chemistry", "physics", "earth"]):
            detected_subject = "Science"
        elif any(word in prompt_lower for word in ["history", "social", "civics", "geography", "government"]):
            detected_subject = "Social Studies"
        
        # Get standards
        standards = get_standards_for_subject_grade(detected_subject, class_info.get("grade", "5th"))
        standards_text = "\n".join([f"- {s['code']}: {s['description']}" for s in standards[:5]])
        
        # ========== STEP 1: Research & Plan ==========
        await update_batch_status(batch_id, "step_1", 1, "Researching standards and creating lesson plans...")
        
        system_prompt_step1 = f"""You are an expert curriculum designer. Create a week of sequential lesson plans.

Class: {class_info.get('name', 'Class')} - Grade {class_info.get('grade', '')}
Subject: {class_info.get('subject', detected_subject)}
School: {school.get('name', 'School') if school else 'School'}

Common Core Standards to address:
{standards_text}
{last_week_context}

Teacher's request: {batch_data['prompt']}

Create {batch_data['num_days']} sequential daily lesson plans for the week starting {batch_data['week_start']}.
Each plan should build on the previous day's learning.

Return a JSON array with exactly {batch_data['num_days']} lesson plans. Each plan must have:
{{
  "day": 1,
  "title": "Lesson title",
  "date": "YYYY-MM-DD",
  "objective": "Learning objective",
  "standards": ["standard codes addressed"],
  "materials": ["list of materials"],
  "warm_up": "5-minute warm-up activity",
  "direct_instruction": "Main teaching content (15-20 min)",
  "guided_practice": "Guided practice activity (15 min)",
  "independent_practice": "Independent work (10-15 min)", 
  "closure": "Lesson closure and assessment (5 min)",
  "homework": "Optional homework assignment",
  "differentiation": "Modifications for different learners"
}}

Return ONLY the JSON array, no other text."""

        chat = get_llm_chat(f"prep_{batch_id}_step1", system_prompt_step1)
        
        try:
            # Use run_llm_in_executor to avoid blocking the event loop
            response_text = await run_llm_in_executor(
                chat, 
                f"Create the weekly lesson plans for: {batch_data['prompt']}",
                timeout=120
            )
            
            # Extract JSON from response
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            if json_start >= 0 and json_end > json_start:
                lesson_plans_json = response_text[json_start:json_end]
                lesson_plans = json.loads(lesson_plans_json)
            else:
                raise ValueError("Could not parse lesson plans JSON")
            
            # Add IDs to lesson plans
            for i, plan in enumerate(lesson_plans):
                plan["plan_id"] = f"prep_plan_{batch_id}_{i+1}"
                plan["batch_id"] = batch_id
            
            await update_batch_status(batch_id, "step_1_complete", 1, 
                f"Created {len(lesson_plans)} lesson plans", lesson_plans=lesson_plans)
            
        except Exception as e:
            await update_batch_status(batch_id, "failed", 1, f"Step 1 failed: {str(e)}", error=str(e))
            return
        
        # ========== STEP 2: Create Materials ==========
        await update_batch_status(batch_id, "step_2", 2, "Generating presentations and worksheets...")
        
        presentations = []
        worksheets = []
        
        if batch_data.get("include_presentations", True):
            for plan in lesson_plans:
                system_prompt_slides = f"""Create a simple slide presentation for this lesson.

Lesson: {plan['title']}
Objective: {plan['objective']}
Content: {plan['direct_instruction']}

Create 6-8 slides. Return a JSON array of slides:
[
  {{"type": "title", "title": "...", "subtitle": "..."}},
  {{"type": "content", "title": "...", "bullets": ["...", "..."]}},
  ...
]
Return ONLY the JSON array."""

                try:
                    slide_chat = get_llm_chat(f"prep_{batch_id}_slides_{plan['day']}", system_prompt_slides)
                    slide_text = await run_llm_in_executor(slide_chat, "Create the slides", timeout=60)
                    
                    json_start = slide_text.find('[')
                    json_end = slide_text.rfind(']') + 1
                    if json_start >= 0 and json_end > json_start:
                        slides = json.loads(slide_text[json_start:json_end])
                        presentations.append({
                            "presentation_id": f"prep_pres_{batch_id}_{plan['day']}",
                            "day": plan['day'],
                            "title": plan['title'],
                            "slides": slides
                        })
                except Exception as e:
                    print(f"Failed to generate slides for day {plan['day']}: {e}")
        
        if batch_data.get("include_worksheets", True):
            for plan in lesson_plans[:3]:  # Generate worksheets for first 3 days
                system_prompt_worksheet = f"""Create a student worksheet for this lesson.

Lesson: {plan['title']}
Objective: {plan['objective']}
Independent Practice: {plan['independent_practice']}

Create a worksheet with 5-8 questions/activities. Return JSON:
{{
  "title": "Worksheet title",
  "instructions": "Student instructions",
  "questions": [
    {{"type": "multiple_choice", "question": "...", "options": ["A", "B", "C", "D"], "answer": "A"}},
    {{"type": "short_answer", "question": "...", "answer_hint": "..."}},
    {{"type": "fill_blank", "question": "The ___ is important because ___", "answers": ["word1", "word2"]}}
  ]
}}
Return ONLY the JSON."""

                try:
                    ws_chat = get_llm_chat(f"prep_{batch_id}_ws_{plan['day']}", system_prompt_worksheet)
                    ws_text = await run_llm_in_executor(ws_chat, "Create the worksheet", timeout=60)
                    
                    json_start = ws_text.find('{')
                    json_end = ws_text.rfind('}') + 1
                    if json_start >= 0 and json_end > json_start:
                        worksheet = json.loads(ws_text[json_start:json_end])
                        worksheet["worksheet_id"] = f"prep_ws_{batch_id}_{plan['day']}"
                        worksheet["day"] = plan['day']
                        worksheets.append(worksheet)
                except Exception as e:
                    print(f"Failed to generate worksheet for day {plan['day']}: {e}")
        
        await update_batch_status(batch_id, "step_2_complete", 2,
            f"Created {len(presentations)} presentations and {len(worksheets)} worksheets",
            presentations=presentations, worksheets=worksheets)
        
        # ========== STEP 3: Assessments ==========
        await update_batch_status(batch_id, "step_3", 3, "Generating Friday quiz...")
        
        quiz = None
        if batch_data.get("include_quiz", True):
            all_content = "\n".join([
                f"Day {p['day']}: {p['title']} - {p['objective']}" 
                for p in lesson_plans
            ])
            
            system_prompt_quiz = f"""Create a Friday quiz covering this week's lessons.

Week's Content:
{all_content}

Create a 10-question quiz. Return JSON:
{{
  "title": "Weekly Quiz: [Topic]",
  "instructions": "Answer all questions. Show your work where applicable.",
  "time_limit": "20 minutes",
  "questions": [
    {{"number": 1, "type": "multiple_choice", "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "A", "points": 1}},
    {{"number": 2, "type": "true_false", "question": "...", "answer": true, "points": 1}},
    {{"number": 3, "type": "short_answer", "question": "...", "answer": "...", "points": 2}}
  ],
  "total_points": 15
}}
Return ONLY the JSON."""

            try:
                quiz_chat = get_llm_chat(f"prep_{batch_id}_quiz", system_prompt_quiz)
                quiz_text = await run_llm_in_executor(quiz_chat, "Create the Friday quiz", timeout=90)
                
                json_start = quiz_text.find('{')
                json_end = quiz_text.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    quiz = json.loads(quiz_text[json_start:json_end])
                    quiz["quiz_id"] = f"prep_quiz_{batch_id}"
            except Exception as e:
                print(f"Failed to generate quiz: {e}")
        
        await update_batch_status(batch_id, "step_3_complete", 3,
            "Quiz created" if quiz else "Quiz generation skipped",
            quiz=quiz)
        
        # ========== STEP 4: Syncing ==========
        await update_batch_status(batch_id, "step_4", 4, "Preparing calendar events and parent email...")
        
        # Create calendar events
        calendar_events = []
        if batch_data.get("include_calendar", True):
            week_start = datetime.fromisoformat(batch_data["week_start"])
            for plan in lesson_plans:
                event_date = week_start + timedelta(days=plan["day"] - 1)
                calendar_events.append({
                    "event_id": f"prep_event_{batch_id}_{plan['day']}",
                    "title": plan["title"],
                    "date": event_date.strftime("%Y-%m-%d"),
                    "type": "lesson",
                    "description": plan["objective"]
                })
            
            # Add quiz event on Friday
            if quiz:
                friday_date = week_start + timedelta(days=4)
                calendar_events.append({
                    "event_id": f"prep_event_{batch_id}_quiz",
                    "title": quiz.get("title", "Weekly Quiz"),
                    "date": friday_date.strftime("%Y-%m-%d"),
                    "type": "quiz",
                    "description": f"Quiz covering this week's content. {quiz.get('time_limit', '20 minutes')}"
                })
        
        # Prepare parent email
        parent_email = None
        if batch_data.get("include_parent_email", True):
            topics_list = "\n".join([f"• Day {p['day']}: {p['title']}" for p in lesson_plans])
            
            default_email_content = f"""Dear Parents/Guardians,

Here's what your child will be learning this week in {class_info.get('name', 'class')}:

{topics_list}

{"We will have a quiz on Friday covering these topics." if quiz else ""}

If you have any questions, please don't hesitate to reach out.

Best regards,
{teacher.get('name', 'Teacher') if teacher else 'Teacher'}
{school.get('name', 'School') if school else ''}"""

            parent_email = {
                "email_id": f"prep_email_{batch_id}",
                "subject": f"Weekly Learning Update: {batch_data['prompt'][:50]}",
                "content": batch_data.get("parent_email_content") or default_email_content,
                "recipients": "parents",  # Will be populated from class roster on publish
            }
        
        # Mark as completed
        await update_batch_status(
            batch_id, "completed", 4,
            "Weekly prep batch is ready for review!",
            calendar_events=calendar_events,
            parent_email=parent_email,
            completed_at=datetime.now(timezone.utc).isoformat()
        )
        
        # Send notification (in-app)
        await get_db().notifications.insert_one({
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": batch_data["teacher_id"],
            "type": "prep_batch_ready",
            "title": "Weekly Prep Ready!",
            "message": f"Your lesson prep batch for '{batch_data['prompt'][:40]}...' is ready for review.",
            "batch_id": batch_id,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        await update_batch_status(batch_id, "failed", 0, f"Workflow failed: {str(e)}", error=str(e))

# ==================== API ENDPOINTS ====================

@router.post("/batches", response_model=PrepBatchResponse)
async def create_prep_batch(batch: PrepBatchCreate, user: dict = Depends(get_user)):
    """Create a new prep batch and start the agent workflow"""
    # Validate class ownership
    cls = await get_db().classes.find_one({"class_id": batch.class_id}, {"_id": 0})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    if cls.get("teacher_id") != user["user_id"] and cls.get("school_id") != user.get("school_id"):
        raise HTTPException(status_code=403, detail="You don't have access to this class")
    
    # Validate prompt
    if not batch.prompt or not batch.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required")
    
    batch_id = f"batch_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    batch_doc = {
        "batch_id": batch_id,
        "teacher_id": user["user_id"],
        "class_id": batch.class_id,
        "prompt": batch.prompt.strip(),
        "status": "pending",
        "current_step": 0,
        "total_steps": 4,
        "progress_message": "Starting prep agent...",
        "week_start": batch.week_start,
        "num_days": min(max(batch.num_days, 1), 7),  # Limit to 1-7 days
        "include_quiz": batch.include_quiz,
        "include_presentations": batch.include_presentations,
        "include_worksheets": batch.include_worksheets,
        "include_calendar": batch.include_calendar,
        "include_parent_email": batch.include_parent_email,
        "parent_email_content": batch.parent_email_content,
        "lesson_plans": [],
        "presentations": [],
        "worksheets": [],
        "quiz": None,
        "calendar_events": [],
        "parent_email": None,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
        "error": None
    }
    
    await get_db().prep_batches.insert_one(batch_doc)
    
    # Start background workflow using asyncio.create_task
    # The workflow stays on the main event loop for DB operations
    # Only LLM calls will use run_in_executor for non-blocking behavior
    asyncio.create_task(run_prep_agent_workflow(batch_id, batch_doc))
    
    return PrepBatchResponse(**batch_doc)

@router.get("/batches", response_model=List[PrepBatchResponse])
async def get_prep_batches(user: dict = Depends(get_user)):
    """Get all prep batches for the current teacher"""
    batches = await get_db().prep_batches.find(
        {"teacher_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return [PrepBatchResponse(**b) for b in batches]

@router.get("/batches/{batch_id}", response_model=PrepBatchResponse)
async def get_prep_batch(batch_id: str, user: dict = Depends(get_user)):
    """Get a specific prep batch"""
    batch = await get_db().prep_batches.find_one(
        {"batch_id": batch_id, "teacher_id": user["user_id"]},
        {"_id": 0}
    )
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return PrepBatchResponse(**batch)

@router.put("/batches/{batch_id}/lesson/{day}")
async def update_lesson_plan(batch_id: str, day: int, updates: dict, user: dict = Depends(get_user)):
    """Update a specific lesson plan in the batch"""
    batch = await get_db().prep_batches.find_one({"batch_id": batch_id, "teacher_id": user["user_id"]}, {"_id": 0})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    lesson_plans = batch.get("lesson_plans", [])
    for i, plan in enumerate(lesson_plans):
        if plan.get("day") == day:
            lesson_plans[i].update(updates)
            break
    
    await get_db().prep_batches.update_one(
        {"batch_id": batch_id},
        {"$set": {"lesson_plans": lesson_plans, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "updated"}

@router.put("/batches/{batch_id}/quiz")
async def update_quiz(batch_id: str, updates: dict, user: dict = Depends(get_user)):
    """Update the quiz in the batch"""
    batch = await get_db().prep_batches.find_one({"batch_id": batch_id, "teacher_id": user["user_id"]}, {"_id": 0})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    quiz = batch.get("quiz", {})
    quiz.update(updates)
    
    await get_db().prep_batches.update_one(
        {"batch_id": batch_id},
        {"$set": {"quiz": quiz, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "updated"}

@router.put("/batches/{batch_id}/email")
async def update_parent_email(batch_id: str, updates: dict, user: dict = Depends(get_user)):
    """Update the parent email content"""
    batch = await get_db().prep_batches.find_one({"batch_id": batch_id, "teacher_id": user["user_id"]}, {"_id": 0})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    parent_email = batch.get("parent_email", {})
    parent_email.update(updates)
    
    await get_db().prep_batches.update_one(
        {"batch_id": batch_id},
        {"$set": {"parent_email": parent_email, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "updated"}

@router.post("/batches/{batch_id}/publish")
async def approve_and_publish(batch_id: str, request: ApprovePublishRequest, user: dict = Depends(get_user)):
    """Approve and publish all generated content"""
    batch = await get_db().prep_batches.find_one({"batch_id": batch_id, "teacher_id": user["user_id"]}, {"_id": 0})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    if batch["status"] != "completed":
        raise HTTPException(status_code=400, detail="Batch is not ready for publishing")
    
    published = {
        "lessons": 0,
        "presentations": 0,
        "worksheets": 0,
        "quiz": False,
        "calendar_events": 0,
        "email_sent": False
    }
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Publish lesson plans
    if request.publish_lessons and batch.get("lesson_plans"):
        for plan in batch["lesson_plans"]:
            lesson_doc = {
                "plan_id": f"plan_{uuid.uuid4().hex[:8]}",
                "class_id": batch["class_id"],
                "teacher_id": user["user_id"],
                "school_id": user.get("school_id", "school_default"),
                "plan_type": "weekly",
                "week_start": plan.get("date", batch["week_start"]),
                "week_end": plan.get("date", batch["week_start"]),
                "unit": plan.get("title"),
                "objective": plan.get("objective"),
                "days": [{
                    "day": plan.get("day", 1),
                    "warm_up": plan.get("warm_up", ""),
                    "direct_instruction": plan.get("direct_instruction", ""),
                    "guided_practice": plan.get("guided_practice", ""),
                    "independent_practice": plan.get("independent_practice", ""),
                    "closure": plan.get("closure", ""),
                    "homework": plan.get("homework", ""),
                    "materials": plan.get("materials", [])
                }],
                "standards": [{"code": s, "description": ""} for s in plan.get("standards", [])],
                "is_template": False,
                "from_prep_batch": batch_id,
                "created_at": now,
                "updated_at": now
            }
            await get_db().lesson_plans.insert_one(lesson_doc)
            published["lessons"] += 1
    
    # Publish presentations
    if request.publish_presentations and batch.get("presentations"):
        for pres in batch["presentations"]:
            pres_doc = {
                "presentation_id": f"pres_{uuid.uuid4().hex[:8]}",
                "teacher_id": user["user_id"],
                "school_id": user.get("school_id", "school_default"),
                "class_id": batch["class_id"],
                "title": pres.get("title", "Untitled"),
                "slides": pres.get("slides", []),
                "theme": "blue",
                "transition": "fade",
                "from_prep_batch": batch_id,
                "created_at": now,
                "updated_at": now
            }
            await get_db().presentations.insert_one(pres_doc)
            published["presentations"] += 1
    
    # Publish quiz as assignment
    if request.publish_quiz and batch.get("quiz"):
        quiz = batch["quiz"]
        quiz_doc = {
            "assignment_id": f"assign_{uuid.uuid4().hex[:8]}",
            "public_token": uuid.uuid4().hex[:12],
            "teacher_id": user["user_id"],
            "school_id": user.get("school_id", "school_default"),
            "class_id": batch["class_id"],
            "title": quiz.get("title", "Weekly Quiz"),
            "description": quiz.get("instructions", ""),
            "instructions": quiz.get("instructions", ""),
            "questions": quiz.get("questions", []),
            "total_points": quiz.get("total_points", 10),
            "due_date": (datetime.fromisoformat(batch["week_start"]) + timedelta(days=4)).isoformat(),
            "time_limit": quiz.get("time_limit"),
            "from_prep_batch": batch_id,
            "created_at": now,
            "updated_at": now
        }
        await get_db().ai_assignments.insert_one(quiz_doc)
        published["quiz"] = True
    
    # Publish calendar events
    if request.publish_calendar and batch.get("calendar_events"):
        for event in batch["calendar_events"]:
            event_doc = {
                "event_id": f"event_{uuid.uuid4().hex[:8]}",
                "teacher_id": user["user_id"],
                "school_id": user.get("school_id", "school_default"),
                "class_id": batch["class_id"],
                "title": event.get("title"),
                "date": event.get("date"),
                "event_type": event.get("type", "lesson"),
                "description": event.get("description", ""),
                "from_prep_batch": batch_id,
                "created_at": now
            }
            await get_db().calendar_events.insert_one(event_doc)
            published["calendar_events"] += 1
    
    # Queue parent email (would integrate with email service)
    if request.send_parent_email and batch.get("parent_email"):
        email = batch["parent_email"]
        email_content = request.parent_email_content or email.get("content", "")
        
        # Store email for sending (would be picked up by email worker)
        email_doc = {
            "email_id": f"email_{uuid.uuid4().hex[:8]}",
            "teacher_id": user["user_id"],
            "class_id": batch["class_id"],
            "subject": email.get("subject"),
            "content": email_content,
            "status": "queued",
            "from_prep_batch": batch_id,
            "created_at": now
        }
        await get_db().queued_emails.insert_one(email_doc)
        published["email_sent"] = True
    
    # Update batch status
    await get_db().prep_batches.update_one(
        {"batch_id": batch_id},
        {"$set": {"status": "published", "published_at": now, "published_items": published}}
    )
    
    return {"status": "published", "published": published}

@router.delete("/batches/{batch_id}")
async def delete_prep_batch(batch_id: str, user: dict = Depends(get_user)):
    """Delete a prep batch"""
    result = await get_db().prep_batches.delete_one({"batch_id": batch_id, "teacher_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Batch not found")
    return {"status": "deleted"}

@router.get("/notifications")
async def get_notifications(user: dict = Depends(get_user)):
    """Get prep agent notifications for the user"""
    notifications = await get_db().notifications.find(
        {"user_id": user["user_id"], "type": "prep_batch_ready"},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    return notifications

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_user)):
    """Mark a notification as read"""
    await get_db().notifications.update_one(
        {"notification_id": notification_id, "user_id": user["user_id"]},
        {"$set": {"read": True}}
    )
    return {"status": "read"}

@router.get("/standards/{subject}/{grade}")
async def get_standards(subject: str, grade: str):
    """Get Common Core standards for a subject and grade"""
    standards = get_standards_for_subject_grade(subject, grade)
    return {"subject": subject, "grade": grade, "standards": standards}
