
# Music U Scheduler - Setup Guide

## Quick Start (One-Click Installation)

The easiest way to get Music U Scheduler running is using our one-click installation script:

```bash
# Clone the repository
git clone https://github.com/yourusername/Music-U-Scheduler.git
cd Music-U-Scheduler

# Run the installation script
./install.sh
```

The script will automatically:
- Check system requirements
- Install dependencies
- Set up the database
- Create an admin user
- Start the application

### Installation Options

```bash
# Basic installation
./install.sh

# Install with systemd service (Linux only)
./install.sh --service

# Show help
./install.sh --help
```

## Manual Installation

If you prefer to install manually or need to customize the setup:

### Prerequisites

- Python 3.8 or higher
- pip3
- Git
- PostgreSQL (optional, SQLite is used by default)

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/Music-U-Scheduler.git
cd Music-U-Scheduler
```

### Step 2: Create Virtual Environment

```bash
python3 -m venv music-u-env
source music-u-env/bin/activate  # On Windows: music-u-env\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Environment Configuration

Create a `.env` file in the project root:

```bash
# Database Configuration
DATABASE_URL=sqlite:///./music_u_scheduler.db
# For PostgreSQL: DATABASE_URL=postgresql://user:password@localhost/music_u_scheduler

# Security Configuration
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Configuration
DEBUG=False
ENVIRONMENT=production
```

### Step 5: Database Setup

```bash
# Run database migrations
alembic upgrade head

# Create admin user (optional)
python scripts/create_admin.py
```

### Step 6: Start the Application

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## System Requirements

### Minimum Requirements
- **OS**: Linux, macOS, or Windows
- **Python**: 3.8 or higher
- **RAM**: 512 MB
- **Storage**: 100 MB free space
- **Network**: Internet connection for initial setup

### Recommended Requirements
- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **Python**: 3.11 or higher
- **RAM**: 2 GB
- **Storage**: 1 GB free space
- **Database**: PostgreSQL 12+ (for production)

## Configuration Options

### Database Configuration

#### SQLite (Default)
```env
DATABASE_URL=sqlite:///./music_u_scheduler.db
```

#### PostgreSQL (Recommended for Production)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/music_u_scheduler
```

### Security Configuration

```env
# Generate a secure secret key
SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# JWT Algorithm
ALGORITHM=HS256

# Token expiration (in minutes)
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Application Configuration

```env
# Debug mode (set to False in production)
DEBUG=False

# Environment
ENVIRONMENT=production

# CORS settings (adjust for your domain)
ALLOWED_ORIGINS=["http://localhost:3000", "https://yourdomain.com"]
```

## Default Admin Account

After installation, you can log in with:
- **Email**: admin@musicuscheduler.com
- **Password**: admin123

**⚠️ Important**: Change the admin password immediately after first login!

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Admin Dashboard
- `GET /admin/dashboard` - Admin dashboard (web)
- `GET /admin/users` - User management (web)
- `GET /admin/lessons` - Lesson management (web)
- `GET /admin/reports` - Reports (web)

### Instructor Dashboard
- `GET /instructor/dashboard` - Instructor dashboard (web)
- `GET /instructor/schedule` - Schedule management (web)
- `GET /instructor/students` - Student management (web)
- `GET /instructor/lessons` - Lesson management (web)

### API Documentation
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

#### Database Connection Issues
```bash
# Check database file permissions (SQLite)
ls -la music_u_scheduler.db

# Reset database (WARNING: This will delete all data)
rm music_u_scheduler.db
alembic upgrade head
```

#### Import Errors
```bash
# Ensure virtual environment is activated
source music-u-env/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

#### Permission Denied on install.sh
```bash
chmod +x install.sh
```

### Logs and Debugging

#### Application Logs
```bash
# If running with install.sh
tail -f server.log

# If running manually
uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level debug
```

#### Database Logs
```bash
# Enable SQLAlchemy logging in .env
DATABASE_ECHO=True
```

## Production Deployment

### Using Systemd (Linux)

1. Run installation with service option:
```bash
./install.sh --service
```

2. Manage the service:
```bash
# Start service
sudo systemctl start music-u-scheduler

# Stop service
sudo systemctl stop music-u-scheduler

# Check status
sudo systemctl status music-u-scheduler

# View logs
journalctl -u music-u-scheduler -f
```

### Using Docker (Optional)

```dockerfile
# Dockerfile example
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Security Considerations

### Production Checklist
- [ ] Change default admin password
- [ ] Use PostgreSQL instead of SQLite
- [ ] Set strong SECRET_KEY
- [ ] Configure CORS properly
- [ ] Use HTTPS in production
- [ ] Set up proper firewall rules
- [ ] Regular database backups
- [ ] Monitor application logs

### Environment Variables
Never commit sensitive information to version control. Use environment variables or a secure `.env` file.

## Support

### Getting Help
- Check the [API documentation](http://localhost:8000/docs)
- Review application logs
- Check this setup guide
- Create an issue on GitHub

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License. See the LICENSE file for details.
