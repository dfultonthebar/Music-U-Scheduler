
"""
Authentication routes for user registration and login
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any

from ..database import get_db
from .. import crud, schemas, models
from .utils import create_access_token, verify_password, ACCESS_TOKEN_EXPIRE_MINUTES
from .dependencies import get_current_active_user

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=schemas.User)
async def register_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Register a new user
    
    Args:
        user_data: User registration data (email, username, password, etc.)
        db: Database session
        
    Returns:
        Created user data (without password)
        
    Raises:
        HTTPException: 400 if username or email already exists
    """
    # Check if user already exists
    existing_user = crud.get_user_by_email(db, email=user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    existing_user = crud.get_user_by_username(db, username=user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    user = crud.create_user(db=db, user=user_data)
    return user


@router.post("/login", response_model=schemas.Token)
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    Authenticate user and return access token
    
    Args:
        form_data: OAuth2 password form data (username and password)
        db: Database session
        
    Returns:
        Access token and token type
        
    Raises:
        HTTPException: 401 if credentials are invalid
    """
    # Authenticate user (can login with username or email)
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user:
        user = crud.get_user_by_email(db, email=form_data.username)
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )
    
    # Create access token with user data and role
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": user.id,
            "role": "teacher" if user.is_teacher else "student",
            "is_teacher": user.is_teacher
        },
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=schemas.User)
async def get_current_user_info(
    current_user: models.User = Depends(get_current_active_user)
) -> Any:
    """
    Get current authenticated user information
    
    Args:
        current_user: Current authenticated user from dependency
        
    Returns:
        Current user data
    """
    return current_user


@router.post("/change-password")
async def change_password(
    password_data: schemas.PasswordChange,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Change user password
    
    Args:
        password_data: Old and new password data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Success message
        
    Raises:
        HTTPException: 400 if old password is incorrect
    """
    # Verify old password
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )
    
    # Update password
    user_update = schemas.UserUpdate(password=password_data.new_password)
    crud.update_user(db=db, user_id=current_user.id, user_update=user_update)
    
    return {"message": "Password changed successfully"}
