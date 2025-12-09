
# Music U Scheduler

A comprehensive music lesson scheduling application built with Next.js and FastAPI, featuring JWT authentication, admin panels, instructor dashboards, and student management.

## Quick Start

### One-Line Installation
```bash
git clone https://github.com/dfultonthebar/Music-U-Scheduler.git
cd Music-U-Scheduler
./install.sh
```

### Start the Application
```bash
./start-all.sh
```

### Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- API Docs: http://localhost:8080/docs
- Admin Login: **admin** / **MusicU2025**

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Complete technical documentation for developers
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

---

## Features

### Authentication & Authorization
- JWT-based authentication with secure session management
- Role-based access control (Admin, Instructor, Student)
- Multi-role support for instructors
- Secure password hashing with bcrypt

### User Management
- Admin Dashboard with full system control
- Instructor Portal for lesson and student management
- Student Interface for booking and viewing lessons
- User profile management with customizable settings

### Scheduling System
- Interactive calendar for lesson scheduling
- Recurring lesson support with flexible patterns
- Conflict detection and resolution
- Automated notifications and reminders

### Analytics & Reporting
- Revenue tracking and financial reports
- Student progress monitoring
- Instructor performance analytics
- Customizable dashboard widgets

### Administration
- System settings management
- Email server configuration
- Backup and restore functionality
- Audit logging for security compliance

## Installation Details

### Prerequisites
- Node.js 18+
- Python 3.8+
- Git

### What the Installer Does
- Sets up Python virtual environment
- Installs all backend dependencies
- Configures Node.js frontend
- Creates database and environment files
- Generates startup scripts

### Service Management

```bash
./manage-services.sh start    # Start all services
./manage-services.sh stop     # Stop all services
./manage-services.sh restart  # Restart all services
./manage-services.sh status   # Check service status
```

## Tech Stack

### Backend
- FastAPI (Python) with SQLAlchemy ORM
- SQLite database (PostgreSQL for production)
- JWT authentication with bcrypt
- Alembic for database migrations

### Frontend
- Next.js 14 with React and TypeScript
- Tailwind CSS with shadcn/ui components
- Radix UI component library
- Zustand for state management

## Development

### Running Services Individually
```bash
./start-backend.sh   # Backend on port 8080
./start-frontend.sh  # Frontend on port 3000
```

### API Documentation
- Swagger UI: http://localhost:8080/docs
- ReDoc: http://localhost:8080/redoc

For complete technical documentation, see [CLAUDE.md](CLAUDE.md).

## Production Deployment

1. Update environment variables for production
2. Configure PostgreSQL database
3. Set up reverse proxy (nginx recommended)
4. Configure SSL certificates
5. Set up process management (systemd, PM2)

See [CLAUDE.md](CLAUDE.md) for detailed deployment instructions.

## Security

- Change default JWT secrets in production
- Use HTTPS in production environments
- Configure CORS properly for your domain
- Regular security updates for dependencies
- Implement proper backup strategies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
