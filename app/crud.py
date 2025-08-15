from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, asc
from . import models, schemas
from .auth.utils import get_password_hash
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import json


# User CRUD Operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def get_users(db: Session, skip: int = 0, limit: int = 100, role: Optional[str] = None, is_active: Optional[bool] = None):
    query = db.query(models.User)
    
    if role:
        query = query.filter(models.User.role == role)
    if is_active is not None:
        query = query.filter(models.User.is_active == is_active)
    
    return query.offset(skip).limit(limit).all()


def get_users_count(db: Session, role: Optional[str] = None, is_active: Optional[bool] = None):
    query = db.query(func.count(models.User.id))
    
    if role:
        query = query.filter(models.User.role == role)
    if is_active is not None:
        query = query.filter(models.User.is_active == is_active)
    
    return query.scalar()


def create_user(db: Session, user: schemas.UserCreate, created_by: Optional[int] = None):
    hashed_password = get_password_hash(user.password)
    
    # Set role and is_teacher for backward compatibility
    role = user.role
    is_teacher = user.is_teacher or (role == models.UserRole.INSTRUCTOR)
    
    db_user = models.User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password,
        is_teacher=is_teacher,
        role=role,
        phone=user.phone,
        address=user.address,
        emergency_contact=user.emergency_contact,
        notes=user.notes,
        hourly_rate=user.hourly_rate,
        specializations=user.specializations
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Log the creation
    if created_by:
        log_audit_action(db, created_by, "CREATE", "user", db_user.id, f"Created user: {db_user.username}")
    
    return db_user


def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate, updated_by: Optional[int] = None):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        update_data = user_update.model_dump(exclude_unset=True)
        if 'password' in update_data:
            update_data['hashed_password'] = get_password_hash(update_data.pop('password'))
        
        # Handle role and is_teacher synchronization
        if 'role' in update_data:
            if update_data['role'] == models.UserRole.INSTRUCTOR:
                update_data['is_teacher'] = True
            elif update_data['role'] == models.UserRole.STUDENT:
                update_data['is_teacher'] = False
        
        for field, value in update_data.items():
            setattr(db_user, field, value)
        
        db_user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_user)
        
        # Log the update
        if updated_by:
            log_audit_action(db, updated_by, "UPDATE", "user", db_user.id, f"Updated user: {db_user.username}")
    
    return db_user


def delete_user(db: Session, user_id: int, deleted_by: Optional[int] = None):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        username = db_user.username
        db.delete(db_user)
        db.commit()
        
        # Log the deletion
        if deleted_by:
            log_audit_action(db, deleted_by, "DELETE", "user", user_id, f"Deleted user: {username}")
    
    return db_user


def update_user_last_login(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.last_login = datetime.utcnow()
        db.commit()
        db.refresh(db_user)
    return db_user


# Lesson CRUD Operations
def get_lesson(db: Session, lesson_id: int):
    return db.query(models.Lesson).options(
        joinedload(models.Lesson.teacher),
        joinedload(models.Lesson.student),
        joinedload(models.Lesson.creator)
    ).filter(models.Lesson.id == lesson_id).first()


def get_lessons(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None, 
                date_from: Optional[datetime] = None, date_to: Optional[datetime] = None):
    query = db.query(models.Lesson).options(
        joinedload(models.Lesson.teacher),
        joinedload(models.Lesson.student)
    )
    
    if status:
        query = query.filter(models.Lesson.status == status)
    if date_from:
        query = query.filter(models.Lesson.scheduled_at >= date_from)
    if date_to:
        query = query.filter(models.Lesson.scheduled_at <= date_to)
    
    return query.order_by(models.Lesson.scheduled_at).offset(skip).limit(limit).all()


def get_lessons_count(db: Session, status: Optional[str] = None, 
                     date_from: Optional[datetime] = None, date_to: Optional[datetime] = None):
    query = db.query(func.count(models.Lesson.id))
    
    if status:
        query = query.filter(models.Lesson.status == status)
    if date_from:
        query = query.filter(models.Lesson.scheduled_at >= date_from)
    if date_to:
        query = query.filter(models.Lesson.scheduled_at <= date_to)
    
    return query.scalar()


def get_lessons_by_teacher(db: Session, teacher_id: int, skip: int = 0, limit: int = 100, 
                          status: Optional[str] = None):
    query = db.query(models.Lesson).options(
        joinedload(models.Lesson.student)
    ).filter(models.Lesson.teacher_id == teacher_id)
    
    if status:
        query = query.filter(models.Lesson.status == status)
    
    return query.order_by(models.Lesson.scheduled_at).offset(skip).limit(limit).all()


def get_lessons_by_student(db: Session, student_id: int, skip: int = 0, limit: int = 100,
                          status: Optional[str] = None):
    query = db.query(models.Lesson).options(
        joinedload(models.Lesson.teacher)
    ).filter(models.Lesson.student_id == student_id)
    
    if status:
        query = query.filter(models.Lesson.status == status)
    
    return query.order_by(models.Lesson.scheduled_at).offset(skip).limit(limit).all()


def create_lesson(db: Session, lesson: schemas.LessonCreate, created_by: Optional[int] = None):
    lesson_data = lesson.model_dump()
    if created_by:
        lesson_data['created_by'] = created_by
    
    db_lesson = models.Lesson(**lesson_data)
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)
    
    # Log the creation
    if created_by:
        log_audit_action(db, created_by, "CREATE", "lesson", db_lesson.id, 
                        f"Created lesson: {db_lesson.title}")
    
    return db_lesson


def update_lesson(db: Session, lesson_id: int, lesson_update: schemas.LessonUpdate, 
                 updated_by: Optional[int] = None):
    db_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if db_lesson:
        update_data = lesson_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_lesson, field, value)
        
        db_lesson.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_lesson)
        
        # Log the update
        if updated_by:
            log_audit_action(db, updated_by, "UPDATE", "lesson", db_lesson.id, 
                           f"Updated lesson: {db_lesson.title}")
    
    return db_lesson


def delete_lesson(db: Session, lesson_id: int, deleted_by: Optional[int] = None):
    db_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if db_lesson:
        title = db_lesson.title
        db.delete(db_lesson)
        db.commit()
        
        # Log the deletion
        if deleted_by:
            log_audit_action(db, deleted_by, "DELETE", "lesson", lesson_id, f"Deleted lesson: {title}")
    
    return db_lesson


def search_lessons(db: Session, query: str, skip: int = 0, limit: int = 100):
    """Search lessons by title, description, or instrument"""
    return db.query(models.Lesson).options(
        joinedload(models.Lesson.teacher),
        joinedload(models.Lesson.student)
    ).filter(
        or_(
            models.Lesson.title.contains(query),
            models.Lesson.description.contains(query),
            models.Lesson.instrument.contains(query)
        )
    ).offset(skip).limit(limit).all()


def get_upcoming_lessons(db: Session, user_id: int, limit: int = 10):
    """Get upcoming lessons for a user (as teacher or student)"""
    return db.query(models.Lesson).options(
        joinedload(models.Lesson.teacher),
        joinedload(models.Lesson.student)
    ).filter(
        and_(
            or_(
                models.Lesson.teacher_id == user_id,
                models.Lesson.student_id == user_id
            ),
            models.Lesson.scheduled_at > datetime.utcnow(),
            models.Lesson.status == models.LessonStatus.SCHEDULED
        )
    ).order_by(models.Lesson.scheduled_at).limit(limit).all()


def get_lessons_today(db: Session, user_id: Optional[int] = None):
    """Get lessons scheduled for today"""
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    query = db.query(models.Lesson).options(
        joinedload(models.Lesson.teacher),
        joinedload(models.Lesson.student)
    ).filter(
        and_(
            models.Lesson.scheduled_at >= today_start,
            models.Lesson.scheduled_at < today_end,
            models.Lesson.status == models.LessonStatus.SCHEDULED
        )
    )
    
    if user_id:
        query = query.filter(
            or_(
                models.Lesson.teacher_id == user_id,
                models.Lesson.student_id == user_id
            )
        )
    
    return query.order_by(models.Lesson.scheduled_at).all()


# System Settings CRUD
def get_system_setting(db: Session, key: str):
    return db.query(models.SystemSettings).filter(models.SystemSettings.key == key).first()


def get_system_settings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.SystemSettings).offset(skip).limit(limit).all()


def create_system_setting(db: Session, setting: schemas.SystemSettingsCreate, created_by: Optional[int] = None):
    db_setting = models.SystemSettings(**setting.model_dump())
    db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    
    if created_by:
        log_audit_action(db, created_by, "CREATE", "system_setting", db_setting.id, 
                        f"Created setting: {db_setting.key}")
    
    return db_setting


def update_system_setting(db: Session, key: str, setting_update: schemas.SystemSettingsUpdate, 
                         updated_by: Optional[int] = None):
    db_setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == key).first()
    if db_setting:
        update_data = setting_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_setting, field, value)
        
        db_setting.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_setting)
        
        if updated_by:
            log_audit_action(db, updated_by, "UPDATE", "system_setting", db_setting.id, 
                           f"Updated setting: {db_setting.key}")
    
    return db_setting


# Audit Log Operations
def log_audit_action(db: Session, user_id: int, action: str, resource_type: str, 
                    resource_id: Optional[int] = None, details: Optional[str] = None,
                    ip_address: Optional[str] = None, user_agent: Optional[str] = None):
    audit_log = models.AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(audit_log)
    db.commit()
    return audit_log


def get_audit_logs(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None,
                  resource_type: Optional[str] = None, action: Optional[str] = None):
    query = db.query(models.AuditLog).options(joinedload(models.AuditLog.user))
    
    if user_id:
        query = query.filter(models.AuditLog.user_id == user_id)
    if resource_type:
        query = query.filter(models.AuditLog.resource_type == resource_type)
    if action:
        query = query.filter(models.AuditLog.action == action)
    
    return query.order_by(desc(models.AuditLog.created_at)).offset(skip).limit(limit).all()


# Dashboard Statistics
def get_dashboard_stats(db: Session) -> Dict[str, Any]:
    """Get comprehensive dashboard statistics"""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = today_start.replace(day=1)
    
    stats = {
        "total_users": db.query(func.count(models.User.id)).scalar(),
        "total_instructors": db.query(func.count(models.User.id)).filter(
            models.User.role == models.UserRole.INSTRUCTOR
        ).scalar(),
        "total_students": db.query(func.count(models.User.id)).filter(
            models.User.role == models.UserRole.STUDENT
        ).scalar(),
        "total_lessons": db.query(func.count(models.Lesson.id)).scalar(),
        "lessons_today": db.query(func.count(models.Lesson.id)).filter(
            and_(
                models.Lesson.scheduled_at >= today_start,
                models.Lesson.scheduled_at < today_start + timedelta(days=1)
            )
        ).scalar(),
        "lessons_this_week": db.query(func.count(models.Lesson.id)).filter(
            models.Lesson.scheduled_at >= week_start
        ).scalar(),
        "lessons_this_month": db.query(func.count(models.Lesson.id)).filter(
            models.Lesson.scheduled_at >= month_start
        ).scalar(),
        "active_users": db.query(func.count(models.User.id)).filter(
            models.User.is_active == True
        ).scalar(),
        "recent_registrations": db.query(func.count(models.User.id)).filter(
            models.User.created_at >= today_start - timedelta(days=7)
        ).scalar()
    }
    
    return stats


def get_instructor_dashboard_stats(db: Session, instructor_id: int) -> Dict[str, Any]:
    """Get instructor-specific dashboard statistics"""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = today_start.replace(day=1)
    
    # Get unique students taught by this instructor
    total_students = db.query(func.count(func.distinct(models.Lesson.student_id))).filter(
        models.Lesson.teacher_id == instructor_id
    ).scalar()
    
    lessons_today = db.query(func.count(models.Lesson.id)).filter(
        and_(
            models.Lesson.teacher_id == instructor_id,
            models.Lesson.scheduled_at >= today_start,
            models.Lesson.scheduled_at < today_start + timedelta(days=1)
        )
    ).scalar()
    
    lessons_this_week = db.query(func.count(models.Lesson.id)).filter(
        and_(
            models.Lesson.teacher_id == instructor_id,
            models.Lesson.scheduled_at >= week_start
        )
    ).scalar()
    
    lessons_this_month = db.query(func.count(models.Lesson.id)).filter(
        and_(
            models.Lesson.teacher_id == instructor_id,
            models.Lesson.scheduled_at >= month_start
        )
    ).scalar()
    
    # Get upcoming lessons
    upcoming_lessons = get_lessons_by_teacher(db, instructor_id, limit=5, 
                                            status=models.LessonStatus.SCHEDULED)
    
    # Get recent completed lessons
    recent_lessons = db.query(models.Lesson).options(
        joinedload(models.Lesson.student)
    ).filter(
        and_(
            models.Lesson.teacher_id == instructor_id,
            models.Lesson.status == models.LessonStatus.COMPLETED
        )
    ).order_by(desc(models.Lesson.scheduled_at)).limit(5).all()
    
    return {
        "total_students": total_students,
        "lessons_today": lessons_today,
        "lessons_this_week": lessons_this_week,
        "lessons_this_month": lessons_this_month,
        "upcoming_lessons": upcoming_lessons,
        "recent_lessons": recent_lessons
    }
