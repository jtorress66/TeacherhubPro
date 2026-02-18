# TeacherHub - Product Requirements Document

## Original Problem Statement
Build a teacher-focused web app that replaces paper planners with a digital solution. The app handles lesson planning (weekly with objectives, skills, taxonomy levels, activities/materials, standards), grades, attendance, and common teacher workflows.

**User Choices:**
- Full MVP (Lesson Planner + Attendance + Gradebook + Dashboard)
- Both auth options (JWT + Google OAuth)
- PDF export matching school's format exactly
- Bilingual (EN/ES)
- Light/clean professional look

## Architecture

### Tech Stack
- **Frontend:** React 19 with React Router, Tailwind CSS, Shadcn/UI components
- **Backend:** FastAPI (Python) with async support
- **Database:** MongoDB with Motor async driver
- **Authentication:** JWT (email/password) + Emergent-managed Google OAuth

### Key Design Decisions
- Bilingual support via LanguageContext with ES default
- Paper-and-ink aesthetic following design guidelines
- RBAC with row-level security for multi-tenant support
- All API routes prefixed with /api

## User Personas

### Teacher (Primary)
- Creates and manages lesson plans
- Takes daily attendance
- Grades assignments
- Manages class rosters

### Administrator
- Creates school-wide templates
- Manages users and settings
- Views reports across classes

## Core Requirements (Static)

### MVP-1 Features (Implemented)
1. **Authentication**
   - JWT-based email/password login/register
   - Google OAuth via Emergent Auth
   - Protected routes with session management

2. **Dashboard**
   - Welcome message with today's date
   - Stats: classes, students, plans, attendance
   - Attendance pending alerts
   - Quick actions grid
   - Upcoming assignments
   - Recent plans

3. **Lesson Planner**
   - Week view (Mon-Fri tabs)
   - Unit, Story, Date range fields
   - Weekly objective and skills
   - Per-day: theme, DOK levels, activities checklist, materials
   - Standards by domain (Listening/Speaking, Reading, Writing, Language)
   - Expectations per week
   - Subject integration badges
   - Duplicate/Save/Delete functionality

4. **Attendance**
   - Class and date selector
   - Student list with status buttons (Present/Absent/Tardy/Excused)
   - Stats summary
   - Mark all present
   - Auto-save

5. **Gradebook**
   - Category management (Homework, Quiz, Test, Project)
   - Assignment creation with points and due dates
   - Grade entry grid
   - Student average calculation

6. **Classes**
   - Class CRUD (name, grade, section, subject, year/term)
   - Student roster management
   - IEP/Accommodations support

7. **Settings**
   - Profile editing
   - Language toggle (EN/ES)
   - Account info display

## What's Been Implemented (2026-02-11)

### Backend (/app/backend/server.py)
- Complete FastAPI application with 45+ endpoints
- Auth: register, login, logout, session, profile
- Classes: CRUD + students management
- Lesson Plans: CRUD + duplicate + templates
- Attendance: sessions, records, reports
- Gradebook: categories, assignments, grades bulk update
- Dashboard aggregation endpoint
- **Stripe Subscriptions:** Plans, checkout sessions, webhooks, status checks
- Substitute Packet generation

### Frontend (/app/frontend/src/)
- 12 pages: Landing, AuthCallback, Dashboard, PlannerList, LessonPlanner, Attendance, Gradebook, Classes, Settings, Pricing, SubstitutePacket, SubscriptionSuccess
- Bilingual context with 100+ translations
- Auth context with session management
- Layout component with responsive sidebar
- **Enhanced UI Design (2026-02-11):**
  - Hero gradient backgrounds with subtle green tints
  - Glass morphism effects on sidebar and cards
  - Animated entrance effects (fade-in, scale, stagger)
  - Gradient text effects
  - Enhanced button hover states with lift effect
  - Paper texture background
  - Modern card hover animations
  - Color-coded icon backgrounds

### Branding Update (2026-02-11)
- Renamed from "TeacherHub" to "TeacherHubPro"
- Updated copyright year to 2026
- Green gradient logo design
- Professional color scheme (Academic Navy + Growth Green)

### Stripe Integration (2026-02-11)
- Individual Monthly: $9.99/month
- Individual Yearly: $79/year (Save $40)
- School Plan: $6/teacher/month (min 10 teachers)
- District Plan: $4/teacher/month (min 100 teachers)
- 7-day free trial for all new users
- Admin role bypasses payment requirements
- **Public pricing page** accessible from landing page
- **Subscription access control** - users blocked after trial expires until they subscribe
- Trial expired users are redirected to pricing page with alert message

### PDF Export (Completed)
- Two-page landscape format matching user's paper planner
- Teacher name, unit, story, objective fields
- E/C/A checkboxes for daily activities
- Skills as numbered list
- Standards grid
- "Otro" activity notes

### Test Results
- Backend: 100% pass
- Frontend: 95% pass

## Prioritized Backlog

### P0 (Critical - Completed)
- ✅ PDF export matching school's paper format
- ✅ Print-friendly styles
- ✅ Stripe subscription integration
- ✅ Pricing visible on landing page

### P1 (High Priority - Next)
- Drag-and-Drop Seating Chart Editor
- Quick Week Copy (duplicate week + shift dates by 7 days)
- Templates gallery improvements
- Attendance reports by date range

### P2 (Medium Priority)
- Bulk student import (CSV)
- Behavior/notes log
- File repository
- Audit log for grades/attendance changes

### P3 (Future)
- Parent/student portal (read-only)
- Email notifications for absences
- Google Classroom integration
- Admin panel with school-wide reporting
- Advanced gradebook: category weighting, drop lowest, late policies

## Next Tasks
1. Implement PDF export with school format
2. Add template gallery page
3. Build attendance reports view
4. Add bulk CSV import for students
5. Implement seating chart drag/drop

## URLs
- Frontend: https://eduplanner-16.preview.emergentagent.com
- Backend API: https://eduplanner-16.preview.emergentagent.com/api

## Database Collections
- users, user_sessions, schools
- classes, students
- lesson_plans
- attendance_sessions
- grade_categories, assignments, grades

---
## Update 2026-02-10 - Phase 2 Features

### New Features Implemented

#### 1. PDF Export (Matching School Paper Format)
- **Component:** `/app/frontend/src/components/PlanPrintView.js`
- **Access:** Click "Exportar PDF" button on any saved lesson plan
- **Features:**
  - School header matching "Colegio De La Inmaculada Concepción" format
  - Unit, Story, Teacher, Grade, Date range info
  - Objective and Skills sections
  - Daily plan table with Mon-Fri columns
  - Webb's DOK taxonomy level checkboxes
  - Activities and Materials checklists
  - Standards by domain (Listening/Speaking, Reading, Writing, Language)
  - Expectations section
  - Subject integration
  - Signature lines for Teacher and Principal
- **Print:** Opens browser print dialog for PDF save

#### 2. Template Gallery
- **Page:** `/app/frontend/src/pages/Templates.js`
- **Route:** `/templates`
- **Features:**
  - Save any lesson plan as reusable template
  - View all saved templates
  - Use template to create new plan
  - Delete templates
- **Workflow:** Plan → Save as Template → Use later

#### 3. Attendance Reports
- **Page:** `/app/frontend/src/pages/AttendanceReports.js`  
- **Route:** `/attendance/reports`
- **Features:**
  - Date range filtering (Desde/Hasta)
  - Class selector
  - Summary stats: Present, Absent, Tardy, Excused, Attendance Rate
  - Student detail table with individual rates
  - Color-coded attendance percentages (90%+ green, 80%+ amber, <80% red)
  - Print functionality

#### 4. Substitute Packet
- **Page:** `/app/frontend/src/pages/SubstitutePacket.js`
- **Route:** `/substitute-packet`
- **Features:**
  - Class selector
  - Auto-generates complete substitute packet
  - Includes:
    - Cover page with class info
    - Emergency contacts (Office, Nurse)
    - Current week's lesson plan
    - Student roster table
    - Seating chart (5x5 grid)
    - Notes sections (Daily Routines, Emergency Procedures, Special Needs, Additional Notes)
  - Print-ready PDF generation

### Navigation Updates
- New sidebar items:
  - Plantillas / Templates
  - Reportes / Reports  
  - Paquete Sustituto / Sub Packet

### Files Added
- `/app/frontend/src/components/PlanPrintView.js`
- `/app/frontend/src/pages/Templates.js`
- `/app/frontend/src/pages/AttendanceReports.js`
- `/app/frontend/src/pages/SubstitutePacket.js`

### Files Modified
- `/app/frontend/src/App.js` - Added new routes
- `/app/frontend/src/components/Layout.js` - Added navigation items
- `/app/frontend/src/pages/LessonPlanner.js` - Added PDF export button

---
## Update 2026-02-11 - E/C/A Checkboxes & School Branding

### Changes Made

#### 1. E/C/A Checkboxes (Enrichment/Core/Assessment)
- Added E/C/A selection to each day in Lesson Planner
- E = Enriquecimiento (Enrichment)
- C = Central (Core)
- A = Evaluación (Assessment)
- Fixed PDF to show "E☐ C☐ A☐" instead of "RE [ ]C [ ]A"
- Checkboxes appear below each day column in PDF

#### 2. School Logo Upload
- Added `logo_url` field to School model
- New Settings section "Escuela" for school configuration
- Fields: Logo URL, School Name, Address, Phone, Email
- Logo displays in PDF header next to school name

#### 3. Dashboard School Branding
- School logo appears next to welcome message
- School name displayed in lime green above welcome text
- Both logo and name pulled from school settings

### Files Modified
- `/app/backend/server.py` - Added eca to PlanDay, logo_url to School
- `/app/frontend/src/pages/LessonPlanner.js` - Added E/C/A toggle UI
- `/app/frontend/src/components/PlanPrintView.js` - Fixed E/C/A display, added school prop
- `/app/frontend/src/pages/Dashboard.js` - Added school logo/name display
- `/app/frontend/src/pages/Settings.js` - Added School settings section

### Database Updates
- `schools` collection now includes `logo_url` field
- `lesson_plans.days` now includes `eca` object `{E: bool, C: bool, A: bool}`

---
## Update 2026-02-11 - Teacher Name & Other Activity Notes

### Changes Made

#### 1. Teacher Name Field
- Added `teacher_name` field to `LessonPlanCreate` and `LessonPlanResponse` Pydantic models
- Added `teacher_name` to plan creation and update API endpoints
- Frontend already had the input field (line 429-435 in LessonPlanner.js)
- Field saves and loads correctly with lesson plans

#### 2. "Other" Activity Notes Input
- Added `handleActivityNoteChange` function to LessonPlanner.js
- When "Otro" (Other) activity checkbox is selected, a text input appears
- Teachers can specify custom activities using this field
- Notes save with the `activities` array in the `days` structure
- Backend `PlanDayActivity` model already supported `notes` field

### Files Modified
- `/app/backend/server.py` - Lines 169, 184, 867, 910: Added teacher_name to models and API endpoints
- `/app/frontend/src/pages/LessonPlanner.js` - Lines 282-294, 604-648: Added handleActivityNoteChange and conditional input

### Test Results
- Backend: 100% pass
- Frontend: 100% pass
- Test report: `/app/test_reports/iteration_3.json`

### Database Updates
- `lesson_plans` collection now includes `teacher_name` field
- `lesson_plans.days.activities` includes `notes` field for all activity types (used for "other")

---
## Prioritized Backlog (Updated 2026-02-11)

### P1 (High Priority - Next)
- Drag-and-Drop Seating Chart Editor
- Quick Week Copy (duplicate + shift dates by 7 days)
- Bulk student import (CSV)

### P2 (Medium Priority)
- Audit Log for grades/attendance changes
- Student/Parent Portal (read-only views)
- Advanced Gradebook (weighting, drop lowest, late policies)
- Google Classroom Integration

### P3 (Future)
- Email notifications for absences
- Admin panel with school-wide reporting
- Report card generation

---
## Update 2026-02-12 - Super Admin Panel Implementation

### Features Implemented

#### Super Admin Panel (Complete)
- **Page:** `/app/frontend/src/pages/AdminPanel.js`
- **Route:** `/admin` (protected, requires `super_admin` role)
- **Access:** Visible in sidebar only for users with `super_admin` role

##### Overview Tab (Resumen)
- Platform-wide statistics: Schools, Users, Classes, Students
- Quick access school list with counts

##### Schools Tab (Escuelas) - Full CRUD
- **List:** Displays all schools with logo, name, address, phone, email
- **Statistics:** User count, class count, student count per school
- **Branding Preview:** 3 color circles showing Primary/Secondary/Accent colors
- **Create:** "Nueva Escuela" button opens dialog with:
  - Basic info: Name, Address, Phone, Email, Logo URL
  - Branding: 3 color pickers (Primary, Secondary, Accent) with hex inputs
  - Font family selector (Manrope, Inter, Roboto, etc.)
  - Live preview of branding
- **Edit:** Opens same dialog with prefilled values
- **Delete:** Confirmation dialog, removes school

##### Users Tab (Usuarios) - Full CRUD
- **List:** Table with User (avatar, name, email), School, Role, Actions
- **Search:** Filter users by name, email, or school
- **Roles:** Super Admin (purple badge), Admin (blue), Teacher (gray)
- **Create:** "Nuevo Usuario" dialog with name, email, password, school selector, role selector
- **Edit:** Same dialog without password field
- **Reset Password:** Generates temporary password, shows in toast notification (10s)
- **Delete:** Only for non-super_admin users (self-protection)

#### Dynamic School Branding (In Progress)
- **Context:** `/app/frontend/src/contexts/SchoolContext.js`
- **Features:**
  - Fetches school data based on user's `school_id`
  - Applies branding colors as CSS variables
  - Exposes `school`, `branding`, `refreshSchool` via useSchool hook
  - Graceful fallback when used outside provider (no errors)
- **PDF Integration:** `PlanPrintView.js` uses school branding for PDF exports

### Backend API Endpoints Added
- `GET /api/super-admin/overview` - Platform stats
- `GET /api/super-admin/schools` - List all schools with counts
- `POST /api/super-admin/schools` - Create school
- `PUT /api/super-admin/schools/{id}` - Update school
- `DELETE /api/super-admin/schools/{id}` - Delete school
- `GET /api/super-admin/users` - List all users with school names
- `POST /api/super-admin/users` - Create user
- `PUT /api/super-admin/users/{id}` - Update user
- `DELETE /api/super-admin/users/{id}` - Delete user
- `POST /api/super-admin/users/{id}/reset-password` - Reset password
- `POST /api/super-admin/users/bulk` - Bulk create users (CSV support)

### Test Results
- Backend: 100% (15/15 tests passed)
- Frontend: 100% (all UI features verified)
- Test report: `/app/test_reports/iteration_4.json`
- Test file: `/app/backend/tests/test_super_admin.py`

### Data-TestIDs Added
- `new-school-btn`, `edit-school-{id}`, `delete-school-{id}`
- `new-user-btn`, `edit-user-{id}`, `delete-user-{id}`, `reset-password-{id}`
- `school-dialog-save`, `school-dialog-cancel`
- `user-dialog-save`, `user-dialog-cancel`

---
## Updated Prioritized Backlog (2026-02-12)

### P0 (Critical - Completed)
- ✅ PDF export matching school's paper format
- ✅ Stripe subscription integration
- ✅ Super Admin Panel with school/user CRUD
- ✅ Dynamic school branding context

### P1 (High Priority - Next)
- Drag-and-Drop Seating Chart Editor
- Quick Week Copy (duplicate + shift dates by 7 days)
- Complete branding application to all teacher views

### P2 (Medium Priority)
- Bulk student import (CSV)
- Audit Log for grades/attendance changes
- Student/Parent Portal (read-only views)
- Advanced Gradebook (weighting, drop lowest)

### P3 (Future)
- Email notifications for absences

---
## Update 2026-02-12 - Gradebook GPA System Implementation

### Features Implemented

#### GPA Calculation & Display (Complete)
- **Location:** `/app/frontend/src/pages/Gradebook.js`
- **GPA Scale (School's Custom):**
  - A: 4.00 - 3.50 (≥87.5%)
  - B: 3.49 - 2.50 (62.5% - 87.4%)
  - C: 2.49 - 1.60 (40% - 62.4%)
  - D: 1.59 - 0.80 (20% - 39.9%)
  - F: 0.79 - 0 (<20%)
- **Display:** Each student shows:
  - Letter grade in colored badge (green A, blue B, yellow C, orange D, red F)
  - GPA value (e.g., "3.18 GPA")
  - Percentage (e.g., "79.5%")

#### Category Management (Complete)
- **Access:** "Categorías" button in Gradebook header
- **Features:**
  - GPA scale reference display (5 color-coded boxes)
  - Total weight percentage indicator (red if >100%)
  - Create new categories with bilingual names (EN/ES) and weight
  - Edit existing categories inline
  - Delete categories (blocked if assignments exist)

### Backend API Endpoints Added
- `PUT /api/categories/{category_id}` - Update category name, name_es, weight_percent
- `DELETE /api/categories/{category_id}` - Delete category (fails if has assignments)

### Test Results
- Backend: 100% (11/11 tests passed)
- Frontend: 100% (all features verified)
- Test report: `/app/test_reports/iteration_5.json`
- Test file: `/app/backend/tests/test_gradebook_gpa.py`


---
## Update 2026-02-12 - Parent Portal & Gradebook Reports

### Features Implemented

#### Gradebook Reports (Complete)
- **Page:** `/app/frontend/src/pages/GradebookReports.js`
- **Route:** `/gradebook/reports`
- **Features:**
  - Class selector dropdown
  - Statistics cards: Class GPA, Average %, Students count, Assignments count
  - Grade Distribution visualization (A, B, C, D, F counts in colored boxes)
  - Student Detail table with: Name, Assignments Completed, Points, Percentage, GPA, Letter Grade
  - Print button for reports
  - GPA Scale reference section

#### Parent Portal (Complete)
- **Page:** `/app/frontend/src/pages/ParentPortal.js`
- **Route:** `/portal/{token}` (PUBLIC - no auth required)
- **Access:** Teachers generate unique links from Classes page (green link icon)
- **Features:**
  - Student info card with name, GPA, letter grade
  - Quick stats: GPA, Grade %, Attendance Rate, Classes
  - Three tabs:
    - **Calificaciones (Grades):** Per-class grades with recent assignments
    - **Asistencia (Attendance):** Summary and history
    - **Tareas (Assignments):** Upcoming and completed assignments with scores
  - Completely read-only (no edit functionality)
  - "Portal de Solo Lectura" badge visible
  - Error handling for invalid tokens
  - Bilingual support (Spanish/English)

#### Portal Link Generation
- **Location:** Classes page → Student row → Green link icon
- **Dialog shows:**
  - Student name
  - Unique access URL
  - Copy to clipboard button
  - "Open Portal" button (new tab)

### Backend API Endpoints Added
- `GET /api/gradebook/report/{class_id}` - Gradebook report with student averages
- `POST /api/students/{student_id}/portal-token` - Generate portal access token
- `GET /api/portal/{token}` - Get student data (PUBLIC, no auth)
- `DELETE /api/students/{student_id}/portal-token` - Revoke portal access

### Database Collection Added
- `portal_tokens`: `{ token, student_id, school_id, created_at, created_by }`


---
## Update 2026-02-12 - Semester System & Portal Email

### Features Implemented

#### Semester System (Complete)
- **Admin Panel Tab:** New "Semestres" tab with full CRUD operations
- **Semester Fields:**
  - Name (English & Spanish)
  - Start/End Dates
  - School Year (e.g., 2024-2025)
  - Active Status (only one can be active at a time)
- **Gradebook Integration:**
  - Semester selector dropdown
  - "Trabajando en: [Semester]" indicator when semester selected
  - Classes filtered by semester
- **Reports Integration:**
  - Semester filter in Gradebook Reports
  - Semester name included in print header

#### Parent Portal Email (Complete)
- **Email Provider:** Resend API
- **Dialog Features:**
  - Parent email input field
  - Expiration selector (7, 14, 30, 60, 90 days)
  - Expiration date display ("Expira: [date]")
  - "Enviar Email" button
- **Email Content:**
  - Bilingual (Spanish/English)
  - School branding (name from school profile)
  - Portal access button
  - Copy-paste URL
  - Expiration warning

### Backend API Endpoints Added
- `GET /api/semesters` - List school's semesters
- `GET /api/semesters/active` - Get active semester
- `POST /api/semesters` - Create semester (admin only)
- `PUT /api/semesters/{id}` - Update semester
- `DELETE /api/semesters/{id}` - Delete semester (fails if has classes)
- `POST /api/portal/email` - Send portal link via Resend

### Database Collections Added/Updated
- `semesters`: `{ semester_id, school_id, name, name_es, start_date, end_date, year_term, is_active, created_at }`
- `portal_tokens`: Added `expires_at` field
- `classes`: Added `semester_id` field

### Environment Variables Added
- `RESEND_API_KEY` - Resend API key for email sending
- `SENDER_EMAIL` - Email sender address (onboarding@resend.dev for testing)

### Test Results
- Backend: 100% (18/18 tests passed)
- Frontend: 100% (all UI features verified)
- Test report: `/app/test_reports/iteration_7.json`
- Test file: `/app/backend/tests/test_semester_portal_email.py`

### Notes
- Resend API is in test mode - emails only work with verified addresses
- In production, use a verified domain for sender email
- Portal tokens expire based on selected duration (default 30 days)

### Test Results
- Backend: 100% (11/11 tests passed)
- Frontend: 100% (all features verified)
- Test report: `/app/test_reports/iteration_6.json`
- Test file: `/app/backend/tests/test_portal_gradebook_reports.py`

### Data Model Updates
- `CategoryCreate` and `CategoryResponse` now include `name_es` field for bilingual support

---
## Update 2026-02-13 - P0 Fixes

### Issues Fixed

#### 1. Backend .env Configuration
- Fixed malformed .env file where STRIPE_API_KEY and STRIPE_WEBHOOK_SECRET were concatenated on same line
- Added proper quotes around SENDER_EMAIL for correct "Name <email>" format
- Added FRONTEND_URL environment variable for production portal email links

#### 2. Pricing Page - Admin Can Test Checkout
- **Issue:** Admin users had "Admin Access" button that was disabled, preventing testing
- **Fix:** Changed to "Probar Checkout" / "Test Checkout" button that IS enabled
- **File:** `/app/frontend/src/pages/Pricing.js` - Lines 337-358

#### 3. Substitute Packet - Editable & Saveable Content
- **Issue:** After generating a sub packet, editable fields were not persisted
- **Fix:** Added new backend endpoints and frontend save functionality
- **New Endpoints:** 
  - `GET /api/classes/{class_id}/sub-packet` - Fetch saved packet data
  - `PUT /api/classes/{class_id}/sub-packet` - Save/update packet data
- **New Database Collection:** `sub_packets`
- **Files:** 
  - `/app/backend/server.py` - Lines 822-869 (SubPacketData model and endpoints)
  - `/app/frontend/src/pages/SubstitutePacket.js` - Save functionality

#### 4. Portal Email URL Fix
- **Issue:** Portal email links were hardcoded to preview URL
- **Fix:** Now uses FRONTEND_URL environment variable (defaults to teachershubpro.com)
- **File:** `/app/backend/server.py` - Line 1682

#### 5. Semester Management for Teachers - VERIFIED WORKING
- Teachers can create, edit, delete, and set active semesters
- Located in Settings page under "Semestres" section
- **File:** `/app/frontend/src/pages/Settings.js`

### Production Setup Instructions
The following issues require user action in production:

1. **SENDER_EMAIL Issue:** Set `SENDER_EMAIL` in production dashboard as: `"TeacherHubPro <no-reply@teachershubpro.com>"`
2. **Setup Admin 404:** Page exists - needs REDEPLOY to push code to production
3. **Setup Key:** `TeacherHubPro2026SecureSetup`

### Test Results
- Backend: 100% (11/11 tests passed)
- Frontend: 100% (all 5 P0 features verified)
- Test report: `/app/test_reports/iteration_8.json`
- Test file: `/app/backend/tests/test_p0_fixes.py`

---
## Future Tasks

### P1 (High Priority - Next)
- Drag-and-Drop Seating Chart Editor
- Quick Week Copy (duplicate + shift dates by 7 days)
- Super Admin Bulk Tools (CSV import for teachers)

### P2 (Medium Priority)
- Audit Log for grades/attendance changes
- Google Classroom Integration
- Report card generation

### Technical Debt
- **Refactor `/app/backend/server.py`**: File is monolithic and needs to be split into logical modules using FastAPI's `APIRouter` (e.g., `routes/auth.py`, `routes/admin.py`, `routes/gradebook.py`)

---
## Update 2026-02-14 - Bug Fixes (SM Login, Print View, Backend Model)

### Bugs Fixed

#### 1. SM Aprendizaje Login Dialog Not Showing Fields
- **Issue:** The dialog was not rendering due to missing `BookOpen` icon import
- **Fix:** Added `BookOpen` to the lucide-react imports in `/app/frontend/src/pages/LessonPlanner.js`
- **Status:** ✅ FIXED - Dialog now shows username and password fields

#### 2. Two-Week Date Range Not Displaying Together in Print View
- **Issue:** Week 1 and Week 2 dates were on separate lines, causing page breaks
- **Fix:** Updated `/app/frontend/src/components/PlanPrintView.js` to display both weeks on the same line: "Week 1: X - Y | Week 2: A - B"
- **Status:** ✅ FIXED - Both weeks now display in compact format

#### 3. Backend Missing week2_start and week2_end Fields
- **Issue:** Backend models didn't include the two-week date fields
- **Fix:** Added `week2_start: Optional[str]` and `week2_end: Optional[str]` to:
  - `LessonPlanCreate` model
  - `LessonPlanResponse` model
  - Create plan endpoint (plan_doc)
  - Update plan endpoint (update_data)
- **Status:** ✅ FIXED - Backend now saves and returns week 2 dates

### Files Modified
- `/app/frontend/src/pages/LessonPlanner.js` - Line 19: Added BookOpen import
- `/app/frontend/src/components/PlanPrintView.js` - Lines 229-235, 362-367: Compact date display
- `/app/backend/server.py` - Lines ~169, ~184, ~1115, ~1163: Added week2 fields

### Test Results
- Test report: `/app/test_reports/iteration_9.json`
- Success Rate: 100% (5/5 features verified)
- All features verified working:
  1. SM Aprendizaje dialog opens with username/password fields
  2. Two-week date range displays on same line in print view
  3. Gradebook categories display correctly
  4. View Assignments button and edit functionality working
  5. GPA calculation uses standard percentage scale (90+=A, 80+=B, 70+=C, 60+=D, <60=F)

---
## Update 2026-02-15 - UI Fixes (Print View, Landing Logo, Pricing Email)

### Issues Fixed

#### 1. Print View Font Size Fix (P0)
- **Problem:** Print preview fonts were too small (6-9pt) leaving excessive white space
- **Solution:** Increased fonts throughout PlanPrintView.js:
  - Page font size: 9pt → 10pt
  - Info grid text: 10pt → 11pt
  - Objective/Skills headers: 10pt → 11pt
  - Table headers: 9pt → 10pt
  - Table cells: 7-8pt → 8-9pt
  - Checkbox sizes: 7-9px → 8-10px
  - Line height: 1.15-1.25 → 1.25-1.3
  - Padding increased throughout
- **Files Modified:** `/app/frontend/src/components/PlanPrintView.js`

#### 2. Landing Page Logo Size Fix (P1)
- **Problem:** Logo was the same visual weight as the app name text
- **Solution:** 
  - Increased logo size: `h-20 w-20` → `h-24 w-24`
  - Reduced text size: `text-3xl` → `text-2xl`
- **Files Modified:** `/app/frontend/src/pages/Landing.js`

#### 3. Pricing Page Email Fix (P1)
- **Problem:** Contact email showed `support@teacherhub.com` instead of correct address
- **Solution:** Updated email to `support@teacherhubpro.com`
- **Files Modified:** `/app/frontend/src/pages/Pricing.js`

### Testing Status
- Screenshots verified all three fixes working correctly
- Print preview shows readable text with proper balance of content/whitespace
- Landing page logo is visibly larger than text
- Pricing page displays correct email address

---
## Update 2026-02-15 - AI Teaching Assistant Implementation

### New Feature: AI Teaching Assistant (Claude Sonnet 4.5)

#### Features Implemented
1. **Content Generation Tools:**
   - Lesson Plan Generator - Creates complete, standards-aligned lesson plans
   - Quiz/Assessment Creator - Generates quizzes with multiple question types and answer keys
   - Topic Summary Generator - Comprehensive topic summaries for teaching
   - Activity Ideas Generator - Creative classroom activities with instructions
   - Worksheet Creator - Printable practice worksheets

2. **AI Chat Assistant:**
   - Interactive chat interface for teaching questions
   - Conversation history maintained per session
   - Quick suggestion buttons for common queries
   - Supports both English and Spanish

3. **Standards Integration:**
   - Common Core State Standards (CCSS)
   - Puerto Rico Core Standards (PR CORE)
   - Option to use both or either framework
   - Standards codes cited in generated content

4. **Access Control:**
   - Available to paid subscribers only
   - Also available during 7-day trial period
   - Subscription check before AI access

#### Files Created/Modified
- **NEW**: `/app/frontend/src/pages/AIAssistant.js` - Full AI Assistant page with Generate, Chat, and History tabs
- **MODIFIED**: `/app/backend/server.py` - Added AI endpoints and models
- **MODIFIED**: `/app/frontend/src/App.js` - Added AI Assistant route
- **MODIFIED**: `/app/frontend/src/components/Layout.js` - Added AI Assistant to navigation with "NEW" badge

#### API Endpoints Added
- `POST /api/ai/generate` - Generate educational content (lesson plans, quizzes, etc.)
- `POST /api/ai/chat` - Chat with AI assistant
- `GET /api/ai/chat/history/{session_id}` - Get chat history
- `GET /api/ai/generations` - Get user's generation history
- `GET /api/ai/generations/{generation_id}` - Get specific generation
- `DELETE /api/ai/chat/sessions/{session_id}` - Delete chat session

#### Database Collections Added
- `ai_generations` - Stores generated content
- `ai_chat_messages` - Stores chat conversations

#### Integration
- Uses Claude Sonnet 4.5 (claude-sonnet-4-5-20250929) via Emergent LLM Key
- Emergent integrations library for API calls

---
## Current Backlog (Updated 2026-02-15)

### P1 (High Priority - Next)
- Save AI Generations to Lesson Planner
- Drag-and-Drop Seating Chart Editor
- Quick Week Copy (duplicate + shift dates by 7 days)
- Super Admin Bulk Tools (CSV import for teachers)

### P2 (Medium Priority)
- Audit Log for grades/attendance changes
- Google Classroom Integration
- Report card generation

### Technical Debt (Recurring)
- ~~**Refactor `/app/backend/server.py`**: File is monolithic (3000+ lines) and continues to grow. Should be split into logical modules using FastAPI's `APIRouter`.~~ PARTIALLY DONE - Auth and AI routes extracted.

---
## Update 2026-02-15 - Landing Page AI Features Showcase

### New AI Features Section on Landing Page
Added comprehensive showcase of all AI features on the landing page.

**Location:** `/app/frontend/src/pages/Landing.js`

**Navigation Update:**
- Added "IA Avanzada" / "Advanced AI" link to header navigation
- Links to new `#ai-features` section

**New Section: "Planificación inteligente con IA"**
Title, subtitle, and 6 feature cards showcasing all AI capabilities:

1. **Genera Semana Completa** (Generate Full Week)
   - Purple gradient card
   - Describes 5-day generation with pedagogical progression
   - Tags: 5 días, Progresión

2. **Sugerencias por Día** (Daily Suggestions)
   - Blue gradient card
   - Explains phase-based daily suggestions
   - Tags: Lunes → Viernes, Contextual

3. **Plantillas Reutilizables** (Reusable Templates)
   - Amber gradient card
   - Save and clone functionality
   - Tags: Guardar, Clonar

4. **5 Plantillas Iniciales** (5 Starter Templates)
   - Green gradient card
   - Lists available subjects
   - Tags: Matemáticas, Lectura, Ciencias

5. **Adapta con IA** (AI Customize)
   - Pink gradient card
   - Template adaptation feature
   - Tags: Nuevo tema, Misma estructura

6. **Plantilla de la Semana** (Template of the Week)
   - Violet gradient card
   - Weekly dashboard spotlight
   - Tags: Rotación semanal, Tips

**CTA Button:**
- "Prueba la IA gratis por 7 días" / "Try AI free for 7 days"
- Purple-to-blue gradient styling

**Design:**
- Each card has hover effects (scale, shadow, border color change)
- Color-coded gradient backgrounds matching feature theme
- Consistent icon styling with white on gradient backgrounds
- Tags for quick feature scanning
- Fully bilingual (Spanish/English)

---
## Update 2026-02-15 - Template of the Week Feature

### Template of the Week Dashboard Spotlight (NEW FEATURE)
Added a prominent "Template of the Week" card on the dashboard that showcases a different starter template each week.

**Backend:** `/app/backend/routes/ai.py`
- `GET /api/ai/templates/weekly` - Returns the template of the week based on week number
- Automatically rotates through 5 starter templates (week 1-5, then repeats)
- Includes customization tips in both English and Spanish

**Frontend:** `/app/frontend/src/pages/Dashboard.js`
- Beautiful amber/orange gradient card positioned prominently after the welcome header
- Shows:
  - "✨ Plantilla de la Semana" / "✨ Template of the Week" badge
  - Template name and description (bilingual)
  - Subject, grade level, and duration
  - "Usar esta plantilla" / "Use this template" CTA button
  - Customization tips panel with 3 actionable suggestions

**Customization Tips Added to Each Template:**

1. **Introduction to Fractions:**
   - Replace pizza theme with local foods (pastelitos, quesadillas)
   - Use available manipulatives (LEGO blocks)
   - Extend to fifths/sixths for advanced students
   - Add real-life fraction homework

2. **Reading Comprehension Strategies:**
   - Choose texts matching current theme/student interests
   - Create strategy bookmarks
   - Pair with class novel
   - Add "Strategy Detective" badges

3. **Scientific Method:**
   - Connect experiments to current science unit
   - Feature diverse scientists (especially Latino!)
   - Turn Day 4 into mini science fair
   - Connect to real-world issues students care about

4. **Writing Process Workshop:**
   - Choose genre aligned with standards
   - Use mentor texts from favorite authors
   - Publish digitally (Book Creator, Google Slides)
   - Invite parents to Author's Celebration

5. **Multiplication Facts:**
   - Focus on fact families students struggle with
   - Add digital games (Prodigy, XtraMath)
   - Create growing class multiplication chart
   - Send home flash cards with strategies

**Rotation Schedule:**
- Week 1: Introduction to Fractions
- Week 2: Reading Comprehension Strategies
- Week 3: Introduction to Scientific Method
- Week 4: Writing Process Workshop
- Week 5: Mastering Multiplication Facts
- (Repeats)

---
## Update 2026-02-15 - Starter Templates Feature

### Starter Templates - Pre-built Lesson Plans (NEW FEATURE)
Added 5 professionally designed starter templates that new users can immediately use and customize.

**Backend:** `/app/backend/routes/ai.py`
- `GET /api/ai/templates/starters` - List all starter templates
- `GET /api/ai/templates/starters/{id}` - Get full starter template content
- Starter templates are stored as Python constants (no database required)

**Starter Templates Available:**
1. **Introduction to Fractions** (Math, Grades 3-4)
   - Hands-on approach using visual models and manipulatives
   - 5-day progression: exploration → practice → mastery
   - Tags: math, fractions, hands-on, visual

2. **Reading Comprehension Strategies** (ELA, Grades 2-5)
   - Teaching predicting, questioning, visualizing, summarizing
   - Strategy-focused daily lessons
   - Tags: reading, comprehension, strategies, literacy

3. **Introduction to Scientific Method** (Science, Grades 3-6)
   - Hands-on exploration through simple experiments
   - Variables, hypotheses, data collection
   - Tags: science, experiments, inquiry, STEM

4. **Writing Process Workshop** (ELA, Grades 2-6)
   - Full writing process: prewriting → drafting → revising → editing → publishing
   - Tags: writing, process, workshop, literacy

5. **Mastering Multiplication Facts** (Math, Grades 3-4)
   - Strategies and games for fact fluency
   - Tags: math, multiplication, facts, fluency

**Frontend UI Updates:**
- Templates modal now has two tabs:
  - **"Plantillas Iniciales"** (Starter Templates) - Amber styling, shown by default
  - **"Mis Plantillas"** (My Templates) - User's saved templates
- Starter templates show:
  - "Inicial" badge with star icon
  - Bilingual names/descriptions (Spanish and English)
  - Subject with icon
  - Grade level range
  - Tags
- Click template to expand options:
  - "Usar esta plantilla" - Apply as-is
  - "Adaptar con IA" - Enter new topic for AI customization

**Benefits:**
- Solves cold-start problem for new users
- Professional, curriculum-aligned content
- Reduces planning time significantly
- Easily customizable for specific topics

---
## Update 2026-02-15 - AI Templates Feature

### AI Templates - Clone & Customize (NEW FEATURE)
Added the ability to save successful AI-generated lesson plans as reusable templates.

**Backend Endpoints:** `/app/backend/routes/ai.py`
- `POST /api/ai/templates` - Save a new template
- `GET /api/ai/templates` - List user's templates
- `GET /api/ai/templates/{id}` - Get full template with content
- `PUT /api/ai/templates/{id}` - Update template
- `DELETE /api/ai/templates/{id}` - Delete template
- `POST /api/ai/templates/{id}/customize` - AI-powered customization for new topic

**Frontend UI:** `/app/frontend/src/pages/LessonPlanner.js`

**Features:**
1. **"Plantillas" Button** - Amber-colored button in planner header opens template browser
2. **"Guardar plantilla" Button** - Green button appears when AI suggestions exist
3. **Template Browser Modal**:
   - Lists all saved templates with metadata (name, subject, grade, days count, use count)
   - Click to select template and see options
   - "Apply as-is" - Use template content directly
   - "Customize" - Enter new topic and AI adapts the template structure
   - Delete templates
4. **Save Template Modal**:
   - Name (required)
   - Description
   - Tags (comma-separated)
   - Preview of what will be saved

**Database Collection:** `ai_templates`
```json
{
  "template_id": "tmpl_abc123",
  "user_id": "user_xyz",
  "name": "Fractions Plan - 4th Grade",
  "description": "Hands-on approach to equivalent fractions",
  "subject": "math",
  "grade_level": "4",
  "original_topic": "Equivalent fractions",
  "days": { "0": "Day 1 content...", "1": "Day 2 content...", ... },
  "tags": ["math", "fractions", "hands-on"],
  "use_count": 5,
  "is_public": false,
  "created_at": "...",
  "updated_at": "..."
}
```

**User Flow - Save Template:**
1. Generate full week plan with AI
2. Review and approve suggestions
3. Click "Guardar plantilla" button
4. Enter name, description, and tags
5. Save template for future use

**User Flow - Use Template:**
1. Click "Plantillas" button
2. Browse saved templates
3. Select template
4. Either:
   - "Apply as-is" to use exact content
   - Enter new topic and "Adapt" for AI customization
5. AI suggestions populate the planner

---
## Update 2026-02-15 - Generate Full Week Feature

### Generate Full Week AI Plan (NEW FEATURE)
Added a "Generate Full Week" button that creates a coherent 5-day lesson plan with proper pedagogical progression.

**Location:** `/app/frontend/src/pages/LessonPlanner.js`

**Features:**
- **"Generar semana completa" Button** - Purple gradient button in the Plan Semanal header
- Generates all 5 days at once with coherent learning progression:
  - Day 1: Introduction - Hook, activate prior knowledge, introduce concepts
  - Day 2: Guided Practice - Teacher modeling, scaffolded practice
  - Day 3: Independent Practice - Centers, partner work, collaboration
  - Day 4: Mastery & Extension - Higher-order thinking, real-world application
  - Day 5: Assessment & Reflection - Evaluation, self-reflection, closure
- **Visual Indicators**: Purple dots on day tabs show which days have AI suggestions
- **Bulk Actions**:
  - "Apply All" button to add all suggestions to notes at once
  - "Clear All" button (trash icon) to remove all suggestions
- AI parses response and assigns content to appropriate days

**User Flow:**
1. Teacher adds an objective for the week
2. Clicks "Generar semana completa" button
3. AI generates a coherent 5-day plan
4. Purple dots appear on all day tabs indicating suggestions
5. Teacher can review each day's suggestions
6. Click "Apply All" to add suggestions to all days' notes
7. Or apply/dismiss individually per day

---
## Update 2026-02-15 - AI Day Suggestions Feature

### AI Suggested Activities for Each Day (NEW FEATURE)
Added contextual AI activity suggestions for each day of the week in the Lesson Planner.

**Location:** `/app/frontend/src/pages/LessonPlanner.js`

**Pedagogical Day Phases:**
- Day 1 (Monday): **Introduction** - Hook students, activate prior knowledge
- Day 2 (Tuesday): **Guided Practice** - Model skills with teacher support
- Day 3 (Wednesday): **Independent Practice** - Small groups, peer collaboration
- Day 4 (Thursday): **Mastery** - Application, extension activities
- Day 5 (Friday): **Assessment** - Formative/summative assessment, reflection

**Features:**
- Phase badge displayed for each day (color-coded: blue for intro, amber for assessment)
- "Sugerir actividades" / "Suggest activities" button with sparkles icon
- AI generates 3-4 specific activities tailored to:
  - The lesson's objective
  - The day's position in the learning sequence
  - Grade level (if class is selected)
  - Subject (if specified)
- Purple gradient suggestions panel with:
  - AI-generated activity list (name, duration, description, materials)
  - "Apply to notes" button to add suggestions to day's notes
  - Dismiss button to close panel
- Loading state with spinner during generation

**User Flow:**
1. Teacher adds an objective for the week
2. Clicks "Suggest activities" on any day
3. AI generates activities appropriate for that day's phase
4. Teacher reviews suggestions
5. Optionally applies suggestions to notes or dismisses
6. Can generate suggestions for different days independently

---
## Update 2026-02-15 - AI Lesson Generator & Landing Page Refinement

### AI Lesson Plan Generator (NEW FEATURE)
Added an "AI Lesson Plan Generator" button directly in the Lesson Planner page:

**Location:** `/app/frontend/src/pages/LessonPlanner.js`

**Features:**
- Purple gradient "Generar con IA" / "Generate with AI" button in the planner header
- Modal dialog with form fields:
  - Subject selection (Math, ELA, Spanish, Science, Social Studies, Art, Music, PE)
  - Grade level (K-12)
  - Lesson topic (free text)
  - Standards framework (Common Core + Puerto Rico, Common Core only, PR only)
  - Difficulty level (Easy, Medium, Hard)
  - Duration in minutes
- Calls the `/api/ai/generate` endpoint with `tool_type: lesson_plan`
- Auto-populates the lesson plan form with:
  - Objective extracted from AI response
  - Topic as the story/theme
  - Full AI-generated content in the first day's notes
- Error handling for subscription requirements (shows appropriate message if user needs to subscribe)

**User Flow:**
1. Teacher opens Lesson Planner (new or existing)
2. Clicks "Generate with AI" button
3. Fills in subject, grade, topic, and preferences
4. Clicks "Generate Plan"
5. AI generates content based on standards
6. Form is auto-populated with generated content
7. Teacher reviews and edits as needed
8. Saves the plan

### Landing Page Refinement
- **Removed:** "Log in" link from header navigation
- **Changed:** "Get Started" button renamed to "Get Started - Log In" / "Comenzar - Iniciar sesión"
- **Reason:** Both buttons performed the same action (scrolling to auth section), so consolidated for cleaner UX

### Landing Page Updates
- **AI Feature Showcase:** Added AI Teaching Assistant to the feature showcase grid (4-column layout)
- **Dedicated AI Section:** Created new purple-gradient section showcasing the AI assistant with:
  - Demo chat interface visual
  - Feature bullets (Common Core & PR CORE aligned, bilingual, powered by Claude)
  - "Try it free" CTA button
- **Navigation Update:** Added "Asistente IA" / "AI Assistant" link to header navigation

### Code Refactoring (COMPLETED)
Started modular refactoring of the monolithic `server.py`:

#### New Directory Structure
```
/app/backend/
├── models/
│   └── __init__.py          # All Pydantic models
├── utils/
│   ├── __init__.py          # Exports
│   ├── database.py          # MongoDB connection
│   ├── auth.py              # Auth helpers (JWT, password hashing)
│   └── constants.py         # App constants, AI prompts
├── routes/
│   ├── __init__.py          # Router exports
│   ├── auth.py              # Auth endpoints (login, register, etc.)
│   └── ai.py                # AI assistant endpoints
└── server.py                # Main app (includes modular routers)
```

#### What Was Extracted
1. **Auth Routes** (`routes/auth.py`):
   - POST /api/auth/register
   - POST /api/auth/login
   - POST /api/auth/session (Google OAuth)
   - GET /api/auth/me
   - POST /api/auth/logout
   - PUT /api/auth/profile

2. **AI Routes** (`routes/ai.py`):
   - POST /api/ai/generate
   - POST /api/ai/chat
   - GET /api/ai/chat/history/{session_id}
   - GET /api/ai/generations
   - GET /api/ai/generations/{generation_id}
   - DELETE /api/ai/chat/sessions/{session_id}

3. **Shared Utilities**:
   - Database connection (utils/database.py)
   - Authentication helpers (utils/auth.py)
   - Constants and AI prompts (utils/constants.py)
   - Pydantic models (models/__init__.py)

#### Still In server.py (To Extract Later)
- School endpoints
- Class endpoints
- Student endpoints
- Lesson Plan endpoints
- Attendance endpoints
- Gradebook endpoints
- Dashboard endpoints
- Subscription/Stripe endpoints
- Super Admin endpoints
- Parent Portal endpoints

### Testing Status
- ✅ Health endpoint verified
- ✅ Auth login verified (modular route)
- ✅ AI generations endpoint verified (modular route)
- ✅ Landing page screenshots captured

---
## Update 2026-02-15 - P0 Bug Fix: AI Network Error

### Bug Fixed: AI Content Generation "Network Error"

**Issue:** Users reported "Network error" when trying to generate AI content (lesson plans, quizzes, etc.), despite having sufficient Emergent LLM Key credits.

**Root Cause:** The model name `claude-sonnet-4-5-20250929` was not available in the Emergent LLM Key's supported model list. The emergentintegrations library was attempting to call the model but failing due to invalid model name.

**Evidence from Logs:**
```
LiteLLM completion() model= claude-sonnet-4-5-20250929; provider = openai
openai._base_client - INFO - Retrying request to /chat/completions in 0.390793 seconds
```

**Solution:** Updated the model name from `claude-sonnet-4-5-20250929` to `claude-sonnet-4-20250514` which is a valid model in the Emergent LLM Key's available models.

**Files Modified:**
- `/app/backend/routes/ai.py` - Lines 108, 192, 1010 (all 3 occurrences updated)

**Verification:**
- Test report: `/app/test_reports/iteration_10.json`
- Success rate: 100% (14/14 backend tests passed)
- All AI endpoints verified working:
  - POST /api/ai/generate (lesson_plan, quiz, summary) ✅
  - POST /api/ai/chat (single message, multi-turn) ✅
  - GET /api/ai/chat/history/{session_id} ✅
  - GET /api/ai/templates/starters ✅
  - GET /api/ai/templates/weekly ✅
  - GET /api/ai/generations ✅

---
## Current Backlog (Updated 2026-02-15)

### P0 (Critical) - Completed
- ✅ AI Network Error bug fix

### P1 (High Priority - Next)
- Complete Backend Refactoring (server.py still has ~2900 lines)
- Drag-and-Drop Seating Chart Editor
- Quick Week Copy (duplicate + shift dates by 7 days)
- Super Admin Bulk Tools (CSV import for teachers)

### P2 (Medium Priority)
- Audit Log for grades/attendance changes
- Google Classroom Integration
- Report card generation

### Technical Debt
- **Refactor `/app/backend/server.py`**: Partially done (auth, ai routes extracted). Remaining: schools, classes, students, plans, attendance, gradebook, dashboard, subscription, super admin routes.

---
## Update 2026-02-15 - Markdown Rendering Fix in AI Assistant

### Bug Fixed: AI Generated Content Showing Raw Markdown Symbols

**Issue:** Users reported that AI-generated content displayed raw markdown symbols (`#`, `**`, `---`, etc.) instead of properly formatted text.

**Root Cause:** The `@tailwindcss/typography` plugin was not installed. While `react-markdown` was properly rendering markdown, the `prose` Tailwind classes used to style the rendered HTML had no effect without the typography plugin.

**Fix Applied:**
1. Installed `@tailwindcss/typography` package: `yarn add @tailwindcss/typography`
2. Added plugin to `/app/frontend/tailwind.config.js`: `require("@tailwindcss/typography")`

**Result:** All markdown elements now render correctly:
- Headings (h1, h2, h3) with proper sizing and weight
- Bold and italic text
- Bullet and numbered lists
- Horizontal rules/dividers
- Code blocks
- Tables

**Files Modified:**
- `/app/frontend/package.json` - Added @tailwindcss/typography dependency
- `/app/frontend/tailwind.config.js` - Added typography plugin

---
## Update 2026-02-15 - Print/PDF Feature for AI Generated Content

### New Feature: Print/Save PDF for AI Materials

**Description:** Added the ability to print or save AI-generated content (quizzes, worksheets, lesson plans) as PDF documents.

**Features:**
1. **Print Button:** Green printer icon appears next to Copy button when content is generated
2. **Professional Print Layout:**
   - TeacherHubPro branded header with logo
   - Content type label (Quiz, Lesson Plan, etc.)
   - Metadata section (Subject, Grade, Topic)
   - Clean typography and formatting
   - Footer with branding
3. **History Tab Integration:** Each history item now has its own Print button
4. **Browser Print Dialog:** Opens native print dialog for saving as PDF or printing directly

**User Flow:**
1. Generate content using AI Assistant
2. Click the green printer icon in the "Contenido Generado" header
3. A new window opens with professionally formatted content
4. Click "Imprimir / Guardar PDF" button to open print dialog
5. Choose "Save as PDF" or print directly

**Files Modified:**
- `/app/frontend/src/pages/AIAssistant.js`
  - Added `Printer` icon import
  - Added `handlePrint()` function with professional formatting
  - Added Print buttons to Generated Content panel
  - Added Print buttons to History items

---
## Update 2026-02-15 - Quick Tour & Audio Guide Updates

### Updated: Quick Tour (WelcomeTour.js)
**New Steps Added:**
1. AI Teaching Assistant - Meet your AI co-teacher
2. Templates & Quick Week - Save and reuse lesson plans  
3. Print & Export PDF - Export AI content as PDF

**Changes:**
- Increased from 9 to 12 steps
- Added new icons: Bot, FileText, Printer
- Updated welcome message to mention AI features
- Updated Lesson Planner description to mention AI generation

### Updated: Audio Guide (VideoStyleGuide.js)
**Major Improvements:**
1. **Auto-Play Audio** - Narration starts automatically when guide opens
2. **Auto-Advance** - Automatically moves to next step when audio finishes (1 second pause between steps)
3. **Pause/Resume Controls** - Users can pause and resume the entire guide
4. **Green "Auto-reproducción" indicator** - Shows when auto-play is active
5. **Skip Step Button** - Jump to next step without waiting

**New Steps Added:**
- Step 4: AI Teaching Assistant
- Step 5: Templates & Quick Week
- Step 6: Print & Export PDF

**Changes:**
- Increased from 9 to 12 steps
- Workflow indicator updated to include AI, Print steps
- Audio caching for better performance
- Fallback behavior if TTS fails (auto-advance after 5s)

**Files Modified:**
- `/app/frontend/src/components/WelcomeTour.js`
- `/app/frontend/src/components/VideoStyleGuide.js`

---
## Update 2026-02-15 - Dark Mode Feature

### New Feature: Dark Mode Toggle

**Description:** Added a full dark mode option for teachers who plan late at night or prefer darker interfaces.

**Features:**
1. **Toggle Button in Sidebar:** Moon/Sun icon with "Oscuro/Claro" (Dark/Light) label
2. **Mobile Header Toggle:** Quick access toggle in mobile header  
3. **Persistent Preference:** Saves to localStorage
4. **System Detection:** Auto-detects OS dark mode preference on first visit
5. **Full Theme Support:** All UI elements properly styled for dark mode

**Technical Implementation:**
- Created `/app/frontend/src/contexts/ThemeContext.js` - Theme state management
- Added `ThemeProvider` to App.js wrapping all other providers
- Updated Layout.js with theme toggle and dark mode compatible classes
- Tailwind already had `.dark` class variables defined in `index.css`

**Dark Mode Colors:**
- Background: Dark slate/navy (#1a1f2e)
- Cards: Slightly lighter dark (#1e2536)
- Text: Light gray/white for contrast
- Accent colors preserved (lime green primary)

**Files Modified:**
- `/app/frontend/src/contexts/ThemeContext.js` (NEW)
- `/app/frontend/src/App.js` - Added ThemeProvider
- `/app/frontend/src/components/Layout.js` - Added toggle and dark classes

---
## Update 2026-02-16 - AI Presentation Creator Backend & Save/Download

### New Feature: AI Presentation Backend (P0 Complete)

**Description:** Implemented complete backend for the AI Presentation Creator, enabling AI-powered slide generation, saving presentations to the database, loading saved presentations, and downloading as HTML.

**Features Implemented:**
1. **AI Presentation Generation** - `POST /api/ai/presentation/generate`
   - Generates 4-8 slides based on topic, subject, and grade level
   - Uses Claude Sonnet 4 via emergentintegrations
   - Returns structured JSON with slide templates, titles, content, and emojis
   - Supports English and Spanish

2. **Presentation CRUD Operations:**
   - `POST /api/ai/presentations` - Save new presentation
   - `GET /api/ai/presentations` - List user's presentations
   - `GET /api/ai/presentations/{id}` - Load specific presentation
   - `PUT /api/ai/presentations/{id}` - Update presentation
   - `DELETE /api/ai/presentations/{id}` - Delete presentation

3. **Frontend Enhancements:**
   - New, Open, Save, Download buttons in header
   - Save dialog with presentation name input
   - Open dialog showing saved presentations list with delete option
   - Download as HTML file for offline use
   - Editing indicator showing current presentation name
   - Full dark mode support

**Database Collection Added:**
- `presentations`: `{ presentation_id, user_id, school_id, name, topic, subject, grade_level, theme_id, slides[], created_at, updated_at }`

**Files Modified:**
- `/app/backend/routes/ai.py` - Added presentation generation and CRUD endpoints (lines 1065-1290)
- `/app/backend/models/__init__.py` - Added PresentationSlide, PresentationCreate, PresentationUpdate, PresentationResponse, AIGeneratePresentationRequest models
- `/app/frontend/src/pages/PresentationCreator.js` - Added save/load/download functionality, state management, and API integration

**Test Results:**
- Backend: 100% (11/11 tests passed)
- Frontend: 100% (all UI flows verified)
- Test report: `/app/test_reports/iteration_11.json`

---
## Current Backlog (Updated 2026-02-16)

### P0 (Critical) - Completed
- ✅ AI Presentation Backend & Save/Download

### P1 (High Priority - Next)
- Complete Backend Refactoring (server.py still has ~2900 lines)
- Drag-and-Drop Seating Chart Editor
- Quick Week Copy (duplicate + shift dates by 7 days)
- Super Admin Bulk Tools (CSV import for teachers)

### P2 (Medium Priority)
- Audit Log for grades/attendance changes
- Google Classroom Integration
- Report card generation

### Technical Debt
- **Refactor `/app/backend/server.py`**: Partially done (auth, ai routes extracted). Remaining: schools, classes, students, plans, attendance, gradebook, dashboard, subscription, super admin routes.
---
## Update 2026-02-16 - UI Enhancements & Transitions

### Features Implemented:

1. **Browser Tab & Favicon**
   - Changed title from "Emergent | Fullstack App" to "TeacherHubPro"
   - Added custom SVG favicon with cyan-blue gradient "T" logo
   - Updated meta description for SEO

2. **Landing Page Hero Update**
   - Changed headline from "The digital planner for your school" to "Your complete classroom in one platform"
   - Updated tagline to mention AI planning, presentations, gradebook, and attendance
   - Updated floating cards to show "AI Lesson Plan" and "Presentaciones - 6 slides"

3. **New AI Presentations Section on Landing Page**
   - Added new section with cyan-blue-purple gradient background
   - Highlights features: AI Generate, 8 Visual Themes, Save & Load, Download HTML
   - Shows "✨ Transiciones activadas" indicator
   - Includes visual demo with slide thumbnails

4. **Presentation Transitions**
   - Added global transition selector with 4 options: None, Fade, Slide, Zoom
   - Transitions apply during presentation mode when navigating between slides
   - CSS animations: fade (opacity), slide (translate-x), zoom (scale)
   - Transition indicator shown at bottom of presentation mode

**Files Modified:**
- `/app/frontend/public/index.html` - Updated title, favicon, and meta description
- `/app/frontend/src/pages/Landing.js` - Updated hero tagline, added AI Presentations section
- `/app/frontend/src/pages/PresentationCreator.js` - Added transition selector and animation logic

**Test Report:** `/app/test_reports/iteration_12.json` - 100% pass rate
---
## Update 2026-02-18 - Image Search Functionality Fix

### Bug Fix: Presentation Creator Image Search (P0 Complete)

**Issue Description:** The image search functionality in the Presentation Creator was completely broken. Users searching for terms like "planets" would see broken image placeholders instead of actual images. The previous implementation used unreliable redirect URLs (`source.unsplash.com`) which returned 503 errors.

**Root Cause:** The backend was using Unsplash Source API redirect URLs which are unreliable and frequently return HTTP 503 errors.

**Solution Implemented:**
1. **Backend Overhaul** (`/app/backend/routes/ai.py`):
   - Created a curated library of ~100+ high-quality educational images from Unsplash
   - Images are organized by educational categories: planets, dinosaurs, ocean, animals, science, math, nature, volcano, space, books, music, sports, art, technology, classroom
   - Direct Unsplash URLs (`images.unsplash.com`) that work reliably
   - Support for Pexels API when key is provided (optional enhancement)
   - Smart keyword matching for any search term

2. **Frontend Cleanup** (`/app/frontend/src/pages/PresentationCreator.js`):
   - Removed all category buttons (Classroom, Science, Math, etc.)
   - Clean free-form search input only
   - Simple empty state with helpful hint text
   - No predefined suggestions - teachers can search anything

**Testing Verified:**
- Search for "planets" returns 8 space/planet images
- Search for "dinosaurs" returns 6 dinosaur images
- Search for "ocean" returns 6 ocean images
- Unknown terms fall back to general educational images
- All image URLs return HTTP 200 and display correctly

**Files Modified:**
- `/app/backend/routes/ai.py` - New curated image library and search endpoint (~150 lines)
- `/app/frontend/src/pages/PresentationCreator.js` - Removed category buttons, simplified search UI

**Code Removed:**
- `stockCategories` array and associated rendering logic
- Quick suggestion buttons (planets, dinosaurs, sea animals, etc.)

**Current Backlog Updated:**
- ✅ Image Search Fix (P0) - Complete
- Remaining P1: "Template of the Week" bug verification, server.py refactoring

---
## Update 2026-02-18 - Pexels API Integration

### Feature: Unlimited Real-Time Image Search (Complete)

**Description:** Integrated Pexels API for unlimited real-time image search, replacing the limited curated library with access to millions of stock photos.

**Implementation:**
1. **Backend** (`/app/backend/routes/ai.py`):
   - Pexels API integration with httpx async client
   - Returns large (800px) and medium (400px) image URLs
   - Falls back to curated library if Pexels API fails
   - Rate limit: 200 requests/hour, 20,000/month (free tier)

2. **Environment Configuration** (`/app/backend/.env`):
   - Added `PEXELS_API_KEY` environment variable

3. **Frontend** (`/app/frontend/src/pages/PresentationCreator.js`):
   - Updated footer text to credit Pexels
   - No other changes needed - backend handles API switching

**API Response Format:**
```json
{
  "images": [
    {
      "id": "pexels_672142",
      "url": "https://images.pexels.com/photos/672142/...",
      "thumb": "https://images.pexels.com/photos/672142/...",
      "alt": "Macro photo of a butterfly..."
    }
  ],
  "query": "butterflies",
  "source": "pexels"
}
```

**Testing Verified:**
- Search "butterflies" → 12 real butterfly images from Pexels
- Search "solar system planets" → 8 space images
- Search "ancient pyramids" → 8 pyramid images
- Any search term now returns relevant real-time results

**Files Modified:**
- `/app/backend/.env` - Added PEXELS_API_KEY
- `/app/frontend/src/pages/PresentationCreator.js` - Updated credit text

**Third-Party Integration Added:**
- **Pexels API** - Free stock photo API with 200 req/hour limit

---
## Update 2026-02-18 - Trial Expiration Enforcement

### Feature: Block Access for Expired Trial Users (Complete)

**Description:** Users whose 7-day free trial has expired are now blocked from accessing the app until they subscribe to a paying plan.

**User Flow After Trial Expiration:**
1. User logs in with expired trial
2. Automatically redirected to Pricing page
3. Yellow alert banner shows: "Your trial period has expired. Select a plan to continue using TeacherHubPro."
4. All protected routes redirect back to Pricing
5. User data is preserved - nothing is deleted
6. User can choose any subscription plan to regain access

**Bypass Conditions:**
- Users with `role: admin` have full access
- Users with `role: super_admin` have full access
- Users with active paid subscriptions have full access

**Backend Changes** (`/app/backend/server.py`):
- Updated `/subscription/status` endpoint to return `has_access: false` when trial expired
- Status changes to `trial_expired` after 7 days
- Message: "Your free trial has expired. Please subscribe to continue using TeacherHubPro."
- Fixed edge case where `days_left: 0` but trial not technically expired

**Frontend Behavior** (`/app/frontend/src/App.js`):
- `ProtectedRoute` component checks subscription status
- Redirects to `/pricing` when `has_access: false`
- Passes `trialExpired: true` state for alert message

**Testing Verified:**
- Created test user with 10-day-old account (expired trial)
- Login successful (account preserved)
- Dashboard access → Redirected to /pricing ✓
- Presentations access → Redirected to /pricing ✓
- Alert banner displayed correctly ✓

**Files Modified:**
- `/app/backend/server.py` - Updated subscription status logic

**Test Credentials:**
- Expired user: `expired@test.com` / `expired123`

---
## Update 2026-02-18 - Trial Expiration Email Reminders

### Feature: Automated Trial Reminder Emails (Complete)

**Description:** Sends email reminders to users 2-3 days before their free trial expires to encourage subscription conversions.

**Implementation:**

1. **Email Template** (`get_trial_reminder_email_html`):
   - Professional HTML email with TeacherHubPro branding
   - Bilingual support (English/Spanish) based on user language preference
   - Yellow alert banner showing days remaining
   - Feature highlights (lesson planning, attendance, presentations, etc.)
   - Call-to-action button linking to /pricing page

2. **API Endpoints:**
   - `POST /api/subscription/send-trial-reminders` - Batch send reminders (admin only)
   - `POST /api/subscription/test-reminder-email` - Send test email to current user
   
3. **Reminder Logic:**
   - Checks all teacher accounts
   - Finds users whose trial expires in 2-3 days
   - Skips users with active subscriptions
   - Prevents duplicate emails (24-hour cooldown via `trial_reminders` collection)
   - Records sent reminders for tracking

**Database Collections:**
- `trial_reminders`: Tracks sent reminder emails
  - `user_id`, `email`, `days_left`, `sent_at`, `email_id`

**Email Service:**
- Uses Resend API for transactional emails
- SENDER_EMAIL: onboarding@resend.dev (test mode)
- Note: To send to any address, verify a domain at resend.com/domains

**Scheduling:**
- Endpoint can be called by external cron job daily
- Supports `X-API-Key` header for automated invocation

**Files Modified:**
- `/app/backend/server.py` - Added trial reminder functions and endpoints (~200 lines)
- `/app/backend/.env` - Added RESEND_API_KEY and SENDER_EMAIL

**Testing:**
- Created test user `reminder_test@test.com` with 2 days trial left
- Verified endpoint correctly identifies users in reminder window
- Email template generates correctly in both languages
- Resend API integration working (limited to verified emails in test mode)

---
## Update 2026-02-18 - Generic Default School Template

### Issue Fixed: School-Specific Information Visible to New Users

**Problem:** New users were seeing "Colegio Inmaculada" information (name, address, phone, logo) which is private school data that should not be the default for all users.

**Solution:** Created a generic default template for new users with no pre-filled private school information.

**Changes Made:**

1. **Database Update:**
   - Updated `school_default` in MongoDB to have generic values:
     - name: "My School"
     - address: "" (empty)
     - phone: "" (empty)
     - email: "" (empty)
     - logo_url: "" (empty)

2. **Frontend - PlanPrintView.js:**
   - Changed default school name from "Colegio De La Inmaculada Concepción" to "My School"
   - Removed hardcoded address, phone, and email fallbacks
   - Now only displays contact info if user has configured it

3. **Frontend - Settings.js:**
   - Updated all placeholders to generic bilingual text:
     - School name: "Your school name" / "Nombre de tu escuela"
     - Address: "School address" / "Dirección de la escuela"
     - Phone: "Phone number" / "Número de teléfono"
   - Removed all Puerto Rico-specific references

4. **Frontend - AdminPanel.js:**
   - Updated school name placeholder to generic "School name"

5. **Frontend - Landing.js:**
   - Changed demo school names to generic examples (Valley High School, Riverside Academy, etc.)
   - Changed branding preview from "Colegio San José" to "Tu Escuela" / "Your School"

**Files Modified:**
- `/app/frontend/src/components/PlanPrintView.js`
- `/app/frontend/src/pages/Settings.js`
- `/app/frontend/src/pages/AdminPanel.js`
- `/app/frontend/src/pages/Landing.js`
- MongoDB `schools` collection (school_default document)

**User Experience:**
- New users see generic "My School" as their default
- All placeholders are now generic and bilingual
- Users customize their school info in Settings
- No private school data is exposed to other users

---
## Update 2026-02-18 - Unique Schools Per User (Critical Fix)

### Issue Fixed: New Users Seeing Other School's Private Information

**Problem:** All new users were assigned to a shared `school_default` record. If any user customized that school with their info (like "Colegio Inmaculada"), ALL new users would see that private data.

**Root Cause:** The registration logic assigned all new users to a single shared `school_default` school ID.

**Solution:** Each new user now gets their OWN unique school record upon registration.

**Implementation:**

1. **Email/Password Registration** (`server.py` + `routes/auth.py`):
   - New users get unique school ID: `school_{user_id_suffix}`
   - School created with generic data: "My School", empty address/phone/logo
   - `owner_user_id` field tracks school ownership

2. **Google OAuth Registration** (`server.py` + `routes/auth.py`):
   - Same unique school creation logic
   - Existing users without schools get one created on next login

**Database Schema - New School Record:**
```json
{
  "school_id": "school_abc123def456",
  "name": "My School",
  "address": "",
  "phone": "",
  "email": "",
  "logo_url": "",
  "created_at": "2026-02-18T...",
  "owner_user_id": "user_abc123def456"
}
```

**Files Modified:**
- `/app/backend/server.py` - Updated register and google_callback functions
- `/app/backend/routes/auth.py` - Updated register and google_callback functions

**Testing Verified:**
- New user `newschool@test.com` registered
- Got unique school `school_dbc85bbfdd4f`
- Dashboard shows "My School" (generic)
- No Inmaculada data visible

**Important Note:**
- Existing users who were assigned to `school_default` may still see whatever data was in that record
- Those users should update their school info in Settings
- Super Admin can reassign users to different schools if needed

---
## Update 2026-02-18 - User Onboarding System

### Feature: New User Onboarding (Complete)

**Description:** Comprehensive onboarding system to guide new users through initial setup.

**Implementation:**

1. **Backend - User Profile Fields:**
   - `onboarding_status`: "not_started" | "in_progress" | "completed" | "dismissed"
   - `first_login_at`: DateTime when user first logged in
   - `settings_completed_at`: DateTime when setup was completed

2. **Backend - New Endpoints:**
   - `GET /api/auth/onboarding-status` - Returns onboarding progress with setup checklist
   - `PUT /api/auth/onboarding-status` - Update onboarding status (dismiss, complete)

3. **Setup Completion Detection (Option C):**
   - Checks actual data, not just flags:
     - `school_info`: School name is not "My School" (customized)
     - `first_class`: At least 1 class created
     - `first_planner`: At least 1 lesson plan created
   - Auto-marks complete when all 3 items are done

4. **Frontend - OnboardingBanner Component:**
   - Welcome modal on first login with 3 setup steps
   - Persistent progress banner on dashboard
   - Clickable step buttons that navigate to correct pages
   - Progress bar showing completion percentage
   - Dismiss (X) button to hide banner

**User Experience Flow:**
1. New user registers → sees welcome modal
2. Can click "Start Setup" → goes to Settings
3. Or click "Later" → sees persistent banner on dashboard
4. Banner shows progress: "0 / 3 completed"
5. Click any incomplete step → navigates to that page
6. When all 3 steps complete → banner disappears
7. User can dismiss banner early if desired

**Files Created:**
- `/app/frontend/src/components/OnboardingBanner.js` (new component)

**Files Modified:**
- `/app/backend/server.py` - Added onboarding fields and endpoints
- `/app/backend/routes/auth.py` - Added onboarding fields to registration
- `/app/frontend/src/pages/Dashboard.js` - Added OnboardingBanner import/render

**Bilingual Support:**
- All labels in English and Spanish
- Detects user's language preference automatically

**API Response Example:**
```json
{
  "onboarding_status": "not_started",
  "setup_items": {
    "school_info": {"completed": false, "label_en": "School Information"},
    "first_class": {"completed": false, "label_en": "Create Your First Class"},
    "first_planner": {"completed": false, "label_en": "Create Your First Planner"}
  },
  "completed_count": 0,
  "total_count": 3,
  "show_onboarding": true
}
```

---
## Update 2026-02-18 - Video Walkthrough in Welcome Modal

### Feature: Animated Video Tutorial (Complete)

**Description:** Added an animated slideshow tutorial to the welcome modal with 5 steps that guide new users through the setup process.

**Implementation:**

1. **Two-Tab Interface:**
   - **"Ver Tutorial"** (Watch Tutorial) - Animated slideshow
   - **"Lista de Pasos"** (Setup Checklist) - Interactive checklist

2. **Video Slideshow (5 slides):**
   - Slide 1: "Welcome to TeacherHubPro" - Introduction
   - Slide 2: "Step 1: School Settings" - Configure school info
   - Slide 3: "Step 2: Create Classes" - Set up classes
   - Slide 4: "Step 3: Plan Your Lessons" - Create lesson plans
   - Slide 5: "You're Ready!" - Completion message

3. **Slideshow Features:**
   - Auto-play with "Reproducir" (Play) button
   - Manual navigation with prev/next arrows
   - Dot indicators to jump between slides
   - Duration estimate (~1 min)
   - Beautiful gradient backgrounds with relevant images

4. **Persistent Access:**
   - "Ver tutorial" link in the banner to reopen modal anytime
   - Users can switch between video and checklist tabs

**Visual Design:**
- Each slide has unique gradient color scheme
- Background images from Unsplash (education-themed)
- Large icons for each step
- Bilingual content (English/Spanish)

**Files Modified:**
- `/app/frontend/src/components/OnboardingBanner.js` - Complete rewrite with video slideshow

**User Flow:**
1. New user logs in → Modal opens with Video tab active
2. User can watch slideshow or switch to Checklist tab
3. After dismissing modal, banner remains with "Ver tutorial" link
4. User can reopen modal anytime to review tutorial

---
## Update 2026-02-18 - Video Tutorial with Voice Narration

### Feature: Onboarding Video with TTS Voice (Complete)

**Description:** Professional video walkthrough with AI-generated voice narration that guides new users through the complete setup process.

**8 Scenes (following the provided script):**

1. **Welcome Screen** (0:00–0:10)
   - "Welcome to TeacherHubPro — your AI-powered lesson planning assistant"
   
2. **Step Overview** (0:10–0:20)
   - Overview of the 3 setup steps with icons
   
3. **School Settings** (0:20–0:55)
   - Fields: Logo URL, School Name, Address, Phone & Email
   - Tip: "Your branding will appear on all exported lesson plans"
   
4. **Create First Class** (0:55–1:35)
   - Fields: Class Name, Grade & Section, Subject, School Year
   - Tip: "You can add unlimited classes anytime"
   
5. **Weekly Planner** (1:35–2:20)
   - Fields: Select Class, Unit & Title, Date Range, Objectives
   
6. **AI Lesson Generation** (2:20–2:40)
   - Highlight "Generate with AI" feature
   - Tip: "AI generates content based on your class and topic"
   
7. **Templates & Export** (2:40–3:00)
   - Features: Ready-made Templates, Duplicate Plans, Export to PDF
   
8. **Closing** (3:00–3:10)
   - "You're ready to start planning smarter!"
   - Call-to-action: "Start Setup" button

**Technical Implementation:**

1. **Voice Generation:**
   - Uses OpenAI TTS via `/api/tts/generate` endpoint
   - Spanish voice: "nova"
   - English voice: "alloy"
   - Audio caching to prevent re-generation

2. **Playback Controls:**
   - Play/Pause button
   - Mute/Unmute
   - Skip to end
   - Scene dots for manual navigation
   - Auto-advance when audio finishes

3. **Visual Design:**
   - Each scene has unique gradient color
   - Background images from Unsplash (education-themed)
   - Dynamic content (fields, tips, features) per scene
   - Progress bar showing position

**Files Created:**
- `/app/frontend/src/components/OnboardingVideo.js` - Full video tutorial component

**Files Modified:**
- `/app/frontend/src/components/OnboardingBanner.js` - Integrated OnboardingVideo

**User Flow:**
1. New user logs in → Video tutorial opens automatically
2. User can Play to hear narration or navigate manually
3. Each scene narrates specific setup instructions
4. "Comenzar" (Start Setup) navigates to Settings
5. "Ver tutorial con audio" link in banner reopens video anytime

**Bilingual Support:**
- All narrations in English and Spanish
- Voice changes based on user's language preference
