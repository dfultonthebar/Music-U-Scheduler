
"""
Web-based instructor dashboard routes
"""
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List

from ...database import get_db
from ...auth.dependencies import get_current_user, require_instructor_role
from ...models import User, Lesson
from ...schemas import User as UserSchema
from ... import crud

router = APIRouter(
    prefix="/instructor",
    tags=["instructor-web"],
    dependencies=[Depends(require_instructor_role)]
)

templates = Jinja2Templates(directory="templates")

@router.get("/dashboard", response_class=HTMLResponse)
async def instructor_dashboard(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Instructor dashboard page"""
    # Get instructor statistics
    instructor_lessons = db.query(Lesson).filter(Lesson.instructor_id == current_user.id).all()
    total_students = len(set(lesson.student_id for lesson in instructor_lessons))
    
    # Get this week's lessons
    today = date.today()
    weekly_lessons = [l for l in instructor_lessons if l.date and l.date >= today and (l.date - today).days < 7]
    
    completed_lessons = len([l for l in instructor_lessons if l.status == "completed"])
    
    # Get today's lessons
    todays_lessons = [l for l in instructor_lessons if l.date == today]
    
    # Get recent students
    recent_students = db.query(User).filter(
        User.role == "student",
        User.id.in_([l.student_id for l in instructor_lessons[-5:]])
    ).limit(5).all()
    
    # Calculate monthly earnings (placeholder)
    monthly_earnings = 1800.00
    
    stats = {
        "total_students": total_students,
        "weekly_lessons": len(weekly_lessons),
        "completed_lessons": completed_lessons,
        "monthly_earnings": monthly_earnings
    }
    
    return templates.TemplateResponse(
        "instructor/dashboard.html",
        {
            "request": request,
            "user": current_user,
            "stats": stats,
            "todays_lessons": todays_lessons,
            "recent_students": recent_students
        }
    )

@router.get("/schedule", response_class=HTMLResponse)
async def instructor_schedule_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Instructor schedule page"""
    lessons = db.query(Lesson).filter(Lesson.instructor_id == current_user.id).order_by(Lesson.date, Lesson.time).all()
    
    return templates.TemplateResponse(
        "instructor/schedule.html",
        {
            "request": request,
            "user": current_user,
            "lessons": lessons
        }
    )

@router.get("/students", response_class=HTMLResponse)
async def instructor_students_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Instructor students page"""
    # Get students who have lessons with this instructor
    instructor_lessons = db.query(Lesson).filter(Lesson.instructor_id == current_user.id).all()
    student_ids = list(set(lesson.student_id for lesson in instructor_lessons))
    
    students = db.query(User).filter(User.id.in_(student_ids)).all() if student_ids else []
    
    return templates.TemplateResponse(
        "instructor/students.html",
        {
            "request": request,
            "user": current_user,
            "students": students
        }
    )

@router.get("/lessons", response_class=HTMLResponse)
async def instructor_lessons_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Instructor lessons management page"""
    lessons = db.query(Lesson).filter(Lesson.instructor_id == current_user.id).order_by(Lesson.date.desc()).all()
    
    return templates.TemplateResponse(
        "instructor/lessons.html",
        {
            "request": request,
            "user": current_user,
            "lessons": lessons
        }
    )

@router.get("/lessons/create", response_class=HTMLResponse)
async def instructor_create_lesson_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create lesson form page"""
    # Get available students
    students = db.query(User).filter(User.role == "student", User.is_active == True).all()
    
    return templates.TemplateResponse(
        "instructor/create_lesson.html",
        {
            "request": request,
            "user": current_user,
            "students": students
        }
    )

@router.get("/lessons/{lesson_id}", response_class=HTMLResponse)
async def instructor_lesson_detail_page(
    lesson_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lesson detail page"""
    lesson = db.query(Lesson).filter(
        Lesson.id == lesson_id,
        Lesson.instructor_id == current_user.id
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return templates.TemplateResponse(
        "instructor/lesson_detail.html",
        {
            "request": request,
            "user": current_user,
            "lesson": lesson
        }
    )

@router.get("/lessons/{lesson_id}/edit", response_class=HTMLResponse)
async def instructor_edit_lesson_page(
    lesson_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Edit lesson form page"""
    lesson = db.query(Lesson).filter(
        Lesson.id == lesson_id,
        Lesson.instructor_id == current_user.id
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    students = db.query(User).filter(User.role == "student", User.is_active == True).all()
    
    return templates.TemplateResponse(
        "instructor/edit_lesson.html",
        {
            "request": request,
            "user": current_user,
            "lesson": lesson,
            "students": students
        }
    )

@router.get("/reports", response_class=HTMLResponse)
async def instructor_reports_page(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Instructor reports page"""
    lessons = db.query(Lesson).filter(Lesson.instructor_id == current_user.id).all()
    
    total_lessons = len(lessons)
    completed_lessons = len([l for l in lessons if l.status == "completed"])
    upcoming_lessons = len([l for l in lessons if l.status == "scheduled" and l.date >= date.today()])
    
    reports_data = {
        "total_lessons": total_lessons,
        "completed_lessons": completed_lessons,
        "upcoming_lessons": upcoming_lessons,
        "completion_rate": (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
    }
    
    return templates.TemplateResponse(
        "instructor/reports.html",
        {
            "request": request,
            "user": current_user,
            "reports": reports_data
        }
    )

@router.get("/profile", response_class=HTMLResponse)
async def instructor_profile_page(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Instructor profile page"""
    return templates.TemplateResponse(
        "instructor/profile.html",
        {
            "request": request,
            "user": current_user
        }
    )
