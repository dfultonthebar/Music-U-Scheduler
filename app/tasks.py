from celery import Celery
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from . import crud, models
from .database import SessionLocal
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Celery
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("music_scheduler", broker=redis_url, backend=redis_url)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "send-lesson-reminders": {
            "task": "app.tasks.send_lesson_reminders",
            "schedule": 3600.0,  # Run every hour
        },
        "cleanup-old-lessons": {
            "task": "app.tasks.cleanup_old_lessons",
            "schedule": 86400.0,  # Run daily
        },
    },
)


def get_db():
    """Get database session for tasks"""
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()


@celery_app.task
def send_lesson_reminder(lesson_id: int):
    """Send reminder for a specific lesson"""
    db = get_db()
    try:
        lesson = crud.get_lesson(db, lesson_id)
        if lesson and lesson.status == "scheduled":
            # TODO: Implement email/SMS notification logic
            print(f"Reminder: Lesson '{lesson.title}' scheduled for {lesson.scheduled_at}")
            return f"Reminder sent for lesson {lesson_id}"
    except Exception as e:
        print(f"Error sending reminder for lesson {lesson_id}: {e}")
        return f"Error: {e}"
    finally:
        db.close()


@celery_app.task
def send_lesson_reminders():
    """Send reminders for upcoming lessons (within next 24 hours)"""
    db = get_db()
    try:
        now = datetime.utcnow()
        tomorrow = now + timedelta(days=1)
        
        # Get lessons scheduled for tomorrow
        upcoming_lessons = db.query(models.Lesson).filter(
            models.Lesson.scheduled_at.between(now, tomorrow),
            models.Lesson.status == "scheduled"
        ).all()
        
        reminder_count = 0
        for lesson in upcoming_lessons:
            send_lesson_reminder.delay(lesson.id)
            reminder_count += 1
        
        return f"Queued {reminder_count} lesson reminders"
    except Exception as e:
        print(f"Error in send_lesson_reminders: {e}")
        return f"Error: {e}"
    finally:
        db.close()


@celery_app.task
def cleanup_old_lessons():
    """Mark old completed lessons for archival"""
    db = get_db()
    try:
        # Mark lessons older than 90 days as archived
        cutoff_date = datetime.utcnow() - timedelta(days=90)
        
        updated_count = db.query(models.Lesson).filter(
            models.Lesson.scheduled_at < cutoff_date,
            models.Lesson.status == "completed"
        ).update({"status": "archived"})
        
        db.commit()
        return f"Archived {updated_count} old lessons"
    except Exception as e:
        print(f"Error in cleanup_old_lessons: {e}")
        db.rollback()
        return f"Error: {e}"
    finally:
        db.close()


@celery_app.task
def send_welcome_email(user_id: int):
    """Send welcome email to new user"""
    db = get_db()
    try:
        user = crud.get_user(db, user_id)
        if user:
            # TODO: Implement email sending logic
            print(f"Welcome email sent to {user.email}")
            return f"Welcome email sent to user {user_id}"
    except Exception as e:
        print(f"Error sending welcome email to user {user_id}: {e}")
        return f"Error: {e}"
    finally:
        db.close()


if __name__ == "__main__":
    # For running celery worker: celery -A app.tasks worker --loglevel=info
    # For running celery beat: celery -A app.tasks beat --loglevel=info
    pass