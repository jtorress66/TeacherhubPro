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
- Frontend: https://teacherdash-2.preview.emergentagent.com
- Backend API: https://teacherdash-2.preview.emergentagent.com/api

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

- Google Classroom Integration
- Report card generation

