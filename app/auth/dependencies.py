
"""
Authentication dependencies for FastAPI routes
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from .. import crud, models
from .utils import verify_token, extract_token_data

# OAuth2 scheme for token URL
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """
    Dependency to get current authenticated user from JWT token
    
    Args:
        token: JWT token from Authorization header
        db: Database session
        
    Returns:
        User model instance
        
    Raises:
        HTTPException: 401 if token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Verify token
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    # Extract user data
    token_data = extract_token_data(payload)
    username = token_data.get("username")
    if username is None:
        raise credentials_exception
    
    # Get user from database
    user = crud.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
        
    return user


async def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """
    Dependency to get current active user (must be active)
    
    Args:
        current_user: User from get_current_user dependency
        
    Returns:
        Active user model instance
        
    Raises:
        HTTPException: 400 if user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    return current_user


async def require_teacher_role(
    current_user: models.User = Depends(get_current_active_user)
) -> models.User:
    """
    Dependency to require teacher role
    
    Args:
        current_user: User from get_current_active_user dependency
        
    Returns:
        User model instance (guaranteed to be a teacher)
        
    Raises:
        HTTPException: 403 if user is not a teacher
    """
    if not current_user.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher role required"
        )
    return current_user


async def require_student_role(
    current_user: models.User = Depends(get_current_active_user)
) -> models.User:
    """
    Dependency to require student role (not a teacher)
    
    Args:
        current_user: User from get_current_active_user dependency
        
    Returns:
        User model instance (guaranteed to be a student)
        
    Raises:
        HTTPException: 403 if user is a teacher (not a student)
    """
    if current_user.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student role required"
        )
    return current_user


async def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """
    Dependency to get current user optionally (for routes that can work with or without auth)
    
    Args:
        token: JWT token from Authorization header (optional)
        db: Database session
        
    Returns:
        User model instance if authenticated, None otherwise
    """
    if not token:
        return None
        
    try:
        payload = verify_token(token)
        if payload is None:
            return None
            
        token_data = extract_token_data(payload)
        username = token_data.get("username")
        if username is None:
            return None
            
        user = crud.get_user_by_username(db, username=username)
        return user if user and user.is_active else None
    except Exception:
        return None
