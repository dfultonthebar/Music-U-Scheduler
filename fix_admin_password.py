
#!/usr/bin/env python3
"""
Fix admin password by recreating the user with correct hash
"""

import sys
import os
sys.path.append('.')

from app.database import get_db
from app import models, crud
import bcrypt

def fix_admin_password():
    """Fix admin user password"""
    db = next(get_db())
    
    try:
        # Get existing admin user
        existing_admin = crud.get_user_by_username(db, "admin")
        if not existing_admin:
            print("Admin user not found")
            return None
        
        # Create new password hash using bcrypt directly
        password = "MusicU2025"
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        # Update existing admin user's password
        existing_admin.hashed_password = hashed_password
        db.commit()
        db.refresh(existing_admin)
        admin_user = existing_admin
        
        # Test the password
        test_result = bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
        
        print("✅ Created new admin user:")
        print(f"   Username: admin")
        print(f"   Password: MusicU2025") 
        print(f"   Email: admin@musicu.com")
        print(f"   Role: {admin_user.role}")
        print(f"   Password test: {'✅ PASS' if test_result else '❌ FAIL'}")
        
        return admin_user
        
    except Exception as e:
        print(f"❌ Error fixing admin user: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 Fixing admin password...")
    fix_admin_password()
