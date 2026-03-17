# TeacherHub - Product Requirements Document

---
## Update 2026-03-17 - PDF PREVIEW & PRINT FOR TESTS ✅ COMPLETE

### What Changed:
- **PDF Generation Utility** (`/app/frontend/src/utils/generateTestPDF.js`): Generates formatted test PDFs using jsPDF with two modes:
  - **Student Version**: Header (title, teacher, class, date, points), student name line, questions with blank answer spaces, MC bubbles, lined essay space
  - **Answer Key**: Red "ANSWER KEY" banner, correct answers highlighted in green (filled bubbles for MC/TF, green text for short answer)
- **Create Assignment Dialog**: "Student PDF" and "Answer Key" buttons appear when questions exist (before Save)
- **View Assignments List**: Printer and Answer Key icon buttons appear for saved assignments (both manual and AI) that have questions
- Supports all 4 question types: Multiple Choice, True/False, Short Answer, Essay

### Testing: 8/8 frontend test scenarios passed. Report: `/app/test_reports/iteration_77.json`

---
## Update 2026-03-17 - ENHANCED CREATE ASSIGNMENT: Question Builder & File Upload ✅ COMPLETE

### What Changed:
- Enhanced Create Assignment dialog with two tabs:
  1. **Build Questions**: Create test questions (MC, T/F, Short Answer, Essay) with per-question points, options, correct answers
  2. **Upload File**: Upload test files (PDF, DOC, DOCX, PPT, images) up to 10MB
- Description/Instructions textarea added
- Backend: `questions` and `attachments` arrays in assignment models, `POST /api/upload-file`, `GET /api/files/{filename}`

### Testing: Backend 94% (15/16), Frontend 100%. Report: `/app/test_reports/iteration_76.json`

---
## Update 2026-03-13 - SUPER ADMIN BUGS FIXED ✅
- Fixed CSV BOM character issue in bulk import
- Fixed super admin class visibility

---
## Update 2026-03-09 - HERO IMAGES, SCROLL FIX, MARKETING REFACTOR ✅
- AI-generated hero images on all detail pages
- Scroll-to-top on navigation fix
- Full marketing website refactor with 7-language support

---

## Core Requirements
1. Marketing Website: Conversion-focused, mobile-responsive, 7 languages
2. Sitemap: Comprehensive with hreflang tags
3. Super Admin Tools: Bulk CSV import, cross-school management
4. Report Cards: School-specific logo/name with defaults
5. Assignments & Gradebook: Question builder, file upload, AI generation, PDF print, grade entry

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
