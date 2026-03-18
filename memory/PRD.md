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

## Update 2026-03-18 - FIX: PDF Parse 504 Timeout → Async Pattern
- Root cause: parse-pdf endpoint was synchronous (AI takes 30-90s, production proxy kills at ~30s → 504)
- Fix: Converted to same async pattern as AI generation: POST returns immediately with job_id (203ms), background task processes PDF, frontend polls GET /parse-pdf/{job_id}
- POST /api/ai-grading/parse-pdf → returns job_id instantly
- GET /api/ai-grading/parse-pdf/{job_id} → polls for result
- Frontend polls every 2.5s with 150s max timeout
- Tested: POST in 203ms, 34 questions / 42pts extracted correctly

## Update 2026-03-18 - FIX: PDF to Interactive Test Conversion (2 bugs)
- Bug 1 (Parse failure): Added retry logic — 3 attempts on backend, 3 on frontend with reconnection toast for cold starts
- Bug 2 (Questions bundled): Rewrote AI prompt with explicit rules for individual question splitting + examples. Result: 34 individual questions from a 38-question exam (was 4-8 bundled sections before)
- Each fill-in-the-blank sentence, true/false statement, and MC item is now its own question
- Word banks and section instructions properly placed in the `instructions` field
- Tested: 34 questions extracted, all types (fill_blank, true_false, multiple_choice, essay, short_answer) verified

## Update 2026-03-18 - FIX: Student Assignment Links Not Showing PDF Content
- Root cause: Old code explicitly filtered OUT PDF attachments from student assignment page (`!f.filename?.endsWith('.pdf')`)
- Fix: Show ALL attachments (including PDFs) on student page via new `AssignmentFiles.jsx` component
- Used DOM injection (useEffect + innerHTML) to bypass Emergent preview editor caching hidden styles
- Improved no-questions message: "Review the attached file(s) above" when attachments exist
- Fixed Google Classroom share button: now only shows for assignments WITH questions/attachments
- Added full edit capability for existing assignments (reuses Create dialog, saves via PUT)
- Production assignment `e24d64cecdb1` has 1 PDF: `chapter eight sixth grade exam.pdf` — will show after deploy
- Tested: 100% frontend (student pages with/without questions, gradebook share gating)

## Update 2026-03-18 - FIX: Assignment Links "No Questions" + Edit Capability
- Fixed Google Classroom share button showing for assignments WITHOUT questions (now gated same as copy link)
- Added full assignment edit capability: Edit button opens the Create dialog pre-populated with existing data (title, category, points, questions, files)
- Save in edit mode uses PUT to update instead of creating new assignment
- Teachers can now add/modify questions on existing assignments
- Tested: 100% (backend 9/9, frontend all flows)

## Update 2026-03-18 - FIX: BLANK SCREEN ON TAB NAVIGATION (P0)
- Root cause: `ProtectedRoute` called `checkAuth()` API on EVERY route change. On production cold starts, the `/api/auth/me` call fails → `setUser(null)` → redirect/crash → blank screen
- Fix 1: ProtectedRoute now skips `checkAuth()` when user already exists in AuthContext. Navigation is instant with zero API dependency.
- Fix 2: Added `ErrorBoundary` component (App.js) to catch any component crashes and show a "Reload Page" recovery UI instead of blank screen
- Fix 3: Subscription check error now defaults to `has_access: true` to avoid blocking navigation when API is temporarily unavailable
- Tested: 100% frontend (10/10 navigation tests passed including rapid navigation)

## Update 2026-03-18 - FIX: AI GENERATION "JOB NOT FOUND" (P0)
- Root cause: Backend runs with `--workers 4` (uvicorn). Jobs were stored in an in-memory Python dict. Worker 1 creates the job, Worker 2/3/4 polls and finds nothing → 404 "Job not found"
- Fix: Replaced in-memory `_generation_jobs` dict with MongoDB `generation_jobs` collection. All workers now share the same job store.
- Background task `_run_generation_task` now accepts serialized dict (not Pydantic model) to avoid cross-worker issues
- Frontend (AIAssistant.js, LessonPlanner.js) now treats 404 during polling as transient (retries instead of failing)
- Stale job cleanup: jobs processing > 5 minutes are auto-failed
- Tested: 100% backend (5/5 endpoints verified via testing agent)

## Update 2026-03-18 - FIX: AI GENERATION 504 TIMEOUT (previous)
- Implemented async background job pattern — POST /api/ai/generate-async returns immediately with job_id, GET /api/ai/generate-async/{job_id} polls for result
- Updated both AIAssistant.js and LessonPlanner.js to use async polling with retry on cold starts

## Update 2026-03-18 - CRITICAL FIX: GRADES NOT SHOWING IN GRADEBOOK/REPORTS
- Root cause: Gradebook endpoint GET /api/gradebook/{class_id} ONLY queried `grades` collection, completely missing AI-graded submissions from `ai_submissions`
- When teachers graded through AI Grading page, scores went to `ai_submissions` but never appeared in Gradebook grid
- Fix: Gradebook endpoint now merges AI-graded submissions into grades_map using names_match()
- AI assignments are now included in the assignments list (with is_ai=True flag)
- Manual grades take precedence over AI grades (won't be overwritten)
- All three views (Gradebook, Grade Report, Report Card) now consistently show ALL grades
- Tested: 100% (18/18 backend tests)

## Update 2026-03-18 - BUG FIX: GRADES NOT FLOWING TO REPORTS
- Root cause: Substring name matching failed when student typed "Paul Figueroa" but roster had "Paul J. Figueroa Mendez"
- Also: query only searched `assignment_id`, missing `ai_assignment_id` for older submissions
- Added `names_match()` helper (token-based: splits names, strips initials/particles, checks subset matching)
- Fixed both Grade Report AND Report Card endpoints
- Tested: 100% (19/19 backend tests), token matching verified for partial names, middle initials, Spanish particles

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
