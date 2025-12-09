

"""
Instructor API endpoints for Music U Scheduler
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, date, time
from sqlalchemy import and_
from sqlalchemy.orm import joinedload
import os
import uuid
from pathlib import Path

from ...database import get_db
from ...auth.dependencies import require_instructor_role, require_teacher_role
from ... import crud, schemas, models

router = APIRouter(prefix="/instructor", tags=["instructor"])

# Upload directory configuration
UPLOAD_DIR = Path("/root/Music-U-Scheduler/uploads/profiles")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


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


@router.post("/profile/image")
async def upload_own_profile_image(
    file: UploadFile = File(...),
    request: Request = None,
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Upload profile image for current instructor"""
    # Validate file type
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file content to check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename

    # Ensure upload directory exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # Delete old profile image if exists
    if current_user.profile_image:
        old_file_path = UPLOAD_DIR / current_user.profile_image
        if old_file_path.exists():
            try:
                old_file_path.unlink()
            except Exception as e:
                print(f"Warning: Could not delete old profile image: {e}")

    # Save new file
    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Update user record
    user_update = schemas.UserUpdate(profile_image=unique_filename)
    updated_user = crud.update_user(db, current_user.id, user_update, updated_by=current_user.id)

    # Log the action
    if request:
        crud.log_audit_action(
            db, current_user.id, "UPDATE", "user", current_user.id,
            f"Instructor uploaded own profile image",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )

    return {
        "message": "Profile image uploaded successfully",
        "filename": unique_filename,
        "url": f"/uploads/profiles/{unique_filename}"
    }


@router.delete("/profile/image")
async def delete_own_profile_image(
    request: Request,
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Delete profile image for current instructor"""
    if not current_user.profile_image:
        raise HTTPException(status_code=404, detail="No profile image to delete")

    # Delete file from filesystem
    file_path = UPLOAD_DIR / current_user.profile_image
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as e:
            print(f"Warning: Could not delete profile image file: {e}")

    # Update user record
    user_update = schemas.UserUpdate(profile_image=None)
    crud.update_user(db, current_user.id, user_update, updated_by=current_user.id)

    # Log the action
    crud.log_audit_action(
        db, current_user.id, "DELETE", "user_profile_image", current_user.id,
        f"Instructor deleted own profile image",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return {"message": "Profile image deleted successfully"}


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


# Availability Management
@router.get("/availability", response_model=List[schemas.InstructorAvailability])
async def get_my_availability(
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Get instructor's weekly availability slots"""
    return crud.get_instructor_availability_slots(db, current_user.id, is_active=True)


@router.get("/availability/all", response_model=List[schemas.InstructorAvailability])
async def get_all_my_availability(
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Get all instructor's availability slots (including inactive)"""
    return crud.get_instructor_availability_slots(db, current_user.id)


@router.post("/availability", response_model=schemas.InstructorAvailability)
async def create_availability_slot(
    availability: schemas.InstructorAvailabilityCreate,
    request: Request,
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Create a new availability time slot"""
    # Validate day_of_week
    if availability.day_of_week < 0 or availability.day_of_week > 6:
        raise HTTPException(status_code=400, detail="day_of_week must be between 0 (Monday) and 6 (Sunday)")

    # Validate times
    if availability.start_time >= availability.end_time:
        raise HTTPException(status_code=400, detail="start_time must be before end_time")

    db_availability = crud.create_instructor_availability(
        db, current_user.id, availability, created_by=current_user.id
    )

    crud.log_audit_action(
        db, current_user.id, "CREATE", "instructor_availability", db_availability.id,
        f"Created availability slot for {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][availability.day_of_week]}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return db_availability


@router.post("/availability/bulk", response_model=List[schemas.InstructorAvailability])
async def create_bulk_availability(
    availability_list: List[schemas.InstructorAvailabilityCreate],
    request: Request,
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Create multiple availability slots at once (e.g., for setting up weekly schedule)"""
    for avail in availability_list:
        if avail.day_of_week < 0 or avail.day_of_week > 6:
            raise HTTPException(status_code=400, detail="day_of_week must be between 0 and 6")
        if avail.start_time >= avail.end_time:
            raise HTTPException(status_code=400, detail="start_time must be before end_time")

    created_slots = crud.bulk_create_instructor_availability(
        db, current_user.id, availability_list, created_by=current_user.id
    )

    crud.log_audit_action(
        db, current_user.id, "BULK_CREATE", "instructor_availability", None,
        f"Created {len(created_slots)} availability slots",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return created_slots


@router.put("/availability/{availability_id}", response_model=schemas.InstructorAvailability)
async def update_availability_slot(
    availability_id: int,
    availability_update: schemas.InstructorAvailabilityUpdate,
    request: Request,
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Update an availability slot"""
    # Verify ownership
    existing = crud.get_instructor_availability(db, availability_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    if existing.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this availability slot")

    # Validate updates if provided
    if availability_update.day_of_week is not None:
        if availability_update.day_of_week < 0 or availability_update.day_of_week > 6:
            raise HTTPException(status_code=400, detail="day_of_week must be between 0 and 6")

    updated = crud.update_instructor_availability(
        db, availability_id, availability_update, updated_by=current_user.id
    )

    crud.log_audit_action(
        db, current_user.id, "UPDATE", "instructor_availability", availability_id,
        f"Updated availability slot",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return updated


@router.delete("/availability/{availability_id}")
async def delete_availability_slot(
    availability_id: int,
    request: Request,
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Delete an availability slot"""
    existing = crud.get_instructor_availability(db, availability_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    if existing.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this availability slot")

    crud.delete_instructor_availability(db, availability_id, deleted_by=current_user.id)

    crud.log_audit_action(
        db, current_user.id, "DELETE", "instructor_availability", availability_id,
        f"Deleted availability slot",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return {"message": "Availability slot deleted successfully"}


@router.delete("/availability/clear-all")
async def clear_all_availability(
    request: Request,
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Clear all availability slots for the instructor"""
    slots = crud.get_instructor_availability_slots(db, current_user.id)
    deleted_count = 0
    for slot in slots:
        crud.delete_instructor_availability(db, slot.id)
        deleted_count += 1

    crud.log_audit_action(
        db, current_user.id, "BULK_DELETE", "instructor_availability", None,
        f"Cleared all {deleted_count} availability slots",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return {"message": f"Cleared {deleted_count} availability slots"}


# Days Off / Exceptions Management
@router.get("/exceptions", response_model=List[schemas.AvailabilityException])
async def get_my_exceptions(
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Get instructor's days off and exceptions"""
    return crud.get_instructor_exceptions(db, current_user.id, date_from=date_from, date_to=date_to)


@router.post("/exceptions", response_model=schemas.AvailabilityException)
async def create_exception(
    exception: schemas.AvailabilityExceptionCreate,
    request: Request,
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Create a new day off or exception"""
    # Check if exception already exists for this date
    existing = crud.get_exception_for_date(db, current_user.id, exception.exception_date)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"An exception already exists for {exception.exception_date}. Please update or delete it first."
        )

    # Validate partial day times
    if not exception.is_full_day:
        if not exception.start_time or not exception.end_time:
            raise HTTPException(
                status_code=400,
                detail="start_time and end_time are required for partial day exceptions"
            )
        if exception.start_time >= exception.end_time:
            raise HTTPException(status_code=400, detail="start_time must be before end_time")

    db_exception = crud.create_availability_exception(
        db, current_user.id, exception, created_by=current_user.id
    )

    crud.log_audit_action(
        db, current_user.id, "CREATE", "availability_exception", db_exception.id,
        f"Created exception for {exception.exception_date}: {exception.reason or 'Day off'}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return db_exception


@router.put("/exceptions/{exception_id}", response_model=schemas.AvailabilityException)
async def update_exception(
    exception_id: int,
    exception_update: schemas.AvailabilityExceptionUpdate,
    request: Request,
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Update an exception"""
    existing = crud.get_availability_exception(db, exception_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Exception not found")
    if existing.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this exception")

    updated = crud.update_availability_exception(
        db, exception_id, exception_update, updated_by=current_user.id
    )

    crud.log_audit_action(
        db, current_user.id, "UPDATE", "availability_exception", exception_id,
        f"Updated exception",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return updated


@router.delete("/exceptions/{exception_id}")
async def delete_exception(
    exception_id: int,
    request: Request,
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Delete an exception"""
    existing = crud.get_availability_exception(db, exception_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Exception not found")
    if existing.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this exception")

    crud.delete_availability_exception(db, exception_id, deleted_by=current_user.id)

    crud.log_audit_action(
        db, current_user.id, "DELETE", "availability_exception", exception_id,
        f"Deleted exception for {existing.exception_date}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return {"message": "Exception deleted successfully"}


# Break Settings
@router.get("/break-settings")
async def get_break_settings(
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Get instructor's default break time between lessons"""
    return {
        "default_break_minutes": current_user.default_break_minutes or 5,
        "available_options": [0, 5, 10, 15]
    }


@router.put("/break-settings")
async def update_break_settings(
    break_minutes: int = Query(..., ge=0, le=15, description="Break time in minutes (0, 5, 10, or 15)"),
    request: Request = None,
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Update instructor's default break time between lessons"""
    if break_minutes not in [0, 5, 10, 15]:
        raise HTTPException(status_code=400, detail="Break time must be 0, 5, 10, or 15 minutes")

    user_update = schemas.UserUpdate(default_break_minutes=break_minutes)
    crud.update_user(db, current_user.id, user_update)

    crud.log_audit_action(
        db, current_user.id, "UPDATE", "user", current_user.id,
        f"Updated default break time to {break_minutes} minutes",
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )

    return {
        "message": "Break settings updated successfully",
        "default_break_minutes": break_minutes
    }


# Full Schedule View
@router.get("/full-schedule")
async def get_full_schedule(
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: models.User = Depends(require_teacher_role),
    db: Session = Depends(get_db)
):
    """Get instructor's full schedule including availability, exceptions, and lessons"""
    if not date_from:
        date_from = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    if not date_to:
        date_to = date_from + timedelta(days=30)

    schedule = crud.get_instructor_schedule_for_date_range(db, current_user.id, date_from, date_to)

    return {
        "instructor_id": current_user.id,
        "instructor_name": current_user.full_name,
        "default_break_minutes": current_user.default_break_minutes or 5,
        "date_range": {
            "from": date_from.isoformat(),
            "to": date_to.isoformat()
        },
        "schedule": schedule
    }

