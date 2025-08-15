
"""
Lesson management routes with authentication and role-based authorization
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ...database import get_db
from ... import crud, schemas, models
from ...auth.dependencies import get_current_active_user, require_teacher_role

router = APIRouter(
    prefix="/lessons",
    tags=["lessons"],
    dependencies=[Depends(get_current_active_user)]  # All routes require authentication
)


@router.get("/", response_model=List[schemas.Lesson])
async def read_lessons(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_teacher_role)  # Only teachers can see all lessons
):
    """
    Retrieve all lessons (teacher only)
    
    Only teachers can access the list of all lessons.
    """
    lessons = crud.get_lessons(db, skip=skip, limit=limit)
    return lessons


@router.post("/", response_model=schemas.Lesson)
async def create_lesson(
    lesson: schemas.LessonCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_teacher_role)  # Only teachers can create lessons
):
    """
    Create new lesson (teacher only)
    
    Only teachers can create lessons. The teacher_id in the lesson must match the current user's ID.
    """
    # Ensure teacher can only create lessons for themselves
    if lesson.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create lessons for other teachers"
        )
    
    # Verify student exists
    student = crud.get_user(db, user_id=lesson.student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Verify student is not a teacher
    if student.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create lesson with another teacher as student"
        )
    
    return crud.create_lesson(db=db, lesson=lesson)


@router.get("/{lesson_id}", response_model=schemas.Lesson)
async def read_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get lesson by ID
    
    Users can only see lessons where they are either the teacher or student.
    """
    db_lesson = crud.get_lesson(db, lesson_id=lesson_id)
    if db_lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Check if user is involved in this lesson
    if (current_user.id != db_lesson.teacher_id and 
        current_user.id != db_lesson.student_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this lesson"
        )
    
    return db_lesson


@router.put("/{lesson_id}", response_model=schemas.Lesson)
async def update_lesson(
    lesson_id: int,
    lesson_update: schemas.LessonUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Update lesson
    
    Only the teacher of the lesson can update it.
    Students can only update the notes field.
    """
    db_lesson = crud.get_lesson(db, lesson_id=lesson_id)
    if db_lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Check if user is involved in this lesson
    if (current_user.id != db_lesson.teacher_id and 
        current_user.id != db_lesson.student_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this lesson"
        )
    
    # If user is student, they can only update notes
    if current_user.id == db_lesson.student_id and not current_user.is_teacher:
        # Extract only the notes field for students
        allowed_fields = {"notes"}
        update_dict = lesson_update.model_dump(exclude_unset=True)
        forbidden_fields = set(update_dict.keys()) - allowed_fields
        
        if forbidden_fields:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Students can only update notes field. Forbidden fields: {forbidden_fields}"
            )
    
    return crud.update_lesson(db, lesson_id=lesson_id, lesson_update=lesson_update)


@router.delete("/{lesson_id}")
async def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Delete lesson
    
    Only the teacher of the lesson can delete it.
    """
    db_lesson = crud.get_lesson(db, lesson_id=lesson_id)
    if db_lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Only the teacher can delete the lesson
    if current_user.id != db_lesson.teacher_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the teacher can delete this lesson"
        )
    
    success = crud.delete_lesson(db, lesson_id=lesson_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    return {"message": "Lesson deleted successfully"}


@router.get("/teacher/{teacher_id}", response_model=List[schemas.Lesson])
async def read_teacher_lessons(
    teacher_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get lessons for a specific teacher
    
    Teachers can see their own lessons. Students can see lessons from their teachers.
    """
    # Teachers can see their own lessons
    if current_user.is_teacher and current_user.id == teacher_id:
        return crud.get_lessons_by_teacher(db, teacher_id=teacher_id, skip=skip, limit=limit)
    
    # Students can see lessons from any teacher (but only their own lessons will be returned)
    if not current_user.is_teacher:
        lessons = crud.get_lessons_by_teacher(db, teacher_id=teacher_id, skip=skip, limit=limit)
        # Filter to only return lessons where current user is the student
        return [lesson for lesson in lessons if lesson.student_id == current_user.id]
    
    # Other teachers cannot see lessons from other teachers
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not authorized to view lessons from this teacher"
    )


@router.get("/student/{student_id}", response_model=List[schemas.Lesson])
async def read_student_lessons(
    student_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get lessons for a specific student
    
    Students can see their own lessons. Teachers can see lessons for any student.
    """
    # Students can see their own lessons
    if not current_user.is_teacher and current_user.id == student_id:
        return crud.get_lessons_by_student(db, student_id=student_id, skip=skip, limit=limit)
    
    # Teachers can see lessons for any student
    if current_user.is_teacher:
        return crud.get_lessons_by_student(db, student_id=student_id, skip=skip, limit=limit)
    
    # Students cannot see other students' lessons
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not authorized to view lessons from this student"
    )
