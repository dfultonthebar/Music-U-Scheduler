from pydantic import BaseModel, EmailStr
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


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    is_teacher: Optional[bool] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


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


# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None