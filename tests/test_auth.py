
"""
Comprehensive tests for authentication system
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

from app.main import app
from app.database import Base, get_db
from app.auth.utils import create_access_token
from app import models

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_auth.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


# Test fixtures
@pytest.fixture
def test_user_data():
    return {
        "email": "test@example.com",
        "username": "testuser",
        "full_name": "Test User",
        "password": "testpass123",
        "is_teacher": False,
        "phone": "555-0123"
    }


@pytest.fixture
def test_teacher_data():
    return {
        "email": "teacher@example.com", 
        "username": "teacheruser",
        "full_name": "Teacher User",
        "password": "teachpass123",
        "is_teacher": True,
        "phone": "555-0456"
    }


@pytest.fixture
def clean_db():
    """Clean database before each test"""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


class TestUserRegistration:
    """Test user registration functionality"""
    
    def test_register_user_success(self, clean_db, test_user_data):
        """Test successful user registration"""
        response = client.post("/auth/register", json=test_user_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["username"] == test_user_data["username"]
        assert data["full_name"] == test_user_data["full_name"]
        assert data["is_teacher"] == test_user_data["is_teacher"]
        assert "password" not in data  # Password should not be returned
        assert "id" in data
        assert data["is_active"] == True
    
    def test_register_teacher_success(self, clean_db, test_teacher_data):
        """Test successful teacher registration"""
        response = client.post("/auth/register", json=test_teacher_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_teacher"] == True
    
    def test_register_duplicate_email(self, clean_db, test_user_data):
        """Test registration with duplicate email"""
        # Register first user
        client.post("/auth/register", json=test_user_data)
        
        # Try to register with same email but different username
        duplicate_data = test_user_data.copy()
        duplicate_data["username"] = "differentuser"
        
        response = client.post("/auth/register", json=duplicate_data)
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]
    
    def test_register_duplicate_username(self, clean_db, test_user_data):
        """Test registration with duplicate username"""
        # Register first user
        client.post("/auth/register", json=test_user_data)
        
        # Try to register with same username but different email
        duplicate_data = test_user_data.copy()
        duplicate_data["email"] = "different@example.com"
        
        response = client.post("/auth/register", json=duplicate_data)
        assert response.status_code == 400
        assert "Username already taken" in response.json()["detail"]
    
    def test_register_invalid_email(self, clean_db, test_user_data):
        """Test registration with invalid email"""
        invalid_data = test_user_data.copy()
        invalid_data["email"] = "invalid-email"
        
        response = client.post("/auth/register", json=invalid_data)
        assert response.status_code == 422  # Validation error
    
    def test_register_short_password(self, clean_db, test_user_data):
        """Test registration with short password"""
        invalid_data = test_user_data.copy()
        invalid_data["password"] = "short"
        
        response = client.post("/auth/register", json=invalid_data)
        assert response.status_code == 422
        assert "Password must be at least 8 characters long" in str(response.json())


class TestUserLogin:
    """Test user login functionality"""
    
    def test_login_success_with_username(self, clean_db, test_user_data):
        """Test successful login with username"""
        # Register user first
        client.post("/auth/register", json=test_user_data)
        
        # Login with username
        login_data = {
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
        
        response = client.post("/auth/login", data=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0
    
    def test_login_success_with_email(self, clean_db, test_user_data):
        """Test successful login with email"""
        # Register user first
        client.post("/auth/register", json=test_user_data)
        
        # Login with email
        login_data = {
            "username": test_user_data["email"],  # Can use email as username
            "password": test_user_data["password"]
        }
        
        response = client.post("/auth/login", data=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_wrong_password(self, clean_db, test_user_data):
        """Test login with wrong password"""
        # Register user first
        client.post("/auth/register", json=test_user_data)
        
        # Login with wrong password
        login_data = {
            "username": test_user_data["username"],
            "password": "wrongpassword"
        }
        
        response = client.post("/auth/login", data=login_data)
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]
    
    def test_login_nonexistent_user(self, clean_db):
        """Test login with nonexistent user"""
        login_data = {
            "username": "nonexistent",
            "password": "somepassword"
        }
        
        response = client.post("/auth/login", data=login_data)
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]


class TestProtectedRoutes:
    """Test protected routes and authentication middleware"""
    
    def test_get_current_user_success(self, clean_db, test_user_data):
        """Test getting current user info with valid token"""
        # Register and login
        client.post("/auth/register", json=test_user_data)
        login_response = client.post("/auth/login", data={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        
        # Get current user info
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == test_user_data["username"]
        assert data["email"] == test_user_data["email"]
        assert data["is_teacher"] == test_user_data["is_teacher"]
    
    def test_get_current_user_invalid_token(self, clean_db):
        """Test getting current user with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/auth/me", headers=headers)
        
        assert response.status_code == 401
        assert "Could not validate credentials" in response.json()["detail"]
    
    def test_get_current_user_no_token(self, clean_db):
        """Test accessing protected route without token"""
        response = client.get("/auth/me")
        assert response.status_code == 401
    
    def test_expired_token(self, clean_db, test_user_data):
        """Test access with expired token"""
        # Create expired token
        token_data = {
            "sub": test_user_data["username"],
            "user_id": 1,
            "role": "student",
            "is_teacher": False
        }
        expired_token = create_access_token(
            data=token_data,
            expires_delta=timedelta(seconds=-1)  # Already expired
        )
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/auth/me", headers=headers)
        
        assert response.status_code == 401


class TestRoleBasedAuthorization:
    """Test role-based authorization functionality"""
    
    def setup_users(self):
        """Helper to create test users"""
        # Create student
        student_data = {
            "email": "student@example.com",
            "username": "student",
            "full_name": "Student User",
            "password": "password123",
            "is_teacher": False
        }
        client.post("/auth/register", json=student_data)
        student_login = client.post("/auth/login", data={
            "username": "student",
            "password": "password123"
        })
        student_token = student_login.json()["access_token"]
        
        # Create teacher
        teacher_data = {
            "email": "teacher@example.com",
            "username": "teacher", 
            "full_name": "Teacher User",
            "password": "password123",
            "is_teacher": True
        }
        client.post("/auth/register", json=teacher_data)
        teacher_login = client.post("/auth/login", data={
            "username": "teacher",
            "password": "password123"
        })
        teacher_token = teacher_login.json()["access_token"]
        
        return student_token, teacher_token
    
    def test_jwt_contains_role_info(self, clean_db):
        """Test that JWT token contains role information"""
        student_token, teacher_token = self.setup_users()
        
        # Test student token contains correct role
        student_headers = {"Authorization": f"Bearer {student_token}"}
        student_response = client.get("/auth/me", headers=student_headers)
        assert student_response.status_code == 200
        assert student_response.json()["is_teacher"] == False
        
        # Test teacher token contains correct role
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
        teacher_response = client.get("/auth/me", headers=teacher_headers)
        assert teacher_response.status_code == 200
        assert teacher_response.json()["is_teacher"] == True


class TestPasswordChange:
    """Test password change functionality"""
    
    def test_change_password_success(self, clean_db, test_user_data):
        """Test successful password change"""
        # Register and login
        client.post("/auth/register", json=test_user_data)
        login_response = client.post("/auth/login", data={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        
        # Change password
        headers = {"Authorization": f"Bearer {token}"}
        password_data = {
            "old_password": test_user_data["password"],
            "new_password": "newtestpass123"
        }
        
        response = client.post("/auth/change-password", json=password_data, headers=headers)
        assert response.status_code == 200
        assert "Password changed successfully" in response.json()["message"]
        
        # Test login with new password
        login_data = {
            "username": test_user_data["username"],
            "password": "newtestpass123"
        }
        new_login_response = client.post("/auth/login", data=login_data)
        assert new_login_response.status_code == 200
    
    def test_change_password_wrong_old_password(self, clean_db, test_user_data):
        """Test password change with wrong old password"""
        # Register and login
        client.post("/auth/register", json=test_user_data)
        login_response = client.post("/auth/login", data={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        
        # Try to change password with wrong old password
        headers = {"Authorization": f"Bearer {token}"}
        password_data = {
            "old_password": "wrongpassword",
            "new_password": "newtestpass123"
        }
        
        response = client.post("/auth/change-password", json=password_data, headers=headers)
        assert response.status_code == 400
        assert "Incorrect old password" in response.json()["detail"]


class TestTokenValidation:
    """Test JWT token validation"""
    
    def test_token_structure(self, clean_db, test_user_data):
        """Test that token contains expected claims"""
        # Register user and get token
        client.post("/auth/register", json=test_user_data)
        login_response = client.post("/auth/login", data={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        
        # Verify token structure by accessing protected route
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/auth/me", headers=headers)
        
        assert response.status_code == 200
        user_data = response.json()
        
        # Verify all expected fields are present
        expected_fields = ["id", "email", "username", "full_name", "is_teacher", "is_active"]
        for field in expected_fields:
            assert field in user_data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
