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

## What's Been Implemented (2026-02-10)

### Backend (/app/backend/server.py)
- Complete FastAPI application with 40+ endpoints
- Auth: register, login, logout, session, profile
- Classes: CRUD + students management
- Lesson Plans: CRUD + duplicate + templates
- Attendance: sessions, records, reports
- Gradebook: categories, assignments, grades bulk update
- Dashboard aggregation endpoint

### Frontend (/app/frontend/src/)
- 10 pages: Landing, AuthCallback, Dashboard, PlannerList, LessonPlanner, Attendance, Gradebook, Classes, Settings
- Bilingual context with 100+ translations
- Auth context with session management
- Layout component with responsive sidebar
- Design following Paper & Ink aesthetic

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
- Frontend: https://classmate-125.preview.emergentagent.com
- Backend API: https://classmate-125.preview.emergentagent.com/api

## Database Collections
- users, user_sessions, schools
- classes, students
- lesson_plans
- attendance_sessions
- grade_categories, assignments, grades
