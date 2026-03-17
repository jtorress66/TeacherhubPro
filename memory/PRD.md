# TeacherHub - Product Requirements Document

---
## Update 2026-03-17 - GRADE PERCENTAGE CALCULATION FIX ✅

### Bug: Tests worth 50 points showing as 50% F instead of 100% A
- **Root cause:** Report Cards and Gradebook Report used `assignment.points` (default 100) for max points, ignoring actual question points sum.
- **Fix:** Calculate max_points from `sum(q.points for q in questions)` when questions exist, fall back to `assignment.points` otherwise.
- **Files:** `/app/backend/server.py` — Report Cards (line 4053) and Gradebook Report (lines 2300-2316)

## Update 2026-03-17 - GRADE REPORT DISPLAY FIX ✅
- Frontend uses total_assignments_completed; backend handles None in names + partial matching

## Update 2026-03-17 - GRADES FLOW TO REPORTS ✅
- Both reports search ai_submissions for ALL assignment IDs

## Update 2026-03-17 - AI GRADING + PLAN + SCHOOL LOGO + STUDENT LINK + PDF + QUESTION BUILDER ✅
- All features implemented and tested

---
## Blocked: Production Login/Deployment — escalated to Emergent Support
## Upcoming (P1): Email lead magnet, referral display, bulk import, parent portal links
## Future (P2): Refactor LanguageContext.js/server.py/GamesCreator.js, Google Classroom sync
## Credentials: test@school.edu / testpassword
