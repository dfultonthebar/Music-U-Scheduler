
"""
Web-based admin dashboard routes
"""
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List

from ...database import get_db
from ...auth.dependencies import get_current_user, require_admin_role
from ...models import User, Lesson
from ...schemas import User as UserSchema
from ... import crud

router = APIRouter(
    prefix="/admin",
    tags=["admin-web"],
    dependencies=[Depends(require_admin_role)]
)

templates = Jinja2Templates(directory="templates")

@router.get("/dashboard", response_class=HTMLResponse)
async def admin_dashboard(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin dashboard page"""
    # Get dashboard statistics
    total_users = db.query(User).count()
    total_lessons = db.query(Lesson).count()
    active_instructors = db.query(User).filter(User.role == "instructor", User.is_active == True).count()
    
    # Get recent lessons
    recent_lessons = db.query(Lesson).order_by(Lesson.created_at.desc()).limit(10).all()
    
    # Calculate monthly revenue (placeholder)
    monthly_revenue = 2500.00
    
    stats = {
        "total_users": total_users,
        "total_lessons": total_lessons,
        "active_instructors": active_instructors,
        "monthly_revenue": monthly_revenue
    }
    
    return templates.TemplateResponse(
        "admin/dashboard.html",
        {
            "request": request,
            "user": current_user,
            "stats": stats,
            "recent_lessons": recent_lessons
        }
    )

@router.get("/users", response_class=HTMLResponse)
async def admin_users_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin users management page"""
    users = crud.get_users(db)
    
    return templates.TemplateResponse(
        "admin/users.html",
        {
            "request": request,
            "user": current_user,
            "users": users
        }
    )

@router.get("/users/create", response_class=HTMLResponse)
async def admin_create_user_page(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Create user form page"""
    return templates.TemplateResponse(
        "admin/create_user.html",
        {
            "request": request,
            "user": current_user
        }
    )

@router.get("/users/{user_id}", response_class=HTMLResponse)
async def admin_user_detail_page(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """User detail page"""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return templates.TemplateResponse(
        "admin/user_detail.html",
        {
            "request": request,
            "user": current_user,
            "target_user": user
        }
    )

@router.get("/users/{user_id}/edit", response_class=HTMLResponse)
async def admin_edit_user_page(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Edit user form page"""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return templates.TemplateResponse(
        "admin/edit_user.html",
        {
            "request": request,
            "user": current_user,
            "target_user": user
        }
    )

@router.get("/lessons", response_class=HTMLResponse)
async def admin_lessons_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin lessons management page"""
    lessons = crud.get_lessons(db)
    
    return templates.TemplateResponse(
        "admin/lessons.html",
        {
            "request": request,
            "user": current_user,
            "lessons": lessons
        }
    )

@router.get("/reports", response_class=HTMLResponse)
async def admin_reports_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin reports page"""
    # Generate report data
    total_users = db.query(User).count()
    total_lessons = db.query(Lesson).count()
    completed_lessons = db.query(Lesson).filter(Lesson.status == "completed").count()
    
    reports_data = {
        "total_users": total_users,
        "total_lessons": total_lessons,
        "completed_lessons": completed_lessons,
        "completion_rate": (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
    }
    
    return templates.TemplateResponse(
        "admin/reports.html",
        {
            "request": request,
            "user": current_user,
            "reports": reports_data
        }
    )

@router.get("/settings", response_class=HTMLResponse)
async def admin_settings_page(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Admin settings page"""
    return templates.TemplateResponse(
        "admin/settings.html",
        {
            "request": request,
            "user": current_user
        }
    )

@router.get("/audit-logs", response_class=HTMLResponse)
async def admin_audit_logs_page(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Admin audit logs page"""
    # Placeholder for audit logs
    audit_logs = []
    
    return templates.TemplateResponse(
        "admin/audit_logs.html",
        {
            "request": request,
            "user": current_user,
            "audit_logs": audit_logs
        }
    )

@router.get("/version-info")
async def get_version_info():
    """Get current system version information"""
    from datetime import datetime
    return {
        "current_version": "1.3.00",
        "latest_version": "1.3.00", 
        "has_updates": False,
        "update_available": False,
        "last_check": datetime.utcnow().isoformat(),
        "commit_hash": "043c0aa",
        "branch": "main",
        "release_date": "2025-08-16T18:47:00Z",
        "description": "Complete Authentication Integration - Production Release"
    }
