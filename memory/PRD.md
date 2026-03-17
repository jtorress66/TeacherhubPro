# TeacherHub - Product Requirements Document

---
## Update 2026-03-17 - GRADES FLOW TO REPORT CARDS & GRADE REPORT ✅

### Bug: AI-graded submissions not appearing in Grade Report or Report Cards
- **Root cause:** Both endpoints only searched `ai_submissions` for `ai_assignment_ids`. Submissions on manual assignments (in `assignments` collection) were missed.
- **Fix:** Updated both `GET /api/gradebook/report/{class_id}` and `GET /api/report-cards/generate` to search `ai_submissions` for ALL assignment IDs. Updated grade calculation to check both `grades_map` and `ai_grades_map`.
- **Files:** `/app/backend/server.py` lines 2220-2302, 3976-4004

## Update 2026-03-17 - AI GRADING FIX FOR MANUAL ASSIGNMENTS ✅
- Extended grading endpoints to check both `ai_assignments` and `assignments` collections

## Update 2026-03-17 - AI PLAN GENERATION FIX ✅
- Fixed `check_ai_access()` to accept `"trialing"` subscription status

## Update 2026-03-17 - SCHOOL LOGO ON PDF & STUDENT PAGE ✅
- School logo + name on student page and PDF header

## Update 2026-03-17 - STUDENT LINK & MATCHING FIX ✅
- Manual assignments get shareable student links; matching preview fixed

## Update 2026-03-17 - PDF PREVIEW & PRINT ✅
- jsPDF Student + Answer Key PDFs

## Update 2026-03-17 - QUESTION BUILDER & FILE UPLOAD ✅
- Build Questions + Upload File tabs in Create Assignment

---
## Core Requirements
1. Marketing Website: Conversion-focused, mobile-responsive, 7 languages
2. Super Admin Tools: Bulk CSV import, cross-school management
3. Report Cards: School-specific logo/name
4. Assignments & Gradebook: Question builder, file upload, PDF print, student links, AI generation, AI grading with grade flow to reports

## Blocked Issues (Platform-level)
- Production Login/Deployment — escalated to Emergent Support

## Upcoming Tasks (P1)
- Email capture lead magnet
- Referral incentive display
- Finish bulk data import tools
- Email Parent Portal links

## Future Tasks (P2)
- Refactor LanguageContext.js, server.py, GamesCreator.js
- Google Classroom full data sync

## Test Credentials
- Email: test@school.edu / Password: testpassword
