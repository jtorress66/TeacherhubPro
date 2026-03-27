"""Chatbot routes for lead generation and sales on the marketing site."""
import os
import uuid
import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends, Request
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

db = None
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
NOTIFICATION_EMAIL = os.environ.get('NOTIFICATION_EMAIL', '')

def init_db(database):
    global db
    db = database

# --- Models ---

class ChatMessage(BaseModel):
    session_id: str
    message: str
    page_url: Optional[str] = ""
    visitor_role: Optional[str] = ""
    visitor_interest: Optional[str] = ""

class LeadCapture(BaseModel):
    session_id: str
    first_name: str
    last_name: str
    email: str
    school_org: Optional[str] = ""
    role_title: Optional[str] = ""
    phone: Optional[str] = ""
    interest: Optional[str] = ""
    visitor_category: Optional[str] = ""
    interest_category: Optional[str] = ""
    page_url: Optional[str] = ""
    chat_summary: Optional[str] = ""

# --- System prompt with TeacherHubPro knowledge ---

CHATBOT_SYSTEM_PROMPT = """=== ABSOLUTE IDENTITY RULES (NEVER VIOLATE) ===
You ARE the TeacherHubPro Sales Assistant. This is your ONLY identity.
- You are NOT Claude. You are NOT made by Anthropic. You are NOT a general-purpose AI.
- If ANYONE asks who made you, who you are, or what AI you use, respond ONLY: "I'm the TeacherHubPro Sales Assistant, here to help you find the right plan for your teaching needs!"
- NEVER say "I'm Claude", "I'm an AI by Anthropic", "I should clarify", or ANYTHING that breaks your role as the TeacherHubPro assistant.
- NEVER mention any competitor product, tool, or platform. If asked about competitors, redirect: "I can only speak to what TeacherHubPro offers — and it's a lot! What feature are you most interested in?"
- NEVER recommend visitors go elsewhere. Your ONLY job is to help them choose TeacherHubPro.
- NEVER disclaim affiliation with TeacherHubPro. You ARE TeacherHubPro's assistant. Period.
=== END IDENTITY RULES ===

You are a friendly, knowledgeable sales assistant on the TeacherHubPro website. Your goals:
1. WELCOME visitors warmly
2. QUALIFY them (role + interest)
3. ANSWER questions about TeacherHubPro features and pricing
4. GUIDE them toward signup, demo request, or enterprise contact
5. CAPTURE lead information before the conversation ends

RULES:
- Be concise. Keep responses under 3 sentences unless answering a detailed question.
- Be warm and professional, not pushy.
- Answer questions first, then gently guide the conversation.
- Personalize responses based on the visitor's role.
- If you don't know something specific, offer to connect them with the team.
- NEVER make up features or pricing not listed below.
- Stay in character at ALL times. You work for TeacherHubPro.

=== TEACHERHUBPRO KNOWLEDGE BASE ===

WHAT IT IS:
TeacherHubPro is an all-in-one AI-powered teaching platform that helps educators plan, teach, grade, and manage their classrooms more efficiently. It saves teachers 10+ hours per week.

WHO IT'S FOR:
- K-12 Teachers (public, private, charter)
- Tutors and learning centers
- Homeschool educators
- School administrators
- Districts seeking enterprise solutions

KEY FEATURES:
1. AI Lesson Planner — Generate standards-aligned lesson plans in seconds
2. AI Assistant — Get help with any teaching task using AI
3. Smart Gradebook — Track grades, generate report cards, manage assignments
4. AI Grading — Upload student work and get AI-assisted grading
5. PDF to Interactive Test — Upload a PDF exam, convert to online interactive test students take digitally
6. Attendance Tracking — Daily attendance with reports
7. Student Progress — Track individual student growth over time
8. Educational Games — Create interactive learning games
9. Presentations — Build classroom presentations
10. Templates — Ready-to-use educational templates
11. Parent Portal — Share progress with parents
12. Google Classroom Integration — Share assignments directly
13. Multi-language Support — Available in 7 languages (English, Spanish, French, Portuguese, German, Italian, Chinese)

=== PRICING (USE THESE EXACT NUMBERS) ===

1. FREE TRIAL — Full access to all features, no credit card required. Start at /auth
2. INDIVIDUAL MONTHLY — $9.99/month. Best for teachers who want flexibility. Includes all features: lesson planner, gradebook, attendance, AI tools, presentations, games, templates, report cards, and more.
3. INDIVIDUAL ANNUAL — $79/year (save over 30%!). Same full access as monthly, billed annually. Best value for individual teachers.
4. SCHOOL PLAN — $6/teacher/month. Volume pricing for schools. Includes admin dashboard, teacher management, school-wide analytics, and dedicated onboarding.
5. DISTRICT / ENTERPRISE — Starting at $4/teacher/month. Custom pricing for districts. Includes everything in School Plan plus district-wide analytics, custom onboarding, dedicated support, and volume discounts.

For School and District plans, recommend they contact us or book a demo for a personalized quote.

=== CONVERSATION FLOW ===

STEP 1 - GREETING: Welcome warmly, ask how you can help. Keep it brief.

STEP 2 - QUALIFICATION: Ask their role if unknown.

STEP 3 - INTEREST: Ask what they're most interested in.

STEP 4 - ANSWER & GUIDE: Answer questions. Mention relevant pages: /features, /pricing, /auth (signup), /contact.

STEP 5 - LEAD CAPTURE: After 2-3 exchanges, offer to collect contact info for follow-up.

STEP 6 - CTA:
- Individual educators: "Start your free trial right now — no credit card needed!"
- School/district: "I'd recommend booking a demo. Want me to help set that up?"

=== RESPONSE FORMAT ===
Respond in plain text. No markdown. Use simple numbered lists or short paragraphs. Keep it conversational."""


# In-memory session store for chat histories (augmented with MongoDB for persistence)
_chat_sessions = {}


def _score_lead(data: dict) -> str:
    """Score a lead as high/medium/low priority."""
    role = (data.get("visitor_category") or data.get("role_title") or "").lower()
    interest = (data.get("interest_category") or data.get("interest") or "").lower()

    # High priority
    high_roles = ["district", "enterprise", "administrator", "admin", "principal", "superintendent", "director"]
    high_interests = ["demo", "enterprise", "district", "school solution", "consultation"]
    if any(r in role for r in high_roles) or any(i in interest for i in high_interests):
        return "high"

    # Medium priority
    medium_interests = ["pricing", "multiple", "school", "grading", "lesson planning"]
    if any(i in interest for i in medium_interests) or data.get("email"):
        return "medium"

    return "low"


async def _send_lead_notification(lead: dict):
    """Send email notification for high-priority leads via Resend."""
    if not RESEND_API_KEY or not NOTIFICATION_EMAIL:
        logger.info("Skipping lead notification — no RESEND_API_KEY or NOTIFICATION_EMAIL configured")
        return

    try:
        import resend
        resend.api_key = RESEND_API_KEY

        name = f"{lead.get('first_name', '')} {lead.get('last_name', '')}".strip()
        params = {
            "from": SENDER_EMAIL,
            "to": [NOTIFICATION_EMAIL],
            "subject": f"[HIGH PRIORITY LEAD] {name} — {lead.get('school_org', 'N/A')}",
            "html": f"""
            <h2>New High-Priority Lead from TeacherHubPro Chatbot</h2>
            <table style="border-collapse:collapse; width:100%; max-width:600px;">
                <tr><td style="padding:8px; border:1px solid #ddd; font-weight:bold;">Name</td><td style="padding:8px; border:1px solid #ddd;">{name}</td></tr>
                <tr><td style="padding:8px; border:1px solid #ddd; font-weight:bold;">Email</td><td style="padding:8px; border:1px solid #ddd;">{lead.get('email', 'N/A')}</td></tr>
                <tr><td style="padding:8px; border:1px solid #ddd; font-weight:bold;">Organization</td><td style="padding:8px; border:1px solid #ddd;">{lead.get('school_org', 'N/A')}</td></tr>
                <tr><td style="padding:8px; border:1px solid #ddd; font-weight:bold;">Role</td><td style="padding:8px; border:1px solid #ddd;">{lead.get('role_title', lead.get('visitor_category', 'N/A'))}</td></tr>
                <tr><td style="padding:8px; border:1px solid #ddd; font-weight:bold;">Interest</td><td style="padding:8px; border:1px solid #ddd;">{lead.get('interest', lead.get('interest_category', 'N/A'))}</td></tr>
                <tr><td style="padding:8px; border:1px solid #ddd; font-weight:bold;">Phone</td><td style="padding:8px; border:1px solid #ddd;">{lead.get('phone', 'N/A')}</td></tr>
                <tr><td style="padding:8px; border:1px solid #ddd; font-weight:bold;">Page</td><td style="padding:8px; border:1px solid #ddd;">{lead.get('page_url', 'N/A')}</td></tr>
                <tr><td style="padding:8px; border:1px solid #ddd; font-weight:bold;">Priority</td><td style="padding:8px; border:1px solid #ddd; color:red; font-weight:bold;">{lead.get('lead_score', 'high').upper()}</td></tr>
                <tr><td style="padding:8px; border:1px solid #ddd; font-weight:bold;">Chat Summary</td><td style="padding:8px; border:1px solid #ddd;">{lead.get('chat_summary', 'N/A')}</td></tr>
            </table>
            <p style="margin-top:16px; color:#666;">Captured at {lead.get('created_at', 'N/A')}</p>
            """
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Lead notification sent for {name}")
    except Exception as e:
        logger.error(f"Failed to send lead notification: {e}")


# --- Routes ---

@router.post("/message")
async def chat_message(msg: ChatMessage):
    """Handle a chatbot message using Claude AI."""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI not configured")

    session_id = msg.session_id

    # Build context from session
    context_parts = []
    if msg.visitor_role:
        context_parts.append(f"Visitor role: {msg.visitor_role}")
    if msg.visitor_interest:
        context_parts.append(f"Visitor interest: {msg.visitor_interest}")
    if msg.page_url:
        context_parts.append(f"Currently viewing: {msg.page_url}")

    context_note = "\n".join(context_parts)
    system = CHATBOT_SYSTEM_PROMPT
    if context_note:
        system += f"\n\n=== CURRENT VISITOR CONTEXT ===\n{context_note}"

    try:
        # Load conversation history from MongoDB
        initial_messages = []
        if db is not None:
            session_doc = await db.chatbot_sessions.find_one(
                {"session_id": session_id}, {"_id": 0}
            )
            if session_doc and session_doc.get("messages"):
                for prev_msg in session_doc["messages"][-10:]:
                    initial_messages.append({
                        "role": prev_msg["role"],
                        "content": prev_msg["content"]
                    })

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"chatbot_{session_id}",
            system_message=system,
            initial_messages=initial_messages if initial_messages else None
        ).with_model("anthropic", "claude-sonnet-4-20250514")

        response = await asyncio.wait_for(
            chat.send_message(UserMessage(text=msg.message)),
            timeout=30
        )

        # Store conversation in MongoDB
        if db is not None:
            await db.chatbot_sessions.update_one(
                {"session_id": session_id},
                {
                    "$push": {
                        "messages": {
                            "$each": [
                                {"role": "user", "content": msg.message, "ts": datetime.now(timezone.utc).isoformat()},
                                {"role": "assistant", "content": response, "ts": datetime.now(timezone.utc).isoformat()}
                            ]
                        }
                    },
                    "$set": {
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                        "visitor_role": msg.visitor_role or "",
                        "visitor_interest": msg.visitor_interest or "",
                        "page_url": msg.page_url or ""
                    },
                    "$setOnInsert": {
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                },
                upsert=True
            )

        return {"response": response, "session_id": session_id}

    except asyncio.TimeoutError:
        return {"response": "I'm sorry, I'm having a moment. Could you try again?", "session_id": session_id}
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        return {
            "response": "I apologize for the inconvenience. You can reach our team directly at the Contact page for immediate assistance.",
            "session_id": session_id
        }


@router.post("/lead")
async def capture_lead(lead: LeadCapture):
    """Store a captured lead with scoring."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    lead_data = lead.model_dump()
    lead_data["lead_id"] = f"lead_{uuid.uuid4().hex[:12]}"
    lead_data["lead_score"] = _score_lead(lead_data)
    lead_data["created_at"] = datetime.now(timezone.utc).isoformat()
    lead_data["status"] = "new"

    await db.leads.insert_one(lead_data)

    # Send email notification for high-priority leads
    if lead_data["lead_score"] == "high":
        asyncio.create_task(_send_lead_notification(lead_data))

    return {
        "lead_id": lead_data["lead_id"],
        "lead_score": lead_data["lead_score"],
        "message": "Thank you! Our team will be in touch."
    }


@router.get("/leads")
async def get_leads(request: Request):
    """Get all leads (admin only)."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    # Simple auth check via cookie
    from utils.auth import get_current_user
    try:
        user = await get_current_user(request)
        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized")
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")

    leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"leads": leads, "total": len(leads)}


@router.get("/leads/stats")
async def get_lead_stats(request: Request):
    """Get lead statistics (admin only)."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    from utils.auth import get_current_user
    try:
        user = await get_current_user(request)
        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized")
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")

    total = await db.leads.count_documents({})
    high = await db.leads.count_documents({"lead_score": "high"})
    medium = await db.leads.count_documents({"lead_score": "medium"})
    low = await db.leads.count_documents({"lead_score": "low"})
    new_leads = await db.leads.count_documents({"status": "new"})

    return {
        "total": total,
        "high_priority": high,
        "medium_priority": medium,
        "low_priority": low,
        "new_leads": new_leads
    }
