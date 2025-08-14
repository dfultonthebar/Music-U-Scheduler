
"""
Authentication utilities for JWT token handling and password operations
"""

from datetime import datetime, timedelta
from typing import Optional, Any, Union
from jose import jwt, JWTError
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token with user data and role
    
    Args:
        data: Dictionary containing user data (must include 'sub' for username and 'role')
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access_token"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """
    Verify JWT token and return payload
    
    Args:
        token: JWT token string
        
    Returns:
        Token payload if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        
        # Check if token is expired (jose handles this automatically, but we can add custom logic)
        token_type: str = payload.get("type")
        if token_type != "access_token":
            return None
            
        return payload
    except JWTError:
        return None


def extract_token_data(payload: dict) -> dict:
    """
    Extract user data from token payload
    
    Args:
        payload: Decoded JWT payload
        
    Returns:
        Dictionary with username, user_id, and role
    """
    return {
        "username": payload.get("sub"),
        "user_id": payload.get("user_id"),
        "role": payload.get("role"),
        "is_teacher": payload.get("is_teacher", False)
    }
