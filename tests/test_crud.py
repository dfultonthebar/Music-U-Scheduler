#!/usr/bin/env python3
"""
Basic CRUD tests for the Music U Lesson Scheduler application.
Tests create, read, update, and delete operations for User and Lesson models.
"""

import pytest
import sys
from datetime import datetime, timedelta
from pathlib import Path
import time

# Add the parent directory to the path so we can import from app
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, Base, engine
from app.models import User, Lesson
import hashlib

def hash_password(password: str) -> str:
    """Simple password hashing function for testing"""
    return hashlib.sha256(password.encode()).hexdigest()

@pytest.fixture
def db_session():
    """Create a fresh database session for each test"""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_create_user(db_session):
    """Test creating a new user"""
    unique_id = str(int(time.time() * 1000))  # Use timestamp for unique emails
    user_data = {
        "email": f"test{unique_id}@example.com",
        "username": f"testuser{unique_id}",
        "full_name": "Test User",
        "hashed_password": hash_password("testpass"),
        "is_active": True,
        "is_teacher": False,
        "phone": "(555) 123-4567"
    }
    
    user = User(**user_data)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    assert user.id is not None
    assert user.email == f"test{unique_id}@example.com"
    assert user.username == f"testuser{unique_id}"
    assert user.is_active is True
    assert user.created_at is not None

def test_read_user(db_session):
    """Test reading/querying users"""
    unique_id = str(int(time.time() * 1000))  # Use timestamp for unique emails
    unique_email = f"read{unique_id}@example.com"
    unique_username = f"readuser{unique_id}"
    
    # Create a test user first
    user = User(
        email=unique_email,
        username=unique_username,
        full_name="Read User",
        hashed_password=hash_password("readpass"),
        is_active=True,
        is_teacher=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Test reading by ID
    found_user = db_session.query(User).filter(User.id == user.id).first()
    assert found_user is not None
    assert found_user.email == unique_email
    assert found_user.is_teacher is True
    
    # Test reading by email
    found_user_by_email = db_session.query(User).filter(User.email == unique_email).first()
    assert found_user_by_email is not None
    assert found_user_by_email.id == user.id

def test_update_user(db_session):
    """Test updating user information"""
    unique_id = str(int(time.time() * 1000))  # Use timestamp for unique emails
    unique_email = f"update{unique_id}@example.com"
    unique_username = f"updateuser{unique_id}"
    
    # Create a test user
    user = User(
        email=unique_email,
        username=unique_username,
        full_name="Update User",
        hashed_password=hash_password("updatepass"),
        is_active=True,
        is_teacher=False
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Update user information
    user.full_name = "Updated User Name"
    user.is_teacher = True
    user.phone = "(555) 999-8888"
    db_session.commit()
    
    # Verify updates
    updated_user = db_session.query(User).filter(User.id == user.id).first()
    assert updated_user.full_name == "Updated User Name"
    assert updated_user.is_teacher is True
    assert updated_user.phone == "(555) 999-8888"

def test_delete_user(db_session):
    """Test deleting a user"""
    unique_id = str(int(time.time() * 1000))  # Use timestamp for unique emails
    unique_email = f"delete{unique_id}@example.com"
    unique_username = f"deleteuser{unique_id}"
    
    # Create a test user
    user = User(
        email=unique_email,
        username=unique_username,
        full_name="Delete User",
        hashed_password=hash_password("deletepass"),
        is_active=True,
        is_teacher=False
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    user_id = user.id
    
    # Delete the user
    db_session.delete(user)
    db_session.commit()
    
    # Verify deletion
    deleted_user = db_session.query(User).filter(User.id == user_id).first()
    assert deleted_user is None

def test_create_lesson(db_session):
    """Test creating a new lesson"""
    unique_id = str(int(time.time() * 1000))  # Use timestamp for unique emails
    
    # Create teacher and student first
    teacher = User(
        email=f"teacher{unique_id}@example.com",
        username=f"teacher{unique_id}",
        full_name="Test Teacher",
        hashed_password=hash_password("teacherpass"),
        is_active=True,
        is_teacher=True
    )
    
    student = User(
        email=f"student{unique_id}@example.com",
        username=f"student{unique_id}",
        full_name="Test Student",
        hashed_password=hash_password("studentpass"),
        is_active=True,
        is_teacher=False
    )
    
    db_session.add(teacher)
    db_session.add(student)
    db_session.commit()
    db_session.refresh(teacher)
    db_session.refresh(student)
    
    # Create lesson
    lesson = Lesson(
        title="Test Lesson",
        description="A test lesson for CRUD testing",
        teacher_id=teacher.id,
        student_id=student.id,
        scheduled_at=datetime.now() + timedelta(days=1),
        duration_minutes=60,
        instrument="Piano",
        lesson_type="individual",
        status="scheduled",
        notes="Test lesson notes"
    )
    
    db_session.add(lesson)
    db_session.commit()
    db_session.refresh(lesson)
    
    assert lesson.id is not None
    assert lesson.title == "Test Lesson"
    assert lesson.teacher_id == teacher.id
    assert lesson.student_id == student.id
    assert lesson.duration_minutes == 60

def test_read_lesson_with_relationships(db_session):
    """Test reading lessons and their relationships"""
    unique_id = str(int(time.time() * 1000))  # Use timestamp for unique emails
    
    # Create teacher and student
    teacher = User(
        email=f"relteacher{unique_id}@example.com",
        username=f"relteacher{unique_id}",
        full_name="Relationship Teacher",
        hashed_password=hash_password("relpass"),
        is_active=True,
        is_teacher=True
    )
    
    student = User(
        email=f"relstudent{unique_id}@example.com",
        username=f"relstudent{unique_id}",
        full_name="Relationship Student",
        hashed_password=hash_password("relpass"),
        is_active=True,
        is_teacher=False
    )
    
    db_session.add(teacher)
    db_session.add(student)
    db_session.commit()
    db_session.refresh(teacher)
    db_session.refresh(student)
    
    # Create lesson
    lesson = Lesson(
        title="Relationship Test Lesson",
        description="Testing relationships",
        teacher_id=teacher.id,
        student_id=student.id,
        scheduled_at=datetime.now() + timedelta(days=2),
        duration_minutes=45,
        instrument="Guitar"
    )
    
    db_session.add(lesson)
    db_session.commit()
    db_session.refresh(lesson)
    
    # Test relationships
    assert lesson.teacher.full_name == "Relationship Teacher"
    assert lesson.student.full_name == "Relationship Student"
    assert len(teacher.taught_lessons) >= 1
    assert len(student.student_lessons) >= 1

def test_update_lesson(db_session):
    """Test updating lesson information"""
    unique_id = str(int(time.time() * 1000))  # Use timestamp for unique emails
    
    # Create necessary users and lesson
    teacher = User(
        email=f"upteacher{unique_id}@example.com",
        username=f"upteacher{unique_id}",
        full_name="Update Teacher",
        hashed_password=hash_password("uppass"),
        is_active=True,
        is_teacher=True
    )
    
    student = User(
        email=f"upstudent{unique_id}@example.com",
        username=f"upstudent{unique_id}",
        full_name="Update Student",
        hashed_password=hash_password("uppass"),
        is_active=True,
        is_teacher=False
    )
    
    db_session.add(teacher)
    db_session.add(student)
    db_session.commit()
    db_session.refresh(teacher)
    db_session.refresh(student)
    
    lesson = Lesson(
        title="Original Lesson",
        description="Original description",
        teacher_id=teacher.id,
        student_id=student.id,
        scheduled_at=datetime.now() + timedelta(days=3),
        duration_minutes=60,
        instrument="Piano",
        status="scheduled"
    )
    
    db_session.add(lesson)
    db_session.commit()
    db_session.refresh(lesson)
    
    # Update lesson
    lesson.title = "Updated Lesson Title"
    lesson.duration_minutes = 90
    lesson.status = "completed"
    lesson.notes = "Lesson completed successfully"
    db_session.commit()
    
    # Verify updates
    updated_lesson = db_session.query(Lesson).filter(Lesson.id == lesson.id).first()
    assert updated_lesson.title == "Updated Lesson Title"
    assert updated_lesson.duration_minutes == 90
    assert updated_lesson.status == "completed"
    assert updated_lesson.notes == "Lesson completed successfully"

def test_delete_lesson(db_session):
    """Test deleting a lesson"""
    unique_id = str(int(time.time() * 1000))  # Use timestamp for unique emails
    
    # Create necessary users and lesson
    teacher = User(
        email=f"delteacher{unique_id}@example.com",
        username=f"delteacher{unique_id}",
        full_name="Delete Teacher",
        hashed_password=hash_password("delpass"),
        is_active=True,
        is_teacher=True
    )
    
    student = User(
        email=f"delstudent{unique_id}@example.com",
        username=f"delstudent{unique_id}",
        full_name="Delete Student",
        hashed_password=hash_password("delpass"),
        is_active=True,
        is_teacher=False
    )
    
    db_session.add(teacher)
    db_session.add(student)
    db_session.commit()
    db_session.refresh(teacher)
    db_session.refresh(student)
    
    lesson = Lesson(
        title="Lesson to Delete",
        description="This lesson will be deleted",
        teacher_id=teacher.id,
        student_id=student.id,
        scheduled_at=datetime.now() + timedelta(days=4),
        duration_minutes=30,
        instrument="Drums"
    )
    
    db_session.add(lesson)
    db_session.commit()
    db_session.refresh(lesson)
    lesson_id = lesson.id
    
    # Delete lesson
    db_session.delete(lesson)
    db_session.commit()
    
    # Verify deletion
    deleted_lesson = db_session.query(Lesson).filter(Lesson.id == lesson_id).first()
    assert deleted_lesson is None

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
