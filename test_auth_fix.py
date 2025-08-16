
#!/usr/bin/env python3
"""
Test script to verify authentication fixes for Music U Scheduler
"""

import requests
import json
import time

# API base URL
API_BASE = "http://localhost:8080"

def test_backend_auth():
    """Test backend authentication directly"""
    print("Testing backend authentication...")
    
    # Test login
    login_data = {
        'username': 'admin',
        'password': 'MusicU2025'
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/login", data=login_data)
        if response.status_code == 200:
            auth_data = response.json()
            token = auth_data.get('access_token')
            print(f"✅ Backend login successful, token: {token[:20]}...")
            
            # Test admin endpoints with token
            headers = {'Authorization': f'Bearer {token}'}
            
            # Test dashboard
            dash_response = requests.get(f"{API_BASE}/admin/dashboard", headers=headers)
            print(f"Dashboard endpoint: {dash_response.status_code}")
            
            # Test users endpoint
            users_response = requests.get(f"{API_BASE}/admin/users", headers=headers)
            print(f"Users endpoint: {users_response.status_code}")
            
            # Test user creation
            user_data = {
                "username": "test_instructor",
                "email": "test@example.com",
                "password": "testpass123",
                "full_name": "Test Instructor",
                "first_name": "Test",
                "last_name": "Instructor",
                "phone": "1234567890",
                "is_instructor": True,
                "is_teacher": True
            }
            
            create_response = requests.post(f"{API_BASE}/admin/users", 
                                          json=user_data, headers=headers)
            print(f"User creation: {create_response.status_code}")
            if create_response.status_code != 200:
                print(f"Error: {create_response.text}")
            
            # Test email settings
            email_response = requests.get(f"{API_BASE}/admin/email-settings", headers=headers)
            print(f"Email settings: {email_response.status_code}")
            
            # Test backups
            backup_response = requests.get(f"{API_BASE}/admin/backups", headers=headers)
            print(f"Backups: {backup_response.status_code}")
            
            return True
            
        else:
            print(f"❌ Backend login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing backend: {e}")
        return False

def test_frontend_health():
    """Test if frontend is responding"""
    print("\nTesting frontend health...")
    
    try:
        # Test frontend health
        response = requests.get("http://localhost:3000/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is responding")
            return True
        else:
            print(f"❌ Frontend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend not responding: {e}")
        return False

def main():
    print("🔍 Testing Music U Scheduler Authentication Fix\n")
    
    # Wait a moment for services to be ready
    time.sleep(2)
    
    # Test backend
    backend_ok = test_backend_auth()
    
    # Test frontend
    frontend_ok = test_frontend_health()
    
    print(f"\n📊 Test Results:")
    print(f"Backend Authentication: {'✅ PASS' if backend_ok else '❌ FAIL'}")
    print(f"Frontend Health: {'✅ PASS' if frontend_ok else '❌ FAIL'}")
    
    if backend_ok and frontend_ok:
        print("\n🎉 All tests passed! Authentication fix looks good.")
        return 0
    else:
        print("\n⚠️ Some tests failed. Check the logs for details.")
        return 1

if __name__ == "__main__":
    exit(main())
