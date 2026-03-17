# TeacherHub - Product Requirements Document

---
## Update 2026-03-17 - AI GRADING FIX FOR MANUAL ASSIGNMENTS ✅ COMPLETE

### Bug: "Grading failed" and View/Grade buttons not working for manual assignment submissions
- **Root cause:** Multiple endpoints in `/app/backend/routes/ai_grading.py` only looked up assignments in `ai_assignments` collection, but manual assignments are stored in the `assignments` collection. This caused "Assignment not found" errors for View and Grade operations.
- **Fix:** Updated `get_submission`, `ai_grade_submission`, and `approve_grade` endpoints to check both `ai_assignments` AND `assignments` collections. Also fixed the grading prompt to handle manual assignment question format (no `question_id`, `true_false` uses options with `is_correct` instead of `correct_answer`).
- **Testing:** Verified via curl — View returns assignment data, Grade successfully runs AI grading and returns scores/feedback.

---
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

## Earlier: Super Admin bugs, hero images, scroll fix, marketing refactor, sitemap

---
## Core Requirements
1. Marketing Website: Conversion-focused, mobile-responsive, 7 languages
2. Super Admin Tools: Bulk CSV import, cross-school management
3. Report Cards: School-specific logo/name
4. Assignments & Gradebook: Question builder, file upload, PDF print, student links, AI generation, AI grading

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
