# TeacherHub - Product Requirements Document

---
## Update 2026-03-17 - STUDENT LINK & MATCHING FIX ✅ COMPLETE

### What Changed:
- **Student Link for Manual Assignments**: When teachers create an assignment with questions or file uploads, a unique `public_token` is generated. The student link is automatically copied to clipboard. Teachers can also copy it later from the assignment list (link icon).
- **Student Assignment Page** (`/assignment/{token}`): Now works for both AI and manual assignments. Shows questions for online answering, file attachments with download links, and handles file-only assignments gracefully.
- **Matching Questions Preview**: AI assignment preview now renders `matching_pairs` data showing left → right pairs, fixing the empty matching display.
- **Unified Backend**: The student endpoint (`GET /api/ai-grading/student/{token}`) now checks both `ai_assignments` and `assignments` collections, and the submission endpoint handles both.

### Files Modified:
- `/app/backend/server.py` — Added `public_token` to AssignmentResponse, generate in create_assignment
- `/app/backend/routes/ai_grading.py` — Extended student/submit endpoints to check both collections
- `/app/frontend/src/pages/Gradebook.js` — Added matching_pairs rendering, Copy Link button, student link toast
- `/app/frontend/src/pages/StudentAssignment.js` — Added file attachments display, conditional questions/submit

### Testing: Backend 100% (7/7), Frontend 100%. Report: `/app/test_reports/iteration_78.json`

---
## Update 2026-03-17 - PDF PREVIEW & PRINT FOR TESTS ✅ COMPLETE

### What Changed:
- PDF generation utility (jsPDF) producing Student Version and Answer Key
- Print buttons in Create Assignment dialog and View Assignments list
- Supports all question types: MC, T/F, Short Answer, Essay

### Testing: 8/8 frontend passed. Report: `/app/test_reports/iteration_77.json`

---
## Update 2026-03-17 - ENHANCED CREATE ASSIGNMENT: Question Builder & File Upload ✅ COMPLETE

### What Changed:
- Build Questions tab (MC, T/F, Short Answer, Essay) + Upload File tab
- Backend: `questions`, `attachments` arrays, file upload/serve endpoints

### Testing: Backend 94%, Frontend 100%. Report: `/app/test_reports/iteration_76.json`

---
## Earlier Updates (Completed)
- Super Admin bugs fixed (CSV BOM, class visibility)
- Hero images on all detail pages
- Scroll-to-top navigation fix
- Full marketing website refactor with 7-language support
- Sitemap with hreflang tags

---

## Core Requirements
1. Marketing Website: Conversion-focused, mobile-responsive, 7 languages
2. Sitemap: Comprehensive with hreflang tags
3. Super Admin Tools: Bulk CSV import, cross-school management
4. Report Cards: School-specific logo/name with defaults
5. Assignments & Gradebook: Question builder, file upload, PDF print, student links, AI generation, grade entry

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
- Emergent-managed Google Auth
- Stripe (payments)
- Resend (email - test mode)
- Anthropic Claude Sonnet 4.6 (via Emergent LLM Key)
- OpenAI TTS (audio narration)
- Google Classroom (share link)
- Gemini Nano Banana (image generation via Emergent LLM Key)

## Test Credentials
- Email: test@school.edu
- Password: testpassword
