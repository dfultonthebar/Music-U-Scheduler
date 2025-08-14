
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from . import models
from .database import engine
from .api.routers import users, lessons
from .auth import auth_router

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Music U Lesson Scheduler",
    description="A FastAPI-based music lesson scheduling application with JWT authentication",
    version="0.2.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(users.router)
app.include_router(lessons.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Music U Lesson Scheduler API",
        "version": "0.2.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "auth": {
            "register": "/auth/register",
            "login": "/auth/login",
            "me": "/auth/me"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}
