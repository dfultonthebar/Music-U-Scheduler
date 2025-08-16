
#!/usr/bin/env python3
"""
Debug the authentication flow and session handling
"""

import requests
import sys
import json

def test_auth_debugging():
    """Debug authentication issues step by step"""
    base_url_backend = "http://localhost:8080"
    base_url_frontend = "http://localhost:3000"
    
    print("🔍 Debugging Music U Scheduler Authentication")
    print("=" * 60)
    
    # Test 1: Backend login
    print("1. Testing direct backend login...")
    login_data = {
        'username': 'admin',
        'password': 'MusicU2025'
    }
    
    try:
        response = requests.post(f"{base_url_backend}/auth/login", data=login_data)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            auth_data = response.json()
            token = auth_data['access_token']
            print(f"   ✅ Backend login successful!")
            print(f"   Token: {token[:20]}...")
            
            # Test 2: Test /auth/me endpoint
            print("\n2. Testing /auth/me endpoint...")
            headers = {'Authorization': f'Bearer {token}'}
            me_response = requests.get(f"{base_url_backend}/auth/me", headers=headers)
            print(f"   Status Code: {me_response.status_code}")
            
            if me_response.status_code == 200:
                user_data = me_response.json()
                print(f"   ✅ User data retrieved!")
                print(f"   Username: {user_data.get('username')}")
                print(f"   Email: {user_data.get('email')}")
                print(f"   Role: {user_data.get('role')}")
            else:
                print(f"   ❌ Failed to get user data: {me_response.text}")
                
        else:
            print(f"   ❌ Backend login failed: {response.text}")
            return
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Test 3: Test NextAuth API
    print("\n3. Testing NextAuth API endpoints...")
    
    # Test providers endpoint
    try:
        providers_response = requests.get(f"{base_url_frontend}/api/auth/providers")
        print(f"   /api/auth/providers - Status: {providers_response.status_code}")
        if providers_response.status_code == 200:
            providers = providers_response.json()
            print(f"   ✅ Providers available: {list(providers.keys())}")
        else:
            print(f"   ❌ Providers failed: {providers_response.text}")
    except Exception as e:
        print(f"   ❌ Providers error: {e}")
    
    # Test session endpoint
    try:
        session_response = requests.get(f"{base_url_frontend}/api/auth/session")
        print(f"   /api/auth/session - Status: {session_response.status_code}")
        if session_response.status_code == 200:
            session = session_response.json()
            if session:
                print(f"   ✅ Session exists: {session.get('user', {}).get('name', 'Unknown')}")
            else:
                print(f"   ℹ️  No active session")
        else:
            print(f"   ❌ Session check failed: {session_response.text}")
    except Exception as e:
        print(f"   ❌ Session error: {e}")
    
    # Test 4: Test NextAuth signin
    print("\n4. Testing NextAuth signin endpoint...")
    try:
        signin_data = {
            'username': 'admin',
            'password': 'MusicU2025',
            'callbackUrl': 'http://localhost:3000/admin',
            'csrfToken': '',
            'json': 'true'
        }
        
        signin_response = requests.post(
            f"{base_url_frontend}/api/auth/signin/credentials",
            data=signin_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            allow_redirects=False
        )
        
        print(f"   Status Code: {signin_response.status_code}")
        print(f"   Headers: {dict(signin_response.headers)}")
        
        if signin_response.status_code in [200, 302]:
            print(f"   ✅ NextAuth signin response received")
            if 'set-cookie' in signin_response.headers:
                print(f"   ✅ Session cookies set")
            else:
                print(f"   ❌ No session cookies in response")
        else:
            print(f"   ❌ NextAuth signin failed: {signin_response.text}")
            
    except Exception as e:
        print(f"   ❌ NextAuth signin error: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 Debug Summary:")
    print("✅ Backend API authentication working")
    print("🔍 Frontend NextAuth integration needs investigation")
    print("💡 Check browser console for detailed NextAuth logs")

if __name__ == "__main__":
    test_auth_debugging()
