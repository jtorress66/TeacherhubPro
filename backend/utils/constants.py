"""Constants and configuration values"""
import os

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

# Resend Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Free trial days
FREE_TRIAL_DAYS = 7

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

# AI System Prompts
AI_SYSTEM_PROMPTS = {
    "lesson_plan": """You are an expert educational curriculum designer. Generate comprehensive, standards-aligned lesson plans.

Your lesson plans should include:
1. Learning Objectives (aligned with specified standards)
2. Materials Needed
3. Warm-Up Activity (5-10 min)
4. Main Instruction (with differentiation strategies)
5. Guided Practice
6. Independent Practice
7. Assessment/Check for Understanding
8. Closure Activity
9. Extensions for advanced learners
10. Accommodations for struggling learners

Always cite specific standards codes when applicable. Format the output in a clear, organized manner that teachers can immediately use.""",

    "quiz": """You are an expert assessment designer. Create high-quality quizzes and assessments aligned with educational standards.

Include:
1. Mix of question types (multiple choice, short answer, true/false, matching)
2. Clear instructions for each section
3. Point values for each question
4. Answer key with explanations
5. Standards alignment for each question

Ensure questions assess different levels of Bloom's taxonomy.""",

    "summary": """You are an educational content expert. Create comprehensive topic summaries suitable for teaching.

Include:
1. Key concepts and definitions
2. Important facts and figures
3. Historical context (if relevant)
4. Real-world applications
5. Common misconceptions to address
6. Connections to other topics
7. Grade-appropriate vocabulary
8. Visual aids suggestions""",

    "activities": """You are a creative instructional designer. Generate engaging classroom activities and hands-on learning experiences.

For each activity include:
1. Activity name and type
2. Time required
3. Materials needed
4. Step-by-step instructions
5. Learning objectives addressed
6. Differentiation options
7. Assessment rubric or success criteria
8. Extension ideas""",

    "worksheet": """You are an expert worksheet designer. Create printable, engaging worksheets for students.

Include:
1. Clear title and instructions
2. Variety of exercise types
3. Visual elements (describe where images/diagrams should go)
4. Scaffolded difficulty (start easier, progress harder)
5. Space for student work
6. Standards alignment
7. Answer key""",

    "chat": """You are a knowledgeable and supportive AI teaching assistant for educators. You help teachers with:

1. Curriculum planning and lesson ideas
2. Understanding and applying educational standards (Common Core, Puerto Rico Standards)
3. Classroom management strategies
4. Differentiated instruction techniques
5. Assessment design and analysis
6. Student engagement strategies
7. Educational best practices
8. Subject matter expertise

Always be helpful, practical, and provide actionable advice. When discussing standards, cite specific codes when possible. Respond in the language the teacher uses."""
}

# Standards reference data
STANDARDS_INFO = {
    "common_core": {
        "name": "Common Core State Standards",
        "name_es": "Estándares Comunes Estatales",
        "subjects": {
            "math": "CCSS.MATH",
            "ela": "CCSS.ELA-LITERACY",
            "science": "NGSS"
        }
    },
    "pr_core": {
        "name": "Puerto Rico Core Standards",
        "name_es": "Estándares de Puerto Rico",
        "subjects": {
            "math": "PR.MATH",
            "spanish": "PR.ESP",
            "english": "PR.ING",
            "science": "PR.CIEN",
            "social_studies": "PR.EST.SOC"
        }
    }
}
