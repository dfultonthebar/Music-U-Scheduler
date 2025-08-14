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
├── .github/
│   └── workflows/
│       └── ci.yml
├── README.md
├── .gitignore
├── pyproject.toml
└── .env.example
```