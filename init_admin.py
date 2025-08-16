
#!/usr/bin/env python3
"""
Initialize default admin user for Music U Scheduler
"""

import sys
import os
sys.path.append('.')

from app.database import get_db
from app import models, crud
from app.auth.utils import get_password_hash
from sqlalchemy.orm import Session

def create_admin_user():
    """Create default admin user if it doesn't exist"""
    db = next(get_db())
    
    try:
        # Check if admin user already exists
        existing_admin = crud.get_user_by_username(db, "admin")
        if existing_admin:
            print("✅ Admin user already exists")
            return existing_admin
        
        # Create admin user
        admin_data = {
            'username': 'admin',
            'email': 'admin@musicu.com',
            'full_name': 'Music U Admin',
            'hashed_password': get_password_hash('MusicU2025'),
            'role': models.UserRole.ADMIN,
            'is_teacher': False,
            'is_active': True
        }
        
        admin_user = models.User(**admin_data)
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Created default admin user:")
        print(f"   Username: admin")
        print(f"   Password: MusicU2025")
        print(f"   Email: admin@musicu.com")
        print(f"   Role: {admin_user.role}")
        
        return admin_user
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Initializing default admin user...")
    create_admin_user()
