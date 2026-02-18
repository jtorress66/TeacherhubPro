"""AI Teaching Assistant routes"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
import uuid
import logging
import re

from emergentintegrations.llm.chat import LlmChat, UserMessage

from utils.database import db
from utils.auth import get_current_user
from utils.constants import EMERGENT_LLM_KEY, AI_SYSTEM_PROMPTS, STANDARDS_INFO, FREE_TRIAL_DAYS
from models import AIGenerationRequest, AIChatRequest, AIGeneratePresentationRequest, PresentationCreate, PresentationUpdate

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
            except ValueError:
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
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
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
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
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


# ==================== AI TEMPLATES ====================

# Starter Templates - Pre-built templates for common topics
STARTER_TEMPLATES = [
    {
        "template_id": "starter_fractions_intro",
        "name": "Introduction to Fractions",
        "name_es": "Introducción a las Fracciones",
        "description": "A hands-on approach to teaching fractions using visual models and manipulatives",
        "description_es": "Un enfoque práctico para enseñar fracciones usando modelos visuales y manipulativos",
        "subject": "math",
        "grade_level": "3-4",
        "tags": ["math", "fractions", "hands-on", "visual"],
        "is_starter": True,
        "customization_tips": [
            "Replace 'pizza' theme with local food favorites (e.g., 'pastelitos', 'quesadillas')",
            "Adjust the manipulatives based on what's available (LEGO blocks work great!)",
            "For advanced students, extend to fifths and sixths on Day 3",
            "Add a 'Fraction in Real Life' homework where students find fractions at home"
        ],
        "customization_tips_es": [
            "Reemplaza el tema de 'pizza' con comidas locales favoritas (ej: 'pastelitos', 'quesadillas')",
            "Ajusta los manipulativos según lo disponible (¡los bloques LEGO funcionan muy bien!)",
            "Para estudiantes avanzados, extiende a quintos y sextos el Día 3",
            "Agrega tarea de 'Fracciones en la Vida Real' donde encuentren fracciones en casa"
        ],
        "days": {
            "0": """🎯 **Day 1 - Introduction & Exploration**

**Activities:**
1. **Fraction Pizza Party** (15 min): Use paper circles to create "pizzas" divided into equal parts. Students explore halves, thirds, and fourths.
2. **Equal Parts Hunt** (10 min): Find objects in the classroom that can be divided into equal parts.
3. **Fraction Vocabulary Wall** (10 min): Introduce key terms: numerator, denominator, equal parts, whole.

📚 **Materials:** Paper circles, scissors, fraction vocabulary cards, real objects (apples, crackers)

✅ **Success Criteria:** Students can identify and name basic fractions (1/2, 1/3, 1/4)""",
            
            "1": """🎯 **Day 2 - Guided Practice with Models**

**Activities:**
1. **Fraction Strips Exploration** (15 min): Use fraction strips to compare fractions. Which is bigger: 1/2 or 1/4?
2. **Partner Matching Game** (15 min): Match fraction cards to visual representations.
3. **Fraction Number Line** (10 min): Place fractions on a number line from 0 to 1.

📚 **Materials:** Fraction strips, fraction cards, number line template

✅ **Success Criteria:** Students can compare fractions with same denominators""",
            
            "2": """🎯 **Day 3 - Independent Practice**

**Activities:**
1. **Fraction Centers Rotation** (25 min): 
   - Center 1: Fraction puzzles
   - Center 2: Digital fraction games
   - Center 3: Draw and label fractions
2. **Exit Ticket** (10 min): Draw a shape divided into fourths, shade 3/4.

📚 **Materials:** Fraction puzzles, tablets/computers, drawing paper, colored pencils

✅ **Success Criteria:** Students can represent fractions in multiple ways""",
            
            "3": """🎯 **Day 4 - Real-World Applications**

**Activities:**
1. **Cooking with Fractions** (20 min): Follow a simple recipe using fraction measurements.
2. **Fraction Story Problems** (15 min): Solve word problems involving fractions in real situations.
3. **Create Your Own Fraction Story** (10 min): Write a story that uses fractions.

📚 **Materials:** Recipe cards, measuring cups, story problem worksheets

✅ **Success Criteria:** Students can apply fractions to real-world situations""",
            
            "4": """🎯 **Day 5 - Assessment & Celebration**

**Activities:**
1. **Fraction Assessment** (20 min): Short quiz covering fraction identification, comparison, and representation.
2. **Fraction Art Gallery** (15 min): Display fraction artwork created during the week.
3. **Reflection Journal** (10 min): "What I learned about fractions this week..."

📚 **Materials:** Assessment sheets, student work for display, journals

✅ **Success Criteria:** Students demonstrate understanding of fraction concepts"""
        }
    },
    {
        "template_id": "starter_reading_comprehension",
        "name": "Reading Comprehension Strategies",
        "name_es": "Estrategias de Comprensión Lectora",
        "description": "Teaching key comprehension strategies: predicting, questioning, visualizing, summarizing",
        "description_es": "Enseñanza de estrategias clave: predecir, cuestionar, visualizar, resumir",
        "subject": "ela",
        "grade_level": "2-5",
        "tags": ["reading", "comprehension", "strategies", "literacy"],
        "is_starter": True,
        "customization_tips": [
            "Choose texts that match your current theme or student interests",
            "Create strategy bookmarks students can use independently",
            "Pair with a class novel for deeper application",
            "Add a 'Strategy Detective' badge for students who catch themselves using strategies"
        ],
        "customization_tips_es": [
            "Elige textos que coincidan con tu tema actual o intereses de los estudiantes",
            "Crea marcadores de estrategias que los estudiantes puedan usar de forma independiente",
            "Combina con una novela de clase para una aplicación más profunda",
            "Agrega una insignia de 'Detective de Estrategias' para estudiantes que se encuentren usando estrategias"
        ],
        "days": {
            "0": """🎯 **Day 1 - Predicting**

**Activities:**
1. **Picture Walk** (10 min): Before reading, look at illustrations and predict what will happen.
2. **Prediction Chart** (15 min): Create a T-chart with "I Predict" and "What Actually Happened".
3. **Read Aloud with Stops** (20 min): Pause during reading to make and check predictions.

📚 **Materials:** Picture book, prediction chart template, sticky notes

✅ **Success Criteria:** Students can make logical predictions based on text evidence""",
            
            "1": """🎯 **Day 2 - Questioning**

**Activities:**
1. **Question Stems Introduction** (10 min): Teach who, what, when, where, why, how questions.
2. **Question the Text** (15 min): Read a short passage and generate questions before, during, and after.
3. **Question Swap** (15 min): Partners exchange questions and find answers in the text.

📚 **Materials:** Question stem cards, short passages, question recording sheets

✅ **Success Criteria:** Students can generate meaningful questions about texts""",
            
            "2": """🎯 **Day 3 - Visualizing**

**Activities:**
1. **Mind Movies** (10 min): Close eyes and visualize as teacher reads descriptive passage.
2. **Sketch to Stretch** (20 min): Draw what you visualize while reading, then share with partner.
3. **Sensory Details Hunt** (15 min): Find words that help create mental images (sight, sound, smell, taste, touch).

📚 **Materials:** Drawing paper, colored pencils, descriptive passages, sensory chart

✅ **Success Criteria:** Students can create mental images from text descriptions""",
            
            "3": """🎯 **Day 4 - Summarizing**

**Activities:**
1. **Somebody-Wanted-But-So-Then** (15 min): Use this framework to summarize a story.
2. **Main Idea & Details** (15 min): Identify the most important information in a nonfiction text.
3. **Shrinking Summary** (15 min): Reduce a paragraph to one sentence, then to 5 words.

📚 **Materials:** SWBST graphic organizer, main idea templates, text passages

✅ **Success Criteria:** Students can identify key information and summarize texts""",
            
            "4": """🎯 **Day 5 - Strategy Integration**

**Activities:**
1. **Strategy Bookmarks** (10 min): Create bookmarks with all four strategy reminders.
2. **Independent Reading with Strategies** (20 min): Apply all strategies while reading a new text.
3. **Strategy Reflection** (15 min): Which strategy helps you most? Write and share.

📚 **Materials:** Bookmark templates, independent reading books, reflection journals

✅ **Success Criteria:** Students can independently apply comprehension strategies"""
        }
    },
    {
        "template_id": "starter_scientific_method",
        "name": "Introduction to Scientific Method",
        "name_es": "Introducción al Método Científico",
        "description": "Hands-on exploration of the scientific method through simple experiments",
        "description_es": "Exploración práctica del método científico a través de experimentos simples",
        "subject": "science",
        "grade_level": "3-6",
        "tags": ["science", "experiments", "inquiry", "STEM"],
        "is_starter": True,
        "customization_tips": [
            "Replace experiments with ones that connect to your current science unit",
            "Feature scientists from diverse backgrounds (especially Latino scientists!)",
            "Turn Day 4 into a mini science fair with student presentations",
            "Connect to real-world issues students care about (environment, animals)"
        ],
        "customization_tips_es": [
            "Reemplaza los experimentos con unos que conecten con tu unidad de ciencias actual",
            "Destaca científicos de diversos orígenes (¡especialmente científicos latinos!)",
            "Convierte el Día 4 en una mini feria de ciencias con presentaciones estudiantiles",
            "Conecta con problemas del mundo real que les importan a los estudiantes (ambiente, animales)"
        ],
        "days": {
            "0": """🎯 **Day 1 - What is Science?**

**Activities:**
1. **Science is Everywhere** (10 min): Brainstorm: Where do we see science in daily life?
2. **Meet a Scientist** (15 min): Video or reading about different types of scientists.
3. **Scientific Method Introduction** (20 min): Introduce the steps with a simple demonstration (melting ice).

📚 **Materials:** Ice cubes, timer, scientific method poster, scientist profiles


✅ **Success Criteria:** Students can name the steps of the scientific method""",
            
            "1": """🎯 **Day 2 - Asking Questions & Making Hypotheses**

**Activities:**
1. **Question Starters** (10 min): What makes a good scientific question? (testable, measurable)
2. **If-Then Hypotheses** (15 min): Practice writing hypotheses in "If...then..." format.
3. **Mystery Box Activity** (20 min): Make hypotheses about what's inside sealed boxes using observations.

📚 **Materials:** Mystery boxes with objects, hypothesis worksheet, question cards

✅ **Success Criteria:** Students can write testable questions and hypotheses""",
            
            "2": """🎯 **Day 3 - Designing Experiments**

**Activities:**
1. **Variables Vocabulary** (10 min): Learn independent, dependent, and controlled variables.
2. **Experiment Planning** (20 min): Design a simple experiment to test: "Does the color of light affect plant growth?"
3. **Materials List & Procedure** (15 min): Write step-by-step procedures for the experiment.

📚 **Materials:** Experiment planning template, sample experiments, variable cards

✅ **Success Criteria:** Students can identify variables and design a fair test""",
            
            "3": """🎯 **Day 4 - Conducting Experiments & Collecting Data**

**Activities:**
1. **Mini Experiment Stations** (30 min): Rotate through 3 simple experiments (sink/float, magnet strength, paper airplane distance).
2. **Data Collection Practice** (15 min): Record observations in data tables and graphs.

📚 **Materials:** Experiment station supplies, data recording sheets, rulers, stopwatches

✅ **Success Criteria:** Students can conduct experiments and record data accurately""",
            
            "4": """🎯 **Day 5 - Drawing Conclusions**

**Activities:**
1. **Analyze Class Data** (15 min): Look at results from Day 4 experiments. What patterns do we see?
2. **Conclusion Writing** (15 min): Write conclusions that connect back to hypotheses.
3. **Science Fair Preview** (15 min): Introduce upcoming science fair project using scientific method.

📚 **Materials:** Class data charts, conclusion template, science fair guidelines

✅ **Success Criteria:** Students can analyze data and draw evidence-based conclusions"""
        }
    },
    {
        "template_id": "starter_writing_process",
        "name": "Writing Process Workshop",
        "name_es": "Taller del Proceso de Escritura",
        "description": "Guide students through prewriting, drafting, revising, editing, and publishing",
        "description_es": "Guiar a los estudiantes a través de planificación, borrador, revisión, edición y publicación",
        "subject": "ela",
        "grade_level": "2-6",
        "tags": ["writing", "process", "workshop", "literacy"],
        "is_starter": True,
        "customization_tips": [
            "Choose a genre that aligns with your current standards (narrative, opinion, informational)",
            "Use mentor texts from authors students love as examples",
            "Publish digitally with tools like Book Creator or Google Slides",
            "Invite parents or another class to the Author's Celebration"
        ],
        "customization_tips_es": [
            "Elige un género que se alinee con tus estándares actuales (narrativo, opinión, informativo)",
            "Usa textos modelo de autores que les gustan a los estudiantes como ejemplos",
            "Publica digitalmente con herramientas como Book Creator o Google Slides",
            "Invita a los padres u otra clase a la Celebración de Autores"
        ],
        "days": {
            "0": """🎯 **Day 1 - Prewriting & Brainstorming**

**Activities:**
1. **Topic Selection** (10 min): Use interest inventory to choose writing topics.
2. **Brainstorming Techniques** (15 min): Try mind mapping, listing, and freewriting.
3. **Graphic Organizer** (20 min): Use appropriate organizer (web for narrative, outline for informational).

📚 **Materials:** Interest inventory, brainstorming templates, graphic organizers, colored pencils

✅ **Success Criteria:** Students can generate and organize ideas for writing""",
            
            "1": """🎯 **Day 2 - Drafting**

**Activities:**
1. **Mini-Lesson: Just Write!** (10 min): Focus on getting ideas down, not perfection.
2. **Independent Drafting Time** (25 min): Students write first drafts using their organizers.
3. **Share Chair** (10 min): Volunteers share opening sentences for feedback.

📚 **Materials:** Drafting paper, graphic organizers from Day 1, writing folders

✅ **Success Criteria:** Students can write a complete first draft""",
            
            "2": """🎯 **Day 3 - Revising**

**Activities:**
1. **ARMS Strategy** (10 min): Add, Remove, Move, Substitute - revision techniques.
2. **Peer Revision Partners** (20 min): Use revision checklist to give feedback.
3. **Revision Application** (15 min): Make changes based on partner feedback.

📚 **Materials:** ARMS poster, revision checklist, colored pens for marking changes

✅ **Success Criteria:** Students can identify areas for improvement and revise""",
            
            "3": """🎯 **Day 4 - Editing**

**Activities:**
1. **CUPS Mini-Lesson** (10 min): Capitalization, Usage, Punctuation, Spelling.
2. **Editing Stations** (20 min): Rotate through editing focus areas.
3. **Final Edit** (15 min): Apply all editing skills to own writing.

📚 **Materials:** CUPS checklist, editing station cards, dictionaries, editing marks guide

✅ **Success Criteria:** Students can edit for conventions and mechanics""",
            
            "4": """🎯 **Day 5 - Publishing & Celebrating**

**Activities:**
1. **Final Copy Creation** (20 min): Write or type final published piece.
2. **Author's Celebration** (20 min): Share published work with class or buddy class.
3. **Reflection** (5 min): How did the writing process help you?

📚 **Materials:** Publishing paper, computers (optional), celebration treats, reflection cards

✅ **Success Criteria:** Students can produce a polished, published piece of writing"""
        }
    },
    {
        "template_id": "starter_multiplication_facts",
        "name": "Mastering Multiplication Facts",
        "name_es": "Dominando las Tablas de Multiplicar",
        "description": "Strategies and games for learning multiplication facts fluently",
        "description_es": "Estrategias y juegos para aprender las tablas de multiplicar con fluidez",
        "subject": "math",
        "grade_level": "3-4",
        "tags": ["math", "multiplication", "facts", "fluency"],
        "is_starter": True,
        "customization_tips": [
            "Focus on fact families your students struggle with most",
            "Add digital games like Prodigy or XtraMath for homework practice",
            "Create a class multiplication chart that grows as students master facts",
            "Send home flash cards with strategies written on the back"
        ],
        "customization_tips_es": [
            "Enfócate en las familias de hechos con las que tus estudiantes más luchan",
            "Agrega juegos digitales como Prodigy o XtraMath para práctica en casa",
            "Crea una tabla de multiplicar de la clase que crezca mientras dominan los hechos",
            "Envía tarjetas de práctica a casa con estrategias escritas al reverso"
        ],
        "days": {
            "0": """🎯 **Day 1 - Understanding Multiplication**

**Activities:**
1. **Equal Groups Introduction** (15 min): Use manipulatives to show multiplication as repeated addition.
2. **Array Art** (15 min): Create arrays to represent multiplication facts (3x4 = 3 rows of 4).
3. **Multiplication Vocabulary** (10 min): Factor, product, times, groups of.

📚 **Materials:** Counters, grid paper, array cards, vocabulary chart

✅ **Success Criteria:** Students understand multiplication as equal groups and arrays""",
            
            "1": """🎯 **Day 2 - Strategies for 2s, 5s, 10s**

**Activities:**
1. **Skip Counting Connection** (10 min): Link skip counting to multiplication.
2. **Pattern Hunt** (15 min): Find patterns in 2s, 5s, and 10s (all 10s end in 0, all 5s end in 0 or 5).
3. **Fact Family Practice** (15 min): Speed practice with these "friendly" facts.

📚 **Materials:** Hundreds chart, pattern worksheets, flash cards, timer

✅ **Success Criteria:** Students can quickly recall 2s, 5s, and 10s facts""",
            
            "2": """🎯 **Day 3 - Strategies for 3s, 4s, 6s**

**Activities:**
1. **Doubles Strategy** (10 min): 4s are double 2s, 6s are double 3s.
2. **Multiplication War** (20 min): Card game to practice facts.
3. **Fact Fluency Stations** (15 min): Rotate through practice activities.

📚 **Materials:** Playing cards, station materials, strategy posters

✅ **Success Criteria:** Students can use strategies to solve 3s, 4s, 6s facts""",
            
            "3": """🎯 **Day 4 - Strategies for 7s, 8s, 9s**

**Activities:**
1. **9s Finger Trick** (10 min): Teach the finger strategy for 9s.
2. **8s Pattern** (10 min): 8s are double 4s (which are double 2s).
3. **7s Songs & Rhymes** (10 min): Learn mnemonic devices for tricky 7s facts.
4. **Practice Games** (15 min): Digital or card games for harder facts.

📚 **Materials:** 9s finger chart, strategy cards, devices for games

✅ **Success Criteria:** Students have strategies for all multiplication facts""",
            
            "4": """🎯 **Day 5 - Fact Fluency Assessment**

**Activities:**
1. **Timed Fact Check** (10 min): Assessment of fact fluency (1-minute drill).
2. **Multiplication Bingo** (20 min): Fun review game with all facts.
3. **Goal Setting** (15 min): Which facts do I still need to practice? Create personal practice plan.

📚 **Materials:** Assessment sheets, bingo cards, goal-setting worksheet, flash card sets to take home

✅ **Success Criteria:** Students can identify known facts and facts needing more practice"""
        }
    }
]


@router.get("/templates/starters")
async def get_starter_templates():
    """Get pre-built starter templates"""
    return [{
        "template_id": t["template_id"],
        "name": t["name"],
        "name_es": t.get("name_es", t["name"]),
        "description": t["description"],
        "description_es": t.get("description_es", t["description"]),
        "subject": t["subject"],
        "grade_level": t["grade_level"],
        "tags": t["tags"],
        "is_starter": True,
        "days_count": len(t["days"])
    } for t in STARTER_TEMPLATES]


@router.get("/templates/weekly")
async def get_template_of_the_week():
    """Get the Template of the Week - rotates weekly through starter templates"""
    # Calculate which template to show based on the current week
    from datetime import datetime
    
    # Get week number of the year (1-52)
    week_number = datetime.now(timezone.utc).isocalendar()[1]
    
    # Rotate through templates
    template_index = week_number % len(STARTER_TEMPLATES)
    t = STARTER_TEMPLATES[template_index]
    
    return {
        "template_id": t["template_id"],
        "name": t["name"],
        "name_es": t.get("name_es", t["name"]),
        "description": t["description"],
        "description_es": t.get("description_es", t["description"]),
        "subject": t["subject"],
        "grade_level": t["grade_level"],
        "tags": t["tags"],
        "customization_tips": t.get("customization_tips", []),
        "customization_tips_es": t.get("customization_tips_es", []),
        "days_count": len(t["days"]),
        "is_starter": True,
        "week_number": week_number
    }


@router.get("/templates/starters/{template_id}")
async def get_starter_template(template_id: str):
    """Get a specific starter template with full content"""
    for t in STARTER_TEMPLATES:
        if t["template_id"] == template_id:
            return {
                "template_id": t["template_id"],
                "name": t["name"],
                "name_es": t.get("name_es", t["name"]),
                "description": t["description"],
                "description_es": t.get("description_es", t["description"]),
                "subject": t["subject"],
                "grade_level": t["grade_level"],
                "tags": t["tags"],
                "days": t["days"],
                "is_starter": True
            }
    raise HTTPException(status_code=404, detail="Starter template not found")


@router.post("/templates")
async def create_ai_template(request: dict, current_user: dict = Depends(get_current_user)):
    """Save an AI-generated plan as a reusable template"""
    user_id = current_user.get("user_id")
    
    # Validate required fields
    name = request.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Template name is required")
    
    template_id = f"tmpl_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    template_doc = {
        "template_id": template_id,
        "user_id": user_id,
        "name": name,
        "description": request.get("description", ""),
        "subject": request.get("subject", ""),
        "grade_level": request.get("grade_level", ""),
        "original_topic": request.get("original_topic", ""),
        "standards_framework": request.get("standards_framework", "common_core"),
        "days": request.get("days", {}),  # Day content keyed by day index
        "tags": request.get("tags", []),
        "is_public": request.get("is_public", False),  # For future community sharing
        "use_count": 0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.ai_templates.insert_one(template_doc)
    
    return {
        "template_id": template_id,
        "name": name,
        "message": "Template saved successfully"
    }


@router.get("/templates")
async def list_ai_templates(current_user: dict = Depends(get_current_user)):
    """List user's AI templates"""
    user_id = current_user.get("user_id")
    
    # Get user's own templates
    templates = await db.ai_templates.find(
        {"user_id": user_id}
    ).sort("created_at", -1).to_list(length=100)
    
    return [{
        "template_id": t["template_id"],
        "name": t["name"],
        "description": t.get("description", ""),
        "subject": t.get("subject", ""),
        "grade_level": t.get("grade_level", ""),
        "original_topic": t.get("original_topic", ""),
        "tags": t.get("tags", []),
        "use_count": t.get("use_count", 0),
        "days_count": len(t.get("days", {})),
        "created_at": t["created_at"]
    } for t in templates]


@router.get("/templates/{template_id}")
async def get_ai_template(template_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific AI template with full content"""
    user_id = current_user.get("user_id")
    
    template = await db.ai_templates.find_one({
        "template_id": template_id,
        "$or": [
            {"user_id": user_id},
            {"is_public": True}
        ]
    })
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Increment use count
    await db.ai_templates.update_one(
        {"template_id": template_id},
        {"$inc": {"use_count": 1}}
    )
    
    return {
        "template_id": template["template_id"],
        "name": template["name"],
        "description": template.get("description", ""),
        "subject": template.get("subject", ""),
        "grade_level": template.get("grade_level", ""),
        "original_topic": template.get("original_topic", ""),
        "standards_framework": template.get("standards_framework", "common_core"),
        "days": template.get("days", {}),
        "tags": template.get("tags", []),
        "use_count": template.get("use_count", 0),
        "created_at": template["created_at"]
    }


@router.put("/templates/{template_id}")
async def update_ai_template(template_id: str, request: dict, current_user: dict = Depends(get_current_user)):
    """Update an AI template"""
    user_id = current_user.get("user_id")
    
    # Check ownership
    template = await db.ai_templates.find_one({
        "template_id": template_id,
        "user_id": user_id
    })
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found or not owned by user")
    
    update_fields = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    for field in ["name", "description", "subject", "grade_level", "tags", "days", "is_public"]:
        if field in request:
            update_fields[field] = request[field]
    
    await db.ai_templates.update_one(
        {"template_id": template_id},
        {"$set": update_fields}
    )
    
    return {"message": "Template updated successfully"}


@router.delete("/templates/{template_id}")
async def delete_ai_template(template_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an AI template"""
    user_id = current_user.get("user_id")
    
    result = await db.ai_templates.delete_one({
        "template_id": template_id,
        "user_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found or not owned by user")
    
    return {"message": "Template deleted successfully"}


@router.post("/templates/{template_id}/customize")
async def customize_template(template_id: str, request: dict, current_user: dict = Depends(get_current_user)):
    """Generate customized content based on a template for a new topic"""
    
    # Check AI access
    has_access = await check_ai_access(current_user)
    if not has_access:
        raise HTTPException(
            status_code=403, 
            detail="AI features require an active subscription or trial period"
        )
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    user_id = current_user.get("user_id")
    
    # Get the template
    template = await db.ai_templates.find_one({
        "template_id": template_id,
        "$or": [
            {"user_id": user_id},
            {"is_public": True}
        ]
    })
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    new_topic = request.get("new_topic", "")
    new_grade = request.get("new_grade", template.get("grade_level", ""))
    new_subject = request.get("new_subject", template.get("subject", ""))
    language = request.get("language", "es")
    
    if not new_topic:
        raise HTTPException(status_code=400, detail="New topic is required")
    
    try:
        # Build the customization prompt
        template_structure = ""
        for day_idx, day_content in template.get("days", {}).items():
            template_structure += f"\n--- Day {int(day_idx) + 1} Structure ---\n{day_content[:500]}...\n"
        
        prompt = f"""Adapt this proven lesson plan template to a new topic while keeping the same successful structure and flow.

ORIGINAL TEMPLATE INFO:
- Name: {template.get('name', 'Untitled')}
- Original Topic: {template.get('original_topic', 'Not specified')}
- Structure Preview:
{template_structure}

NEW LESSON REQUIREMENTS:
- New Topic: {new_topic}
- Grade Level: {new_grade}
- Subject: {new_subject}

INSTRUCTIONS:
1. Keep the same day-by-day progression (intro → practice → mastery → assessment)
2. Adapt all activities to fit the new topic
3. Maintain similar activity types and durations
4. Update materials and examples for the new topic
5. Keep the successful pedagogical structure

FORMAT each day as:
## [DAY NAME] - [PHASE]
🎯 **Activities:**
1. [Activity Name] (X min): [Description adapted for new topic]
2. [Activity Name] (X min): [Description adapted for new topic]

📚 **Materials:** [Updated materials for new topic]

✅ **Success Criteria:** [Updated for new topic]

---

{'IMPORTANTE: Responde completamente en español.' if language == 'es' else 'Please respond in English.'}"""

        # Call AI
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"customize_{template_id}_{uuid.uuid4().hex[:8]}",
            system_message="You are an expert curriculum designer. Adapt lesson plan templates to new topics while preserving their successful structure."
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse response into days (similar to full week generation)
        day_patterns = [
            r'##\s*(LUNES|MONDAY|DAY 1|DÍA 1)[^\n]*\n([\s\S]*?)(?=##\s*(MARTES|TUESDAY|DAY 2|DÍA 2)|$)',
            r'##\s*(MARTES|TUESDAY|DAY 2|DÍA 2)[^\n]*\n([\s\S]*?)(?=##\s*(MIÉRCOLES|WEDNESDAY|DAY 3|DÍA 3)|$)',
            r'##\s*(MIÉRCOLES|WEDNESDAY|DAY 3|DÍA 3)[^\n]*\n([\s\S]*?)(?=##\s*(JUEVES|THURSDAY|DAY 4|DÍA 4)|$)',
            r'##\s*(JUEVES|THURSDAY|DAY 4|DÍA 4)[^\n]*\n([\s\S]*?)(?=##\s*(VIERNES|FRIDAY|DAY 5|DÍA 5)|$)',
            r'##\s*(VIERNES|FRIDAY|DAY 5|DÍA 5)[^\n]*\n([\s\S]*?)$'
        ]
        
        import re
        customized_days = {}
        
        for index, pattern in enumerate(day_patterns):
            match = re.search(pattern, response, re.IGNORECASE)
            if match:
                customized_days[str(index)] = {
                    "content": match.group(2).strip(),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
        
        # Fallback if parsing didn't work well
        if len(customized_days) < 3:
            sections = re.split(r'(?=##\s*(?:DAY|DÍA|LUNES|MARTES|MIÉRCOLES|JUEVES|VIERNES|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY))', response, flags=re.IGNORECASE)
            for index, section in enumerate(sections):
                if index < 5 and section.strip():
                    customized_days[str(index)] = {
                        "content": section.strip(),
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
        
        # Update template use count
        await db.ai_templates.update_one(
            {"template_id": template_id},
            {"$inc": {"use_count": 1}}
        )
        
        return {
            "template_id": template_id,
            "template_name": template.get("name"),
            "new_topic": new_topic,
            "customized_days": customized_days,
            "full_response": response
        }
        
    except Exception as e:
        logger.error(f"Template customization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Customization failed: {str(e)}")


# ==================== PRESENTATIONS ====================

@router.post("/presentation/generate")
async def generate_presentation_ai(request: AIGeneratePresentationRequest, current_user: dict = Depends(get_current_user)):
    """Generate a presentation using AI for kids/students"""
    
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
        language_instruction = "Responde completamente en español." if request.language == "es" else "Respond entirely in English."
        
        system_prompt = """You are an expert educational presentation designer who creates fun, engaging, and visually captivating presentations for students and kids.
Your presentations should:
- Be age-appropriate and engaging for the specified grade level
- Use simple, clear language that students can understand
- Include fun facts and interesting information
- Suggest relevant emojis for visual appeal
- Follow a logical learning progression

You must respond ONLY with valid JSON, no other text."""

        user_prompt = f"""{language_instruction}

Create a {request.num_slides}-slide educational presentation for:
- Topic: {request.topic}
- Subject: {request.subject}
- Grade Level: {request.grade_level}

The presentation should be fun, colorful, and captivating for students!

Return ONLY a valid JSON object in this exact format:
{{
  "title": "Main presentation title",
  "slides": [
    {{
      "template": "title",
      "title": "Engaging main title with emoji",
      "subtitle": "Subtitle or tagline",
      "content": "",
      "image": "🎯",
      "bullets": []
    }},
    {{
      "template": "content",
      "title": "Slide title",
      "subtitle": "",
      "content": "Brief intro text",
      "image": "📚",
      "bullets": ["Key point 1", "Key point 2", "Key point 3"]
    }},
    {{
      "template": "image-right",
      "title": "Visual concept title",
      "subtitle": "",
      "content": "Explanation text that goes with the image",
      "image": "🔬",
      "bullets": []
    }},
    {{
      "template": "two-column",
      "title": "Comparison or facts",
      "subtitle": "",
      "content": "",
      "image": "",
      "bullets": ["Fact 1", "Fact 2", "Fact 3", "Fact 4"]
    }},
    {{
      "template": "quote",
      "title": "Key Takeaway",
      "subtitle": "",
      "content": "An inspiring or memorable quote or fact",
      "image": "💡",
      "bullets": []
    }},
    {{
      "template": "content",
      "title": "Quiz Time! / Activities",
      "subtitle": "",
      "content": "Let's practice what we learned!",
      "image": "🎮",
      "bullets": ["Activity 1", "Activity 2", "Activity 3"]
    }}
  ]
}}

Template options: "title", "content", "image-left", "image-right", "full-image", "two-column", "quote"
Use appropriate emojis for the image field to make it visually engaging for kids.
Make sure each slide has educational value while being fun and engaging."""

        # Call AI
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"pres_{uuid.uuid4().hex[:8]}",
            system_message=system_prompt
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
        user_message = UserMessage(text=user_prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        
        # Clean response - remove markdown code blocks if present
        cleaned_response = response.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]
        cleaned_response = cleaned_response.strip()
        
        try:
            presentation_data = json.loads(cleaned_response)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            # Return a fallback structure
            presentation_data = {
                "title": request.topic,
                "slides": [
                    {
                        "template": "title",
                        "title": request.topic,
                        "subtitle": f"{request.subject} - {request.grade_level}",
                        "content": "",
                        "image": "📚",
                        "bullets": []
                    }
                ]
            }
        
        # Add imageType to each slide
        slides = []
        for slide in presentation_data.get("slides", []):
            slide["imageType"] = "emoji"
            slides.append(slide)
        
        return {
            "title": presentation_data.get("title", request.topic),
            "slides": slides,
            "theme": request.theme
        }
        
    except Exception as e:
        logger.error(f"Presentation generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Presentation generation failed: {str(e)}")


@router.post("/presentations")
async def save_presentation(request: PresentationCreate, current_user: dict = Depends(get_current_user)):
    """Save a presentation to the database"""
    user_id = current_user.get("user_id")
    school_id = current_user.get("school_id")
    
    presentation_id = f"pres_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    # Convert slides to dicts
    slides_data = [slide.model_dump() if hasattr(slide, 'model_dump') else dict(slide) for slide in request.slides]
    
    presentation_doc = {
        "presentation_id": presentation_id,
        "user_id": user_id,
        "school_id": school_id,
        "name": request.name,
        "topic": request.topic,
        "subject": request.subject,
        "grade_level": request.grade_level,
        "theme_id": request.theme_id,
        "slides": slides_data,
        "created_at": now,
        "updated_at": now
    }
    
    await db.presentations.insert_one(presentation_doc)
    
    return {
        "presentation_id": presentation_id,
        "name": request.name,
        "message": "Presentation saved successfully"
    }


@router.get("/presentations")
async def list_presentations(current_user: dict = Depends(get_current_user)):
    """List user's presentations"""
    user_id = current_user.get("user_id")
    
    presentations = await db.presentations.find(
        {"user_id": user_id}
    ).sort("updated_at", -1).to_list(length=100)
    
    return [{
        "presentation_id": p["presentation_id"],
        "name": p["name"],
        "topic": p.get("topic", ""),
        "subject": p.get("subject", ""),
        "grade_level": p.get("grade_level", ""),
        "theme_id": p.get("theme_id", "ocean"),
        "slides_count": len(p.get("slides", [])),
        "created_at": p["created_at"],
        "updated_at": p["updated_at"]
    } for p in presentations]


@router.get("/presentations/{presentation_id}")
async def get_presentation(presentation_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific presentation"""
    user_id = current_user.get("user_id")
    
    presentation = await db.presentations.find_one({
        "presentation_id": presentation_id,
        "user_id": user_id
    })
    
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
    
    return {
        "presentation_id": presentation["presentation_id"],
        "user_id": presentation["user_id"],
        "school_id": presentation.get("school_id"),
        "name": presentation["name"],
        "topic": presentation.get("topic", ""),
        "subject": presentation.get("subject", ""),
        "grade_level": presentation.get("grade_level", ""),
        "theme_id": presentation.get("theme_id", "ocean"),
        "slides": presentation.get("slides", []),
        "created_at": presentation["created_at"],
        "updated_at": presentation["updated_at"]
    }


@router.put("/presentations/{presentation_id}")
async def update_presentation(presentation_id: str, request: PresentationUpdate, current_user: dict = Depends(get_current_user)):
    """Update a presentation"""
    user_id = current_user.get("user_id")
    
    # Check ownership
    presentation = await db.presentations.find_one({
        "presentation_id": presentation_id,
        "user_id": user_id
    })
    
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if request.name is not None:
        update_data["name"] = request.name
    if request.topic is not None:
        update_data["topic"] = request.topic
    if request.subject is not None:
        update_data["subject"] = request.subject
    if request.grade_level is not None:
        update_data["grade_level"] = request.grade_level
    if request.theme_id is not None:
        update_data["theme_id"] = request.theme_id
    if request.slides is not None:
        update_data["slides"] = [slide.model_dump() if hasattr(slide, 'model_dump') else dict(slide) for slide in request.slides]
    
    await db.presentations.update_one(
        {"presentation_id": presentation_id},
        {"$set": update_data}
    )
    
    return {"message": "Presentation updated successfully"}


@router.delete("/presentations/{presentation_id}")
async def delete_presentation(presentation_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a presentation"""
    user_id = current_user.get("user_id")
    
    result = await db.presentations.delete_one({
        "presentation_id": presentation_id,
        "user_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Presentation not found")
    
    return {"message": "Presentation deleted successfully"}


# ==================== IMAGE SEARCH & UPLOAD ====================

# Curated educational images from Unsplash (direct URLs that work reliably)
CURATED_IMAGES = {
    "planet": [
        {"id": "planet_1", "url": "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=300&fit=crop", "alt": "Planet Earth from space"},
        {"id": "planet_2", "url": "https://images.unsplash.com/photo-1630839437035-dac17da580d0?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1630839437035-dac17da580d0?w=400&h=300&fit=crop", "alt": "Saturn with rings"},
        {"id": "planet_3", "url": "https://images.unsplash.com/photo-1545156521-77bd85671d30?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1545156521-77bd85671d30?w=400&h=300&fit=crop", "alt": "Mars surface"},
        {"id": "planet_4", "url": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=300&fit=crop", "alt": "Earth from ISS"},
        {"id": "planet_5", "url": "https://images.unsplash.com/photo-1657063756791-4376708a4554?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1657063756791-4376708a4554?w=400&h=300&fit=crop", "alt": "Saturn crescent"},
        {"id": "planet_6", "url": "https://images.unsplash.com/photo-1639921884918-8d28ab2e39a4?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1639921884918-8d28ab2e39a4?w=400&h=300&fit=crop", "alt": "Jupiter closeup"},
        {"id": "planet_7", "url": "https://images.unsplash.com/photo-1630358276435-1a11cae9c5d1?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1630358276435-1a11cae9c5d1?w=400&h=300&fit=crop", "alt": "Jupiter and Saturn conjunction"},
        {"id": "planet_8", "url": "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=400&h=300&fit=crop", "alt": "Solar system illustration"},
    ],
    "dinosaur": [
        {"id": "dino_1", "url": "https://images.unsplash.com/photo-1525877442103-5ddb2089b2bb?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1525877442103-5ddb2089b2bb?w=400&h=300&fit=crop", "alt": "T-Rex skeleton"},
        {"id": "dino_2", "url": "https://images.unsplash.com/photo-1519575706483-221027bfbb31?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1519575706483-221027bfbb31?w=400&h=300&fit=crop", "alt": "Dinosaur fossil"},
        {"id": "dino_3", "url": "https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=400&h=300&fit=crop", "alt": "Dinosaur museum"},
        {"id": "dino_4", "url": "https://images.unsplash.com/photo-1615243029542-4fcced64c70e?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1615243029542-4fcced64c70e?w=400&h=300&fit=crop", "alt": "Dinosaur figure"},
        {"id": "dino_5", "url": "https://images.unsplash.com/photo-1569180880150-df4eed93c90b?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1569180880150-df4eed93c90b?w=400&h=300&fit=crop", "alt": "Dinosaur bones"},
        {"id": "dino_6", "url": "https://images.unsplash.com/photo-1601459427108-47e20d579a35?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1601459427108-47e20d579a35?w=400&h=300&fit=crop", "alt": "Raptor model"},
    ],
    "ocean": [
        {"id": "ocean_1", "url": "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop", "alt": "Ocean waves"},
        {"id": "ocean_2", "url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop", "alt": "Tropical beach"},
        {"id": "ocean_3", "url": "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=300&fit=crop", "alt": "Underwater coral"},
        {"id": "ocean_4", "url": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop", "alt": "Sea turtle"},
        {"id": "ocean_5", "url": "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=400&h=300&fit=crop", "alt": "Jellyfish"},
        {"id": "ocean_6", "url": "https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1559825481-12a05cc00344?w=400&h=300&fit=crop", "alt": "Clownfish"},
    ],
    "animal": [
        {"id": "animal_1", "url": "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=400&h=300&fit=crop", "alt": "Lion"},
        {"id": "animal_2", "url": "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400&h=300&fit=crop", "alt": "Giraffe"},
        {"id": "animal_3", "url": "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400&h=300&fit=crop", "alt": "Elephant"},
        {"id": "animal_4", "url": "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop", "alt": "Hamster"},
        {"id": "animal_5", "url": "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=400&h=300&fit=crop", "alt": "Sea turtle"},
        {"id": "animal_6", "url": "https://images.unsplash.com/photo-1484406566174-9da000fda645?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1484406566174-9da000fda645?w=400&h=300&fit=crop", "alt": "Panda"},
    ],
    "science": [
        {"id": "sci_1", "url": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop", "alt": "Lab equipment"},
        {"id": "sci_2", "url": "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&h=300&fit=crop", "alt": "DNA model"},
        {"id": "sci_3", "url": "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=300&fit=crop", "alt": "Microscope"},
        {"id": "sci_4", "url": "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=400&h=300&fit=crop", "alt": "Chemistry flasks"},
        {"id": "sci_5", "url": "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=400&h=300&fit=crop", "alt": "Atom model"},
        {"id": "sci_6", "url": "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=300&fit=crop", "alt": "Laboratory"},
    ],
    "math": [
        {"id": "math_1", "url": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop", "alt": "Math equations"},
        {"id": "math_2", "url": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=300&fit=crop", "alt": "Geometry shapes"},
        {"id": "math_3", "url": "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=400&h=300&fit=crop", "alt": "Calculator"},
        {"id": "math_4", "url": "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=400&h=300&fit=crop", "alt": "Pi symbol"},
        {"id": "math_5", "url": "https://images.unsplash.com/photo-1453733190371-0a9bedd82893?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1453733190371-0a9bedd82893?w=400&h=300&fit=crop", "alt": "Numbers"},
        {"id": "math_6", "url": "https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=400&h=300&fit=crop", "alt": "Chalkboard math"},
    ],
    "nature": [
        {"id": "nat_1", "url": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop", "alt": "Forest sunlight"},
        {"id": "nat_2", "url": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop", "alt": "Mountain valley"},
        {"id": "nat_3", "url": "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=300&fit=crop", "alt": "Waterfall"},
        {"id": "nat_4", "url": "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop", "alt": "Green hills"},
        {"id": "nat_5", "url": "https://images.unsplash.com/photo-1518173946687-a4c036bc0f83?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1518173946687-a4c036bc0f83?w=400&h=300&fit=crop", "alt": "Autumn forest"},
        {"id": "nat_6", "url": "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=400&h=300&fit=crop", "alt": "Lake reflection"},
    ],
    "volcano": [
        {"id": "vol_1", "url": "https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=400&h=300&fit=crop", "alt": "Volcano eruption"},
        {"id": "vol_2", "url": "https://images.unsplash.com/photo-1584553421349-3557471bed79?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1584553421349-3557471bed79?w=400&h=300&fit=crop", "alt": "Lava flow"},
        {"id": "vol_3", "url": "https://images.unsplash.com/photo-1576842546480-91a825555dea?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1576842546480-91a825555dea?w=400&h=300&fit=crop", "alt": "Volcanic landscape"},
        {"id": "vol_4", "url": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop", "alt": "Mountain volcano"},
        {"id": "vol_5", "url": "https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?w=400&h=300&fit=crop", "alt": "Volcanic crater"},
    ],
    "space": [
        {"id": "space_1", "url": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=300&fit=crop", "alt": "Earth from space"},
        {"id": "space_2", "url": "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=400&h=300&fit=crop", "alt": "Astronaut"},
        {"id": "space_3", "url": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=300&fit=crop", "alt": "Nebula"},
        {"id": "space_4", "url": "https://images.unsplash.com/photo-1520034475321-cbe63696469a?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1520034475321-cbe63696469a?w=400&h=300&fit=crop", "alt": "Galaxy"},
        {"id": "space_5", "url": "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=400&h=300&fit=crop", "alt": "Stars"},
        {"id": "space_6", "url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop", "alt": "Earth night lights"},
    ],
    "book": [
        {"id": "book_1", "url": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop", "alt": "Open books"},
        {"id": "book_2", "url": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop", "alt": "Library shelves"},
        {"id": "book_3", "url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop", "alt": "Stacked books"},
        {"id": "book_4", "url": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&h=300&fit=crop", "alt": "Old books"},
        {"id": "book_5", "url": "https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=400&h=300&fit=crop", "alt": "Reading book"},
    ],
    "music": [
        {"id": "music_1", "url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop", "alt": "Piano keys"},
        {"id": "music_2", "url": "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=300&fit=crop", "alt": "Musical notes"},
        {"id": "music_3", "url": "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=300&fit=crop", "alt": "Guitar"},
        {"id": "music_4", "url": "https://images.unsplash.com/photo-1458560871784-56d23406c091?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1458560871784-56d23406c091?w=400&h=300&fit=crop", "alt": "Headphones"},
        {"id": "music_5", "url": "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop", "alt": "Concert"},
    ],
    "sport": [
        {"id": "sport_1", "url": "https://images.unsplash.com/photo-1461896836934- voices-of-strength?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1461896836934-eff56896c-01?w=400&h=300&fit=crop", "alt": "Basketball"},
        {"id": "sport_2", "url": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=300&fit=crop", "alt": "Soccer ball"},
        {"id": "sport_3", "url": "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=300&fit=crop", "alt": "Swimming"},
        {"id": "sport_4", "url": "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=300&fit=crop", "alt": "Gym workout"},
        {"id": "sport_5", "url": "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop", "alt": "Running"},
    ],
    "art": [
        {"id": "art_1", "url": "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=300&fit=crop", "alt": "Paint palette"},
        {"id": "art_2", "url": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop", "alt": "Colorful paint"},
        {"id": "art_3", "url": "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop", "alt": "Art supplies"},
        {"id": "art_4", "url": "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=400&h=300&fit=crop", "alt": "Museum gallery"},
        {"id": "art_5", "url": "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=400&h=300&fit=crop", "alt": "Abstract art"},
    ],
    "technology": [
        {"id": "tech_1", "url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop", "alt": "Circuit board"},
        {"id": "tech_2", "url": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop", "alt": "Laptop"},
        {"id": "tech_3", "url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop", "alt": "Cybersecurity"},
        {"id": "tech_4", "url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop", "alt": "Robot"},
        {"id": "tech_5", "url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop", "alt": "Code"},
    ],
    "classroom": [
        {"id": "class_1", "url": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop", "alt": "Classroom desks"},
        {"id": "class_2", "url": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop", "alt": "Students studying"},
        {"id": "class_3", "url": "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&h=300&fit=crop", "alt": "Chalkboard"},
        {"id": "class_4", "url": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=300&fit=crop", "alt": "School supplies"},
        {"id": "class_5", "url": "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop", "thumb": "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=300&fit=crop", "alt": "Teacher helping"},
    ],
}

@router.get("/images/search")
async def search_images(query: str, count: int = 12, current_user: dict = Depends(get_current_user)):
    """Search for stock images using curated Unsplash images or Pexels API"""
    import httpx
    import os
    
    clean_query = query.strip().lower()
    images = []
    
    # First try Pexels API if key is available
    PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY", "")
    if PEXELS_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://api.pexels.com/v1/search",
                    params={"query": clean_query, "per_page": count, "orientation": "landscape"},
                    headers={"Authorization": PEXELS_API_KEY}
                )
                if response.status_code == 200:
                    data = response.json()
                    for photo in data.get("photos", []):
                        images.append({
                            "id": f"pexels_{photo['id']}",
                            "url": photo["src"]["large"],
                            "thumb": photo["src"]["medium"],
                            "alt": photo.get("alt", clean_query)
                        })
                    if images:
                        return {"images": images[:count], "query": clean_query, "source": "pexels"}
        except Exception as e:
            logger.warning(f"Pexels API error: {e}")
    
    # Use curated images based on keyword matching
    matched_images = []
    for keyword, keyword_images in CURATED_IMAGES.items():
        if keyword in clean_query or clean_query in keyword:
            matched_images.extend(keyword_images)
    
    # If no exact match, try partial matching
    if not matched_images:
        query_words = clean_query.split()
        for keyword, keyword_images in CURATED_IMAGES.items():
            for word in query_words:
                if word in keyword or keyword in word:
                    matched_images.extend(keyword_images)
                    break
    
    # If still no matches, return a mix of general educational images
    if not matched_images:
        for category in ["nature", "science", "classroom", "book"]:
            matched_images.extend(CURATED_IMAGES.get(category, [])[:3])
    
    # Remove duplicates while preserving order
    seen_ids = set()
    unique_images = []
    for img in matched_images:
        if img["id"] not in seen_ids:
            seen_ids.add(img["id"])
            unique_images.append(img)
    
    return {"images": unique_images[:count], "query": clean_query, "source": "curated"}


@router.post("/images/upload")
async def upload_image(current_user: dict = Depends(get_current_user)):
    """Upload endpoint placeholder - images are handled as base64 on frontend"""
    return {"message": "Use base64 encoding for image uploads", "status": "info"}
