
#!/usr/bin/env python3
"""
Test login credentials and create a comprehensive authentication test
"""

import requests
import sys
import os

def test_backend_auth():
    """Test backend authentication directly"""
    print("🧪 Testing backend authentication...")
    
    # Test backend login
    try:
        response = requests.post(
            "http://localhost:8080/auth/login",
            data={
                "username": "admin",
                "password": "MusicU2025"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print("✅ Backend authentication successful!")
            print(f"   Token: {token[:50]}...")
            
            # Test /auth/me endpoint
            me_response = requests.get(
                "http://localhost:8080/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if me_response.status_code == 200:
                user_data = me_response.json()
                print("✅ User data retrieved successfully!")
                print(f"   Username: {user_data.get('username')}")
                print(f"   Email: {user_data.get('email')}")
                print(f"   Role: {user_data.get('role')}")
                return True
            else:
                print(f"❌ /auth/me failed: {me_response.status_code}")
                return False
        else:
            print(f"❌ Backend authentication failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Backend authentication error: {e}")
        return False

def test_frontend():
    """Test if frontend is accessible"""
    print("\n🧪 Testing frontend accessibility...")
    
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is accessible!")
            return True
        else:
            print(f"❌ Frontend returned status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend not accessible: {e}")
        return False

def check_environment():
    """Check if environment variables are set"""
    print("\n🧪 Checking environment variables...")
    
    env_file = "/home/ubuntu/music-u-scheduler-frontend/app/.env.local"
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            content = f.read()
            if "NEXTAUTH_SECRET" in content:
                print("✅ NEXTAUTH_SECRET found in .env.local")
            else:
                print("❌ NEXTAUTH_SECRET not found in .env.local")
            
            if "NEXTAUTH_URL" in content:
                print("✅ NEXTAUTH_URL found in .env.local")
            else:
                print("❌ NEXTAUTH_URL not found in .env.local")
    else:
        print("❌ .env.local file not found")

def main():
    print("🔍 Music U Scheduler Authentication Test")
    print("="*50)
    
    # Test backend authentication
    backend_works = test_backend_auth()
    
    # Test frontend accessibility
    frontend_works = test_frontend()
    
    # Check environment
    check_environment()
    
    print("\n" + "="*50)
    print("📋 SUMMARY")
    print("="*50)
    
    if backend_works:
        print("✅ Backend authentication: WORKING")
        print("   • Username: admin")
        print("   • Password: MusicU2025")
        print("   • These credentials are correct!")
    else:
        print("❌ Backend authentication: FAILED")
    
    if frontend_works:
        print("✅ Frontend accessibility: WORKING")
    else:
        print("❌ Frontend accessibility: FAILED")
        print("   • Try restarting the frontend service")
    
    if not frontend_works:
        print("\n🚀 Quick fix commands:")
        print("   cd /home/ubuntu/music-u-scheduler-frontend/app")
        print("   pkill -f 'next' || true")
        print("   yarn dev")
        print("\n   Then try logging in at: http://localhost:3000/login")

if __name__ == "__main__":
    main()
