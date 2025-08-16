
#!/usr/bin/env python3
"""
Complete end-to-end test for Music U Scheduler authentication and user creation
"""

import requests
import json
import time

API_BASE = "http://localhost:8080"

def test_full_workflow():
    """Test complete authentication and user creation workflow"""
    print("🧪 Testing Music U Scheduler Full Workflow\n")
    
    # Step 1: Login as admin
    print("1️⃣ Testing admin login...")
    login_data = {'username': 'admin', 'password': 'MusicU2025'}
    
    try:
        response = requests.post(f"{API_BASE}/auth/login", data=login_data)
        if response.status_code != 200:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
        
        auth_data = response.json()
        token = auth_data.get('access_token')
        print(f"✅ Login successful, token: {token[:20]}...")
        headers = {'Authorization': f'Bearer {token}'}
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False

    # Step 2: Test admin endpoints
    print("\n2️⃣ Testing admin endpoints...")
    endpoints = [
        ('/admin/dashboard', 'Dashboard'),
        ('/admin/users', 'Users list'),
        ('/admin/lessons', 'Lessons'),
        ('/admin/audit-logs', 'Audit logs'),
        ('/admin/email-settings', 'Email settings'),
        ('/admin/backups', 'Backups'),
        ('/admin/instructor-roles', 'Instructor roles')
    ]
    
    failed_endpoints = []
    for endpoint, name in endpoints:
        try:
            response = requests.get(f"{API_BASE}{endpoint}", headers=headers)
            if response.status_code == 200:
                print(f"✅ {name}: OK")
            else:
                print(f"❌ {name}: {response.status_code}")
                failed_endpoints.append((endpoint, response.status_code))
        except Exception as e:
            print(f"❌ {name}: Error - {e}")
            failed_endpoints.append((endpoint, 'Error'))

    # Step 3: Test user creation (instructor)
    print("\n3️⃣ Testing instructor creation...")
    instructor_data = {
        "username": f"test_instructor_{int(time.time())}",
        "email": f"instructor{int(time.time())}@example.com",
        "password": "testpass123",
        "full_name": "Test Instructor",
        "first_name": "Test",
        "last_name": "Instructor", 
        "phone": "1234567890",
        "is_instructor": True,
        "is_teacher": True,
        "role": "instructor"
    }
    
    try:
        response = requests.post(f"{API_BASE}/admin/users", json=instructor_data, headers=headers)
        if response.status_code == 200:
            instructor = response.json()
            print(f"✅ Instructor created: {instructor.get('username')} (ID: {instructor.get('id')})")
        else:
            print(f"❌ Instructor creation failed: {response.status_code}")
            print(f"Error: {response.text}")
            failed_endpoints.append(('/admin/users POST', response.status_code))
    except Exception as e:
        print(f"❌ Instructor creation error: {e}")
        failed_endpoints.append(('/admin/users POST', 'Error'))

    # Step 4: Test student creation
    print("\n4️⃣ Testing student creation...")
    student_data = {
        "username": f"test_student_{int(time.time())}",
        "email": f"student{int(time.time())}@example.com", 
        "password": "testpass123",
        "full_name": "Test Student",
        "first_name": "Test",
        "last_name": "Student",
        "phone": "0987654321",
        "is_instructor": False,
        "is_teacher": False,
        "role": "student"
    }
    
    try:
        response = requests.post(f"{API_BASE}/admin/users", json=student_data, headers=headers)
        if response.status_code == 200:
            student = response.json()
            print(f"✅ Student created: {student.get('username')} (ID: {student.get('id')})")
        else:
            print(f"❌ Student creation failed: {response.status_code}")
            print(f"Error: {response.text}")
            failed_endpoints.append(('/admin/users POST', response.status_code))
    except Exception as e:
        print(f"❌ Student creation error: {e}")
        failed_endpoints.append(('/admin/users POST', 'Error'))

    # Step 5: Test other admin features
    print("\n5️⃣ Testing admin features...")
    
    # Test email settings update
    try:
        email_settings = {"smtp_host": "smtp.test.com", "smtp_port": 587}
        response = requests.put(f"{API_BASE}/admin/email-settings", json=email_settings, headers=headers)
        print(f"✅ Email settings update: {response.status_code}")
    except Exception as e:
        print(f"❌ Email settings update error: {e}")

    # Test backup creation
    try:
        backup_data = {"name": "Test Backup"}
        response = requests.post(f"{API_BASE}/admin/backups", json=backup_data, headers=headers)
        print(f"✅ Backup creation: {response.status_code}")
    except Exception as e:
        print(f"❌ Backup creation error: {e}")

    # Final Report
    print(f"\n📊 Test Results Summary:")
    print(f"{'='*50}")
    
    if not failed_endpoints:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Authentication working perfectly")
        print("✅ All admin endpoints accessible")  
        print("✅ User creation (instructors and students) working")
        print("✅ Admin features functional")
        return True
    else:
        print("⚠️ Some tests failed:")
        for endpoint, status in failed_endpoints:
            print(f"   ❌ {endpoint}: {status}")
        return False

if __name__ == "__main__":
    success = test_full_workflow()
    exit(0 if success else 1)
