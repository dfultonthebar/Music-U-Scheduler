from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ... import crud, schemas, models
from ...main import get_current_active_user
from ...tasks import send_welcome_email

router = APIRouter(
    prefix="/api/v1/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    # Check if user already exists
    if crud.get_user_by_email(db, email=user.email):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    if crud.get_user_by_username(db, username=user.username):
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )
    
    db_user = crud.create_user(db=db, user=user)
    
    # Send welcome email asynchronously
    send_welcome_email.delay(db_user.id)
    
    return db_user


@router.get("/", response_model=List[schemas.User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get list of users (requires authentication)"""
    users = crud.get_users(db, skip=skip, limit=limit)
    return users


@router.get("/me", response_model=schemas.User)
def read_user_me(current_user: models.User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user


@router.get("/{user_id}", response_model=schemas.User)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get user by ID"""
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.put("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update user information"""
    # Users can only update their own information unless they're admin
    if current_user.id != user_id and not getattr(current_user, 'is_admin', False):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update this user"
        )
    
    db_user = crud.update_user(db, user_id=user_id, user_update=user_update)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete user (soft delete - deactivate)"""
    # Users can only delete their own account unless they're admin
    if current_user.id != user_id and not getattr(current_user, 'is_admin', False):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to delete this user"
        )
    
    # Soft delete by deactivating user
    user_update = schemas.UserUpdate(is_active=False)
    db_user = crud.update_user(db, user_id=user_id, user_update=user_update)
    
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deactivated successfully"}


@router.get("/teachers/", response_model=List[schemas.User])
def get_teachers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get list of teachers"""
    teachers = db.query(models.User).filter(
        models.User.is_teacher == True,
        models.User.is_active == True
    ).offset(skip).limit(limit).all()
    return teachers


@router.get("/{user_id}/lessons", response_model=List[schemas.Lesson])
def get_user_lessons(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get lessons for a specific user"""
    # Users can only view their own lessons unless they're admin
    if current_user.id != user_id and not getattr(current_user, 'is_admin', False):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this user's lessons"
        )
    
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    if db_user.is_teacher:
        lessons = crud.get_lessons_by_teacher(db, teacher_id=user_id, skip=skip, limit=limit)
    else:
        lessons = crud.get_lessons_by_student(db, student_id=user_id, skip=skip, limit=limit)
    
    return lessons