#!/usr/bin/env python3
"""
Test script for admin and instructor API endpoints
"""
import asyncio
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, engine
from app.models import Base
from app.auth.utils import create_access_token
from sqlalchemy.orm import sessionmaker
import json

# Create test database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_test_tokens():
    """Create test tokens for different user roles"""
    # Admin token
    admin_token = create_access_token(
        data={"sub": "admin@test.com", "role": "admin", "user_id": 1}
    )
    
    # Instructor token
    instructor_token = create_access_token(
        data={"sub": "instructor@test.com", "role": "instructor", "user_id": 2}
    )
    
    # Student token
    student_token = create_access_token(
        data={"sub": "student@test.com", "role": "student", "user_id": 3}
    )
    
    return admin_token, instructor_token, student_token

def test_admin_endpoints():
    """Test admin API endpoints"""
    client = TestClient(app)
    admin_token, instructor_token, student_token = create_test_tokens()
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    print("Testing Admin Endpoints...")
    
    # Test admin dashboard
    response = client.get("/admin/dashboard", headers=headers)
    print(f"Admin Dashboard: {response.status_code}")
    
    # Test user management
    response = client.get("/admin/users", headers=headers)
    print(f"Get Users: {response.status_code}")
    
    # Test create user
    user_data = {
        "email": "newuser@test.com",
        "password": "testpass123",
        "full_name": "New User",
        "role": "student"
    }
    response = client.post("/admin/users", json=user_data, headers=headers)
    print(f"Create User: {response.status_code}")
    
    # Test lesson management
    response = client.get("/admin/lessons", headers=headers)
    print(f"Get Lessons: {response.status_code}")
    
    # Test reports
    response = client.get("/admin/reports/overview", headers=headers)
    print(f"Reports Overview: {response.status_code}")
    
    return True

def test_instructor_endpoints():
    """Test instructor API endpoints"""
    client = TestClient(app)
    admin_token, instructor_token, student_token = create_test_tokens()
    
    headers = {"Authorization": f"Bearer {instructor_token}"}
    
    print("\nTesting Instructor Endpoints...")
    
    # Test instructor dashboard
    response = client.get("/instructor/dashboard", headers=headers)
    print(f"Instructor Dashboard: {response.status_code}")
    
    # Test schedule management
    response = client.get("/instructor/schedule", headers=headers)
    print(f"Get Schedule: {response.status_code}")
    
    # Test student management
    response = client.get("/instructor/students", headers=headers)
    print(f"Get Students: {response.status_code}")
    
    # Test lesson creation
    lesson_data = {
        "title": "Test Lesson",
        "description": "Test lesson description",
        "date": "2025-08-20",
        "time": "10:00:00",
        "duration": 60,
        "student_id": 3
    }
    response = client.post("/instructor/lessons", json=lesson_data, headers=headers)
    print(f"Create Lesson: {response.status_code}")
    
    return True

def test_role_permissions():
    """Test role-based access control"""
    client = TestClient(app)
    admin_token, instructor_token, student_token = create_test_tokens()
    
    print("\nTesting Role Permissions...")
    
    # Test student trying to access admin endpoint (should fail)
    student_headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/admin/dashboard", headers=student_headers)
    print(f"Student accessing admin (should be 403): {response.status_code}")
    
    # Test instructor trying to access admin endpoint (should fail)
    instructor_headers = {"Authorization": f"Bearer {instructor_token}"}
    response = client.get("/admin/users", headers=instructor_headers)
    print(f"Instructor accessing admin users (should be 403): {response.status_code}")
    
    # Test student trying to access instructor endpoint (should fail)
    response = client.get("/instructor/dashboard", headers=student_headers)
    print(f"Student accessing instructor (should be 403): {response.status_code}")
    
    return True

def main():
    """Run all endpoint tests"""
    try:
        print("Starting Admin/Instructor API Endpoint Tests...")
        print("=" * 50)
        
        # Test admin endpoints
        test_admin_endpoints()
        
        # Test instructor endpoints
        test_instructor_endpoints()
        
        # Test role permissions
        test_role_permissions()
        
        print("\n" + "=" * 50)
        print("All endpoint tests completed!")
        
    except Exception as e:
        print(f"Error during testing: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
