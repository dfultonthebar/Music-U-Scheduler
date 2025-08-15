
#!/usr/bin/env python3
"""
Script to create an admin user for Music U Scheduler
"""

import sys
import os
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.models import User
from app.auth.utils import get_password_hash
import getpass

def create_admin_user():
    """Create an admin user interactively"""
    print("🎵 Music U Scheduler - Admin User Creation")
    print("==========================================")
    
    # Get user input
    email = input("Admin email: ").strip()
    if not email:
        print("Error: Email is required")
        return False
    
    full_name = input("Full name: ").strip()
    if not full_name:
        print("Error: Full name is required")
        return False
    
    username = input("Username (optional): ").strip()
    if not username:
        username = email.split('@')[0]
    
    password = getpass.getpass("Password: ")
    if len(password) < 8:
        print("Error: Password must be at least 8 characters long")
        return False
    
    confirm_password = getpass.getpass("Confirm password: ")
    if password != confirm_password:
        print("Error: Passwords do not match")
        return False
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"Error: User with email {email} already exists")
            return False
        
        # Create admin user
        admin_user = User(
            email=email,
            username=username,
            full_name=full_name,
            role="admin",
            is_active=True,
            hashed_password=get_password_hash(password)
        )
        
        db.add(admin_user)
        db.commit()
        
        print(f"\n✅ Admin user created successfully!")
        print(f"Email: {email}")
        print(f"Username: {username}")
        print(f"Role: admin")
        print("\nYou can now log in to the admin dashboard.")
        
        return True
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
        return False
    
    finally:
        db.close()

def create_default_admin():
    """Create default admin user non-interactively"""
    db = SessionLocal()
    
    try:
        # Check if admin user already exists
        admin_exists = db.query(User).filter(User.email == 'admin@musicuscheduler.com').first()
        
        if not admin_exists:
            admin_user = User(
                email='admin@musicuscheduler.com',
                username='admin',
                full_name='System Administrator',
                role='admin',
                is_active=True,
                hashed_password=get_password_hash('admin123')
            )
            db.add(admin_user)
            db.commit()
            
            print('✅ Default admin user created successfully')
            print('Email: admin@musicuscheduler.com')
            print('Password: admin123')
            print('⚠️  Please change the password after first login!')
            return True
        else:
            print('ℹ️  Admin user already exists')
            return True
            
    except Exception as e:
        print(f"Error creating default admin user: {e}")
        db.rollback()
        return False
    
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--default":
        success = create_default_admin()
    else:
        success = create_admin_user()
    
    sys.exit(0 if success else 1)
