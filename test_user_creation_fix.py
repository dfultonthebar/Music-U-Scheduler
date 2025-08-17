
#!/usr/bin/env python3
"""
Test script to verify user creation functionality
"""

import requests
import json
from typing import Dict, Any

# Test configuration
BACKEND_URL = "http://localhost:8080"
TEST_CREDENTIALS = {
    "username": "admin",
    "password": "MusicU2025"
}

def authenticate() -> str:
    """Get JWT token by authenticating with the backend"""
    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/login",
            data=TEST_CREDENTIALS,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        response.raise_for_status()
        return response.json()["access_token"]
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        return None

def create_test_user(token: str, user_type: str) -> Dict[str, Any]:
    """Create a test user"""
    user_data = {
        "username": f"test_{user_type}_001",
        "email": f"test_{user_type}@example.com",
        "password": "TestPass123",
        "full_name": f"Test {user_type.title()} User",
        "role": user_type,
        "is_teacher": user_type == "instructor",
        "phone": "+1-555-0123"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/admin/users",
            json=user_data,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        print(f"📤 Creating {user_type}: {response.status_code}")
        print(f"📄 Request: {json.dumps(user_data, indent=2)}")
        
        if response.status_code == 422:
            print(f"❌ Validation Error: {response.json()}")
        elif response.status_code == 200:
            print(f"✅ Success: {response.json()}")
        else:
            print(f"❓ Response: {response.text}")
            
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"❌ Error creating {user_type}: {e}")
        return None

def delete_test_user(token: str, user_id: int) -> bool:
    """Delete a test user"""
    try:
        response = requests.delete(
            f"{BACKEND_URL}/admin/users/{user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            print(f"✅ User {user_id} deleted successfully")
            return True
        else:
            print(f"❌ Failed to delete user {user_id}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error deleting user: {e}")
        return False

def test_instructor_roles(token: str, instructor_id: int):
    """Test instructor roles functionality"""
    try:
        # Test getting instructor roles
        response = requests.get(
            f"{BACKEND_URL}/admin/instructors/{instructor_id}/roles",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            print(f"✅ Instructor roles retrieved: {response.json()}")
        else:
            print(f"❌ Failed to get instructor roles: {response.status_code} - {response.text}")
        
        # Test assigning a role
        assign_data = {
            "instructor_id": str(instructor_id),
            "role_id": "piano"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/admin/instructor-roles/assign",
            json=assign_data,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code == 200:
            print(f"✅ Role assigned successfully: {response.json()}")
        else:
            print(f"❌ Failed to assign role: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing instructor roles: {e}")

def main():
    print("🧪 Testing User Creation Functionality")
    print("=" * 50)
    
    # Step 1: Authenticate
    print("\n1️⃣ Authenticating...")
    token = authenticate()
    if not token:
        print("❌ Cannot proceed without authentication")
        return
    
    print("✅ Authentication successful")
    
    # Step 2: Test creating a student
    print("\n2️⃣ Creating test student...")
    student = create_test_user(token, "student")
    
    # Step 3: Test creating an instructor
    print("\n3️⃣ Creating test instructor...")
    instructor = create_test_user(token, "instructor")
    
    # Step 4: Test instructor roles if instructor was created
    if instructor:
        print("\n4️⃣ Testing instructor roles...")
        test_instructor_roles(token, instructor["id"])
    
    # Step 5: Clean up (delete test users)
    print("\n5️⃣ Cleaning up...")
    if student:
        delete_test_user(token, student["id"])
    if instructor:
        delete_test_user(token, instructor["id"])
    
    print("\n✅ User creation test completed!")

if __name__ == "__main__":
    main()
