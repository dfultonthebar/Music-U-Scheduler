
# Music U Lesson Scheduler

A FastAPI-based web application for scheduling music lessons.

## Features

- User management
- Lesson scheduling
- RESTful API
- Background tasks for notifications

## Setup for Ubuntu 24

### Prerequisites

- Python 3.11+
- PostgreSQL (or SQLite for development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dfultonthebar/Music-U-Scheduler.git
cd Music-U-Scheduler
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -e .
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Run the application:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Setup & Testing

### PostgreSQL Setup

The application uses PostgreSQL as the primary database. Follow these steps to set up the database:

1. **Install PostgreSQL** (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib libpq-dev
```

2. **Install Python dependencies**:
```bash
pip install psycopg2-binary alembic pytest
```

3. **Start PostgreSQL service**:
```bash
sudo service postgresql start
```

4. **Create database and user**:
```bash
sudo -u postgres psql -c "CREATE USER musicu_user WITH PASSWORD 'musicu_password123';"
sudo -u postgres createdb musicu_db -O musicu_user
```

### Database Configuration

1. **Set up environment variables** in your `.env` file:
```env
# Database Configuration
DATABASE_URL=postgresql://musicu_user:musicu_password123@localhost:5432/musicu_db

# Security
SECRET_KEY=your-secret-key-change-this-in-production-12345
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Redis Configuration (for Celery)
REDIS_URL=redis://localhost:6379/0

# Application Settings
DEBUG=True
PROJECT_NAME=Music U Lesson Scheduler
VERSION=0.1.0
```

2. **Initialize Alembic** (already done):
```bash
alembic init alembic
```

3. **Create and run database migrations**:
```bash
# Create initial migration
alembic revision --autogenerate -m "Initial database schema"

# Apply migrations to create tables
alembic upgrade head
```

### Sample Data

Initialize the database with sample users and lessons:

```bash
python scripts/db_init.py
```

This creates:
- **3 Teachers**: Piano, Guitar, and General Music instructors
- **4 Students**: Various skill levels
- **5 Sample Lessons**: Scheduled lessons between teachers and students

**Sample Teacher Accounts**:
- `john.teacher@musicu.com` (General Music)
- `sarah.piano@musicu.com` (Piano)
- `mike.guitar@musicu.com` (Guitar)

**Sample Student Accounts**:
- `alice.student@example.com`
- `bob.student@example.com`
- `carol.student@example.com`
- `david.student@example.com`

All sample accounts use simple passwords for testing (check the script output for details).

### Database Testing

Run CRUD tests to verify database functionality:

```bash
# Run all database tests
pytest tests/test_crud.py -v

# Run tests quietly (less output)
pytest tests/test_crud.py -q
```

The tests cover:
- User creation, reading, updating, deletion
- Lesson creation, reading, updating, deletion
- Database relationships between users and lessons

### Database Management

**View database contents**:
```bash
# Connect to database
psql postgresql://musicu_user:musicu_password123@localhost:5432/musicu_db

# List tables
\dt

# View users
SELECT id, email, username, full_name, is_teacher FROM users;

# View lessons
SELECT id, title, teacher_id, student_id, scheduled_at, instrument FROM lessons;
```

**Reset database** (if needed):
```bash
# Drop and recreate database
sudo -u postgres dropdb musicu_db
sudo -u postgres createdb musicu_db -O musicu_user
alembic upgrade head
python scripts/db_init.py
```

## Project Structure

```
├── app/
│   ├── api/
│   │   └── routers/
│   │       ├── users.py
│   │       └── lessons.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── crud.py
│   ├── main.py
│   └── tasks.py
├── alembic/                    # Database migrations
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
├── scripts/
│   └── db_init.py             # Database initialization
├── tests/
│   └── test_crud.py           # Database tests
├── .github/
│   └── workflows/
│       └── ci.yml
├── README.md
├── .gitignore
├── pyproject.toml
├── alembic.ini
└── .env.example
```
