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
    language: Optional[str] = "en"

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

CHATBOT_SYSTEM_PROMPT = """Your name is Ed. You are the friendly sales assistant chatbot for TeacherHubPro, an AI-powered teaching platform.

CRITICAL IDENTITY RULES — FOLLOW THESE WITHOUT EXCEPTION:
- Your name is Ed. You work for TeacherHubPro. This is your ONLY identity.
- You must NEVER reveal, hint, or acknowledge any underlying AI model, company, or technology. You are Ed from TeacherHubPro.
- If asked "who are you?", "who made you?", "are you an AI?", "are you ChatGPT/Claude/etc?" — answer ONLY: "I'm Ed, your TeacherHubPro assistant! How can I help you today?"
- You must NEVER say phrases like "I should clarify", "I'm actually", "I'm not affiliated", "I don't have access to", or "as an AI". These phrases are FORBIDDEN.
- You must NEVER mention, suggest, or recommend any competitor product or platform. If asked about competitors, say: "I'm here to help with TeacherHubPro! What would you like to know about our features or pricing?"
- You must NEVER tell users to visit another website. Only recommend TeacherHubPro pages.
- Stay in character as Ed at ALL times. No exceptions. No disclaimers.

YOUR GOALS:
1. Welcome visitors warmly as Ed
2. Qualify them (their role + what they need)
3. Answer questions about TeacherHubPro features and pricing
4. Guide them toward signup, demo request, or contacting the team
5. Capture lead information when appropriate

STYLE RULES:
- Be concise (under 3 sentences unless answering a detailed question)
- Be warm, helpful, and conversational — not pushy
- Answer the question first, then guide the conversation
- Personalize based on the visitor's role
- If unsure about something specific, offer to connect them with the team
- NEVER invent features or pricing not listed below

=== TEACHERHUBPRO PRODUCT INFO ===

TeacherHubPro is an all-in-one AI-powered teaching platform. It saves teachers 10+ hours per week.

FOR: K-12 Teachers, Tutors, Homeschool educators, School administrators, Districts

FEATURES:
1. AI Lesson Planner — Standards-aligned lesson plans in seconds
2. AI Assistant — Help with any teaching task
3. Smart Gradebook — Grades, report cards, assignments
4. AI Grading — AI-assisted grading of student work
5. PDF to Interactive Test — Convert PDF exams to online tests
6. Attendance Tracking — Daily attendance with reports
7. Student Progress Tracking
8. Educational Games Creator
9. Presentations Builder
10. Templates Library
11. Parent Portal
12. Google Classroom Integration
13. 7-Language Support (EN, ES, FR, PT, DE, IT, ZH)

=== PRICING — USE ONLY THESE EXACT PLAN NAMES AND PRICES ===

IMPORTANT: There are exactly 4 plans plus a free trial. ONLY use these plan names and prices. NEVER invent new plan names like "Basic", "Professional", "Premium", or "Starter". NEVER make up prices.

FREE TRIAL — Full access to all features, no credit card required. Start at /auth

"Individual Monthly" — $9.99/month
- Best for teachers who want flexibility
- Includes: Lesson Planner, Attendance Tracker, Digital Gradebook, AI Tools, PDF Export, Email Support

"Individual Annual" — $79/year (Save $40, that is 2 months free)
- Best for committed educators who want the best value
- Includes: Everything in Monthly plus Priority Support and Early Access to Features

"School Plan" — $6/teacher/month (billed annually, minimum 10 teachers, e.g. 10 teachers = $720/year)
- Best for schools and educational teams
- Includes: All Individual Features plus Admin Dashboard, School Branding, Bulk Import, School Reports, User Management

"District Plan" — $4/teacher/month (billed annually, minimum 100 teachers)
- Best for large school districts
- Includes: All School Features plus District Analytics, SSO Integration, Dedicated Support, Custom Training, API Access

For School and District plans, recommend contacting the team or booking a demo for a quote.

=== CONVERSATION FLOW ===

1. GREET: Welcome warmly, ask how you can help
2. QUALIFY: Ask their role if unknown
3. DISCOVER: Ask what they need most
4. ANSWER: Provide info, mention /features, /pricing, /auth, /contact as relevant
5. LEAD CAPTURE: After 2-3 exchanges, offer to collect contact info
6. CTA: Individual educators say "Start your free trial!" / Schools say "Book a demo!"

Respond in plain text only. No markdown formatting. No bold, no headers, no bullet points with asterisks. Keep it conversational."""


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

# Phrases that indicate the LLM broke character - used for filtering
_IDENTITY_BREAK_PHRASES = [
    "i'm claude", "i am claude", "i'm an ai assistant created by",
    "created by anthropic", "made by anthropic", "developed by anthropic",
    "not affiliated", "not actually affiliated", "i should clarify",
    "i don't have access to pricing", "i can't provide quotes",
    "as an ai language model", "as an ai,", "i'm an ai",
    "i am an ai", "i'm not actually", "i am not actually",
    "fictional", "roleplaying", "role-playing", "appears to be a",
    "i was roleplaying", "i don't represent"
]

# Fallback responses when the LLM breaks character
_PRICING_FALLBACK = (
    "Great question! Here are our plans:\n\n"
    "- Individual Monthly: $9.99/month (all features included)\n"
    "- Individual Annual: $79/year (save $40, 2 months free!)\n"
    "- School Plan: $6/teacher/month (billed annually, min 10 teachers)\n"
    "- District Plan: $4/teacher/month (billed annually, min 100 teachers)\n\n"
    "Plus you can start with a free trial — full access, no credit card needed! "
    "Would you like to try it out, or do you have questions about a specific plan?"
)

_IDENTITY_FALLBACK = (
    "I'm Ed, your TeacherHubPro assistant! I'm here to help you explore our platform, "
    "answer your questions about features and pricing, and get you set up. "
    "What would you like to know?"
)


def _is_clean_message(content: str) -> bool:
    """Check if a message doesn't contain identity-breaking phrases."""
    lower = content.lower()
    return not any(phrase in lower for phrase in _IDENTITY_BREAK_PHRASES)


def _sanitize_response(response: str, user_message: str) -> str:
    """Post-process LLM response to catch identity breaks and pricing inaccuracies."""
    lower = response.lower()
    
    # Layer 1: Catch any identity breaks
    if any(phrase in lower for phrase in _IDENTITY_BREAK_PHRASES):
        user_lower = user_message.lower()
        if any(w in user_lower for w in ["price", "pricing", "cost", "how much", "plan", "subscribe"]):
            return _PRICING_FALLBACK
        return _IDENTITY_FALLBACK
    
    # Layer 2: If user asked about pricing but response doesn't have real prices, replace
    user_lower = user_message.lower()
    is_pricing_question = any(w in user_lower for w in ["price", "pricing", "cost", "how much", "plan", "plans", "subscribe", "subscription"])
    if is_pricing_question:
        has_real_prices = ("9.99" in response and "$79" in response) or ("$6" in response and "$4" in response)
        has_fake_plans = any(p in lower for p in ["basic plan", "professional plan", "premium plan", "starter plan", "pro plan"])
        if has_fake_plans or not has_real_prices:
            return _PRICING_FALLBACK
    
    return response


# The initial assistant message to anchor Ed's identity in every conversation
_ED_ANCHOR_MESSAGE = {
    "role": "assistant",
    "content": "Hi! I'm Ed, your TeacherHubPro assistant. I can help you with features, pricing, or getting started with a free trial. What can I help you with today?"
}


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

    # Language mapping
    LANG_NAMES = {
        "en": "English", "es": "Spanish", "fr": "French",
        "pt": "Portuguese", "de": "German", "it": "Italian", "zh": "Chinese"
    }
    lang = msg.language or "en"
    lang_name = LANG_NAMES.get(lang, "English")

    context_note = "\n".join(context_parts)
    system = CHATBOT_SYSTEM_PROMPT
    if lang != "en":
        system += f"\n\n=== LANGUAGE INSTRUCTION ===\nYou MUST respond ENTIRELY in {lang_name}. All your replies must be in {lang_name}. Do not mix languages. The visitor's preferred language is {lang_name}."
    if context_note:
        system += f"\n\n=== CURRENT VISITOR CONTEXT ===\n{context_note}"

    try:
        # Build conversation history: start with Ed's anchor message, then clean MongoDB history
        initial_messages = [_ED_ANCHOR_MESSAGE.copy()]

        if db is not None:
            session_doc = await db.chatbot_sessions.find_one(
                {"session_id": session_id}, {"_id": 0}
            )
            if session_doc and session_doc.get("messages"):
                for prev_msg in session_doc["messages"][-10:]:
                    content = prev_msg.get("content", "")
                    # Skip any assistant messages that broke character
                    if prev_msg["role"] == "assistant" and not _is_clean_message(content):
                        continue
                    initial_messages.append({
                        "role": prev_msg["role"],
                        "content": content
                    })

        # Use a unique session_id per call so the library never loads stale history
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"ed_{uuid.uuid4().hex}",
            system_message=system,
            initial_messages=initial_messages
        ).with_model("anthropic", "claude-sonnet-4-6")

        response = await asyncio.wait_for(
            chat.send_message(UserMessage(text=msg.message)),
            timeout=30
        )

        # Post-process: catch any identity breaks and replace with safe fallback
        response = _sanitize_response(response, msg.message)

        # Store the clean conversation in MongoDB
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
