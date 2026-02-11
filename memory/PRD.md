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
- Design following Paper & Ink aesthetic
- **Pricing section on Landing page** (visible to unauthenticated users)
- **Subscription status on Settings page**

### Stripe Integration (2026-02-11)
- Individual Monthly: $9.99/month
- Individual Yearly: $79/year (Save $40)
- School Plan: $6/teacher/month (min 10 teachers)
- District Plan: $4/teacher/month (min 100 teachers)
- 7-day free trial for all new users
- Admin role bypasses payment requirements

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

### P0 (Critical - Next Phase)
- PDF export matching school's paper format
- Print-friendly styles

### P1 (High Priority)
- Templates gallery
- Duplicate last week with date shift
- Attendance reports by date range
- Student grade view

### P2 (Medium Priority)
- Bulk student import (CSV)
- Seating chart
- Behavior/notes log
- Substitute packet generation
- File repository

### P3 (Future)
- Parent/student portal (read-only)
- Email notifications for absences
- Google Classroom integration
- Admin panel with school-wide reporting

## Next Tasks
1. Implement PDF export with school format
2. Add template gallery page
3. Build attendance reports view
4. Add bulk CSV import for students
5. Implement seating chart drag/drop

## URLs
- Frontend: https://teach-planner-4.preview.emergentagent.com
- Backend API: https://teach-planner-4.preview.emergentagent.com/api

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
