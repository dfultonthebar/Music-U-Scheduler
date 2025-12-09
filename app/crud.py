from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, asc, String
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

        # Delete related lessons where user is the student
        db.query(models.Lesson).filter(models.Lesson.student_id == user_id).delete(synchronize_session=False)

        # Set created_by to NULL for lessons created by this user (if they were an admin/instructor)
        db.query(models.Lesson).filter(models.Lesson.created_by == user_id).update(
            {models.Lesson.created_by: None}, synchronize_session=False
        )

        # Delete the user
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


# Instructor Availability CRUD Operations
def get_instructor_availability(db: Session, availability_id: int):
    """Get a single availability record by ID"""
    return db.query(models.InstructorAvailability).filter(
        models.InstructorAvailability.id == availability_id
    ).first()


def get_instructor_availability_slots(db: Session, instructor_id: int, is_active: Optional[bool] = None):
    """Get all availability slots for an instructor"""
    query = db.query(models.InstructorAvailability).filter(
        models.InstructorAvailability.instructor_id == instructor_id
    )
    if is_active is not None:
        query = query.filter(models.InstructorAvailability.is_active == is_active)
    return query.order_by(
        models.InstructorAvailability.day_of_week,
        models.InstructorAvailability.start_time
    ).all()


def get_instructor_availability_by_day(db: Session, instructor_id: int, day_of_week: int):
    """Get availability slots for a specific day of the week"""
    return db.query(models.InstructorAvailability).filter(
        and_(
            models.InstructorAvailability.instructor_id == instructor_id,
            models.InstructorAvailability.day_of_week == day_of_week,
            models.InstructorAvailability.is_active == True
        )
    ).order_by(models.InstructorAvailability.start_time).all()


def create_instructor_availability(db: Session, instructor_id: int,
                                   availability: schemas.InstructorAvailabilityCreate,
                                   created_by: Optional[int] = None):
    """Create a new availability slot for an instructor"""
    db_availability = models.InstructorAvailability(
        instructor_id=instructor_id,
        day_of_week=availability.day_of_week,
        start_time=availability.start_time,
        end_time=availability.end_time,
        is_active=availability.is_active
    )
    db.add(db_availability)
    db.commit()
    db.refresh(db_availability)

    if created_by:
        log_audit_action(db, created_by, "CREATE", "instructor_availability",
                        db_availability.id, f"Created availability for instructor {instructor_id}")

    return db_availability


def update_instructor_availability(db: Session, availability_id: int,
                                   availability_update: schemas.InstructorAvailabilityUpdate,
                                   updated_by: Optional[int] = None):
    """Update an existing availability slot"""
    db_availability = db.query(models.InstructorAvailability).filter(
        models.InstructorAvailability.id == availability_id
    ).first()

    if db_availability:
        update_data = availability_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_availability, field, value)

        db_availability.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_availability)

        if updated_by:
            log_audit_action(db, updated_by, "UPDATE", "instructor_availability",
                           db_availability.id, f"Updated availability {availability_id}")

    return db_availability


def delete_instructor_availability(db: Session, availability_id: int, deleted_by: Optional[int] = None):
    """Delete an availability slot"""
    db_availability = db.query(models.InstructorAvailability).filter(
        models.InstructorAvailability.id == availability_id
    ).first()

    if db_availability:
        instructor_id = db_availability.instructor_id
        db.delete(db_availability)
        db.commit()

        if deleted_by:
            log_audit_action(db, deleted_by, "DELETE", "instructor_availability",
                           availability_id, f"Deleted availability for instructor {instructor_id}")

    return db_availability


def bulk_create_instructor_availability(db: Session, instructor_id: int,
                                        availability_list: List[schemas.InstructorAvailabilityCreate],
                                        created_by: Optional[int] = None):
    """Bulk create availability slots for an instructor"""
    created_slots = []
    for availability in availability_list:
        db_availability = models.InstructorAvailability(
            instructor_id=instructor_id,
            day_of_week=availability.day_of_week,
            start_time=availability.start_time,
            end_time=availability.end_time,
            is_active=availability.is_active
        )
        db.add(db_availability)
        created_slots.append(db_availability)

    db.commit()
    for slot in created_slots:
        db.refresh(slot)

    if created_by:
        log_audit_action(db, created_by, "BULK_CREATE", "instructor_availability",
                        None, f"Created {len(created_slots)} availability slots for instructor {instructor_id}")

    return created_slots


# Availability Exception CRUD Operations (Days Off)
def get_availability_exception(db: Session, exception_id: int):
    """Get a single availability exception by ID"""
    return db.query(models.AvailabilityException).filter(
        models.AvailabilityException.id == exception_id
    ).first()


def get_instructor_exceptions(db: Session, instructor_id: int,
                              date_from: Optional[datetime] = None,
                              date_to: Optional[datetime] = None):
    """Get all exceptions for an instructor, optionally filtered by date range"""
    query = db.query(models.AvailabilityException).filter(
        models.AvailabilityException.instructor_id == instructor_id
    )

    if date_from:
        query = query.filter(models.AvailabilityException.exception_date >= date_from.date())
    if date_to:
        query = query.filter(models.AvailabilityException.exception_date <= date_to.date())

    return query.order_by(models.AvailabilityException.exception_date).all()


def get_exception_for_date(db: Session, instructor_id: int, check_date):
    """Get exception for a specific date if it exists"""
    from datetime import date as date_type
    if isinstance(check_date, datetime):
        check_date = check_date.date()

    return db.query(models.AvailabilityException).filter(
        and_(
            models.AvailabilityException.instructor_id == instructor_id,
            models.AvailabilityException.exception_date == check_date
        )
    ).first()


def create_availability_exception(db: Session, instructor_id: int,
                                  exception: schemas.AvailabilityExceptionCreate,
                                  created_by: Optional[int] = None):
    """Create a new availability exception (day off)"""
    db_exception = models.AvailabilityException(
        instructor_id=instructor_id,
        exception_date=exception.exception_date,
        is_full_day=exception.is_full_day,
        start_time=exception.start_time,
        end_time=exception.end_time,
        reason=exception.reason
    )
    db.add(db_exception)
    db.commit()
    db.refresh(db_exception)

    if created_by:
        log_audit_action(db, created_by, "CREATE", "availability_exception",
                        db_exception.id, f"Created exception for instructor {instructor_id} on {exception.exception_date}")

    return db_exception


def update_availability_exception(db: Session, exception_id: int,
                                  exception_update: schemas.AvailabilityExceptionUpdate,
                                  updated_by: Optional[int] = None):
    """Update an existing availability exception"""
    db_exception = db.query(models.AvailabilityException).filter(
        models.AvailabilityException.id == exception_id
    ).first()

    if db_exception:
        update_data = exception_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_exception, field, value)

        db_exception.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_exception)

        if updated_by:
            log_audit_action(db, updated_by, "UPDATE", "availability_exception",
                           db_exception.id, f"Updated exception {exception_id}")

    return db_exception


def delete_availability_exception(db: Session, exception_id: int, deleted_by: Optional[int] = None):
    """Delete an availability exception"""
    db_exception = db.query(models.AvailabilityException).filter(
        models.AvailabilityException.id == exception_id
    ).first()

    if db_exception:
        instructor_id = db_exception.instructor_id
        exception_date = db_exception.exception_date
        db.delete(db_exception)
        db.commit()

        if deleted_by:
            log_audit_action(db, deleted_by, "DELETE", "availability_exception",
                           exception_id, f"Deleted exception for instructor {instructor_id} on {exception_date}")

    return db_exception


# Scheduling Validation Functions
def check_instructor_availability_for_time(db: Session, instructor_id: int,
                                           proposed_start: datetime,
                                           proposed_end: datetime) -> Dict[str, Any]:
    """
    Check if an instructor is available during the proposed time slot.
    Returns validation result with any conflicts found.
    """
    from datetime import time as time_type

    conflicts = []

    # Get the day of week (0=Monday, 6=Sunday)
    day_of_week = proposed_start.weekday()
    proposed_date = proposed_start.date()
    proposed_start_time = proposed_start.time()
    proposed_end_time = proposed_end.time()

    # 1. Check if there's an exception for this date
    exception = get_exception_for_date(db, instructor_id, proposed_date)
    if exception:
        if exception.is_full_day:
            conflicts.append({
                "conflict_type": "day_off",
                "message": f"Instructor has the day off: {exception.reason or 'Day off'}",
                "conflicting_lesson_id": None
            })
        else:
            # Partial day exception - check if proposed time overlaps
            if exception.start_time and exception.end_time:
                if (proposed_start_time < exception.end_time and
                    proposed_end_time > exception.start_time):
                    conflicts.append({
                        "conflict_type": "day_off",
                        "message": f"Instructor unavailable during this time: {exception.reason or 'Unavailable'}",
                        "conflicting_lesson_id": None
                    })

    # 2. Check if time falls within instructor's availability for this day
    availability_slots = get_instructor_availability_by_day(db, instructor_id, day_of_week)

    if not availability_slots:
        conflicts.append({
            "conflict_type": "outside_availability",
            "message": f"Instructor has no availability set for this day",
            "conflicting_lesson_id": None
        })
    else:
        # Check if the proposed time falls within any availability slot
        is_within_availability = False
        for slot in availability_slots:
            if (proposed_start_time >= slot.start_time and
                proposed_end_time <= slot.end_time):
                is_within_availability = True
                break

        if not is_within_availability:
            available_times = ", ".join([
                f"{slot.start_time.strftime('%H:%M')}-{slot.end_time.strftime('%H:%M')}"
                for slot in availability_slots
            ])
            conflicts.append({
                "conflict_type": "outside_availability",
                "message": f"Time is outside instructor's availability. Available times: {available_times}",
                "conflicting_lesson_id": None
            })

    # 3. Check for lesson overlaps (including break time)
    existing_lessons = db.query(models.Lesson).filter(
        and_(
            models.Lesson.teacher_id == instructor_id,
            models.Lesson.status.in_([models.LessonStatus.SCHEDULED, models.LessonStatus.RESCHEDULED]),
            func.date(models.Lesson.scheduled_at) == proposed_date
        )
    ).all()

    for lesson in existing_lessons:
        lesson_start = lesson.scheduled_at
        # Lesson end includes the lesson duration plus any break time after
        lesson_end = lesson_start + timedelta(minutes=lesson.duration_minutes + lesson.break_after_minutes)

        # Check for overlap
        if (proposed_start < lesson_end and proposed_end > lesson_start):
            if proposed_start < lesson_start + timedelta(minutes=lesson.duration_minutes):
                conflict_type = "lesson_overlap"
                message = f"Conflicts with lesson '{lesson.title}' ({lesson_start.strftime('%H:%M')}-{(lesson_start + timedelta(minutes=lesson.duration_minutes)).strftime('%H:%M')})"
            else:
                conflict_type = "break_overlap"
                message = f"Conflicts with break time after lesson '{lesson.title}'"

            conflicts.append({
                "conflict_type": conflict_type,
                "message": message,
                "conflicting_lesson_id": lesson.id
            })

    return {
        "is_valid": len(conflicts) == 0,
        "conflicts": conflicts
    }


def get_available_time_slots(db: Session, instructor_id: int,
                             target_date: datetime,
                             duration_minutes: int = 60,
                             break_minutes: int = 0) -> List[Dict[str, Any]]:
    """
    Get available time slots for an instructor on a specific date.
    Returns list of available start times.
    """
    from datetime import time as time_type

    available_slots = []
    check_date = target_date.date() if isinstance(target_date, datetime) else target_date
    day_of_week = check_date.weekday()

    # Check for full-day exception
    exception = get_exception_for_date(db, instructor_id, check_date)
    if exception and exception.is_full_day:
        return []  # No availability on this day

    # Get availability slots for this day
    availability_slots = get_instructor_availability_by_day(db, instructor_id, day_of_week)
    if not availability_slots:
        return []

    # Get existing lessons for this day
    existing_lessons = db.query(models.Lesson).filter(
        and_(
            models.Lesson.teacher_id == instructor_id,
            models.Lesson.status.in_([models.LessonStatus.SCHEDULED, models.LessonStatus.RESCHEDULED]),
            func.date(models.Lesson.scheduled_at) == check_date
        )
    ).order_by(models.Lesson.scheduled_at).all()

    # Build blocked time ranges
    blocked_ranges = []
    for lesson in existing_lessons:
        block_start = lesson.scheduled_at
        block_end = lesson.scheduled_at + timedelta(minutes=lesson.duration_minutes + lesson.break_after_minutes)
        blocked_ranges.append((block_start.time(), block_end.time()))

    # Add partial-day exception to blocked ranges
    if exception and not exception.is_full_day:
        if exception.start_time and exception.end_time:
            blocked_ranges.append((exception.start_time, exception.end_time))

    # For each availability slot, find available time slots in 5-minute increments
    for avail_slot in availability_slots:
        current_time = avail_slot.start_time
        slot_end = avail_slot.end_time

        while True:
            # Calculate end time for a lesson starting at current_time
            start_dt = datetime.combine(check_date, current_time)
            end_dt = start_dt + timedelta(minutes=duration_minutes + break_minutes)

            # Check if end time exceeds availability
            if end_dt.time() > slot_end:
                break

            # Check if this slot overlaps with any blocked range
            is_blocked = False
            for block_start, block_end in blocked_ranges:
                if current_time < block_end and end_dt.time() > block_start:
                    is_blocked = True
                    break

            if not is_blocked:
                available_slots.append({
                    "start_time": start_dt,
                    "end_time": start_dt + timedelta(minutes=duration_minutes),
                    "is_available": True,
                    "conflict_reason": None
                })

            # Move to next 5-minute slot
            current_time = (datetime.combine(check_date, current_time) + timedelta(minutes=5)).time()

    return available_slots


def get_instructor_schedule_for_date_range(db: Session, instructor_id: int,
                                           start_date: datetime,
                                           end_date: datetime) -> List[Dict[str, Any]]:
    """
    Get instructor's full schedule for a date range including availability,
    exceptions, and booked lessons.
    """
    schedule = []
    current_date = start_date.date() if isinstance(start_date, datetime) else start_date
    final_date = end_date.date() if isinstance(end_date, datetime) else end_date

    while current_date <= final_date:
        day_of_week = current_date.weekday()

        # Get availability for this day of week
        availability = get_instructor_availability_by_day(db, instructor_id, day_of_week)

        # Get any exception for this date
        exception = get_exception_for_date(db, instructor_id, current_date)

        # Get lessons for this date
        lessons = db.query(models.Lesson).options(
            joinedload(models.Lesson.student)
        ).filter(
            and_(
                models.Lesson.teacher_id == instructor_id,
                func.date(models.Lesson.scheduled_at) == current_date,
                models.Lesson.status.in_([models.LessonStatus.SCHEDULED, models.LessonStatus.RESCHEDULED])
            )
        ).order_by(models.Lesson.scheduled_at).all()

        # Convert lessons to summary format
        lesson_summaries = []
        for lesson in lessons:
            lesson_summaries.append({
                "id": lesson.id,
                "title": lesson.title,
                "scheduled_at": lesson.scheduled_at,
                "duration_minutes": lesson.duration_minutes,
                "break_after_minutes": lesson.break_after_minutes,
                "status": lesson.status.value,
                "teacher_name": "",  # Will be filled by the instructor themselves
                "student_name": lesson.student.full_name if lesson.student else "Unknown",
                "instrument": lesson.instrument
            })

        schedule.append({
            "date": current_date,
            "day_of_week": day_of_week,
            "availability_slots": availability,
            "exceptions": [exception] if exception else [],
            "lessons": lesson_summaries,
            "is_day_off": exception.is_full_day if exception else False
        })

        current_date = current_date + timedelta(days=1)

    return schedule


# Lesson Template CRUD Operations
def get_lesson_template(db: Session, template_id: int):
    """Get a lesson template by ID"""
    return db.query(models.LessonTemplate).options(
        joinedload(models.LessonTemplate.instructor),
        joinedload(models.LessonTemplate.student)
    ).filter(models.LessonTemplate.id == template_id).first()


def get_lesson_templates(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    instructor_id: Optional[int] = None,
    student_id: Optional[int] = None,
    is_active: Optional[bool] = None
):
    """Get all lesson templates with optional filtering"""
    query = db.query(models.LessonTemplate).options(
        joinedload(models.LessonTemplate.instructor),
        joinedload(models.LessonTemplate.student)
    )

    if instructor_id is not None:
        query = query.filter(models.LessonTemplate.instructor_id == instructor_id)
    if student_id is not None:
        query = query.filter(models.LessonTemplate.student_id == student_id)
    if is_active is not None:
        query = query.filter(models.LessonTemplate.is_active == is_active)

    return query.offset(skip).limit(limit).all()


def create_lesson_template(
    db: Session,
    template: schemas.LessonTemplateCreate,
    created_by: Optional[int] = None
):
    """Create a new lesson template"""
    db_template = models.LessonTemplate(
        instructor_id=template.instructor_id,
        student_id=template.student_id,
        day_of_week=template.day_of_week,
        start_time=template.start_time,
        duration_minutes=template.duration_minutes,
        instrument=template.instrument,
        lesson_type=template.lesson_type,
        location=template.location,
        room_number=template.room_number,
        is_active=template.is_active
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)

    # Log the creation
    if created_by:
        log_audit_action(
            db, created_by, "CREATE", "lesson_template", db_template.id,
            f"Created lesson template for instructor {template.instructor_id} and student {template.student_id}"
        )

    return db_template


def update_lesson_template(
    db: Session,
    template_id: int,
    template_update: schemas.LessonTemplateUpdate,
    updated_by: Optional[int] = None
):
    """Update a lesson template"""
    db_template = db.query(models.LessonTemplate).filter(
        models.LessonTemplate.id == template_id
    ).first()

    if db_template:
        update_data = template_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_template, field, value)

        db_template.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_template)

        # Log the update
        if updated_by:
            log_audit_action(
                db, updated_by, "UPDATE", "lesson_template", db_template.id,
                f"Updated lesson template {template_id}"
            )

    return db_template


def delete_lesson_template(
    db: Session,
    template_id: int,
    deleted_by: Optional[int] = None
):
    """Delete a lesson template"""
    db_template = db.query(models.LessonTemplate).filter(
        models.LessonTemplate.id == template_id
    ).first()

    if db_template:
        # Log the deletion before removing
        if deleted_by:
            log_audit_action(
                db, deleted_by, "DELETE", "lesson_template", template_id,
                f"Deleted lesson template for instructor {db_template.instructor_id} and student {db_template.student_id}"
            )

        db.delete(db_template)
        db.commit()
        return True

    return False


def generate_lessons_from_templates(
    db: Session,
    start_date: datetime.date,
    end_date: datetime.date,
    template_ids: Optional[List[int]] = None,
    created_by: Optional[int] = None
) -> Dict[str, Any]:
    """
    Generate lessons from templates for a date range.

    Args:
        db: Database session
        start_date: Start date for lesson generation
        end_date: End date for lesson generation
        template_ids: Optional list of specific template IDs to use. If None, uses all active templates.
        created_by: ID of the user creating the lessons

    Returns:
        Dictionary with creation statistics and details
    """
    from datetime import datetime as dt, time as dt_time

    # Get templates to process
    query = db.query(models.LessonTemplate).options(
        joinedload(models.LessonTemplate.instructor),
        joinedload(models.LessonTemplate.student)
    ).filter(models.LessonTemplate.is_active == True)

    if template_ids:
        query = query.filter(models.LessonTemplate.id.in_(template_ids))

    templates = query.all()

    lessons_created = 0
    lessons_skipped = 0
    details = []

    # Iterate through each template
    for template in templates:
        current_date = start_date

        # Iterate through each day in the range
        while current_date <= end_date:
            # Check if this day matches the template's day of week
            # Python's weekday() returns 0=Monday, 6=Sunday (same as our model)
            if current_date.weekday() == template.day_of_week:
                # Combine date and time to create scheduled datetime
                scheduled_at = dt.combine(current_date, template.start_time)

                # Check if a lesson already exists at this time
                existing_lesson = db.query(models.Lesson).filter(
                    and_(
                        models.Lesson.teacher_id == template.instructor_id,
                        models.Lesson.student_id == template.student_id,
                        models.Lesson.scheduled_at == scheduled_at
                    )
                ).first()

                if existing_lesson:
                    lessons_skipped += 1
                    details.append({
                        "date": current_date.isoformat(),
                        "template_id": template.id,
                        "status": "skipped",
                        "reason": "Lesson already exists"
                    })
                else:
                    # Check for scheduling conflicts
                    end_time = scheduled_at + timedelta(minutes=template.duration_minutes)

                    # Check for overlapping lessons
                    conflicting_lesson = db.query(models.Lesson).filter(
                        and_(
                            models.Lesson.teacher_id == template.instructor_id,
                            models.Lesson.scheduled_at < end_time,
                            func.datetime(
                                models.Lesson.scheduled_at,
                                '+' + func.cast(models.Lesson.duration_minutes, String) + ' minutes'
                            ) > scheduled_at
                        )
                    ).first()

                    if conflicting_lesson:
                        lessons_skipped += 1
                        details.append({
                            "date": current_date.isoformat(),
                            "template_id": template.id,
                            "status": "skipped",
                            "reason": f"Conflicts with lesson ID {conflicting_lesson.id}"
                        })
                    else:
                        # Create the lesson
                        lesson_data = schemas.LessonCreate(
                            title=f"{template.instrument or 'Music'} Lesson",
                            description=f"Recurring lesson from template {template.id}",
                            teacher_id=template.instructor_id,
                            student_id=template.student_id,
                            scheduled_at=scheduled_at,
                            duration_minutes=template.duration_minutes,
                            break_after_minutes=0,  # Can be set based on instructor defaults
                            instrument=template.instrument,
                            lesson_type=template.lesson_type,
                            location=template.location,
                            room_number=template.room_number
                        )

                        new_lesson = create_lesson(db, lesson_data, created_by=created_by)
                        lessons_created += 1
                        details.append({
                            "date": current_date.isoformat(),
                            "template_id": template.id,
                            "lesson_id": new_lesson.id,
                            "status": "created"
                        })

            current_date = current_date + timedelta(days=1)

    # Log the bulk generation
    if created_by:
        log_audit_action(
            db, created_by, "BULK_CREATE", "lesson", None,
            f"Generated {lessons_created} lessons from templates ({lessons_skipped} skipped)"
        )

    return {
        "lessons_created": lessons_created,
        "lessons_skipped": lessons_skipped,
        "date_range": f"{start_date.isoformat()} to {end_date.isoformat()}",
        "details": details
    }
