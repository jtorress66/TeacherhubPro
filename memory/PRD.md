# TeacherHub - Product Requirements Document

---
## Update 2026-03-17 - AI PLAN GENERATION FIX ✅ COMPLETE

### Bug: "Error generating plan" when using AI features
- **Root cause:** `check_ai_access()` in `/app/backend/routes/ai.py` only matched subscriptions with `status: "active"`, but users on trial have `status: "trialing"`.
- **Fix:** Updated subscription query to accept both: `{"status": {"$in": ["active", "trialing"]}}` (both user and school-level checks).
- **Testing:** Verified via curl — AI generates lesson plans successfully.

---
## Update 2026-03-17 - SCHOOL LOGO ON PDF & STUDENT PAGE ✅
- Student page shows school logo + name; PDF header includes school logo + name
- Report: `/app/test_reports/iteration_79.json`

## Update 2026-03-17 - STUDENT LINK & MATCHING FIX ✅
- Manual assignments get shareable student links; matching preview fixed
- Report: `/app/test_reports/iteration_78.json`

## Update 2026-03-17 - PDF PREVIEW & PRINT ✅
- jsPDF Student + Answer Key PDFs with print buttons
- Report: `/app/test_reports/iteration_77.json`

## Update 2026-03-17 - QUESTION BUILDER & FILE UPLOAD ✅
- Build Questions + Upload File tabs in Create Assignment
- Report: `/app/test_reports/iteration_76.json`

## Earlier Updates (Completed)
- Super Admin bugs, hero images, scroll fix, marketing refactor, sitemap

---

## Core Requirements
1. Marketing Website: Conversion-focused, mobile-responsive, 7 languages
2. Super Admin Tools: Bulk CSV import, cross-school management
3. Report Cards: School-specific logo/name with defaults
4. Assignments & Gradebook: Question builder, file upload, PDF print with school logo, student links, AI generation

## Blocked Issues (Platform-level)
- Production Login Failure (MongoDB permissions) — escalated to Emergent Support
- Production Deployment Failure — escalated to Emergent Support

## Upcoming Tasks (P1)
- Email capture lead magnet
- Referral incentive display
- Finish bulk data import tools
- Email Parent Portal links

## Future Tasks (P2)
- Refactor LanguageContext.js into separate JSON files per language
- Refactor monolithic server.py
- Refactor GamesCreator.js component
- Google Classroom full data sync

## 3rd Party Integrations
- Emergent-managed Google Auth, Stripe, Resend (test mode)
- Anthropic Claude Sonnet 4.6, OpenAI TTS, Google Classroom
- Gemini Nano Banana (image generation)

## Test Credentials
- Email: test@school.edu / Password: testpassword
