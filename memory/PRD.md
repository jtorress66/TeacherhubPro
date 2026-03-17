# TeacherHub - Product Requirements Document

---
## Update 2026-03-17 - GRADE REPORT DISPLAY FIX ✅

### Bug: Grades showing in Report Cards but not Grade Report
- **Root cause 1 (Frontend):** `GradebookReports.js` used `assignments_completed` (regular only) instead of `total_assignments_completed`. Total denominator excluded AI assignments.
- **Root cause 2 (Backend):** Name matching in Grade Report had None value bug. Also added partial name matching fallback for better student-submission matching.
- **Files:** `/app/frontend/src/pages/GradebookReports.js` line 396, `/app/backend/server.py` lines 2238-2260

## Update 2026-03-17 - GRADES FLOW TO REPORTS ✅
- Both Grade Report and Report Cards now search ai_submissions for ALL assignment IDs (regular + AI)

## Update 2026-03-17 - AI GRADING FIX ✅
- Grading endpoints check both ai_assignments and assignments collections

## Update 2026-03-17 - AI PLAN FIX ✅
- check_ai_access accepts "trialing" subscription status

## Update 2026-03-17 - SCHOOL LOGO, STUDENT LINK, PDF, QUESTION BUILDER ✅
- School logo on PDF + student page
- Manual assignments get shareable student links
- jsPDF Student + Answer Key PDFs
- Build Questions + Upload File tabs

---
## Blocked: Production Login/Deployment — escalated to Emergent Support

## Upcoming (P1): Email lead magnet, referral display, bulk import, parent portal links
## Future (P2): Refactor LanguageContext.js/server.py/GamesCreator.js, Google Classroom sync

## Credentials: test@school.edu / testpassword
