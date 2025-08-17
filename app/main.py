
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime

from . import models
from .database import engine
from .api.routers import users, lessons, admin, instructor, web_admin, web_instructor
from .auth import auth_router

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Music U Lesson Scheduler",
    description="A comprehensive music lesson scheduling application with JWT authentication, admin panel, and instructor dashboard",
    version="1.3.02"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(auth_router)
app.include_router(users.router)
app.include_router(lessons.router)
app.include_router(admin.router)
app.include_router(instructor.router)
app.include_router(web_admin.router)
app.include_router(web_instructor.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Music U Lesson Scheduler API",
        "version": "1.3.00",
        "docs": "/docs",
        "redoc": "/redoc",
        "auth": {
            "register": "/auth/register",
            "login": "/auth/login",
            "me": "/auth/me"
        },
        "admin": {
            "dashboard": "/admin/dashboard",
            "users": "/admin/users",
            "lessons": "/admin/lessons",
            "settings": "/admin/settings",
            "audit_logs": "/admin/audit-logs",
            "reports": "/admin/reports"
        },
        "instructor": {
            "dashboard": "/instructor/dashboard",
            "profile": "/instructor/profile",
            "lessons": "/instructor/lessons",
            "students": "/instructor/students",
            "schedule": "/instructor/schedule",
            "reports": "/instructor/reports"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}
