
"""
Authentication module for Music U Lesson Scheduler
"""

from .dependencies import (
    get_current_user,
    get_current_active_user,
    require_teacher_role,
    require_student_role,
    oauth2_scheme
)
from .utils import (
    create_access_token,
    verify_token,
    get_password_hash,
    verify_password
)
from .routers import router as auth_router

__all__ = [
    "get_current_user",
    "get_current_active_user", 
    "require_teacher_role",
    "require_student_role",
    "oauth2_scheme",
    "create_access_token",
    "verify_token",
    "get_password_hash",
    "verify_password",
    "auth_router"
]
