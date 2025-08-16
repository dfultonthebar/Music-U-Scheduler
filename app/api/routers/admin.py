

"""
Admin API endpoints for Music U Scheduler
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from ...database import get_db
from ...auth.dependencies import require_admin_role
from ... import crud, schemas, models

router = APIRouter(prefix="/admin", tags=["admin"])


# Dashboard
@router.get("/dashboard", response_model=schemas.DashboardStats)
async def get_admin_dashboard(
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    return crud.get_dashboard_stats(db)


# User Management
@router.get("/users", response_model=List[schemas.User])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get all users with filtering options"""
    return crud.get_users(db, skip=skip, limit=limit, role=role, is_active=is_active)


@router.get("/users/count")
async def get_users_count(
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get total count of users with filtering"""
    return {"count": crud.get_users_count(db, role=role, is_active=is_active)}


@router.get("/users/{user_id}", response_model=schemas.User)
async def get_user_by_id(
    user_id: int,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get user by ID"""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/users", response_model=schemas.User)
async def create_user(
    user: schemas.UserCreate,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Create a new user"""
    # Check if user already exists
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user
    db_user = crud.create_user(db, user, created_by=current_user.id)
    
    # Log the action
    crud.log_audit_action(
        db, current_user.id, "CREATE", "user", db_user.id,
        f"Admin created user: {db_user.username}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return db_user


@router.put("/users/{user_id}", response_model=schemas.User)
async def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Update user information"""
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check for email/username conflicts
    if user_update.email and user_update.email != db_user.email:
        if crud.get_user_by_email(db, user_update.email):
            raise HTTPException(status_code=400, detail="Email already registered")
    
    if user_update.username and user_update.username != db_user.username:
        if crud.get_user_by_username(db, user_update.username):
            raise HTTPException(status_code=400, detail="Username already taken")
    
    updated_user = crud.update_user(db, user_id, user_update, updated_by=current_user.id)
    
    # Log the action
    crud.log_audit_action(
        db, current_user.id, "UPDATE", "user", user_id,
        f"Admin updated user: {updated_user.username}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return updated_user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Delete a user"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    username = db_user.username
    crud.delete_user(db, user_id, deleted_by=current_user.id)
    
    # Log the action
    crud.log_audit_action(
        db, current_user.id, "DELETE", "user", user_id,
        f"Admin deleted user: {username}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return {"message": f"User {username} deleted successfully"}


@router.post("/users/bulk", response_model=List[schemas.User])
async def create_bulk_users(
    bulk_users: schemas.BulkUserCreate,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Create multiple users at once"""
    created_users = []
    errors = []
    
    for i, user in enumerate(bulk_users.users):
        try:
            # Check if user already exists
            if crud.get_user_by_email(db, user.email):
                errors.append(f"Row {i+1}: Email {user.email} already registered")
                continue
            if crud.get_user_by_username(db, user.username):
                errors.append(f"Row {i+1}: Username {user.username} already taken")
                continue
            
            # Create user
            db_user = crud.create_user(db, user, created_by=current_user.id)
            created_users.append(db_user)
            
        except Exception as e:
            errors.append(f"Row {i+1}: {str(e)}")
    
    # Log the bulk action
    crud.log_audit_action(
        db, current_user.id, "BULK_CREATE", "user", None,
        f"Admin bulk created {len(created_users)} users. Errors: {len(errors)}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    if errors:
        raise HTTPException(
            status_code=207,  # Multi-Status
            detail={
                "message": f"Created {len(created_users)} users with {len(errors)} errors",
                "created": len(created_users),
                "errors": errors,
                "users": created_users
            }
        )
    
    return created_users


# Lesson Management
@router.get("/lessons", response_model=List[schemas.Lesson])
async def get_all_lessons(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get all lessons with filtering options"""
    return crud.get_lessons(db, skip=skip, limit=limit, status=status, 
                           date_from=date_from, date_to=date_to)


@router.get("/lessons/count")
async def get_lessons_count(
    status: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get total count of lessons with filtering"""
    return {"count": crud.get_lessons_count(db, status=status, date_from=date_from, date_to=date_to)}


@router.post("/lessons", response_model=schemas.Lesson)
async def create_lesson(
    lesson: schemas.LessonCreate,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Create a new lesson"""
    # Verify teacher and student exist
    teacher = crud.get_user(db, lesson.teacher_id)
    if not teacher or (teacher.role != models.UserRole.INSTRUCTOR and not teacher.is_teacher):
        raise HTTPException(status_code=400, detail="Invalid teacher ID")
    
    student = crud.get_user(db, lesson.student_id)
    if not student:
        raise HTTPException(status_code=400, detail="Invalid student ID")
    
    db_lesson = crud.create_lesson(db, lesson, created_by=current_user.id)
    
    # Log the action
    crud.log_audit_action(
        db, current_user.id, "CREATE", "lesson", db_lesson.id,
        f"Admin created lesson: {db_lesson.title}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return db_lesson


@router.post("/lessons/bulk", response_model=List[schemas.Lesson])
async def create_bulk_lessons(
    bulk_lessons: schemas.BulkLessonCreate,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Create multiple lessons at once"""
    created_lessons = []
    errors = []
    
    for i, lesson in enumerate(bulk_lessons.lessons):
        try:
            # Verify teacher and student exist
            teacher = crud.get_user(db, lesson.teacher_id)
            if not teacher or (teacher.role != models.UserRole.INSTRUCTOR and not teacher.is_teacher):
                errors.append(f"Row {i+1}: Invalid teacher ID {lesson.teacher_id}")
                continue
            
            student = crud.get_user(db, lesson.student_id)
            if not student:
                errors.append(f"Row {i+1}: Invalid student ID {lesson.student_id}")
                continue
            
            # Create lesson
            db_lesson = crud.create_lesson(db, lesson, created_by=current_user.id)
            created_lessons.append(db_lesson)
            
        except Exception as e:
            errors.append(f"Row {i+1}: {str(e)}")
    
    # Log the bulk action
    crud.log_audit_action(
        db, current_user.id, "BULK_CREATE", "lesson", None,
        f"Admin bulk created {len(created_lessons)} lessons. Errors: {len(errors)}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    if errors:
        raise HTTPException(
            status_code=207,  # Multi-Status
            detail={
                "message": f"Created {len(created_lessons)} lessons with {len(errors)} errors",
                "created": len(created_lessons),
                "errors": errors,
                "lessons": created_lessons
            }
        )
    
    return created_lessons


# System Settings
@router.get("/settings", response_model=List[schemas.SystemSettings])
async def get_system_settings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get system settings"""
    return crud.get_system_settings(db, skip=skip, limit=limit)


@router.get("/settings/{key}", response_model=schemas.SystemSettings)
async def get_system_setting(
    key: str,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get a specific system setting"""
    setting = crud.get_system_setting(db, key)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting


@router.post("/settings", response_model=schemas.SystemSettings)
async def create_system_setting(
    setting: schemas.SystemSettingsCreate,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Create a new system setting"""
    # Check if setting already exists
    if crud.get_system_setting(db, setting.key):
        raise HTTPException(status_code=400, detail="Setting already exists")
    
    db_setting = crud.create_system_setting(db, setting, created_by=current_user.id)
    
    # Log the action
    crud.log_audit_action(
        db, current_user.id, "CREATE", "system_setting", db_setting.id,
        f"Admin created setting: {db_setting.key}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return db_setting


@router.put("/settings/{key}", response_model=schemas.SystemSettings)
async def update_system_setting(
    key: str,
    setting_update: schemas.SystemSettingsUpdate,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Update a system setting"""
    db_setting = crud.get_system_setting(db, key)
    if not db_setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    updated_setting = crud.update_system_setting(db, key, setting_update, updated_by=current_user.id)
    
    # Log the action
    crud.log_audit_action(
        db, current_user.id, "UPDATE", "system_setting", db_setting.id,
        f"Admin updated setting: {key}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return updated_setting


# Audit Logs
@router.get("/audit-logs", response_model=List[schemas.AuditLog])
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[int] = Query(None),
    resource_type: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get audit logs with filtering options"""
    return crud.get_audit_logs(db, skip=skip, limit=limit, user_id=user_id, 
                              resource_type=resource_type, action=action)


# Reports
@router.get("/reports/users", response_model=List[schemas.UserReport])
async def get_user_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get user activity reports"""
    users = crud.get_users(db, skip=skip, limit=limit)
    reports = []
    
    for user in users:
        # Get lesson statistics for each user
        total_lessons = db.query(models.Lesson).filter(
            or_(models.Lesson.teacher_id == user.id, models.Lesson.student_id == user.id)
        ).count()
        
        completed_lessons = db.query(models.Lesson).filter(
            and_(
                or_(models.Lesson.teacher_id == user.id, models.Lesson.student_id == user.id),
                models.Lesson.status == models.LessonStatus.COMPLETED
            )
        ).count()
        
        cancelled_lessons = db.query(models.Lesson).filter(
            and_(
                or_(models.Lesson.teacher_id == user.id, models.Lesson.student_id == user.id),
                models.Lesson.status == models.LessonStatus.CANCELLED
            )
        ).count()
        
        upcoming_lessons = db.query(models.Lesson).filter(
            and_(
                or_(models.Lesson.teacher_id == user.id, models.Lesson.student_id == user.id),
                models.Lesson.status == models.LessonStatus.SCHEDULED,
                models.Lesson.scheduled_at > datetime.utcnow()
            )
        ).count()
        
        # Get last lesson date
        last_lesson = db.query(models.Lesson).filter(
            or_(models.Lesson.teacher_id == user.id, models.Lesson.student_id == user.id)
        ).order_by(models.Lesson.scheduled_at.desc()).first()
        
        reports.append(schemas.UserReport(
            user=user,
            total_lessons=total_lessons,
            completed_lessons=completed_lessons,
            cancelled_lessons=cancelled_lessons,
            upcoming_lessons=upcoming_lessons,
            last_lesson_date=last_lesson.scheduled_at if last_lesson else None
        ))
    
    return reports


@router.get("/reports/lessons", response_model=schemas.LessonReport)
async def get_lesson_reports(
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get lesson activity reports"""
    # Set default date range if not provided
    if not date_from:
        date_from = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if not date_to:
        date_to = datetime.utcnow()
    
    # Get lesson statistics
    query = db.query(models.Lesson)
    if date_from:
        query = query.filter(models.Lesson.scheduled_at >= date_from)
    if date_to:
        query = query.filter(models.Lesson.scheduled_at <= date_to)
    
    lessons = query.all()
    
    total_lessons = len(lessons)
    completed_lessons = len([l for l in lessons if l.status == models.LessonStatus.COMPLETED])
    cancelled_lessons = len([l for l in lessons if l.status == models.LessonStatus.CANCELLED])
    
    # Calculate revenue
    revenue = sum([l.cost for l in lessons if l.cost and l.status == models.LessonStatus.COMPLETED])
    
    # Popular instruments
    instruments = {}
    for lesson in lessons:
        if lesson.instrument:
            instruments[lesson.instrument] = instruments.get(lesson.instrument, 0) + 1
    
    # Instructor statistics
    instructor_stats = {}
    for lesson in lessons:
        teacher_name = lesson.teacher.full_name
        if teacher_name not in instructor_stats:
            instructor_stats[teacher_name] = {
                "total_lessons": 0,
                "completed_lessons": 0,
                "revenue": 0
            }
        
        instructor_stats[teacher_name]["total_lessons"] += 1
        if lesson.status == models.LessonStatus.COMPLETED:
            instructor_stats[teacher_name]["completed_lessons"] += 1
            if lesson.cost:
                instructor_stats[teacher_name]["revenue"] += lesson.cost
    
    return schemas.LessonReport(
        date_range=f"{date_from.strftime('%Y-%m-%d')} to {date_to.strftime('%Y-%m-%d')}",
        total_lessons=total_lessons,
        completed_lessons=completed_lessons,
        cancelled_lessons=cancelled_lessons,
        revenue=revenue,
        popular_instruments=instruments,
        instructor_stats=instructor_stats
    )


# Update Management Endpoints
@router.get("/updates/check")
async def check_for_updates(
    current_user: models.User = Depends(require_admin_role)
):
    """Check for available system updates"""
    try:
        import subprocess
        import os
        
        # Get current git status
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=os.getcwd(),
            capture_output=True,
            text=True
        )
        
        current_commit = result.stdout.strip() if result.returncode == 0 else "unknown"
        
        # Check for remote updates
        subprocess.run(["git", "fetch", "origin"], capture_output=True)
        result = subprocess.run(
            ["git", "rev-list", "--count", "HEAD..origin/main"],
            capture_output=True,
            text=True
        )
        
        updates_available = int(result.stdout.strip()) if result.returncode == 0 else 0
        
        return {
            "updates_available": updates_available > 0,
            "update_count": updates_available,
            "current_version": current_commit[:8],
            "last_check": datetime.utcnow().isoformat(),
            "status": "success"
        }
    except Exception as e:
        return {
            "updates_available": False,
            "update_count": 0,
            "current_version": "unknown",
            "last_check": datetime.utcnow().isoformat(),
            "status": "error",
            "error": str(e)
        }


@router.get("/updates/logs")
async def get_update_logs(
    current_user: models.User = Depends(require_admin_role)
):
    """Get system update logs"""
    try:
        import os
        
        logs = []
        log_file = os.path.join(os.getcwd(), "logs", "updates.log")
        
        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                logs = f.readlines()[-50:]  # Get last 50 lines
        
        return {
            "logs": [line.strip() for line in logs],
            "status": "success"
        }
    except Exception as e:
        return {
            "logs": [f"Error reading logs: {str(e)}"],
            "status": "error"
        }


@router.post("/updates/apply")
async def apply_updates(
    current_user: models.User = Depends(require_admin_role)
):
    """Apply available system updates"""
    try:
        import subprocess
        import os
        from datetime import datetime
        
        # Ensure logs directory exists
        os.makedirs("logs", exist_ok=True)
        
        # Log update attempt
        with open("logs/updates.log", "a") as f:
            f.write(f"[{datetime.utcnow().isoformat()}] Update initiated by {current_user.username}\n")
        
        # Pull latest changes
        result = subprocess.run(
            ["git", "pull", "origin", "main"],
            capture_output=True,
            text=True,
            cwd=os.getcwd()
        )
        
        success = result.returncode == 0
        
        # Log result
        with open("logs/updates.log", "a") as f:
            f.write(f"[{datetime.utcnow().isoformat()}] Update {'successful' if success else 'failed'}: {result.stdout if success else result.stderr}\n")
        
        if success:
            return {
                "status": "success",
                "message": "Updates applied successfully",
                "details": result.stdout.strip(),
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "status": "error",
                "message": "Update failed",
                "details": result.stderr.strip(),
                "timestamp": datetime.utcnow().isoformat()
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Update process failed: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }

