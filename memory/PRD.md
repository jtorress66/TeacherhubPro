# TeacherHub - Product Requirements Document

---
## Update 2026-03-17 - SCHOOL LOGO ON PDF & STUDENT PAGE ✅ COMPLETE

### What Changed:
- **Student Assignment Page**: Shows the actual school logo (from `school.logo_url`) instead of the default GraduationCap icon. Falls back to the icon when no logo is uploaded. Also displays school name alongside class name (e.g., "My School — English 4A").
- **PDF Generation**: School logo is loaded as base64 and rendered centered at the top of the PDF header. School name appears below the logo, above the test title.
- **Backend**: Student endpoint (`GET /api/ai-grading/student/{token}`) now looks up school via `class → school_id → school` and returns `school_name` and `school_logo_url`.
- **Gradebook**: Fetches school info on load and includes it in PDF data.

### Files Modified:
- `/app/backend/routes/ai_grading.py` — Added school lookup and school_name/school_logo_url to student response
- `/app/frontend/src/pages/StudentAssignment.js` — Conditional school logo/fallback icon, school name display
- `/app/frontend/src/utils/generateTestPDF.js` — Async logo loading, school logo+name in PDF header
- `/app/frontend/src/pages/Gradebook.js` — schoolInfo state, fetch on load, passed to buildPDFData

### Testing: Backend 100% (7/7), Frontend 100%. Report: `/app/test_reports/iteration_79.json`

---
## Update 2026-03-17 - STUDENT LINK & MATCHING FIX ✅
- Manual assignments generate shareable student links (`public_token`)
- Unified student page for both AI and manual assignments
- Matching questions preview renders left → right pairs
- Report: `/app/test_reports/iteration_78.json`

## Update 2026-03-17 - PDF PREVIEW & PRINT ✅
- jsPDF Student Version + Answer Key PDFs
- Print buttons in Create dialog + assignment list
- Report: `/app/test_reports/iteration_77.json`

## Update 2026-03-17 - QUESTION BUILDER & FILE UPLOAD ✅
- Build Questions tab (MC, T/F, Short Answer, Essay) + Upload File tab
- Report: `/app/test_reports/iteration_76.json`

## Earlier Updates (Completed)
- Super Admin bugs fixed (CSV BOM, class visibility)
- Hero images on all detail pages, scroll-to-top fix
- Full marketing website refactor with 7-language support, sitemap

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
- Anthropic Claude Sonnet 4.6, OpenAI TTS, Google Classroom (via Emergent LLM Key)
- Gemini Nano Banana (image generation via Emergent LLM Key)

## Test Credentials
- Email: test@school.edu / Password: testpassword
