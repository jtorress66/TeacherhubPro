# TeacherHubPro - Product Requirements Document

## Core Product
AI-powered workspace for teachers: lesson planning, gradebook, attendance, classroom materials, and more.

## Credentials
- test@school.edu / testpassword

## Architecture
- Frontend: React (CRA) + Shadcn/UI + Tailwind
- Backend: FastAPI + MongoDB
- Auth: Cookie-based (Emergent Google Auth + local)
- LLM: Anthropic Claude Sonnet 4.6 via Emergent LLM Key
- Payments: Stripe
- Email: Resend (test mode)
- TTS: OpenAI
- PDF: jsPDF (client-side), pdfplumber (server-side extraction)

## Key Files
- `/app/frontend/src/pages/Gradebook.js` - Assignment builder, PDF-to-test conversion, grading UI
- `/app/frontend/src/pages/StudentAssignment.js` - Student test-taking page (interactive questions)
- `/app/backend/server.py` - Main backend (assignments, grades, reports)
- `/app/backend/routes/ai_grading.py` - AI grading, PDF parsing, student submission endpoints
- `/app/frontend/src/utils/generateTestPDF.js` - PDF generation for printable tests

---

## Update 2026-03-17 - GOOGLE CLASSROOM SHARE BUTTON IN VIEW ASSIGNMENTS
- Added Google Classroom share button to both AI and Manual assignment rows in the "View Assignments" dialog
- Uses existing `shareToGoogleClassroom()` function that opens Google Classroom's share dialog
- Button styled with amber color, matching the Educational Games page
- Only shows when assignment has a `public_token`

## Update 2026-03-17 - BUG FIX: AI GRADING "NO ANSWER" DISPLAY
- Root cause: Manual assignments created via Gradebook didn't have `question_id` fields
- Student page generated fallback IDs (q1, q2...) for answer keys, but teacher view tried to look up by undefined question_id
- Fixed in 3 places: backend `get_submission` adds fallback IDs, frontend uses same fallback logic, Gradebook `addQuestion()` now always generates question_id
- Tested and passing (100% backend 6/6, frontend verified)

## Update 2026-03-17 - PDF TO INTERACTIVE ONLINE TEST
- **New endpoint**: `POST /api/ai-grading/parse-pdf` - extracts text from PDF using pdfplumber, sends to Claude AI to parse into structured questions (MC, TF, short answer, matching, essay)
- **Teacher workflow**: Upload PDF → click "Convert to Online Test" → AI extracts questions → teacher reviews/edits → save assignment → share student link
- **Student experience**: Students see interactive form fields (radio buttons, text inputs, dropdowns, textareas) instead of a static PDF
- **Frontend (Gradebook.js)**: Added "Convert to Online Test" button with Wand2 icon next to uploaded PDFs
- **Frontend (StudentAssignment.js)**: Removed PDF iframe display; shows interactive questions only; non-PDF files still shown as downloads
- All tested and passing (100% backend 8/8, 100% frontend)

## Update 2026-03-17 - PER-QUESTION INSTRUCTIONS & MATCHING QUESTIONS
- Per-question instructions: Blue info box displayed below each question on student page
- Matching question support: Left items with dropdown selectors
- Fixed matching answer validation (object-type answers)

## Update 2026-03-17 - GRADE PERCENTAGE CALCULATION FIX
- Report Cards and Gradebook Report calculate max_points from sum(q.points)

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
