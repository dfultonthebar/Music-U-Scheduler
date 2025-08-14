
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from typing import Optional


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    is_teacher: bool = False
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    is_teacher: Optional[bool] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if v and len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None
    is_teacher: Optional[bool] = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('New password must be at least 8 characters long')
        return v


# Lesson Schemas
class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    teacher_id: int
    student_id: int
    scheduled_at: datetime
    duration_minutes: int = 60
    instrument: Optional[str] = None
    lesson_type: str = "individual"


class LessonCreate(LessonBase):
    pass


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    instrument: Optional[str] = None
    lesson_type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class Lesson(LessonBase):
    id: int
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    teacher: User
    student: User

    class Config:
        from_attributes = True
