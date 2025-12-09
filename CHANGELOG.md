
# Changelog

All notable changes to the Music U Scheduler project will be documented in this file.

## [1.5.0] - 2025-12-09

### Major Feature Release - Enhanced Admin & Integration Features

This release adds 6 major new features for improved admin functionality and digital signage integration.

### Added
- **Data Export (CSV)** - Export students, instructors, lessons, and attendance data to CSV format with date range filtering
- **Recurring Lesson Templates** - Create reusable lesson templates with recurrence patterns (daily, weekly, bi-weekly, monthly)
- **Student Self-Registration Portal** - Public registration page at `/register` with admin approval workflow
- **Instructor Profile Pictures** - Upload and manage profile images for instructors with bio text support
- **Yodeck Digital Signage Integration** - Connect to Yodeck API to create instructor slideshow cards for digital displays
- **Registration Approval System** - Admin dashboard for approving/rejecting student registration requests

### New Components
- `app/components/admin/data-export.tsx` - Data export UI with date pickers and format selection
- `app/components/admin/lesson-templates.tsx` - Template management with recurrence settings
- `app/components/admin/registration-approval.tsx` - Registration approval queue
- `app/components/admin/yodeck-integration.tsx` - Yodeck configuration and sync controls
- `app/components/shared/profile-image-upload.tsx` - Reusable profile image upload component
- `app/app/register/page.tsx` - Public student registration page
- `app/services/yodeck.py` - Yodeck API service class

### New API Endpoints
- `GET/POST /admin/lesson-templates` - Template CRUD operations
- `POST /admin/lesson-templates/{id}/generate` - Generate lessons from template
- `GET /admin/export/students|instructors|lessons|attendance` - CSV export endpoints
- `GET/POST /admin/yodeck/settings|status|sync-instructors` - Yodeck integration
- `POST /admin/users/{id}/profile-image` - Profile image upload
- `POST /auth/register/student` - Public student registration (no auth required)
- `GET/POST /admin/registrations` - Registration approval management

### Database Changes
- Added `lesson_templates` table for recurring lesson templates
- Added `student_registrations` table for registration requests
- Added `profile_image` and `bio` columns to users table

### Infrastructure
- Created `/uploads/profiles/` directory for profile image storage
- Static file serving for uploaded images at `/uploads` route

---

## [1.4.0] - 2025-12-09

### Admin Enhancements & Email Configuration

### Added
- **Email Server Settings** - Complete SMTP/IMAP configuration with test email functionality
- **Password Reset System** - Secure token-based password reset with email notifications
- **Production Service Files** - systemd service files for auto-start on boot
- **Consolidated Documentation** - Cleaned up redundant documentation files

### Fixed
- Password reset token validation and expiration handling
- Email settings persistence in system settings
- Service auto-restart on failure

---

## [1.3.02] - 2025-08-17

### 🛠️ User Management Fixes

This patch resolves all user creation and management issues in the admin dashboard.

### 🔧 Fixed
- **User Creation Validation Errors** - Resolved 422 validation errors preventing user creation
- **API Payload Field Mapping** - Fixed field mapping issues (first_name/last_name → full_name)
- **Instructor Role Assignment** - Fixed 404 errors in instructor role management endpoints
- **Missing API Endpoints** - Added `/admin/instructors/{id}/roles` endpoint for role retrieval
- **User Role Filtering** - Enhanced role filtering to use proper UserRole.INSTRUCTOR enum
- **API Service Payload** - Improved payload transformation in frontend API service

### ✅ Verified
- **Student Creation**: ✅ Working perfectly with proper validation
- **Instructor Creation**: ✅ Working seamlessly with role assignment
- **User Deletion**: ✅ Both students and instructors can be deleted
- **Instructor Role Management**: ✅ Role assignment and removal working
- **Field Validation**: ✅ All required fields properly validated

### 📋 Impact
- **Critical**: Resolves complete inability to add users via admin dashboard
- **Functionality**: Enables full user management capabilities
- **Stability**: Eliminates API 422 and 404 errors in user management
- **Performance**: Optimized API payload processing and validation

## [1.3.01] - 2025-08-17

### 🚨 Critical Authentication Fixes

This is a critical patch that resolves major authentication issues preventing user login.

### 🔧 Fixed
- **NextAuth.js Compilation Errors** - Resolved webpack compilation failures in NextAuth routes
- **Missing Environment Variables** - Added required NEXTAUTH_SECRET for secure session handling
- **Session Cookie Failures** - Fixed NextAuth session creation and persistence issues
- **TypeScript Build Errors** - Corrected type errors preventing frontend compilation
- **Route Configuration Issues** - Updated NextAuth API routes for Next.js 14 compatibility
- **JWT Session Management** - Enhanced cookie and session handling for better reliability
- **Frontend Build Process** - Resolved all TypeScript and build errors

### ✅ Verified
- **Admin Login Credentials**: Username: `admin`, Password: `MusicU2025`
- **Backend Authentication**: JWT token generation working correctly
- **Frontend/Backend Integration**: Seamless authentication flow restored
- **Service Stability**: Both frontend (port 3000) and backend (port 8080) running reliably

### 📋 Impact
- **Critical**: Resolves complete login failure affecting all users
- **Security**: Improves session security with proper NEXTAUTH_SECRET
- **Stability**: Eliminates NextAuth compilation and runtime errors
- **Performance**: Optimized authentication flow and error handling

## [1.3.00] - 2025-08-16

### 🎉 Production Release - Complete Authentication Integration

This release marks the completion of full authentication integration between the NextJS frontend and FastAPI backend, making the application production-ready.

### ✨ Added
- **Complete Authentication Integration** - NextAuth.js now fully integrated with backend JWT authentication
- **Seamless User Management** - Frontend admin dashboard fully functional with backend user/role management
- **Token Management** - Automatic JWT token handling for all API requests
- **Comprehensive Testing** - Complete test suite for authentication flow verification
- **Enhanced Security** - Proper password hashing and validation across frontend/backend
- **Admin Dashboard** - Fully functional admin features including user creation, role management
- **Email & Backup Settings** - Complete admin configuration options
- **Production Documentation** - Detailed integration guides and troubleshooting docs

### 🔧 Fixed
- **Authentication Flow** - Resolved all 401 Unauthorized errors
- **User Creation** - Fixed frontend user registration with backend validation
- **Session Management** - Proper JWT token storage and retrieval in NextAuth sessions
- **API Communication** - All admin endpoints now working correctly
- **Password Validation** - Fixed bcrypt compatibility issues
- **Frontend/Backend Sync** - Complete integration between authentication systems

### 📖 Documentation
- `COMPLETE_AUTHENTICATION_INTEGRATION.md` - Full documentation of authentication fixes
- Updated test scripts with comprehensive authentication verification
- Production-ready deployment instructions

## [2.0.0] - 2025-08-15

### 🎉 Major Release - Fixed Installation & Deployment

This release represents a complete overhaul of the installation and deployment process, making the Music U Scheduler much easier to install and run.

### ✨ Added
- **Fixed Installation Script** (`install-fixed.sh`) - One-command installation that handles all dependencies
- **Service Management** - Easy start/stop/restart of all services with `manage-services.sh`
- **Comprehensive Documentation** - Updated README with complete setup instructions
- **Troubleshooting Guide** - Detailed guide for common issues and solutions
- **Environment Auto-Configuration** - Automatic setup of all required environment variables
- **Port Conflict Resolution** - Automatic detection and resolution of port conflicts
- **Startup Scripts** - Individual and combined service startup scripts
- **Installation Validation** - Comprehensive testing of installation success

### 🔧 Fixed
- **Yarn Permission Issues** - Automatic fallback to npm when yarn has permission problems
- **Backend Import Errors** - Corrected Python module imports and PYTHONPATH setup
- **Frontend Build Issues** - Fixed Next.js build and dependency management
- **Database Initialization** - Proper SQLite database setup and table creation
- **CORS Configuration** - Fixed cross-origin request handling
- **Authentication Setup** - Proper NextAuth configuration and secrets generation
- **Service Dependencies** - Correct startup order and dependency management

### 🏗️ Infrastructure
- **Robust Error Handling** - Installation script handles various failure scenarios
- **Logging System** - Comprehensive logging for debugging and monitoring
- **Health Checks** - Added health check endpoints and service status monitoring
- **Process Management** - Proper background process handling and cleanup
- **Development Tools** - Enhanced development workflow with hot-reload

### 📚 Documentation
- **Complete README** - Comprehensive setup and usage documentation
- **Troubleshooting Guide** - Detailed solutions for common problems
- **API Documentation** - Updated FastAPI documentation
- **Installation Guide** - Step-by-step installation instructions

### 🚀 Deployment
- **One-Line Installation** - Single command to install and run the entire system
- **Service Management** - Easy management of all application services
- **Production Ready** - Configuration options for production deployment
- **Cross-Platform** - Works on various Linux distributions

## [1.0.0] - Previous Versions

### Features Carried Forward
- **Authentication System** - JWT-based authentication with role management
- **Admin Dashboard** - Complete administrative interface
- **Instructor Portal** - Instructor management and scheduling tools
- **Student Management** - User profiles and lesson booking
- **Lesson Scheduling** - Calendar-based lesson scheduling system
- **Reporting & Analytics** - Basic reporting functionality
- **Database Integration** - SQLite/PostgreSQL support
- **API Documentation** - FastAPI automatic documentation
- **Frontend Interface** - Next.js-based responsive web interface

### Previous Issues (Now Fixed)
- Complex installation process requiring manual configuration
- Yarn permission issues preventing frontend setup
- Backend import errors due to module path issues
- Database initialization failures
- Service startup conflicts and port issues
- Missing environment configuration
- Incomplete documentation

---

## 🔮 Upcoming Features

### Version 2.1.0 (Planned)
- **Docker Support** - Complete containerization with Docker Compose
- **Enhanced Security** - Additional security features and hardening
- **Mobile Optimization** - Better mobile app interface
- **Advanced Reporting** - More comprehensive analytics and reports

### Version 2.2.0 (Planned)
- **Payment Integration** - Stripe/PayPal integration for lesson payments
- **Video Conferencing** - Integrated video calls for online lessons
- **Mobile App** - React Native mobile application
- **Multi-tenancy** - Support for multiple music schools

---

## 📋 Migration Notes

### Upgrading from 1.x to 2.0

If you have a previous installation:

1. **Backup your data**:
   ```bash
   cp app.db app.db.backup
   ```

2. **Update to new version**:
   ```bash
   git pull origin main
   chmod +x install-fixed.sh
   ./install-fixed.sh
   ```

3. **Restore data** (if needed):
   ```bash
   cp app.db.backup app.db
   ```

4. **Start services**:
   ```bash
   ./start-all.sh
   ```

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more information on how to contribute to this project.

### Development Setup

1. Fork the repository
2. Clone your fork
3. Run the installation script
4. Make your changes
5. Test thoroughly
6. Submit a pull request

---

**For more information, see the [README.md](README.md) and [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**
