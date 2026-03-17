# TeacherHubPro - Product Requirements Document

## Core Product
AI-powered workspace for teachers: lesson planning, gradebook, attendance, classroom materials, and more.

## Credentials
- test@school.edu / testpassword

## Architecture
- Frontend: React (CRA) + Shadcn/UI + Tailwind
- Backend: FastAPI + MongoDB
- Auth: Cookie-based (Emergent Google Auth + local)
- LLM: Anthropic Claude Sonnet via Emergent LLM Key
- Payments: Stripe
- Email: Resend (test mode)
- TTS: OpenAI
- PDF: jsPDF (client-side)

## Key Files
- `/app/frontend/src/pages/Gradebook.js` - Assignment builder, grading UI
- `/app/frontend/src/pages/StudentAssignment.js` - Student test-taking page
- `/app/backend/server.py` - Main backend (assignments, grades, reports)
- `/app/backend/routes/ai_grading.py` - AI grading, student submission endpoints
- `/app/frontend/src/utils/generateTestPDF.js` - PDF generation for tests

---

## Update 2026-03-17 - PDF VIEWER, MATCHING Q, PER-QUESTION INSTRUCTIONS
- Inline PDF viewer: Students see embedded PDF in iframe for PDF-based assignments
- PDF answer area: Numbered answer input fields with Add/Remove for PDF-only tests
- Per-question instructions: Blue info box with instructions displayed below each question
- Matching question support: Left items with dropdown selectors for right items
- Fixed matching answer validation: Object-type answers handled correctly in submit
- Submit button now shows for PDF-only assignments (no questions but has attachments)
- All tested and passing (100% - 7/7 features)

## Update 2026-03-17 - GRADE PERCENTAGE CALCULATION FIX
- Report Cards and Gradebook Report calculate max_points from sum(q.points) when questions exist

## Update 2026-03-17 - GRADES FLOW TO REPORTS
- Both reports search ai_submissions for ALL assignment IDs

## Update 2026-03-17 - AI GRADING + PLAN + SCHOOL LOGO + STUDENT LINK + PDF + QUESTION BUILDER
- All features implemented and tested

---

## Blocked: Production Login/Deployment - escalated to Emergent Support

## Upcoming (P1)
- Email capture lead magnet
- Referral incentive display
- Bulk data import tools
- Emailing Parent Portal links

## Future (P2)
- Refactor LanguageContext.js into separate JSON files per language
- Refactor monolithic server.py
- Refactor large GamesCreator.js component
- Full Google Classroom data sync
