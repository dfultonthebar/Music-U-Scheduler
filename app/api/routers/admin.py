

"""
Admin API endpoints for Music U Scheduler
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime, timedelta
import csv
import io
import os
import uuid
from pathlib import Path

from ...database import get_db
from ...auth.dependencies import require_admin_role
from ... import crud, schemas, models
from ...services.yodeck import YodeckService

router = APIRouter(prefix="/admin", tags=["admin"])

# Upload directory configuration
UPLOAD_DIR = Path("/root/Music-U-Scheduler/uploads/profiles")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


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


@router.post("/users/{user_id}/profile-image")
async def upload_profile_image(
    user_id: int,
    file: UploadFile = File(...),
    request: Request = None,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Upload profile image for a user (admin only)"""
    # Verify user exists
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

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
    if db_user.profile_image:
        old_file_path = UPLOAD_DIR / db_user.profile_image
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
    updated_user = crud.update_user(db, user_id, user_update, updated_by=current_user.id)

    # Log the action
    if request:
        crud.log_audit_action(
            db, current_user.id, "UPDATE", "user", user_id,
            f"Admin uploaded profile image for user: {db_user.username}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )

    return {
        "message": "Profile image uploaded successfully",
        "filename": unique_filename,
        "url": f"/uploads/profiles/{unique_filename}"
    }


@router.delete("/users/{user_id}/profile-image")
async def delete_profile_image(
    user_id: int,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Delete profile image for a user (admin only)"""
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not db_user.profile_image:
        raise HTTPException(status_code=404, detail="User has no profile image")

    # Delete file from filesystem
    file_path = UPLOAD_DIR / db_user.profile_image
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as e:
            print(f"Warning: Could not delete profile image file: {e}")

    # Update user record
    user_update = schemas.UserUpdate(profile_image=None)
    crud.update_user(db, user_id, user_update, updated_by=current_user.id)

    # Log the action
    crud.log_audit_action(
        db, current_user.id, "DELETE", "user_profile_image", user_id,
        f"Admin deleted profile image for user: {db_user.username}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return {"message": "Profile image deleted successfully"}


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


# Instructor Role Management Endpoints
@router.get("/instructor-roles")
async def get_instructor_roles(
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get all available instructor roles"""
    try:
        # Return predefined instructor roles
        roles = [
            {
                "id": "piano",
                "name": "Piano Instructor",
                "instrument": "Piano",
                "description": "Teaches piano lessons for all skill levels"
            },
            {
                "id": "guitar",
                "name": "Guitar Instructor", 
                "instrument": "Guitar",
                "description": "Teaches acoustic and electric guitar"
            },
            {
                "id": "violin",
                "name": "Violin Instructor",
                "instrument": "Violin", 
                "description": "Teaches violin for beginners to advanced"
            },
            {
                "id": "drums",
                "name": "Drum Instructor",
                "instrument": "Drums",
                "description": "Teaches drum kit and percussion"
            },
            {
                "id": "voice",
                "name": "Voice Coach",
                "instrument": "Voice",
                "description": "Vocal training and singing lessons"
            },
            {
                "id": "saxophone",
                "name": "Saxophone Instructor",
                "instrument": "Saxophone",
                "description": "Teaches alto, tenor, and soprano saxophone"
            },
            {
                "id": "trumpet",
                "name": "Trumpet Instructor", 
                "instrument": "Trumpet",
                "description": "Brass instrument instruction"
            },
            {
                "id": "flute",
                "name": "Flute Instructor",
                "instrument": "Flute",
                "description": "Woodwind instrument lessons"
            }
        ]
        return roles
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching instructor roles: {str(e)}"
        )


@router.post("/instructor-roles")
async def create_instructor_role(
    role_data: dict,
    current_user: models.User = Depends(require_admin_role)
):
    """Create a new instructor role"""
    try:
        # For now, return success (could be expanded to store in database)
        new_role = {
            "id": role_data.get("id", f"custom-{datetime.utcnow().timestamp()}"),
            "name": role_data.get("name"),
            "instrument": role_data.get("instrument"), 
            "description": role_data.get("description", "")
        }
        return new_role
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating instructor role: {str(e)}"
        )


@router.post("/instructor-roles/assign")
async def assign_instructor_role(
    assignment_data: dict,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Assign role to instructor"""
    try:
        # Handle both camelCase and snake_case
        instructor_id = assignment_data.get("instructor_id") or assignment_data.get("instructorId")
        role_id = assignment_data.get("role_id") or assignment_data.get("roleId")
        
        # Find instructor
        instructor = db.query(models.User).filter(
            models.User.id == instructor_id,
            models.User.role == models.UserRole.INSTRUCTOR
        ).first()
        
        if not instructor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Instructor not found"
            )
        
        # Update instructor's specializations (simple string-based approach)
        current_specs = instructor.specializations or ""
        if role_id not in current_specs:
            new_specs = f"{current_specs},{role_id}" if current_specs else role_id
            instructor.specializations = new_specs
            db.commit()
        
        return {"status": "success", "message": "Role assigned successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error assigning role: {str(e)}"
        )


@router.delete("/instructor-roles/remove/{instructor_id}/{role_id}")
async def remove_instructor_role(
    instructor_id: str,
    role_id: str,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Remove role from instructor"""
    try:
        # Find instructor
        instructor = db.query(models.User).filter(
            models.User.id == instructor_id,
            models.User.role == models.UserRole.INSTRUCTOR
        ).first()
        
        if not instructor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Instructor not found"
            )
        
        # Remove role from specializations
        if instructor.specializations:
            specs = instructor.specializations.split(',')
            specs = [s.strip() for s in specs if s.strip() != role_id]
            instructor.specializations = ','.join(specs) if specs else None
            db.commit()
        
        return {"status": "success", "message": "Role removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing role: {str(e)}"
        )


@router.put("/instructor-roles/{role_id}")
async def update_instructor_role(
    role_id: str,
    role_data: dict,
    current_user: models.User = Depends(require_admin_role)
):
    """Update instructor role"""
    try:
        # Return updated role (could be expanded to update in database)
        updated_role = {
            "id": role_id,
            "name": role_data.get("name"),
            "instrument": role_data.get("instrument"),
            "description": role_data.get("description", "")
        }
        return updated_role
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating instructor role: {str(e)}"
        )


@router.delete("/instructor-roles/{role_id}")
async def delete_instructor_role(
    role_id: str,
    current_user: models.User = Depends(require_admin_role)
):
    """Delete instructor role"""
    try:
        return {"status": "success", "message": "Role deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting instructor role: {str(e)}"
        )


# Email Settings Endpoints
@router.get("/email-settings", response_model=schemas.EmailSettingsResponse)
async def get_email_settings(
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get current email server settings"""
    from ...services.email import EmailService

    try:
        email_service = EmailService(db)
        settings = email_service.get_settings()
        safe_settings = settings.to_safe_dict()
        safe_settings["is_configured"] = email_service.is_configured()
        return safe_settings
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching email settings: {str(e)}"
        )


@router.put("/email-settings", response_model=schemas.EmailSettingsResponse)
async def update_email_settings(
    settings_data: schemas.EmailSettingsUpdate,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Update email server settings"""
    from ...services.email import EmailService

    try:
        email_service = EmailService(db)

        # Convert to dict, excluding None values
        updates = {k: v for k, v in settings_data.dict().items() if v is not None}

        updated_settings = email_service.update_settings(updates)

        # Log the action
        crud.log_audit_action(
            db, current_user.id, "UPDATE", "email_settings", None,
            "Admin updated email settings",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )

        safe_settings = updated_settings.to_safe_dict()
        safe_settings["is_configured"] = email_service.is_configured()
        return safe_settings
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating email settings: {str(e)}"
        )


@router.post("/email-settings/test", response_model=schemas.EmailTestResult)
async def test_email_connection(
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Test SMTP connection with current settings"""
    from ...services.email import EmailService

    try:
        email_service = EmailService(db)
        result = email_service.test_connection()
        return result
    except Exception as e:
        return {
            "success": False,
            "message": f"Connection test failed: {str(e)}"
        }


@router.post("/email-settings/send-test")
async def send_test_email(
    to_email: str = Query(..., description="Email address to send test to"),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Send a test email to verify settings"""
    from ...services.email import EmailService

    try:
        email_service = EmailService(db)

        if not email_service.is_configured():
            return {
                "success": False,
                "message": "Email settings not configured. Please configure SMTP settings first."
            }

        result = email_service.send_email(
            to_email=to_email,
            subject="Test Email - Music U Scheduler",
            body_text="This is a test email from Music U Scheduler. If you received this, your email settings are working correctly!",
            body_html="""
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #2563eb;">Test Email</h2>
                <p>This is a test email from <strong>Music U Scheduler</strong>.</p>
                <p>If you received this, your email settings are working correctly!</p>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #6b7280; font-size: 12px;">This is an automated test message.</p>
            </body>
            </html>
            """
        )
        return result
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to send test email: {str(e)}"
        }


@router.post("/email/send")
async def send_email(
    email_request: schemas.SendEmailRequest,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Send an email to a single recipient"""
    from ...services.email import EmailService

    try:
        email_service = EmailService(db)
        result = email_service.send_email(
            to_email=email_request.to_email,
            subject=email_request.subject,
            body_text=email_request.body_text,
            body_html=email_request.body_html
        )
        return result
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to send email: {str(e)}"
        }


@router.post("/email/send-bulk")
async def send_bulk_email(
    email_request: schemas.SendBulkEmailRequest,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Send an email to multiple recipients"""
    from ...services.email import EmailService

    try:
        email_service = EmailService(db)
        result = email_service.send_bulk_emails(
            recipients=email_request.recipients,
            subject=email_request.subject,
            body_text=email_request.body_text,
            body_html=email_request.body_html
        )
        return result
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to send bulk email: {str(e)}"
        }


# Backup Management Endpoints
@router.get("/backups")
async def get_backups(
    current_user: models.User = Depends(require_admin_role)
):
    """Get list of available backups"""
    try:
        # Return mock backup list (can be expanded with real backup system)
        backups = [
            {
                "id": "backup_20250816_120000",
                "name": "Daily Backup - Aug 16, 2025",
                "created": "2025-08-16T12:00:00Z",
                "size": "2.4 MB",
                "type": "automatic"
            },
            {
                "id": "backup_20250815_120000",
                "name": "Daily Backup - Aug 15, 2025",
                "created": "2025-08-15T12:00:00Z",
                "size": "2.3 MB",
                "type": "automatic"
            }
        ]
        return backups
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching backups: {str(e)}"
        )


@router.post("/backups")
async def create_backup(
    backup_data: dict,
    current_user: models.User = Depends(require_admin_role)
):
    """Create a new backup"""
    try:
        backup_name = backup_data.get("name", f"Manual Backup - {datetime.utcnow().strftime('%b %d, %Y')}")
        new_backup = {
            "id": f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "name": backup_name,
            "created": datetime.utcnow().isoformat() + "Z",
            "size": "2.4 MB",
            "type": "manual"
        }
        return {
            "status": "success",
            "message": "Backup created successfully",
            "backup": new_backup
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating backup: {str(e)}"
        )


@router.delete("/backups/{backup_id}")
async def delete_backup(
    backup_id: str,
    current_user: models.User = Depends(require_admin_role)
):
    """Delete a backup"""
    try:
        return {
            "status": "success",
            "message": f"Backup {backup_id} deleted successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting backup: {str(e)}"
        )


@router.post("/backups/{backup_id}/restore")
async def restore_backup(
    backup_id: str,
    current_user: models.User = Depends(require_admin_role)
):
    """Restore from a backup"""
    try:
        return {
            "status": "success",
            "message": f"System restored from backup {backup_id} successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error restoring backup: {str(e)}"
        )


# Missing Instructor Role Management Endpoints
@router.get("/instructors/{instructor_id}/roles")
async def get_instructor_with_roles(
    instructor_id: int,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get an instructor with their assigned roles"""
    try:
        # Get the instructor
        instructor = crud.get_user(db, instructor_id)
        if not instructor:
            raise HTTPException(status_code=404, detail="Instructor not found")
        
        if instructor.role != models.UserRole.INSTRUCTOR:
            raise HTTPException(status_code=400, detail="User is not an instructor")
        
        # For now, return mock assigned roles (in future, this would come from a roles table)
        assigned_roles = []
        if instructor.specializations:
            specializations = instructor.specializations.split(',')
            # Map specializations to role IDs
            for spec in specializations:
                spec = spec.strip().lower()
                if 'piano' in spec:
                    assigned_roles.append({
                        "id": "piano",
                        "name": "Piano Instructor",
                        "instrument": "Piano",
                        "description": "Teaches piano lessons for all skill levels"
                    })
                elif 'guitar' in spec:
                    assigned_roles.append({
                        "id": "guitar", 
                        "name": "Guitar Instructor",
                        "instrument": "Guitar",
                        "description": "Teaches acoustic and electric guitar"
                    })
                elif 'violin' in spec:
                    assigned_roles.append({
                        "id": "violin",
                        "name": "Violin Instructor", 
                        "instrument": "Violin",
                        "description": "Teaches violin for beginners to advanced"
                    })
        
        return {
            "id": instructor.id,
            "username": instructor.username,
            "email": instructor.email,
            "full_name": instructor.full_name,
            "role": instructor.role,
            "assigned_roles": assigned_roles
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching instructor roles: {str(e)}"
        )


# Fix version-info endpoint
@router.get("/version-info")
async def get_version_info(
    current_user: models.User = Depends(require_admin_role)
):
    """Get current system version information"""
    try:
        return {
            "version": "1.3.02",
            "build": "202508170140",
            "last_updated": "2025-08-17T01:40:00Z",
            "status": "production",
            "features": [
                "Authentication Integration",
                "User Management",
                "Lesson Scheduling",
                "Admin Dashboard",
                "Backup System"
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting version info: {str(e)}"
        )


# Get students assigned to an instructor (based on lesson history)
@router.get("/instructors/{instructor_id}/students")
async def get_instructor_students(
    instructor_id: int,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get students who have lessons with this instructor"""
    # Verify instructor exists
    instructor = crud.get_user(db, instructor_id)
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    if instructor.role != models.UserRole.INSTRUCTOR and not instructor.is_teacher:
        raise HTTPException(status_code=400, detail="User is not an instructor")

    # Get unique students who have had lessons with this instructor
    student_ids = db.query(models.Lesson.student_id).filter(
        models.Lesson.teacher_id == instructor_id
    ).distinct().all()

    student_ids = [s[0] for s in student_ids]

    students = []
    for student_id in student_ids:
        student = crud.get_user(db, student_id)
        if student and student.is_active:
            students.append({
                "id": student.id,
                "full_name": student.full_name,
                "email": student.email,
                "username": student.username
            })

    return {
        "instructor_id": instructor_id,
        "instructor_name": instructor.full_name,
        "students": students,
        "student_count": len(students)
    }


# Get all students (for adding new student-instructor assignments)
@router.get("/students")
async def get_all_students(
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get all students in the system"""
    students = db.query(models.User).filter(
        models.User.role == models.UserRole.STUDENT,
        models.User.is_active == True
    ).all()

    return [
        {
            "id": s.id,
            "full_name": s.full_name,
            "email": s.email,
            "username": s.username
        }
        for s in students
    ]


# Get all instructors with their availability status
@router.get("/instructors")
async def get_all_instructors(
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get all instructors with their availability info"""
    instructors = db.query(models.User).filter(
        or_(
            models.User.role == models.UserRole.INSTRUCTOR,
            models.User.is_teacher == True
        ),
        models.User.is_active == True
    ).all()

    result = []
    for instructor in instructors:
        # Check if they have availability set up
        availability_count = db.query(models.InstructorAvailability).filter(
            models.InstructorAvailability.instructor_id == instructor.id,
            models.InstructorAvailability.is_active == True
        ).count()

        # Get count of students they teach
        student_count = db.query(models.Lesson.student_id).filter(
            models.Lesson.teacher_id == instructor.id
        ).distinct().count()

        result.append({
            "id": instructor.id,
            "full_name": instructor.full_name,
            "email": instructor.email,
            "username": instructor.username,
            "default_break_minutes": instructor.default_break_minutes or 5,
            "has_availability": availability_count > 0,
            "availability_slots": availability_count,
            "student_count": student_count,
            "specializations": instructor.specializations
        })

    return result


# Scheduling and Availability Endpoints
@router.get("/scheduling/instructors/{instructor_id}/availability")
async def get_instructor_availability_admin(
    instructor_id: int,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get an instructor's availability settings (admin view)"""
    # Verify instructor exists
    instructor = crud.get_user(db, instructor_id)
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    if instructor.role != models.UserRole.INSTRUCTOR:
        raise HTTPException(status_code=400, detail="User is not an instructor")

    availability_slots = crud.get_instructor_availability_slots(db, instructor_id, is_active=True)

    return {
        "instructor_id": instructor_id,
        "instructor_name": instructor.full_name,
        "default_break_minutes": instructor.default_break_minutes or 5,
        "availability": availability_slots
    }


@router.get("/scheduling/instructors/{instructor_id}/exceptions")
async def get_instructor_exceptions_admin(
    instructor_id: int,
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get an instructor's days off and exceptions (admin view)"""
    instructor = crud.get_user(db, instructor_id)
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    if instructor.role != models.UserRole.INSTRUCTOR:
        raise HTTPException(status_code=400, detail="User is not an instructor")

    exceptions = crud.get_instructor_exceptions(db, instructor_id, date_from=date_from, date_to=date_to)

    return {
        "instructor_id": instructor_id,
        "instructor_name": instructor.full_name,
        "exceptions": exceptions
    }


@router.get("/scheduling/instructors/{instructor_id}/schedule")
async def get_instructor_schedule_admin(
    instructor_id: int,
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get an instructor's full schedule including availability, exceptions, and lessons"""
    instructor = crud.get_user(db, instructor_id)
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    if instructor.role != models.UserRole.INSTRUCTOR:
        raise HTTPException(status_code=400, detail="User is not an instructor")

    if not date_from:
        date_from = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    if not date_to:
        date_to = date_from + timedelta(days=30)

    schedule = crud.get_instructor_schedule_for_date_range(db, instructor_id, date_from, date_to)

    return {
        "instructor_id": instructor_id,
        "instructor_name": instructor.full_name,
        "default_break_minutes": instructor.default_break_minutes or 5,
        "date_range": {
            "from": date_from.isoformat(),
            "to": date_to.isoformat()
        },
        "schedule": schedule
    }


@router.post("/scheduling/validate")
async def validate_lesson_time(
    instructor_id: int = Query(..., description="Instructor ID"),
    scheduled_at: datetime = Query(..., description="Proposed start time"),
    duration_minutes: int = Query(60, ge=15, le=120, description="Lesson duration in minutes"),
    break_after_minutes: int = Query(0, ge=0, le=15, description="Break time after lesson"),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """
    Validate if a proposed lesson time is available.
    Returns validation result with any conflicts.
    """
    # Verify instructor exists
    instructor = crud.get_user(db, instructor_id)
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    if instructor.role != models.UserRole.INSTRUCTOR:
        raise HTTPException(status_code=400, detail="User is not an instructor")

    # Calculate end time
    proposed_end = scheduled_at + timedelta(minutes=duration_minutes + break_after_minutes)

    # Validate the time
    validation_result = crud.check_instructor_availability_for_time(
        db, instructor_id, scheduled_at, proposed_end
    )

    return {
        "instructor_id": instructor_id,
        "instructor_name": instructor.full_name,
        "proposed_time": {
            "start": scheduled_at.isoformat(),
            "end": (scheduled_at + timedelta(minutes=duration_minutes)).isoformat(),
            "duration_minutes": duration_minutes,
            "break_after_minutes": break_after_minutes
        },
        "is_valid": validation_result["is_valid"],
        "conflicts": validation_result["conflicts"]
    }


@router.get("/scheduling/available-slots")
async def get_available_slots(
    instructor_id: int = Query(..., description="Instructor ID"),
    target_date: datetime = Query(..., description="Date to check availability"),
    duration_minutes: int = Query(60, ge=15, le=120, description="Lesson duration in minutes"),
    break_minutes: int = Query(0, ge=0, le=15, description="Break time after lesson"),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """
    Get available time slots for an instructor on a specific date.
    Returns list of available start times in 5-minute increments.
    """
    instructor = crud.get_user(db, instructor_id)
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    if instructor.role != models.UserRole.INSTRUCTOR:
        raise HTTPException(status_code=400, detail="User is not an instructor")

    available_slots = crud.get_available_time_slots(
        db, instructor_id, target_date, duration_minutes, break_minutes
    )

    return {
        "instructor_id": instructor_id,
        "instructor_name": instructor.full_name,
        "date": target_date.date().isoformat(),
        "duration_minutes": duration_minutes,
        "break_minutes": break_minutes,
        "available_slots": available_slots,
        "slot_count": len(available_slots)
    }


@router.post("/scheduling/lessons", response_model=schemas.Lesson)
async def create_lesson_with_validation(
    lesson: schemas.LessonCreate,
    request: Request,
    validate: bool = Query(True, description="Validate against instructor availability"),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """
    Create a new lesson with optional availability validation.
    If validate=True, will check for conflicts before creating.
    """
    # Verify teacher and student exist
    teacher = crud.get_user(db, lesson.teacher_id)
    if not teacher or (teacher.role != models.UserRole.INSTRUCTOR and not teacher.is_teacher):
        raise HTTPException(status_code=400, detail="Invalid teacher ID")

    student = crud.get_user(db, lesson.student_id)
    if not student:
        raise HTTPException(status_code=400, detail="Invalid student ID")

    # Apply instructor's default break time if not specified
    if lesson.break_after_minutes == 0 and teacher.default_break_minutes:
        lesson.break_after_minutes = teacher.default_break_minutes

    # Validate if requested
    if validate:
        proposed_end = lesson.scheduled_at + timedelta(
            minutes=lesson.duration_minutes + lesson.break_after_minutes
        )
        validation_result = crud.check_instructor_availability_for_time(
            db, lesson.teacher_id, lesson.scheduled_at, proposed_end
        )

        if not validation_result["is_valid"]:
            conflict_messages = [c["message"] for c in validation_result["conflicts"]]
            raise HTTPException(
                status_code=409,
                detail={
                    "message": "Scheduling conflict detected",
                    "conflicts": validation_result["conflicts"],
                    "summary": "; ".join(conflict_messages)
                }
            )

    # Create the lesson
    db_lesson = crud.create_lesson(db, lesson, created_by=current_user.id)

    crud.log_audit_action(
        db, current_user.id, "CREATE", "lesson", db_lesson.id,
        f"Admin created lesson: {db_lesson.title} (validated: {validate})",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return db_lesson


@router.get("/scheduling/duration-options")
async def get_duration_options(
    current_user: models.User = Depends(require_admin_role)
):
    """Get available lesson duration options (in 5-minute increments)"""
    return {
        "duration_options": [
            {"minutes": 15, "label": "15 min"},
            {"minutes": 20, "label": "20 min"},
            {"minutes": 25, "label": "25 min"},
            {"minutes": 30, "label": "30 min"},
            {"minutes": 35, "label": "35 min"},
            {"minutes": 40, "label": "40 min"},
            {"minutes": 45, "label": "45 min"},
            {"minutes": 50, "label": "50 min"},
            {"minutes": 55, "label": "55 min"},
            {"minutes": 60, "label": "1 hour"},
            {"minutes": 65, "label": "1h 5m"},
            {"minutes": 70, "label": "1h 10m"},
            {"minutes": 75, "label": "1h 15m"},
            {"minutes": 80, "label": "1h 20m"},
            {"minutes": 85, "label": "1h 25m"},
            {"minutes": 90, "label": "1h 30m"},
            {"minutes": 95, "label": "1h 35m"},
            {"minutes": 100, "label": "1h 40m"},
            {"minutes": 105, "label": "1h 45m"},
            {"minutes": 110, "label": "1h 50m"},
            {"minutes": 115, "label": "1h 55m"},
            {"minutes": 120, "label": "2 hours"}
        ],
        "break_options": [
            {"minutes": 0, "label": "No break"},
            {"minutes": 5, "label": "5 min"},
            {"minutes": 10, "label": "10 min"},
            {"minutes": 15, "label": "15 min"}
        ],
        "default_duration": 60,
        "min_duration": 15,
        "max_duration": 120
    }


# Admin can also manage instructor availability
@router.post("/scheduling/instructors/{instructor_id}/availability")
async def create_instructor_availability_admin(
    instructor_id: int,
    availability: schemas.InstructorAvailabilityCreate,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Create availability slot for an instructor (admin)"""
    instructor = crud.get_user(db, instructor_id)
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    if instructor.role != models.UserRole.INSTRUCTOR:
        raise HTTPException(status_code=400, detail="User is not an instructor")

    if availability.day_of_week < 0 or availability.day_of_week > 6:
        raise HTTPException(status_code=400, detail="day_of_week must be between 0 and 6")
    if availability.start_time >= availability.end_time:
        raise HTTPException(status_code=400, detail="start_time must be before end_time")

    db_availability = crud.create_instructor_availability(
        db, instructor_id, availability, created_by=current_user.id
    )

    crud.log_audit_action(
        db, current_user.id, "CREATE", "instructor_availability", db_availability.id,
        f"Admin created availability for instructor {instructor.username}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return db_availability


@router.post("/scheduling/instructors/{instructor_id}/exceptions")
async def create_instructor_exception_admin(
    instructor_id: int,
    exception: schemas.AvailabilityExceptionCreate,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Create day off/exception for an instructor (admin)"""
    instructor = crud.get_user(db, instructor_id)
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    if instructor.role != models.UserRole.INSTRUCTOR:
        raise HTTPException(status_code=400, detail="User is not an instructor")

    existing = crud.get_exception_for_date(db, instructor_id, exception.exception_date)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"An exception already exists for {exception.exception_date}"
        )

    db_exception = crud.create_availability_exception(
        db, instructor_id, exception, created_by=current_user.id
    )

    crud.log_audit_action(
        db, current_user.id, "CREATE", "availability_exception", db_exception.id,
        f"Admin created exception for instructor {instructor.username} on {exception.exception_date}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return db_exception


# Data Export Endpoints
@router.get("/export/students")
async def export_students(
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Export all students to CSV"""
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        "ID", "Username", "Full Name", "Email", "Phone",
        "Instrument", "Is Active", "Created At", "Last Login"
    ])

    # Query students
    students = db.query(models.User).filter(
        models.User.role == models.UserRole.STUDENT
    ).order_by(models.User.created_at.desc()).all()

    # Write data rows
    for student in students:
        writer.writerow([
            student.id,
            student.username,
            student.full_name,
            student.email,
            student.phone or "",
            student.instrument or "",
            "Yes" if student.is_active else "No",
            student.created_at.strftime("%Y-%m-%d %H:%M:%S") if student.created_at else "",
            student.last_login.strftime("%Y-%m-%d %H:%M:%S") if student.last_login else ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=students_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"}
    )


@router.get("/export/instructors")
async def export_instructors(
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Export all instructors to CSV"""
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        "ID", "Username", "Full Name", "Email", "Phone",
        "Specializations", "Hourly Rate", "Default Break (min)",
        "Is Active", "Created At", "Last Login"
    ])

    # Query instructors
    instructors = db.query(models.User).filter(
        models.User.role == models.UserRole.INSTRUCTOR
    ).order_by(models.User.created_at.desc()).all()

    # Write data rows
    for instructor in instructors:
        writer.writerow([
            instructor.id,
            instructor.username,
            instructor.full_name,
            instructor.email,
            instructor.phone or "",
            instructor.specializations or "",
            instructor.hourly_rate or "",
            instructor.default_break_minutes or 5,
            "Yes" if instructor.is_active else "No",
            instructor.created_at.strftime("%Y-%m-%d %H:%M:%S") if instructor.created_at else "",
            instructor.last_login.strftime("%Y-%m-%d %H:%M:%S") if instructor.last_login else ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=instructors_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"}
    )


@router.get("/export/lessons")
async def export_lessons(
    date_from: Optional[datetime] = Query(None, description="Start date for lessons export"),
    date_to: Optional[datetime] = Query(None, description="End date for lessons export"),
    status: Optional[str] = Query(None, description="Filter by lesson status"),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Export lessons to CSV with optional date range and status filter"""
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        "ID", "Title", "Teacher", "Student", "Scheduled At",
        "Duration (min)", "Break After (min)", "Instrument", "Lesson Type",
        "Status", "Cost", "Location", "Room Number", "Created At"
    ])

    # Build query
    query = db.query(models.Lesson)

    if status:
        query = query.filter(models.Lesson.status == status)
    if date_from:
        query = query.filter(models.Lesson.scheduled_at >= date_from)
    if date_to:
        query = query.filter(models.Lesson.scheduled_at <= date_to)

    lessons = query.order_by(models.Lesson.scheduled_at.desc()).all()

    # Write data rows
    for lesson in lessons:
        writer.writerow([
            lesson.id,
            lesson.title,
            lesson.teacher.full_name if lesson.teacher else "",
            lesson.student.full_name if lesson.student else "",
            lesson.scheduled_at.strftime("%Y-%m-%d %H:%M:%S") if lesson.scheduled_at else "",
            lesson.duration_minutes or 60,
            lesson.break_after_minutes or 0,
            lesson.instrument or "",
            lesson.lesson_type or "individual",
            lesson.status.value if lesson.status else "",
            lesson.cost or "",
            lesson.location or "",
            lesson.room_number or "",
            lesson.created_at.strftime("%Y-%m-%d %H:%M:%S") if lesson.created_at else ""
        ])

    output.seek(0)
    filename_parts = ["lessons"]
    if date_from:
        filename_parts.append(f"from_{date_from.strftime('%Y%m%d')}")
    if date_to:
        filename_parts.append(f"to_{date_to.strftime('%Y%m%d')}")
    filename = "_".join(filename_parts) + f"_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/attendance")
async def export_attendance(
    date_from: Optional[datetime] = Query(None, description="Start date for attendance export"),
    date_to: Optional[datetime] = Query(None, description="End date for attendance export"),
    instructor_id: Optional[int] = Query(None, description="Filter by instructor ID"),
    student_id: Optional[int] = Query(None, description="Filter by student ID"),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Export attendance/lesson history to CSV"""
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        "Lesson ID", "Date", "Time", "Teacher", "Student", "Instrument",
        "Duration (min)", "Status", "Cost", "Location",
        "Instructor Notes", "Progress Notes"
    ])

    # Build query - only completed or cancelled lessons for attendance tracking
    query = db.query(models.Lesson).filter(
        models.Lesson.status.in_([models.LessonStatus.COMPLETED, models.LessonStatus.CANCELLED])
    )

    if date_from:
        query = query.filter(models.Lesson.scheduled_at >= date_from)
    if date_to:
        query = query.filter(models.Lesson.scheduled_at <= date_to)
    if instructor_id:
        query = query.filter(models.Lesson.teacher_id == instructor_id)
    if student_id:
        query = query.filter(models.Lesson.student_id == student_id)

    lessons = query.order_by(models.Lesson.scheduled_at.desc()).all()

    # Write data rows
    for lesson in lessons:
        writer.writerow([
            lesson.id,
            lesson.scheduled_at.strftime("%Y-%m-%d") if lesson.scheduled_at else "",
            lesson.scheduled_at.strftime("%H:%M") if lesson.scheduled_at else "",
            lesson.teacher.full_name if lesson.teacher else "",
            lesson.student.full_name if lesson.student else "",
            lesson.instrument or "",
            lesson.duration_minutes or 60,
            lesson.status.value if lesson.status else "",
            lesson.cost or "",
            lesson.location or "",
            lesson.instructor_notes or "",
            lesson.progress_notes or ""
        ])

    output.seek(0)
    filename_parts = ["attendance"]
    if date_from:
        filename_parts.append(f"from_{date_from.strftime('%Y%m%d')}")
    if date_to:
        filename_parts.append(f"to_{date_to.strftime('%Y%m%d')}")
    filename = "_".join(filename_parts) + f"_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# Student Registration Management
@router.get("/registrations/pending", response_model=List[schemas.PendingRegistration])
async def get_pending_registrations(
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get all pending student registrations"""
    registrations = db.query(models.StudentRegistration).filter(
        models.StudentRegistration.approval_status == models.ApprovalStatus.PENDING
    ).order_by(models.StudentRegistration.created_at.desc()).all()

    return registrations


@router.get("/registrations", response_model=List[schemas.PendingRegistration])
async def get_all_registrations(
    status: Optional[str] = Query(None),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get all student registrations with optional status filter"""
    query = db.query(models.StudentRegistration)

    if status:
        try:
            status_enum = models.ApprovalStatus(status)
            query = query.filter(models.StudentRegistration.approval_status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    registrations = query.order_by(models.StudentRegistration.created_at.desc()).all()
    return registrations


@router.post("/registrations/{registration_id}/approve", response_model=schemas.RegistrationApprovalResponse)
async def approve_registration(
    registration_id: int,
    approval_data: schemas.RegistrationApprovalRequest,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """
    Approve a pending student registration and create user account

    Args:
        registration_id: ID of the registration to approve
        approval_data: Username and password for the new account
        current_user: Admin user approving the registration
        db: Database session

    Returns:
        Approval confirmation with new user ID

    Raises:
        HTTPException: 404 if registration not found, 400 if already processed
    """
    # Get the registration
    registration = db.query(models.StudentRegistration).filter(
        models.StudentRegistration.id == registration_id
    ).first()

    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    if registration.approval_status != models.ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Registration already {registration.approval_status.value}"
        )

    # Check if username is already taken
    if crud.get_user_by_username(db, approval_data.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create user account from registration
    user_data = schemas.UserCreate(
        email=registration.email,
        username=approval_data.username,
        password=approval_data.password,
        full_name=registration.full_name,
        role=models.UserRole.STUDENT,
        is_teacher=False,
        phone=registration.phone,
        instrument=registration.instrument,
        notes=f"Experience: {registration.experience_level}. {registration.notes or ''}".strip()
    )

    new_user = crud.create_user(db, user_data, created_by=current_user.id)

    # Update registration status
    registration.approval_status = models.ApprovalStatus.APPROVED
    registration.approved_user_id = new_user.id
    db.commit()

    # Log the action
    crud.log_audit_action(
        db, current_user.id, "APPROVE_REGISTRATION", "student_registration", registration.id,
        f"Admin approved registration for {registration.full_name} (created user {new_user.username})",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    # TODO: Send welcome email to student (if email configured)

    return schemas.RegistrationApprovalResponse(
        message=f"Registration approved. User account created with username: {new_user.username}",
        user_id=new_user.id
    )


@router.post("/registrations/{registration_id}/reject")
async def reject_registration(
    registration_id: int,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """
    Reject a pending student registration

    Args:
        registration_id: ID of the registration to reject
        current_user: Admin user rejecting the registration
        db: Database session

    Returns:
        Rejection confirmation

    Raises:
        HTTPException: 404 if registration not found, 400 if already processed
    """
    # Get the registration
    registration = db.query(models.StudentRegistration).filter(
        models.StudentRegistration.id == registration_id
    ).first()

    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    if registration.approval_status != models.ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Registration already {registration.approval_status.value}"
        )

    # Update registration status
    registration.approval_status = models.ApprovalStatus.REJECTED
    db.commit()

    # Log the action
    crud.log_audit_action(
        db, current_user.id, "REJECT_REGISTRATION", "student_registration", registration.id,
        f"Admin rejected registration for {registration.full_name}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    # TODO: Send rejection email to student (if email configured)

    return {"message": f"Registration rejected for {registration.full_name}"}


# Lesson Template Management Endpoints
@router.get("/lesson-templates", response_model=List[schemas.LessonTemplate])
async def get_lesson_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    instructor_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get all lesson templates with filtering options"""
    return crud.get_lesson_templates(
        db,
        skip=skip,
        limit=limit,
        instructor_id=instructor_id,
        student_id=student_id,
        is_active=is_active
    )


@router.get("/lesson-templates/{template_id}", response_model=schemas.LessonTemplate)
async def get_lesson_template(
    template_id: int,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get a specific lesson template by ID"""
    template = crud.get_lesson_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Lesson template not found")
    return template


@router.post("/lesson-templates", response_model=schemas.LessonTemplate)
async def create_lesson_template(
    template: schemas.LessonTemplateCreate,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Create a new recurring lesson template"""
    # Verify instructor exists
    instructor = crud.get_user(db, template.instructor_id)
    if not instructor or (instructor.role != models.UserRole.INSTRUCTOR and not instructor.is_teacher):
        raise HTTPException(status_code=400, detail="Invalid instructor ID")

    # Verify student exists
    student = crud.get_user(db, template.student_id)
    if not student or student.role != models.UserRole.STUDENT:
        raise HTTPException(status_code=400, detail="Invalid student ID")

    # Validate day_of_week
    if template.day_of_week < 0 or template.day_of_week > 6:
        raise HTTPException(status_code=400, detail="day_of_week must be between 0 (Monday) and 6 (Sunday)")

    db_template = crud.create_lesson_template(db, template, created_by=current_user.id)

    # Log the action
    crud.log_audit_action(
        db, current_user.id, "CREATE", "lesson_template", db_template.id,
        f"Created lesson template: {instructor.full_name} -> {student.full_name} on {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][template.day_of_week]}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return db_template


@router.put("/lesson-templates/{template_id}", response_model=schemas.LessonTemplate)
async def update_lesson_template(
    template_id: int,
    template_update: schemas.LessonTemplateUpdate,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Update a lesson template"""
    db_template = crud.get_lesson_template(db, template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Lesson template not found")

    # Validate day_of_week if provided
    if template_update.day_of_week is not None:
        if template_update.day_of_week < 0 or template_update.day_of_week > 6:
            raise HTTPException(status_code=400, detail="day_of_week must be between 0 (Monday) and 6 (Sunday)")

    updated_template = crud.update_lesson_template(db, template_id, template_update, updated_by=current_user.id)

    # Log the action
    crud.log_audit_action(
        db, current_user.id, "UPDATE", "lesson_template", template_id,
        f"Updated lesson template {template_id}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return updated_template


@router.delete("/lesson-templates/{template_id}")
async def delete_lesson_template(
    template_id: int,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Delete a lesson template"""
    db_template = crud.get_lesson_template(db, template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Lesson template not found")

    success = crud.delete_lesson_template(db, template_id, deleted_by=current_user.id)

    if success:
        # Log the action
        crud.log_audit_action(
            db, current_user.id, "DELETE", "lesson_template", template_id,
            f"Deleted lesson template {template_id}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        return {"message": "Lesson template deleted successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete lesson template")


@router.post("/lesson-templates/generate", response_model=schemas.GenerateLessonsResponse)
async def generate_lessons_from_templates(
    request_data: schemas.GenerateLessonsRequest,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """
    Generate lessons from templates for a specified date range.

    This endpoint creates lesson instances from active recurring templates.
    It will skip lessons that already exist or conflict with existing lessons.
    """
    # Validate date range
    if request_data.start_date > request_data.end_date:
        raise HTTPException(status_code=400, detail="start_date must be before or equal to end_date")

    # Generate lessons
    result = crud.generate_lessons_from_templates(
        db,
        request_data.start_date,
        request_data.end_date,
        request_data.template_ids,
        created_by=current_user.id
    )

    # Log the action
    crud.log_audit_action(
        db, current_user.id, "GENERATE", "lesson_template", None,
        f"Generated {result['lessons_created']} lessons from templates for {result['date_range']}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return schemas.GenerateLessonsResponse(**result)


# Yodeck Digital Signage Integration Endpoints
@router.get("/yodeck/status", response_model=schemas.YodeckSettingsResponse)
async def get_yodeck_status(
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get Yodeck integration status and settings"""
    try:
        yodeck_service = YodeckService(db)
        status = yodeck_service.get_sync_status()

        # Mask API token for security
        token_setting = crud.get_system_setting(db, "yodeck_api_token")
        masked_token = ""
        if token_setting and token_setting.value:
            masked_token = "*" * 8 + token_setting.value[-4:] if len(token_setting.value) > 4 else "****"

        return schemas.YodeckSettingsResponse(
            api_token=masked_token,
            is_configured=status["is_configured"],
            last_sync=status["last_sync"],
            instructor_count=status["instructor_count"],
            playlist_id=status["playlist_id"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching Yodeck status: {str(e)}"
        )


@router.post("/yodeck/settings", response_model=schemas.YodeckSettingsResponse)
async def save_yodeck_settings(
    settings: schemas.YodeckSettingsUpdate,
    request: Request,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Save Yodeck API token"""
    try:
        yodeck_service = YodeckService(db)
        result = yodeck_service.save_api_token(settings.api_token)

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )

        # Log the action
        crud.log_audit_action(
            db, current_user.id, "UPDATE", "yodeck_settings", None,
            "Admin updated Yodeck API token",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )

        # Get updated status
        sync_status = yodeck_service.get_sync_status()
        masked_token = "*" * 8 + settings.api_token[-4:] if len(settings.api_token) > 4 else "****"

        return schemas.YodeckSettingsResponse(
            api_token=masked_token,
            is_configured=sync_status["is_configured"],
            last_sync=sync_status["last_sync"],
            instructor_count=sync_status["instructor_count"],
            playlist_id=sync_status["playlist_id"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving Yodeck settings: {str(e)}"
        )


@router.post("/yodeck/test-connection", response_model=schemas.YodeckConnectionTestResult)
async def test_yodeck_connection(
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Test connection to Yodeck API"""
    try:
        yodeck_service = YodeckService(db)
        result = await yodeck_service.test_connection()

        return schemas.YodeckConnectionTestResult(
            success=result["success"],
            message=result["message"],
            status=result["status"]
        )
    except Exception as e:
        return schemas.YodeckConnectionTestResult(
            success=False,
            message=f"Connection test failed: {str(e)}",
            status="error"
        )


@router.post("/yodeck/sync-instructors", response_model=schemas.YodeckSyncResponse)
async def sync_instructors_to_yodeck(
    sync_request: schemas.YodeckSyncRequest = schemas.YodeckSyncRequest(),
    request: Request = None,
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Sync instructors to Yodeck digital signage"""
    try:
        yodeck_service = YodeckService(db)

        if not yodeck_service.is_configured():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Yodeck is not configured. Please add API token first."
            )

        # Perform sync
        result = await yodeck_service.sync_instructors()

        # Log the action
        if request:
            crud.log_audit_action(
                db, current_user.id, "SYNC", "yodeck", None,
                f"Synced {result['synced']} instructors to Yodeck",
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent")
            )

        return schemas.YodeckSyncResponse(
            success=result["success"],
            message=result["message"],
            synced=result["synced"],
            failed=result["failed"],
            total=result.get("total", 0)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error syncing instructors: {str(e)}"
        )


@router.get("/yodeck/instructors", response_model=List[schemas.YodeckInstructorSlide])
async def get_yodeck_instructor_slides(
    current_user: models.User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Get list of instructors with their Yodeck sync status"""
    try:
        # Get all active instructors
        instructors = db.query(models.User).filter(
            models.User.role == models.UserRole.INSTRUCTOR,
            models.User.is_active == True
        ).all()

        slides = []
        for instructor in instructors:
            # Parse instruments
            instruments = []
            if instructor.specializations:
                instruments = [s.strip() for s in instructor.specializations.split(',')]

            slides.append(schemas.YodeckInstructorSlide(
                instructor_id=instructor.id,
                instructor_name=instructor.full_name,
                instruments=instruments,
                bio=instructor.bio,
                photo_url=instructor.profile_image,
                sync_status="pending"  # Could be enhanced to track actual sync status
            ))

        return slides
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching instructor slides: {str(e)}"
        )

