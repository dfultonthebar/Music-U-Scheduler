# CLAUDE.md - Music U Scheduler

## Project Overview

Music U Scheduler is a comprehensive music lesson scheduling application with:
- **Frontend**: Next.js 14 with React, TypeScript, and shadcn/ui components
- **Backend**: FastAPI (Python) with SQLAlchemy ORM
- **Database**: SQLite (app.db) with Alembic migrations
- **Authentication**: JWT tokens with backend session management

## Architecture

```
Music-U-Scheduler/
├── app/                           # Main application code
│   ├── api/routers/               # FastAPI route handlers (Python)
│   │   ├── admin.py               # Admin endpoints (/admin/*)
│   │   ├── instructor.py          # Instructor endpoints
│   │   ├── lessons.py             # Lesson CRUD
│   │   ├── users.py               # User management
│   │   ├── web_admin.py           # Web admin routes
│   │   └── web_instructor.py      # Web instructor routes
│   ├── auth/                      # FastAPI auth logic
│   │   ├── dependencies.py        # JWT auth dependencies
│   │   ├── routers.py             # Auth endpoints
│   │   └── utils.py               # Password/token utilities
│   ├── services/                  # Backend services
│   │   ├── email.py               # SMTP email service
│   │   └── yodeck.py              # Yodeck digital signage
│   ├── app/                       # Next.js app directory
│   │   ├── admin/                 # Admin dashboard page
│   │   ├── api/auth/[...nextauth] # NextAuth API routes
│   │   ├── dashboard/             # General dashboard
│   │   ├── forgot-password/       # Password reset request
│   │   ├── instructor/            # Instructor dashboard
│   │   ├── login/                 # Login page
│   │   ├── register/              # Student registration
│   │   └── reset-password/        # Password reset
│   ├── components/                # React components
│   │   ├── admin/                 # Admin components (11 files)
│   │   │   ├── admin-dashboard.tsx
│   │   │   ├── data-export.tsx
│   │   │   ├── email-settings.tsx
│   │   │   ├── github-updates.tsx
│   │   │   ├── lesson-scheduler.tsx
│   │   │   ├── role-management.tsx
│   │   │   ├── system-backup.tsx
│   │   │   ├── user-management.tsx
│   │   │   ├── version-management.tsx
│   │   │   └── yodeck-integration.tsx
│   │   ├── auth/                  # Auth components
│   │   │   ├── forgot-password-form.tsx
│   │   │   ├── login-form.tsx
│   │   │   ├── reset-password-form.tsx
│   │   │   ├── role-selection.tsx
│   │   │   └── student-registration-form.tsx
│   │   ├── instructor/            # Instructor components
│   │   │   ├── availability-manager.tsx
│   │   │   ├── days-off-manager.tsx
│   │   │   └── instructor-dashboard.tsx
│   │   ├── layout/                # Layout components
│   │   │   └── protected-route.tsx
│   │   └── ui/                    # shadcn/ui components (40+ files)
│   ├── contexts/                  # React context providers
│   │   └── auth-context.tsx
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-toast.ts
│   │   └── useAuth.ts
│   ├── lib/                       # Frontend utilities
│   │   ├── api.ts                 # API client class
│   │   ├── auth.ts                # NextAuth configuration
│   │   ├── timezone.ts            # CST timezone formatting
│   │   ├── types.ts               # TypeScript interfaces
│   │   ├── utils.ts               # Utility functions
│   │   └── version.ts             # Version info
│   ├── main.py                    # FastAPI app entry point
│   ├── models.py                  # SQLAlchemy models
│   ├── schemas.py                 # Pydantic schemas
│   ├── crud.py                    # CRUD operations
│   └── database.py                # Database connection
├── alembic/                       # Database migrations
├── scripts/                       # Utility scripts
│   ├── create_admin.py            # Admin user creation
│   └── db_init.py                 # Database initialization
├── tests/                         # Test suite
│   ├── test_api_*.py              # API tests
│   ├── test_*_playwright.py       # Playwright UI tests
│   └── test_comprehensive_*.py    # Full integration tests
├── uploads/                       # User uploads (profile images)
├── music-u-env/                   # Python virtual environment
├── app.db                         # SQLite database file
├── setup-production.sh            # Production deployment script
├── start-all.sh                   # Start both services
├── start-backend.sh               # Start backend only
├── start-frontend.sh              # Start frontend only
├── manage-services.sh             # Service management
├── download-update.sh             # Update from GitHub
├── clear-sessions.sh              # Clear user sessions
├── README.md                      # Project readme
├── CLAUDE.md                      # Technical documentation
├── CHANGELOG.md                   # Version history
└── TROUBLESHOOTING.md             # Support guide
```

## Running the Application

### Services
- **Backend**: Port 8080 - FastAPI with uvicorn
- **Frontend**: Port 3000 - Next.js dev server

### Commands
```bash
# Start backend
./music-u-env/bin/uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

# Start frontend
cd app && npm run dev

# Or use the scripts
./start-all.sh
./manage-services.sh start|stop|restart|status
```

### Access URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- API Docs: http://localhost:8080/docs
- Default Admin: admin / MusicU2025

### Production Deployment
```bash
# Run setup script (as root)
sudo ./setup-production.sh

# This creates systemd services for auto-start on boot:
# - music-u-backend.service (port 8080)
# - music-u-frontend.service (port 3000)

# Service management commands
systemctl start music-u-backend music-u-frontend
systemctl stop music-u-backend music-u-frontend
systemctl restart music-u-backend music-u-frontend
systemctl status music-u-backend music-u-frontend

# View logs
tail -f /var/log/music-u/backend.log
tail -f /var/log/music-u/frontend.log
```

## Key Technologies

### Backend (Python)
- FastAPI with automatic OpenAPI documentation
- SQLAlchemy ORM with SQLite
- Pydantic for request/response validation
- JWT authentication with python-jose
- Password hashing with passlib/bcrypt

### Frontend (TypeScript/React)
- Next.js 14 with App Router
- shadcn/ui component library (Radix UI primitives)
- Tailwind CSS for styling
- Sonner for toast notifications
- Lucide React for icons

## Database Models

### User (models.py)
```python
- id, email, username, full_name
- hashed_password
- role: UserRole (admin, instructor, student)
- is_teacher: bool (legacy, use role instead)
- is_active: bool
- phone, address, emergency_contact, notes
- hourly_rate (instructors)
- specializations (instructors - JSON string of instruments)
- instrument (students - primary instrument)
- default_break_minutes (0, 5, 10, 15)
```

### Lesson (models.py)
```python
- id, title, description
- teacher_id, student_id (FK to users)
- scheduled_at (datetime)
- duration_minutes, break_after_minutes
- instrument, lesson_type
- status: LessonStatus (scheduled, completed, cancelled, rescheduled)
- notes, instructor_notes, admin_notes
- cost, location, room_number
```

### InstructorAvailability (models.py)
```python
- id, instructor_id
- day_of_week (0=Monday, 6=Sunday)
- start_time, end_time
- is_active
```

### AvailabilityException (models.py)
```python
- id, instructor_id
- exception_date
- is_full_day
- start_time, end_time (if not full day)
- reason
```

### PasswordResetToken (models.py)
```python
- id, user_id
- token (unique, indexed)
- expires_at
- used (bool)
- created_at
```

## API Endpoints

### Authentication (/auth)
- POST /auth/register - Create new user
- POST /auth/login - Login, returns JWT token
- GET /auth/me - Get current user
- POST /auth/change-password - Change password
- POST /auth/forgot-password - Request password reset token
- POST /auth/reset-password - Reset password with token
- GET /auth/verify-reset-token/{token} - Verify if reset token is valid

### Admin (/admin)
- GET /admin/dashboard - Dashboard stats
- GET/POST /admin/users - List/create users
- GET/PUT/DELETE /admin/users/{id} - User CRUD
- GET /admin/instructors - List instructors with availability
- GET /admin/students - List all students
- GET /admin/instructors/{id}/students - Students assigned to instructor
- GET/POST /admin/lessons - Lesson management
- GET /admin/audit-logs - Audit trail

### Instructor (/instructor)
- GET /instructor/dashboard - Instructor dashboard
- GET /instructor/students - Instructor's students
- GET /instructor/lessons - Instructor's lessons
- GET/POST /instructor/availability - Weekly availability
- GET/POST /instructor/days-off - Days off management

## Frontend Components

### Admin Dashboard (app/app/admin/page.tsx)
Uses tabs for different sections:
- Dashboard stats
- User Management (user-management.tsx)
- Lesson Scheduler (lesson-scheduler.tsx)
- Instructor Availability (availability-manager.tsx)
- Days Off (days-off-manager.tsx)
- Role Management
- System Settings

### Key Admin Components
- `user-management.tsx` - Create/edit/delete users, assign instruments
- `lesson-scheduler.tsx` - Schedule lessons with instructor/student filtering
- `availability-manager.tsx` - Manage instructor weekly schedules
- `days-off-manager.tsx` - Manage instructor time off

## API Client (lib/api.ts)

The `APIClient` class handles all backend communication:
```typescript
const api = new APIClient();
api.setToken(jwtToken);

// Methods
api.login(username, password)
api.getCurrentUser()
api.getUsers()
api.createUser(userData)
api.updateUser(id, data)
api.deleteUser(id)
api.getInstructorsForScheduling()
api.getStudentsByInstructor(instructorId)
api.getAllStudentsForScheduling()
api.getLessons()
api.createLesson(data)
// ... etc
```

## Common Patterns

### Creating Users
Users are created via POST /admin/users with:
```typescript
{
  username: string,
  email: string,
  password: string,  // Min 8 characters
  full_name: string,
  role: 'instructor' | 'student',
  is_teacher: boolean,
  phone?: string,
  instrument?: string,      // For students
  specializations?: string  // For instructors (comma-separated)
}
```

### Student-Instructor Relationships
There's no direct FK between students and instructors. Relationships are determined by querying the Lessons table for distinct student_ids per instructor.

### Authentication Flow
1. User logs in via /auth/login
2. Backend returns JWT token
3. Frontend stores token in AuthContext
4. API client includes token in Authorization header
5. Backend validates token on protected routes

## Database Migrations

Using Alembic for schema changes:
```bash
# Create migration
./music-u-env/bin/alembic revision --autogenerate -m "description"

# Run migrations
./music-u-env/bin/alembic upgrade head

# Manual column addition (SQLite)
./music-u-env/bin/python -c "
from sqlalchemy import create_engine, text
engine = create_engine('sqlite:///app.db')
with engine.connect() as conn:
    conn.execute(text('ALTER TABLE users ADD COLUMN new_column TEXT'))
    conn.commit()
"
```

## Coding Conventions

### Backend (Python)
- Use Pydantic schemas for request/response validation
- Add new routes in appropriate router file
- Include routes in main.py
- Use SQLAlchemy models for database operations
- Log actions to audit_logs table for admin operations

### Frontend (TypeScript)
- Use shadcn/ui components from components/ui/
- Add API methods to lib/api.ts
- Define types in lib/types.ts
- Use Sonner toast for notifications
- Follow existing component patterns in components/admin/

## Debugging

### Check Server Status
```bash
curl http://localhost:8080/health
curl http://localhost:3000
```

### View Backend Logs
Backend runs with --reload flag, check terminal output

### Common Issues
- Port in use: `fuser -k 8080/tcp` or `fuser -k 3000/tcp`
- Database schema mismatch: Run Alembic migration or add column manually
- Auth issues: Check JWT token in browser DevTools > Application > Local Storage
- API errors: Check browser Network tab and backend terminal

## Testing

### Test Suite
The project includes comprehensive automated tests in the `/tests` directory:

```bash
# Run API tests
./music-u-env/bin/python tests/test_api_endpoints.py

# Run UI tests (requires Playwright)
./music-u-env/bin/python tests/test_comprehensive_ui.py
```

### Test Results Summary (2025-12-09)

**API Tests**: 30 passed, 0 failed, 3 warnings
- All authentication endpoints working
- All admin CRUD operations working
- All lesson operations working
- All availability/scheduling endpoints working

**UI Tests**: 44 passed, 1 failed, 4 warnings
- All page loads working
- All admin dashboard tabs accessible
- User management forms working
- Responsive design verified across mobile/tablet/desktop

### Issues Fixed During Testing

1. **Database Schema Mismatch** (500 errors)
   - Missing `break_after_minutes` column in lessons table
   - Fixed by running: `ALTER TABLE lessons ADD COLUMN break_after_minutes INTEGER DEFAULT 0`

2. **Availability Endpoint Usage**
   - `/instructor/availability` - Returns current authenticated instructor's availability
   - `/admin/scheduling/instructors/{id}/availability` - Admin endpoint for querying by instructor ID

## Admin Dashboard Structure

The admin dashboard uses these tab values (from `admin-dashboard.tsx`):
- `dashboard` - Overview stats
- `user-management` - User CRUD
- `role-management` - Role permissions
- `schedule` - Scheduling view
- `lessons` - Lesson management
- `email-settings` - Email configuration
- `backup` - System backups
- `updates` - GitHub updates
- `version` - Version history
- `settings` - System settings
- `audit-logs` - Activity logs
- `reports` - Usage reports

## Instructor Dashboard Structure

The instructor dashboard tabs (from `instructor-dashboard.tsx`):
- `dashboard` - Overview
- `profile` - Instructor profile
- `lessons` - Instructor's lessons
- `students` - Assigned students
- `schedule` - Personal schedule
- `availability` - Weekly availability
- `days-off` - Time off management
- `reports` - Personal reports

## Admin Scheduling Endpoints

Additional scheduling endpoints for admin:
```
GET  /admin/scheduling/instructors/{id}/availability - Instructor availability
GET  /admin/scheduling/instructors/{id}/days-off - Instructor days off
POST /admin/scheduling/validate - Validate proposed lesson time
GET  /admin/scheduling/available-slots - Get available time slots
```

## Known Warnings

These are expected behaviors, not bugs:
- Instructor endpoints return 403 for admin users (role-based access)
- Lesson delete may return 404 if lesson already deleted
- Admin redirects to /admin when accessing /instructor (correct role handling)
