
#!/usr/bin/env python3
"""
Comprehensive test suite for Music U Scheduler
Tests all major functionality including admin and instructor features
"""

import pytest
import asyncio
import sys
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import tempfile
import os

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.main import app
from app.database import get_db, Base
from app.models import User, Lesson
from app.auth.utils import create_access_token, get_password_hash

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

class TestMusicUScheduler:
    """Comprehensive test suite for Music U Scheduler"""
    
    @classmethod
    def setup_class(cls):
        """Set up test database and client"""
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)
        cls.setup_test_data()
    
    @classmethod
    def teardown_class(cls):
        """Clean up test database"""
        Base.metadata.drop_all(bind=engine)
        if os.path.exists("test.db"):
            os.remove("test.db")
    
    @classmethod
    def setup_test_data(cls):
        """Create test users and data"""
        db = TestingSessionLocal()
        
        # Create test users
        admin_user = User(
            email="admin@test.com",
            username="admin",
            full_name="Test Admin",
            role="admin",
            is_active=True,
            hashed_password=get_password_hash("testpass123")
        )
        
        instructor_user = User(
            email="instructor@test.com",
            username="instructor",
            full_name="Test Instructor",
            role="instructor",
            is_active=True,
            hashed_password=get_password_hash("testpass123")
        )
        
        student_user = User(
            email="student@test.com",
            username="student",
            full_name="Test Student",
            role="student",
            is_active=True,
            hashed_password=get_password_hash("testpass123")
        )
        
        db.add_all([admin_user, instructor_user, student_user])
        db.commit()
        
        # Create test lesson
        from datetime import datetime
        lesson = Lesson(
            title="Test Lesson",
            description="Test lesson description",
            scheduled_at=datetime(2025, 8, 20, 10, 0, 0),
            duration_minutes=60,
            teacher_id=2,
            student_id=3,
            status="scheduled"
        )
        
        db.add(lesson)
        db.commit()
        db.close()
        
        # Create tokens
        cls.admin_token = create_access_token(
            data={"sub": "admin@test.com", "role": "admin", "user_id": 1}
        )
        cls.instructor_token = create_access_token(
            data={"sub": "instructor@test.com", "role": "instructor", "user_id": 2}
        )
        cls.student_token = create_access_token(
            data={"sub": "student@test.com", "role": "student", "user_id": 3}
        )
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = self.client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "admin" in data
        assert "instructor" in data
    
    def test_authentication_endpoints(self):
        """Test authentication endpoints"""
        # Test login
        response = self.client.post(
            "/auth/login",
            data={"username": "admin@test.com", "password": "testpass123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        
        # Test protected endpoint
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = self.client.get("/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@test.com"
        assert data["role"] == "admin"
    
    def test_admin_api_endpoints(self):
        """Test admin API endpoints"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test admin dashboard
        response = self.client.get("/admin/dashboard", headers=headers)
        assert response.status_code == 200
        
        # Test get users
        response = self.client.get("/admin/users", headers=headers)
        assert response.status_code == 200
        
        # Test create user
        user_data = {
            "email": "newuser@test.com",
            "username": "newuser",
            "password": "testpass123",
            "full_name": "New User",
            "role": "student"
        }
        response = self.client.post("/admin/users", json=user_data, headers=headers)
        assert response.status_code == 200
        
        # Test get lessons
        response = self.client.get("/admin/lessons", headers=headers)
        assert response.status_code == 200
        
        # Test reports
        response = self.client.get("/admin/reports/overview", headers=headers)
        assert response.status_code == 200
    
    def test_instructor_api_endpoints(self):
        """Test instructor API endpoints"""
        headers = {"Authorization": f"Bearer {self.instructor_token}"}
        
        # Test instructor dashboard
        response = self.client.get("/instructor/dashboard", headers=headers)
        assert response.status_code == 200
        
        # Test get schedule
        response = self.client.get("/instructor/schedule", headers=headers)
        assert response.status_code == 200
        
        # Test get students
        response = self.client.get("/instructor/students", headers=headers)
        assert response.status_code == 200
        
        # Test create lesson
        lesson_data = {
            "title": "New Test Lesson",
            "description": "New test lesson description",
            "scheduled_at": "2025-08-21T14:00:00",
            "duration_minutes": 45,
            "student_id": 3
        }
        response = self.client.post("/instructor/lessons", json=lesson_data, headers=headers)
        assert response.status_code == 200
    
    def test_role_based_access_control(self):
        """Test role-based access control"""
        # Test student trying to access admin endpoint (should fail)
        student_headers = {"Authorization": f"Bearer {self.student_token}"}
        response = self.client.get("/admin/dashboard", headers=student_headers)
        assert response.status_code == 403
        
        # Test instructor trying to access admin users endpoint (should fail)
        instructor_headers = {"Authorization": f"Bearer {self.instructor_token}"}
        response = self.client.get("/admin/users", headers=instructor_headers)
        assert response.status_code == 403
        
        # Test student trying to access instructor endpoint (should fail)
        response = self.client.get("/instructor/dashboard", headers=student_headers)
        assert response.status_code == 403
    
    def test_web_dashboard_endpoints(self):
        """Test web dashboard endpoints"""
        # Note: These will return HTML, so we just check for 200 status
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        instructor_headers = {"Authorization": f"Bearer {self.instructor_token}"}
        
        # Test admin web dashboard
        response = self.client.get("/admin/dashboard", headers=admin_headers)
        assert response.status_code == 200
        
        # Test instructor web dashboard
        response = self.client.get("/instructor/dashboard", headers=instructor_headers)
        assert response.status_code == 200
    
    def test_lesson_management(self):
        """Test lesson management functionality"""
        headers = {"Authorization": f"Bearer {self.instructor_token}"}
        
        # Create a lesson
        lesson_data = {
            "title": "Piano Lesson",
            "description": "Beginner piano lesson",
            "scheduled_at": "2025-08-22T15:00:00",
            "duration_minutes": 60,
            "student_id": 3
        }
        response = self.client.post("/instructor/lessons", json=lesson_data, headers=headers)
        assert response.status_code == 200
        lesson_id = response.json()["id"]
        
        # Get the lesson
        response = self.client.get(f"/instructor/lessons/{lesson_id}", headers=headers)
        assert response.status_code == 200
        
        # Update the lesson
        update_data = {
            "title": "Advanced Piano Lesson",
            "duration_minutes": 90
        }
        response = self.client.put(f"/instructor/lessons/{lesson_id}", json=update_data, headers=headers)
        assert response.status_code == 200
        
        # Mark lesson as completed
        response = self.client.post(f"/instructor/lessons/{lesson_id}/complete", headers=headers)
        assert response.status_code == 200
    
    def test_user_management(self):
        """Test user management functionality"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Create a user
        user_data = {
            "email": "testuser@test.com",
            "username": "testuser",
            "password": "testpass123",
            "full_name": "Test User",
            "role": "student"
        }
        response = self.client.post("/admin/users", json=user_data, headers=headers)
        assert response.status_code == 200
        user_id = response.json()["id"]
        
        # Get the user
        response = self.client.get(f"/admin/users/{user_id}", headers=headers)
        assert response.status_code == 200
        
        # Update the user
        update_data = {
            "full_name": "Updated Test User",
            "role": "instructor"
        }
        response = self.client.put(f"/admin/users/{user_id}", json=update_data, headers=headers)
        assert response.status_code == 200
        
        # Deactivate the user
        response = self.client.put(f"/admin/users/{user_id}", json={"is_active": False}, headers=headers)
        assert response.status_code == 200

def run_tests():
    """Run all tests"""
    print("🧪 Running Comprehensive Tests for Music U Scheduler")
    print("=" * 55)
    
    # Run pytest
    exit_code = pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "--color=yes"
    ])
    
    if exit_code == 0:
        print("\n✅ All tests passed!")
        print("🎉 Music U Scheduler is ready for production!")
    else:
        print("\n❌ Some tests failed!")
        print("Please check the test output above for details.")
    
    return exit_code == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
