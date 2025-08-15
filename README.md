# 🎵 Music-U-Scheduler

A comprehensive music lesson scheduling and management system with a modern web interface.

## Features

- **Admin Dashboard**: Complete user and system management
- **Instructor Interface**: Lesson scheduling and student management
- **Student Portal**: View lessons and manage schedules
- **Modern UI**: Built with Next.js and Tailwind CSS
- **Secure Authentication**: Role-based access control
- **Database Management**: PostgreSQL with Alembic migrations
- **RESTful API**: FastAPI backend with automatic documentation

## Quick Start

### One-Line Installation

```bash
curl -sSL https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/install.sh | bash
```

### Manual Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dfultonthebar/Music-U-Scheduler.git
   cd Music-U-Scheduler
   ```

2. **Run the installer:**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. **Start the application:**
   ```bash
   ./start-musicu.sh
   ```

## Default Login

- **Username:** `admin`
- **Password:** `MusicU2025`

## Access URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## Technology Stack

### Backend (FastAPI)
- **Framework:** FastAPI
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Migrations:** Alembic
- **Authentication:** JWT tokens

### Frontend (Next.js)
- **Framework:** Next.js 14
- **UI Components:** Shadcn/ui
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Forms:** React Hook Form
- **State Management:** Zustand

## Project Structure

```
Music-U-Scheduler/
├── app/                    # FastAPI backend
│   ├── api/               # API routes
│   ├── auth/              # Authentication
│   ├── models.py          # Database models
│   ├── main.py            # FastAPI app
│   └── database.py        # Database configuration
├── frontend/              # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities
│   └── contexts/          # React contexts
├── alembic/               # Database migrations
├── install.sh             # Installation script
├── start-musicu.sh        # Application launcher
├── stop-musicu.sh         # Stop services
└── requirements.txt       # Python dependencies
```

## Development

### Backend Development
```bash
cd Music-U-Scheduler
source music-u-env/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Development
```bash
cd Music-U-Scheduler/frontend
npm run dev
```

### Database Migrations
```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```

## API Documentation

The API documentation is automatically generated and available at:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues:

1. Check the logs in `backend.log` and `frontend.log`
2. Ensure PostgreSQL is running: `sudo systemctl status postgresql`
3. Verify dependencies are installed correctly
4. Create an issue on GitHub with error details

## Troubleshooting

### Common Issues

**PostgreSQL not starting:**
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Port already in use:**
```bash
sudo fuser -k 8000/tcp 3000/tcp
```

**Database connection issues:**
```bash
sudo -u postgres psql -c "CREATE DATABASE musicu;"
sudo -u postgres psql -c "CREATE USER musicuuser WITH PASSWORD 'musicupass';"
```

**Frontend build errors:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```
