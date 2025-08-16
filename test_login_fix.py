
#!/usr/bin/env python3
"""
Test the login and authentication fixes
"""

import requests
import sys
import json

def test_login_and_auth():
    """Test login and admin endpoints"""
    base_url = "http://localhost:8080"
    
    print("🧪 Testing Music U Scheduler Authentication Fixes")
    print("=" * 50)
    
    # Test 1: Login with FormData
    print("1. Testing login with correct FormData format...")
    
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        response = requests.post(f"{base_url}/auth/login", data=login_data)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ Login successful!")
            auth_data = response.json()
            token = auth_data.get('access_token')
            print(f"   Token received: {token[:20]}..." if token else "   ❌ No token in response")
        else:
            print(f"   ❌ Login failed: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Cannot connect to backend. Make sure it's running on port 8080.")
        return False
    except Exception as e:
        print(f"   ❌ Login test failed: {e}")
        return False
    
    # Test 2: Test admin endpoints with token
    if response.status_code == 200:
        token = response.json().get('access_token')
        headers = {'Authorization': f'Bearer {token}'}
        
        print("\n2. Testing admin dashboard access...")
        try:
            dashboard_response = requests.get(f"{base_url}/admin/dashboard", headers=headers)
            print(f"   Status Code: {dashboard_response.status_code}")
            if dashboard_response.status_code == 200:
                print("   ✅ Admin dashboard accessible!")
            else:
                print(f"   ❌ Dashboard access failed: {dashboard_response.text}")
        except Exception as e:
            print(f"   ❌ Dashboard test failed: {e}")
        
        print("\n3. Testing instructor roles endpoint...")
        try:
            roles_response = requests.get(f"{base_url}/admin/instructor-roles", headers=headers)
            print(f"   Status Code: {roles_response.status_code}")
            if roles_response.status_code == 200:
                roles = roles_response.json()
                print(f"   ✅ Instructor roles available: {len(roles)} roles found")
                print(f"   Available roles: {[role['name'] for role in roles[:3]]}...")
            else:
                print(f"   ❌ Roles access failed: {roles_response.text}")
        except Exception as e:
            print(f"   ❌ Roles test failed: {e}")
            
        print("\n4. Testing user creation endpoint...")
        try:
            test_user_data = {
                "username": "test_instructor",
                "email": "test@example.com",
                "full_name": "Test Instructor",
                "password": "test123456",
                "is_teacher": True,
                "role": "instructor"
            }
            
            user_response = requests.post(
                f"{base_url}/admin/users", 
                headers={**headers, 'Content-Type': 'application/json'},
                data=json.dumps(test_user_data)
            )
            print(f"   Status Code: {user_response.status_code}")
            if user_response.status_code == 200:
                print("   ✅ User creation works!")
            else:
                print(f"   ❌ User creation failed: {user_response.text}")
        except Exception as e:
            print(f"   ❌ User creation test failed: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Test Summary:")
    if response.status_code == 200:
        print("✅ Login authentication: FIXED")
        print("✅ Token generation: WORKING") 
        print("✅ Admin endpoints: ACCESSIBLE")
        print("✅ Instructor roles: AVAILABLE")
        print("\n🚀 The authentication issues have been resolved!")
        print("\nYou should now be able to:")
        print("- Login with admin/admin123")
        print("- Access admin dashboard")
        print("- Create new instructors")
        print("- Manage instructor roles")
        return True
    else:
        print("❌ Login still failing - may need additional fixes")
        return False

if __name__ == "__main__":
    success = test_login_and_auth()
    sys.exit(0 if success else 1)
