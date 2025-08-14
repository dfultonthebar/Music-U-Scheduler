
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ...database import get_db
from ... import crud, schemas, models
from ...main import get_current_active_user
from ...tasks import send_lesson_reminder

router = APIRouter(
    prefix="/api/v1/lessons",
    tags=["lessons"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=schemas.Lesson, status_code=status.HTTP_201_CREATED)
def create_lesson(
    lesson: schemas.LessonCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new lesson"""
    # Verify that teacher exists and is actually a teacher
    teacher = crud.get_user(db, user_id=lesson.teacher_id)
    if not teacher or not teacher.is_teacher:
        raise HTTPException(
            status_code=400,
            detail="Invalid teacher ID"
        )
    
    # Verify that student exists
    student = crud.get_user(db, user_id=lesson.student_id)
    if not student:
        raise HTTPException(
            status_code=400,
            detail="Invalid student ID"
        )
    
    # Only teachers can create lessons for themselves or admins can create any lesson
    if (current_user.id != lesson.teacher_id and 
        not getattr(current_user, 'is_admin', False)):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to create lessons for this teacher"
        )
    
    # Check for scheduling conflicts
    existing_lessons = db.query(models.Lesson).filter(
        models.Lesson.teacher_id == lesson.teacher_id,
        models.Lesson.scheduled_at == lesson.scheduled_at,
        models.Lesson.status == "scheduled"
    ).first()
    
    if existing_lessons:
        raise HTTPException(
            status_code=400,
            detail="Teacher already has a lesson scheduled at this time"
        )
    
    db_lesson = crud.create_lesson(db=db, lesson=lesson)
    
    # Schedule reminder task
    reminder_time = lesson.scheduled_at.timestamp() - 3600  # 1 hour before
    send_lesson_reminder.apply_async(args=[db_lesson.id], eta=datetime.fromtimestamp(reminder_time))
    
    return db_lesson


@router.get("/", response_model=List[schemas.Lesson])
def read_lessons(
    skip: int = 0,
    limit: int = 100,
    teacher_id: Optional[int] = None,
    student_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get list of lessons with optional filters"""
    query = db.query(models.Lesson)
    
    # Apply filters
    if teacher_id:
        query = query.filter(models.Lesson.teacher_id == teacher_id)
    if student_id:
        query = query.filter(models.Lesson.student_id == student_id)
    if status:
        query = query.filter(models.Lesson.status == status)
    
    # Users can only see lessons they're involved in unless they're admin
    if not getattr(current_user, 'is_admin', False):
        query = query.filter(
            (models.Lesson.teacher_id == current_user.id) |
            (models.Lesson.student_id == current_user.id)
        )
    
    lessons = query.offset(skip).limit(limit).all()
    return lessons


@router.get("/{lesson_id}", response_model=schemas.Lesson)
def read_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get lesson by ID"""
    db_lesson = crud.get_lesson(db, lesson_id=lesson_id)
    if db_lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Users can only view lessons they're involved in unless they're admin
    if (not getattr(current_user, 'is_admin', False) and
        current_user.id != db_lesson.teacher_id and
        current_user.id != db_lesson.student_id):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this lesson"
        )
    
    return db_lesson


@router.put("/{lesson_id}", response_model=schemas.Lesson)
def update_lesson(
    lesson_id: int,
    lesson_update: schemas.LessonUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update lesson information"""
    db_lesson = crud.get_lesson(db, lesson_id=lesson_id)
    if db_lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Only teachers can update their lessons or admins can update any lesson
    if (not getattr(current_user, 'is_admin', False) and
        current_user.id != db_lesson.teacher_id):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update this lesson"
        )
    
    updated_lesson = crud.update_lesson(db, lesson_id=lesson_id, lesson_update=lesson_update)
    return updated_lesson


@router.delete("/{lesson_id}")
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete (cancel) lesson"""
    db_lesson = crud.get_lesson(db, lesson_id=lesson_id)
    if db_lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Only teachers can cancel their lessons or admins can cancel any lesson
    if (not getattr(current_user, 'is_admin', False) and
        current_user.id != db_lesson.teacher_id):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to cancel this lesson"
        )
    
    # Soft delete by marking as cancelled
    lesson_update = schemas.LessonUpdate(status="cancelled")
    crud.update_lesson(db, lesson_id=lesson_id, lesson_update=lesson_update)
    
    return {"message": "Lesson cancelled successfully"}


@router.get("/upcoming/me", response_model=List[schemas.Lesson])
def get_my_upcoming_lessons(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get upcoming lessons for current user"""
    lessons = crud.get_upcoming_lessons(db, user_id=current_user.id, is_teacher=current_user.is_teacher)
    return lessons


@router.post("/{lesson_id}/complete")
def mark_lesson_complete(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Mark lesson as completed"""
    db_lesson = crud.get_lesson(db, lesson_id=lesson_id)
    if db_lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Only teachers can mark lessons as complete
    if current_user.id != db_lesson.teacher_id:
        raise HTTPException(
            status_code=403,
            detail="Only the teacher can mark lessons as complete"
        )
    
    lesson_update = schemas.LessonUpdate(status="completed")
    updated_lesson = crud.update_lesson(db, lesson_id=lesson_id, lesson_update=lesson_update)
    
    return {"message": "Lesson marked as completed", "lesson": updated_lesson}


@router.post("/{lesson_id}/reschedule")
def reschedule_lesson(
    lesson_id: int,
    new_datetime: datetime,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Reschedule a lesson"""
    db_lesson = crud.get_lesson(db, lesson_id=lesson_id)
    if db_lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Only teachers can reschedule lessons
    if current_user.id != db_lesson.teacher_id:
        raise HTTPException(
            status_code=403,
            detail="Only the teacher can reschedule lessons"
        )
    
    # Check for scheduling conflicts
    existing_lessons = db.query(models.Lesson).filter(
        models.Lesson.teacher_id == db_lesson.teacher_id,
        models.Lesson.scheduled_at == new_datetime,
        models.Lesson.status == "scheduled",
        models.Lesson.id != lesson_id
    ).first()
    
    if existing_lessons:
        raise HTTPException(
            status_code=400,
            detail="Teacher already has a lesson scheduled at this time"
        )
    
    lesson_update = schemas.LessonUpdate(scheduled_at=new_datetime)
    updated_lesson = crud.update_lesson(db, lesson_id=lesson_id, lesson_update=lesson_update)
    
    return {"message": "Lesson rescheduled successfully", "lesson": updated_lesson}
