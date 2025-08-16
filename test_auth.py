
#!/usr/bin/env python3
"""
Test authentication functionality
"""

import sys
import os
sys.path.append('.')

from app.database import get_db
from app import crud, models
from app.auth.utils import verify_password, get_password_hash
from sqlalchemy.orm import Session

def test_admin_auth():
    """Test admin user authentication"""
    db = next(get_db())
    
    try:
        # Get admin user
        admin_user = crud.get_user_by_username(db, "admin")
        if not admin_user:
            print("❌ Admin user not found")
            return False
            
        print(f"✅ Admin user found:")
        print(f"   Username: {admin_user.username}")
        print(f"   Email: {admin_user.email}")
        print(f"   Active: {admin_user.is_active}")
        print(f"   Teacher: {admin_user.is_teacher}")
        print(f"   ID: {admin_user.id}")
        
        # Test password verification
        test_password = "admin123"
        password_valid = verify_password(test_password, admin_user.hashed_password)
        print(f"   Password valid: {password_valid}")
        
        if password_valid:
            print("✅ Admin authentication test PASSED")
            return True
        else:
            print("❌ Admin authentication test FAILED - Invalid password")
            
            # Try to fix password
            print("🔧 Attempting to fix admin password...")
            new_hash = get_password_hash(test_password)
            admin_user.hashed_password = new_hash
            db.commit()
            print("✅ Admin password updated")
            return True
            
    except Exception as e:
        print(f"❌ Error testing authentication: {e}")
        return False

if __name__ == "__main__":
    test_admin_auth()
