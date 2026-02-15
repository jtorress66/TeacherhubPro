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
- Frontend: https://classmate-128.preview.emergentagent.com
- Backend API: https://classmate-128.preview.emergentagent.com/api

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


