# TeacherHub - Product Requirements Document

---
## Update 2026-03-17 - ENHANCED CREATE ASSIGNMENT: Question Builder & File Upload ✅ COMPLETE

### What Changed:
- **Enhanced Create Assignment Dialog** in Gradebook page with two new capabilities:
  1. **Build Questions Tab**: Teachers can create test questions directly in the app
     - Question types: Multiple Choice, True/False, Short Answer, Essay
     - Multiple choice: add/remove options, mark correct answer
     - True/False: auto-populated True/False options with correct answer selection
     - Short Answer: correct answer input field
     - Essay: manual grading note
     - Per-question points allocation
  2. **Upload File Tab**: Teachers can upload existing test files as attachments
     - Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, PNG, JPG, JPEG, GIF, WEBP
     - 10MB file size limit
     - Multiple file upload support
     - File list with remove capability
- **Description/Instructions** textarea added to assignment form
- Backend models updated to store `questions` and `attachments` arrays
- New endpoints: `POST /api/upload-file`, `GET /api/files/{filename}`

### Files Modified:
- `/app/backend/server.py` — Updated AssignmentCreate/AssignmentResponse models, create_assignment endpoint, added upload-file and serve-file endpoints
- `/app/frontend/src/pages/Gradebook.js` — Enhanced Create Assignment dialog with question builder and file upload tabs, added helper functions

### Testing: Backend 94% (15/16), Frontend 100%. Test report: `/app/test_reports/iteration_76.json`

---
## Update 2026-03-13 - SUPER ADMIN BUGS FIXED ✅

### Bug 1: Bulk CSV Import shows 0 students
- **Root cause:** Excel-generated CSVs include a BOM character at the start, causing all rows to fail validation.
- **Fix:** Strip BOM from CSV text in frontend and normalize keys in backend.

### Bug 2: Classes created by Super Admin disappear
- **Root cause:** GET /api/classes filtered by school_id for super admins, but super admin had no school_id.
- **Fix:** Super admin now sees ALL classes.

---
## Update 2026-03-09 - HERO IMAGES ON ALL DETAIL PAGES ✅ COMPLETE
- Replaced icon placeholders on all 10 feature/use-case detail pages with AI-generated custom illustrations.

---
## Update 2026-03-09 - SCROLL TO TOP ON NAVIGATION FIX ✅ COMPLETE
- Fixed React Router not resetting scroll position on page navigation.

---

## Core Requirements
1. **Marketing Website:** Conversion-focused, mobile-responsive, fully translated into 7 languages
2. **Sitemap:** Comprehensive sitemap with hreflang tags for Google Search Console
3. **Super Admin Tools:** Bulk student/teacher CSV import, cross-school class management
4. **Report Cards:** School-specific logo/name with default fallback, accurate translations
5. **Assignments & Gradebook:** Question builder, file upload, AI assignment generation, grade entry

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

## Test Credentials
- Email: test@school.edu
- Password: testpassword
