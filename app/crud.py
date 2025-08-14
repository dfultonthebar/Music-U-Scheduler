
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from datetime import datetime
from . import models, schemas
from .auth.utils import get_password_hash, verify_password


# User CRUD operations
def get_user(db: Session, user_id: int) -> Optional[models.User]:
    """Get user by ID"""
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Get user by email"""
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """Get user by username"""
    return db.query(models.User).filter(models.User.username == username).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    """Get users with pagination"""
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """Create a new user"""
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password,
        is_teacher=user.is_teacher,
        phone=user.phone
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate) -> Optional[models.User]:
    """Update user information"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        update_data = user_update.model_dump(exclude_unset=True)
        
        # Hash password if it's being updated
        if 'password' in update_data:
            update_data['hashed_password'] = get_password_hash(update_data.pop('password'))
        
        for field, value in update_data.items():
            setattr(db_user, field, value)
        db.commit()
        db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int) -> bool:
    """Delete a user"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False


# Lesson CRUD operations
def get_lesson(db: Session, lesson_id: int) -> Optional[models.Lesson]:
    """Get lesson by ID"""
    return db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()


def get_lessons(db: Session, skip: int = 0, limit: int = 100) -> List[models.Lesson]:
    """Get lessons with pagination"""
    return db.query(models.Lesson).offset(skip).limit(limit).all()


def get_lessons_by_teacher(db: Session, teacher_id: int, skip: int = 0, limit: int = 100) -> List[models.Lesson]:
    """Get lessons for a specific teacher"""
    return db.query(models.Lesson).filter(models.Lesson.teacher_id == teacher_id).offset(skip).limit(limit).all()


def get_lessons_by_student(db: Session, student_id: int, skip: int = 0, limit: int = 100) -> List[models.Lesson]:
    """Get lessons for a specific student"""
    return db.query(models.Lesson).filter(models.Lesson.student_id == student_id).offset(skip).limit(limit).all()


def create_lesson(db: Session, lesson: schemas.LessonCreate) -> models.Lesson:
    """Create a new lesson"""
    db_lesson = models.Lesson(**lesson.model_dump())
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)
    return db_lesson


def update_lesson(db: Session, lesson_id: int, lesson_update: schemas.LessonUpdate) -> Optional[models.Lesson]:
    """Update lesson information"""
    db_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if db_lesson:
        update_data = lesson_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_lesson, field, value)
        db.commit()
        db.refresh(db_lesson)
    return db_lesson


def delete_lesson(db: Session, lesson_id: int) -> bool:
    """Delete a lesson"""
    db_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if db_lesson:
        db.delete(db_lesson)
        db.commit()
        return True
    return False


def get_upcoming_lessons(db: Session, user_id: int, is_teacher: bool = False) -> List[models.Lesson]:
    """Get upcoming lessons for a user"""
    now = datetime.utcnow()
    query = db.query(models.Lesson).filter(
        models.Lesson.scheduled_at > now,
        models.Lesson.status == "scheduled"
    )
    
    if is_teacher:
        query = query.filter(models.Lesson.teacher_id == user_id)
    else:
        query = query.filter(models.Lesson.student_id == user_id)
    
    return query.order_by(models.Lesson.scheduled_at).all()


# Authentication helper functions (kept for backward compatibility)
# Note: These are just aliases to the functions in auth.utils for backward compatibility
# They are already imported at the top of this file from auth.utils
