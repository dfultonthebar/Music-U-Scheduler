

"""
Instructor API endpoints for Music U Scheduler
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from ...database import get_db
from ...auth.dependencies import require_instructor_role, require_teacher_role
from ... import crud, schemas, models

router = APIRouter(prefix="/instructor", tags=["instructor"])


# Dashboard
@router.get("/dashboard", response_model=schemas.InstructorDashboardStats)
async def get_instructor_dashboard(
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Get instructor dashboard statistics"""
    return crud.get_instructor_dashboard_stats(db, current_user.id)


# Profile Management
@router.get("/profile", response_model=schemas.User)
async def get_instructor_profile(
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Get instructor's own profile"""
    return current_user


@router.put("/profile", response_model=schemas.User)
async def update_instructor_profile(
    profile_update: schemas.UserUpdate,
    request: Request,
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Update instructor's own profile"""
    # Prevent role changes
    if profile_update.role and profile_update.role != current_user.role:
        raise HTTPException(status_code=403, detail="Cannot change your own role")
    
    # Check for email/username conflicts
    if profile_update.email and profile_update.email != current_user.email:
        if crud.get_user_by_email(db, profile_update.email):
            raise HTTPException(status_code=400, detail="Email already registered")
    
    if profile_update.username and profile_update.username != current_user.username:
        if crud.get_user_by_username(db, profile_update.username):
            raise HTTPException(status_code=400, detail="Username already taken")
    
    updated_user = crud.update_user(db, current_user.id, profile_update, updated_by=current_user.id)
    
    # Log the action
    crud.log_audit_action(
        db, current_user.id, "UPDATE", "user", current_user.id,
        f"Instructor updated own profile",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return updated_user


# Lesson Management
@router.get("/lessons", response_model=List[schemas.Lesson])
async def get_instructor_lessons(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Get lessons for the current instructor"""
    return crud.get_lessons_by_teacher(db, current_user.id, skip=skip, limit=limit, status=status)


@router.get("/lessons/upcoming", response_model=List[schemas.Lesson])
async def get_upcoming_lessons(
    limit: int = Query(10, ge=1, le=100),
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Get upcoming lessons for the instructor"""
    return crud.get_upcoming_lessons(db, current_user.id, limit=limit)


@router.get("/lessons/today", response_model=List[schemas.Lesson])
async def get_today_lessons(
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Get today's lessons for the instructor"""
    return crud.get_lessons_today(db, current_user.id)


@router.get("/lessons/{lesson_id}", response_model=schemas.Lesson)
async def get_lesson(
    lesson_id: int,
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Get a specific lesson (must be instructor's lesson)"""
    lesson = crud.get_lesson(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    if lesson.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this lesson")
    
    return lesson


@router.put("/lessons/{lesson_id}", response_model=schemas.Lesson)
async def update_lesson(
    lesson_id: int,
    lesson_update: schemas.LessonUpdate,
    request: Request,
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Update a lesson (instructor can only update their own lessons)"""
    lesson = crud.get_lesson(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    if lesson.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this lesson")
    
    # Instructors cannot change teacher_id or student_id
    if lesson_update.teacher_id or lesson_update.student_id:
        raise HTTPException(status_code=403, detail="Cannot change lesson participants")
    
    updated_lesson = crud.update_lesson(db, lesson_id, lesson_update, updated_by=current_user.id)
    
    # Log the action
    crud.log_audit_action(
        db, current_user.id, "UPDATE", "lesson", lesson_id,
        f"Instructor updated lesson: {updated_lesson.title}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return updated_lesson


@router.put("/lessons/{lesson_id}/complete")
async def complete_lesson(
    lesson_id: int,
    completion_data: schemas.LessonUpdate,
    request: Request,
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Mark a lesson as completed with notes"""
    lesson = crud.get_lesson(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    if lesson.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to complete this lesson")
    
    if lesson.status != models.LessonStatus.SCHEDULED:
        raise HTTPException(status_code=400, detail="Only scheduled lessons can be completed")
    
    # Set status to completed
    completion_data.status = models.LessonStatus.COMPLETED
    
    updated_lesson = crud.update_lesson(db, lesson_id, completion_data, updated_by=current_user.id)
    
    # Log the action
    crud.log_audit_action(
        db, current_user.id, "COMPLETE", "lesson", lesson_id,
        f"Instructor completed lesson: {updated_lesson.title}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return {"message": "Lesson marked as completed", "lesson": updated_lesson}


@router.put("/lessons/{lesson_id}/cancel")
async def cancel_lesson(
    lesson_id: int,
    request: Request,
    cancellation_reason: str = Query(..., description="Reason for cancellation"),
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Cancel a lesson"""
    lesson = crud.get_lesson(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    if lesson.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this lesson")
    
    if lesson.status != models.LessonStatus.SCHEDULED:
        raise HTTPException(status_code=400, detail="Only scheduled lessons can be cancelled")
    
    # Update lesson status and add cancellation note
    lesson_update = schemas.LessonUpdate(
        status=models.LessonStatus.CANCELLED,
        instructor_notes=f"Cancelled by instructor: {cancellation_reason}"
    )
    
    updated_lesson = crud.update_lesson(db, lesson_id, lesson_update, updated_by=current_user.id)
    
    # Log the action
    crud.log_audit_action(
        db, current_user.id, "CANCEL", "lesson", lesson_id,
        f"Instructor cancelled lesson: {updated_lesson.title}. Reason: {cancellation_reason}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return {"message": "Lesson cancelled successfully", "lesson": updated_lesson}


# Student Management
@router.get("/students", response_model=List[schemas.UserSummary])
async def get_instructor_students(
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Get all students taught by this instructor"""
    # Get unique student IDs from lessons
    student_ids = db.query(models.Lesson.student_id).filter(
        models.Lesson.teacher_id == current_user.id
    ).distinct().all()
    
    student_ids = [sid[0] for sid in student_ids]
    
    # Get student details
    students = db.query(models.User).filter(models.User.id.in_(student_ids)).all()
    
    return students


@router.get("/students/{student_id}/lessons", response_model=List[schemas.Lesson])
async def get_student_lessons(
    student_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Get lessons for a specific student (only lessons taught by this instructor)"""
    # Verify the instructor teaches this student
    lesson_exists = db.query(models.Lesson).filter(
        and_(
            models.Lesson.teacher_id == current_user.id,
            models.Lesson.student_id == student_id
        )
    ).first()
    
    if not lesson_exists:
        raise HTTPException(status_code=403, detail="You don't teach this student")
    
    # Get lessons
    query = db.query(models.Lesson).options(
        joinedload(models.Lesson.student)
    ).filter(
        and_(
            models.Lesson.teacher_id == current_user.id,
            models.Lesson.student_id == student_id
        )
    )
    
    if status:
        query = query.filter(models.Lesson.status == status)
    
    return query.order_by(models.Lesson.scheduled_at).offset(skip).limit(limit).all()


# Schedule Management
@router.get("/schedule")
async def get_instructor_schedule(
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Get instructor's schedule for a date range"""
    # Set default date range if not provided (next 30 days)
    if not date_from:
        date_from = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    if not date_to:
        date_to = date_from + timedelta(days=30)
    
    lessons = crud.get_lessons_by_teacher(
        db, current_user.id, 
        status=models.LessonStatus.SCHEDULED
    )
    
    # Filter by date range
    filtered_lessons = [
        lesson for lesson in lessons 
        if date_from <= lesson.scheduled_at <= date_to
    ]
    
    # Group by date
    schedule = {}
    for lesson in filtered_lessons:
        date_key = lesson.scheduled_at.strftime('%Y-%m-%d')
        if date_key not in schedule:
            schedule[date_key] = []
        
        schedule[date_key].append({
            "id": lesson.id,
            "title": lesson.title,
            "student_name": lesson.student.full_name,
            "scheduled_at": lesson.scheduled_at,
            "duration_minutes": lesson.duration_minutes,
            "instrument": lesson.instrument,
            "location": lesson.location,
            "room_number": lesson.room_number
        })
    
    # Sort lessons within each date
    for date_key in schedule:
        schedule[date_key].sort(key=lambda x: x["scheduled_at"])
    
    return {
        "date_range": f"{date_from.strftime('%Y-%m-%d')} to {date_to.strftime('%Y-%m-%d')}",
        "schedule": schedule
    }


# Reports
@router.get("/reports/summary")
async def get_instructor_summary_report(
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Get instructor's summary report"""
    # Set default date range if not provided (current month)
    if not date_from:
        now = datetime.utcnow()
        date_from = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if not date_to:
        date_to = datetime.utcnow()
    
    # Get lessons in date range
    lessons = db.query(models.Lesson).filter(
        and_(
            models.Lesson.teacher_id == current_user.id,
            models.Lesson.scheduled_at >= date_from,
            models.Lesson.scheduled_at <= date_to
        )
    ).all()
    
    # Calculate statistics
    total_lessons = len(lessons)
    completed_lessons = len([l for l in lessons if l.status == models.LessonStatus.COMPLETED])
    cancelled_lessons = len([l for l in lessons if l.status == models.LessonStatus.CANCELLED])
    scheduled_lessons = len([l for l in lessons if l.status == models.LessonStatus.SCHEDULED])
    
    # Calculate revenue
    revenue = sum([l.cost for l in lessons if l.cost and l.status == models.LessonStatus.COMPLETED])
    
    # Student statistics
    unique_students = len(set([l.student_id for l in lessons]))
    
    # Instrument breakdown
    instruments = {}
    for lesson in lessons:
        if lesson.instrument:
            instruments[lesson.instrument] = instruments.get(lesson.instrument, 0) + 1
    
    # Teaching hours
    total_hours = sum([l.duration_minutes for l in lessons if l.status == models.LessonStatus.COMPLETED]) / 60
    
    return {
        "date_range": f"{date_from.strftime('%Y-%m-%d')} to {date_to.strftime('%Y-%m-%d')}",
        "total_lessons": total_lessons,
        "completed_lessons": completed_lessons,
        "cancelled_lessons": cancelled_lessons,
        "scheduled_lessons": scheduled_lessons,
        "unique_students": unique_students,
        "total_revenue": revenue,
        "total_teaching_hours": round(total_hours, 2),
        "instruments_taught": instruments,
        "completion_rate": round((completed_lessons / total_lessons * 100) if total_lessons > 0 else 0, 2)
    }

