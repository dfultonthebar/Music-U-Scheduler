
#!/usr/bin/env python3
"""
Debug script to test user creation directly and compare with frontend behavior
"""

import requests
import json

def test_user_creation_debug():
    """Test user creation step by step to identify issues"""
    base_url = "http://localhost:8080"
    
    print("🔧 Music U Scheduler User Creation Debug")
    print("=" * 50)
    
    # Step 1: Login
    print("\n1️⃣ Logging in as admin...")
    login_data = {'username': 'admin', 'password': 'MusicU2025'}
    
    try:
        response = requests.post(f"{base_url}/auth/login", data=login_data)
        if response.status_code != 200:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return
        
        auth_data = response.json()
        token = auth_data.get('access_token')
        print(f"✅ Login successful!")
        print(f"   Token: {token[:30]}...")
        headers = {'Authorization': f'Bearer {token}'}
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return

    # Step 2: Test getting current users
    print("\n2️⃣ Getting current users list...")
    try:
        response = requests.get(f"{base_url}/admin/users", headers=headers)
        if response.status_code == 200:
            users = response.json()
            print(f"✅ Found {len(users)} existing users")
            for user in users:
                print(f"   - {user.get('username')} ({user.get('role', 'unknown')})")
        else:
            print(f"❌ Failed to get users: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Error getting users: {e}")
        return
    
    # Step 3: Create a test student
    print("\n3️⃣ Creating test student...")
    student_data = {
        "username": "test_debug_student",
        "email": "debug_student@test.com", 
        "password": "testpass123",
        "first_name": "Debug",
        "last_name": "Student",
        "phone": "555-0123",
        "role": "student",
        "full_name": "Debug Student",
        "is_instructor": False
    }
    
    try:
        response = requests.post(f"{base_url}/admin/users", 
                               headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
                               json=student_data)
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            student = response.json()
            print(f"✅ Student created successfully!")
            print(f"   ID: {student.get('id')}")
            print(f"   Username: {student.get('username')}")
        else:
            print(f"❌ Student creation failed!")
            
    except Exception as e:
        print(f"❌ Error creating student: {e}")
        
    # Step 4: Create a test instructor
    print("\n4️⃣ Creating test instructor...")
    instructor_data = {
        "username": "test_debug_instructor",
        "email": "debug_instructor@test.com",
        "password": "testpass123", 
        "first_name": "Debug",
        "last_name": "Instructor",
        "phone": "555-0124",
        "role": "instructor",
        "full_name": "Debug Instructor",
        "is_instructor": True
    }
    
    try:
        response = requests.post(f"{base_url}/admin/users",
                               headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}, 
                               json=instructor_data)
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            instructor = response.json()
            print(f"✅ Instructor created successfully!")
            print(f"   ID: {instructor.get('id')}")  
            print(f"   Username: {instructor.get('username')}")
        else:
            print(f"❌ Instructor creation failed!")
            
    except Exception as e:
        print(f"❌ Error creating instructor: {e}")

    print("\n📊 Debug Summary:")
    print("If the backend API tests pass but frontend fails, the issue is in:")
    print("1. Frontend authentication token handling") 
    print("2. API request formatting from frontend")
    print("3. CORS configuration")
    print("4. Frontend error handling/display")

if __name__ == "__main__":
    test_user_creation_debug()
