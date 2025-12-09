
"""
Authentication routes for user registration and login
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from typing import Any
import secrets
import os

from ..database import get_db
from .. import crud, schemas, models
from .utils import create_access_token, verify_password, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
from .dependencies import get_current_active_user

router = APIRouter(prefix="/auth", tags=["authentication"])

# Password reset token expiration in minutes
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = 60


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


@router.post("/forgot-password", response_model=schemas.PasswordResetTokenResponse)
async def forgot_password(
    request: schemas.PasswordResetRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Request a password reset token

    Args:
        request: Email address to send reset token to
        db: Database session

    Returns:
        Success message (and token in dev mode)

    Note:
        For security, this always returns success even if email doesn't exist.
        In production, this would send an email. Currently returns token directly.
    """
    user = crud.get_user_by_email(db, email=request.email)

    # Generate response - always return success for security
    response = {
        "message": "If an account exists with this email, a password reset link has been sent.",
        "expires_in_minutes": PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
    }

    if user:
        # Generate a secure random token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)

        # Invalidate any existing tokens for this user
        db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.user_id == user.id,
            models.PasswordResetToken.used == False
        ).update({"used": True})

        # Create new token
        reset_token = models.PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at
        )
        db.add(reset_token)
        db.commit()

        # In production, send email here
        # For now, include token in response (dev mode)
        dev_mode = os.getenv("DEV_MODE", "true").lower() == "true"
        if dev_mode:
            response["token"] = token

    return response


@router.post("/reset-password")
async def reset_password(
    request: schemas.PasswordResetConfirm,
    db: Session = Depends(get_db)
) -> Any:
    """
    Reset password using a valid reset token

    Args:
        request: Token and new password
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: 400 if token is invalid or expired
    """
    # Find the token
    reset_token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == request.token,
        models.PasswordResetToken.used == False
    ).first()

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Check if token is expired (handle both naive and aware datetimes from SQLite)
    expires_at = reset_token.expires_at
    now = datetime.now(timezone.utc)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        reset_token.used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )

    # Get the user
    user = db.query(models.User).filter(models.User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )

    # Update password
    user.hashed_password = get_password_hash(request.new_password)

    # Mark token as used
    reset_token.used = True

    db.commit()

    return {"message": "Password has been reset successfully"}


@router.get("/verify-reset-token/{token}")
async def verify_reset_token(
    token: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Verify if a password reset token is valid

    Args:
        token: The reset token to verify
        db: Database session

    Returns:
        Valid status and email hint
    """
    reset_token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == token,
        models.PasswordResetToken.used == False
    ).first()

    if not reset_token:
        return {"valid": False, "message": "Invalid or expired token"}

    # Handle both naive and aware datetimes from SQLite
    expires_at = reset_token.expires_at
    now = datetime.now(timezone.utc)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        return {"valid": False, "message": "Token has expired"}

    # Get user email (masked)
    user = db.query(models.User).filter(models.User.id == reset_token.user_id).first()
    email_hint = ""
    if user and user.email:
        parts = user.email.split("@")
        if len(parts) == 2:
            email_hint = f"{parts[0][:2]}***@{parts[1]}"

    return {
        "valid": True,
        "email_hint": email_hint,
        "message": "Token is valid"
    }
