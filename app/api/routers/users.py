
"""
User management routes with authentication and role-based authorization
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ...database import get_db
from ... import crud, schemas, models
from ...auth.dependencies import get_current_active_user, require_teacher_role

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_current_active_user)]  # All routes require authentication
)


@router.get("/", response_model=List[schemas.User])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_teacher_role)  # Only teachers can list all users
):
    """
    Retrieve users (teacher only)
    
    Only teachers can access the list of all users.
    """
    users = crud.get_users(db, skip=skip, limit=limit)
    return users


@router.get("/{user_id}", response_model=schemas.User)
async def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get user by ID
    
    Users can only see their own profile unless they are a teacher.
    """
    # Check if user is trying to access their own profile or if they're a teacher
    if current_user.id != user_id and not current_user.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user"
        )
    
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db_user


@router.put("/{user_id}", response_model=schemas.User)
async def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Update user information
    
    Users can only update their own profile unless they are a teacher.
    Teachers can update any user's profile.
    """
    # Check if user is trying to update their own profile or if they're a teacher
    if current_user.id != user_id and not current_user.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )
    
    # If a non-teacher is trying to change their teacher status, deny it
    if current_user.id == user_id and not current_user.is_teacher and user_update.is_teacher is True:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot promote yourself to teacher role"
        )
    
    db_user = crud.update_user(db, user_id=user_id, user_update=user_update)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db_user


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_teacher_role)  # Only teachers can delete users
):
    """
    Delete user (teacher only)
    
    Only teachers can delete users. Teachers cannot delete themselves.
    """
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    success = crud.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return {"message": "User deleted successfully"}


@router.get("/me/lessons", response_model=List[schemas.Lesson])
async def read_my_lessons(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get current user's lessons
    
    Returns lessons where the current user is either teacher or student.
    """
    if current_user.is_teacher:
        lessons = crud.get_lessons_by_teacher(db, teacher_id=current_user.id)
    else:
        lessons = crud.get_lessons_by_student(db, student_id=current_user.id)
    
    return lessons


@router.get("/me/upcoming-lessons", response_model=List[schemas.Lesson])
async def read_my_upcoming_lessons(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get current user's upcoming lessons
    
    Returns upcoming lessons where the current user is either teacher or student.
    """
    lessons = crud.get_upcoming_lessons(
        db, 
        user_id=current_user.id, 
        is_teacher=current_user.is_teacher
    )
    return lessons
