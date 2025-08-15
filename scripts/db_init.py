#!/usr/bin/env python3
"""
Database initialization script that creates sample users and lessons
for testing the Music U Lesson Scheduler application.
"""

import sys
import os
from datetime import datetime, timedelta
from pathlib import Path

# Add the parent directory to the path so we can import from app
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, engine, Base
from app.models import User, Lesson
from dotenv import load_dotenv
import hashlib

# Load environment variables
load_dotenv()

def hash_password(password: str) -> str:
    """Simple password hashing (in production, use bcrypt or similar)"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_sample_data():
    """Create sample users and lessons for testing"""
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"Database already contains {existing_users} users. Skipping initialization.")
            return
        
        print("Creating sample users...")
        
        # Sample teachers
        teachers = [
            User(
                email="john.teacher@musicu.com",
                username="john_teacher",
                full_name="John Smith",
                hashed_password=hash_password("teacher123"),
                is_active=True,
                is_teacher=True,
                phone="(555) 123-4567"
            ),
            User(
                email="sarah.piano@musicu.com",
                username="sarah_piano",
                full_name="Sarah Johnson",
                hashed_password=hash_password("piano123"),
                is_active=True,
                is_teacher=True,
                phone="(555) 234-5678"
            ),
            User(
                email="mike.guitar@musicu.com",
                username="mike_guitar",
                full_name="Mike Rodriguez",
                hashed_password=hash_password("guitar123"),
                is_active=True,
                is_teacher=True,
                phone="(555) 345-6789"
            )
        ]
        
        # Sample students
        students = [
            User(
                email="alice.student@example.com",
                username="alice_student",
                full_name="Alice Brown",
                hashed_password=hash_password("student123"),
                is_active=True,
                is_teacher=False,
                phone="(555) 456-7890"
            ),
            User(
                email="bob.student@example.com",
                username="bob_student",
                full_name="Bob Wilson",
                hashed_password=hash_password("student123"),
                is_active=True,
                is_teacher=False,
                phone="(555) 567-8901"
            ),
            User(
                email="carol.student@example.com",
                username="carol_student",
                full_name="Carol Davis",
                hashed_password=hash_password("student123"),
                is_active=True,
                is_teacher=False,
                phone="(555) 678-9012"
            ),
            User(
                email="david.student@example.com",
                username="david_student",
                full_name="David Miller",
                hashed_password=hash_password("student123"),
                is_active=True,
                is_teacher=False,
                phone="(555) 789-0123"
            )
        ]
        
        # Add all users to database
        all_users = teachers + students
        for user in all_users:
            db.add(user)
        
        db.commit()
        
        # Refresh to get IDs
        for user in all_users:
            db.refresh(user)
        
        print(f"Created {len(teachers)} teachers and {len(students)} students.")
        
        print("Creating sample lessons...")
        
        # Create sample lessons
        base_date = datetime.now() + timedelta(days=1)  # Start lessons tomorrow
        sample_lessons = [
            Lesson(
                title="Piano Basics - Week 1",
                description="Introduction to piano fundamentals and proper posture",
                teacher_id=teachers[1].id,  # Sarah (piano teacher)
                student_id=students[0].id,  # Alice
                scheduled_at=base_date + timedelta(hours=10),
                duration_minutes=60,
                instrument="Piano",
                lesson_type="individual",
                status="scheduled",
                notes="First lesson - assess skill level"
            ),
            Lesson(
                title="Guitar Fundamentals",
                description="Basic chords and strumming patterns",
                teacher_id=teachers[2].id,  # Mike (guitar teacher)
                student_id=students[1].id,  # Bob
                scheduled_at=base_date + timedelta(days=1, hours=14),
                duration_minutes=45,
                instrument="Guitar",
                lesson_type="individual",
                status="scheduled",
                notes="Bring your own guitar if you have one"
            ),
            Lesson(
                title="Music Theory Introduction",
                description="Basic music theory concepts and notation",
                teacher_id=teachers[0].id,  # John (general teacher)
                student_id=students[2].id,  # Carol
                scheduled_at=base_date + timedelta(days=2, hours=16),
                duration_minutes=60,
                instrument="Theory",
                lesson_type="individual",
                status="scheduled",
                notes="No instrument required - bring notebook"
            ),
            Lesson(
                title="Advanced Piano Techniques",
                description="Working on advanced finger exercises and pieces",
                teacher_id=teachers[1].id,  # Sarah (piano teacher)
                student_id=students[3].id,  # David
                scheduled_at=base_date + timedelta(days=3, hours=11),
                duration_minutes=90,
                instrument="Piano",
                lesson_type="individual",
                status="scheduled",
                notes="Student has 2 years experience"
            ),
            Lesson(
                title="Group Guitar Class",
                description="Group lesson for beginner guitar students",
                teacher_id=teachers[2].id,  # Mike (guitar teacher)
                student_id=students[1].id,  # Bob (one of multiple students)
                scheduled_at=base_date + timedelta(days=4, hours=15),
                duration_minutes=75,
                instrument="Guitar",
                lesson_type="group",
                status="scheduled",
                notes="Group class with 4 students total"
            )
        ]
        
        # Add lessons to database
        for lesson in sample_lessons:
            db.add(lesson)
        
        db.commit()
        
        print(f"Created {len(sample_lessons)} sample lessons.")
        print("\nSample data creation completed successfully!")
        print("\nSample Teacher Accounts:")
        for teacher in teachers:
            print(f"  - {teacher.full_name} ({teacher.email}) - Password: Use original password")
        
        print("\nSample Student Accounts:")
        for student in students:
            print(f"  - {student.full_name} ({student.email}) - Password: Use original password")
            
    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Initializing Music U database with sample data...")
    create_sample_data()
