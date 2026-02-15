"""AI Teaching Assistant routes"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
import uuid
import logging

from emergentintegrations.llm.chat import LlmChat, UserMessage

from ..utils.database import db
from ..utils.auth import get_current_user
from ..utils.constants import EMERGENT_LLM_KEY, AI_SYSTEM_PROMPTS, STANDARDS_INFO, FREE_TRIAL_DAYS
from ..models import AIGenerationRequest, AIChatRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["AI Assistant"])


async def check_ai_access(user: dict) -> bool:
    """Check if user has access to AI features (paid subscription or trial)"""
    user_id = user.get("user_id")
    
    # Check subscription status
    subscription = await db.subscriptions.find_one({"user_id": user_id, "status": "active"})
    if subscription:
        return True
    
    # Check if in trial period
    user_doc = await db.users.find_one({"user_id": user_id})
    if user_doc:
        created_at = user_doc.get("created_at", "")
        if created_at:
            try:
                created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                trial_end = created_date + timedelta(days=FREE_TRIAL_DAYS)
                if datetime.now(timezone.utc) < trial_end:
                    return True
            except:
                pass
    
    return False


@router.post("/generate")
async def ai_generate_content(request: AIGenerationRequest, current_user: dict = Depends(get_current_user)):
    """Generate educational content using AI"""
    
    # Check AI access
    has_access = await check_ai_access(current_user)
    if not has_access:
        raise HTTPException(
            status_code=403, 
            detail="AI features require an active subscription or trial period"
        )
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    try:
        # Get the appropriate system prompt
        system_prompt = AI_SYSTEM_PROMPTS.get(request.tool_type, AI_SYSTEM_PROMPTS["chat"])
        
        # Build the user prompt
        standards_context = ""
        if request.standards_framework == "both":
            standards_context = f"""
Use BOTH of these standards frameworks:
1. {STANDARDS_INFO['common_core']['name']} - Cite as {STANDARDS_INFO['common_core']['subjects'].get(request.subject.lower(), 'CCSS')}
2. {STANDARDS_INFO['pr_core']['name']} - Cite as {STANDARDS_INFO['pr_core']['subjects'].get(request.subject.lower(), 'PR')}
"""
        elif request.standards_framework == "pr_core":
            standards_context = f"""
Use Puerto Rico Standards ({STANDARDS_INFO['pr_core']['name_es']}).
Cite standards as: {STANDARDS_INFO['pr_core']['subjects'].get(request.subject.lower(), 'PR')}
"""
        else:
            standards_context = f"""
Use Common Core State Standards.
Cite standards as: {STANDARDS_INFO['common_core']['subjects'].get(request.subject.lower(), 'CCSS')}
"""
        
        language_instruction = "Respond entirely in Spanish." if request.language == "es" else "Respond entirely in English."
        
        user_prompt = f"""
{language_instruction}

Generate content for:
- Subject: {request.subject}
- Grade Level: {request.grade_level}
- Topic: {request.topic}
- Difficulty: {request.difficulty_level}
{f'- Duration: {request.duration_minutes} minutes' if request.duration_minutes else ''}
{f'- Number of questions: {request.num_questions}' if request.tool_type == 'quiz' else ''}

Standards Framework:
{standards_context}

{f'Additional Instructions: {request.additional_instructions}' if request.additional_instructions else ''}

Please generate high-quality, ready-to-use educational content.
"""
        
        # Initialize the chat with Claude
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"gen_{uuid.uuid4().hex[:8]}",
            system_message=system_prompt
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        # Send the message
        user_message = UserMessage(text=user_prompt)
        response = await chat.send_message(user_message)
        
        # Save generation to database
        generation_id = f"gen_{uuid.uuid4().hex[:12]}"
        generation_doc = {
            "generation_id": generation_id,
            "user_id": current_user.get("user_id"),
            "tool_type": request.tool_type,
            "subject": request.subject,
            "grade_level": request.grade_level,
            "topic": request.topic,
            "standards_framework": request.standards_framework,
            "language": request.language,
            "content": response,
            "metadata": {
                "difficulty": request.difficulty_level,
                "duration": request.duration_minutes,
                "num_questions": request.num_questions
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.ai_generations.insert_one(generation_doc)
        
        return {
            "generation_id": generation_id,
            "tool_type": request.tool_type,
            "content": response,
            "metadata": generation_doc["metadata"],
            "created_at": generation_doc["created_at"]
        }
        
    except Exception as e:
        logger.error(f"AI generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@router.post("/chat")
async def ai_chat(request: AIChatRequest, current_user: dict = Depends(get_current_user)):
    """Chat with the AI teaching assistant"""
    
    # Check AI access
    has_access = await check_ai_access(current_user)
    if not has_access:
        raise HTTPException(
            status_code=403, 
            detail="AI features require an active subscription or trial period"
        )
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    try:
        user_id = current_user.get("user_id")
        
        # Get chat history for context
        chat_history = await db.ai_chat_messages.find(
            {"session_id": request.session_id, "user_id": user_id}
        ).sort("created_at", 1).limit(20).to_list(length=20)
        
        # Build context from history
        history_context = ""
        if chat_history:
            history_context = "\n\nPrevious conversation:\n"
            for msg in chat_history[-10:]:
                role = "Teacher" if msg["role"] == "user" else "Assistant"
                history_context += f"{role}: {msg['content'][:500]}...\n" if len(msg['content']) > 500 else f"{role}: {msg['content']}\n"
        
        language_instruction = "Respond in Spanish." if request.language == "es" else "Respond in English."
        
        system_message = AI_SYSTEM_PROMPTS["chat"] + f"\n\n{language_instruction}"
        if request.context:
            system_message += f"\n\nCurrent context: {request.context}"
        if history_context:
            system_message += history_context
        
        # Initialize chat with Claude
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=request.session_id,
            system_message=system_message
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        # Send message
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        # Save user message
        user_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
        await db.ai_chat_messages.insert_one({
            "message_id": user_msg_id,
            "session_id": request.session_id,
            "user_id": user_id,
            "role": "user",
            "content": request.message,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Save assistant response
        assistant_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
        assistant_msg = {
            "message_id": assistant_msg_id,
            "session_id": request.session_id,
            "user_id": user_id,
            "role": "assistant",
            "content": response,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.ai_chat_messages.insert_one(assistant_msg)
        
        return {
            "message_id": assistant_msg_id,
            "session_id": request.session_id,
            "role": "assistant",
            "content": response,
            "created_at": assistant_msg["created_at"]
        }
        
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")


@router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str, current_user: dict = Depends(get_current_user)):
    """Get chat history for a session"""
    user_id = current_user.get("user_id")
    
    messages = await db.ai_chat_messages.find(
        {"session_id": session_id, "user_id": user_id}
    ).sort("created_at", 1).to_list(length=100)
    
    return [{
        "message_id": msg["message_id"],
        "session_id": msg["session_id"],
        "role": msg["role"],
        "content": msg["content"],
        "created_at": msg["created_at"]
    } for msg in messages]


@router.get("/generations")
async def get_user_generations(current_user: dict = Depends(get_current_user)):
    """Get user's AI generations"""
    user_id = current_user.get("user_id")
    
    generations = await db.ai_generations.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(50).to_list(length=50)
    
    return [{
        "generation_id": gen["generation_id"],
        "tool_type": gen["tool_type"],
        "subject": gen["subject"],
        "grade_level": gen["grade_level"],
        "topic": gen["topic"],
        "content": gen["content"][:500] + "..." if len(gen["content"]) > 500 else gen["content"],
        "created_at": gen["created_at"]
    } for gen in generations]


@router.get("/generations/{generation_id}")
async def get_generation(generation_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific AI generation"""
    user_id = current_user.get("user_id")
    
    generation = await db.ai_generations.find_one({
        "generation_id": generation_id,
        "user_id": user_id
    })
    
    if not generation:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    return {
        "generation_id": generation["generation_id"],
        "tool_type": generation["tool_type"],
        "subject": generation["subject"],
        "grade_level": generation["grade_level"],
        "topic": generation["topic"],
        "standards_framework": generation["standards_framework"],
        "language": generation["language"],
        "content": generation["content"],
        "metadata": generation.get("metadata", {}),
        "created_at": generation["created_at"]
    }


@router.delete("/chat/sessions/{session_id}")
async def delete_chat_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a chat session and its messages"""
    user_id = current_user.get("user_id")
    
    result = await db.ai_chat_messages.delete_many({
        "session_id": session_id,
        "user_id": user_id
    })
    
    return {"deleted_count": result.deleted_count}
