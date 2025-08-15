

from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    INSTRUCTOR = "instructor"
    STUDENT = "student"


class LessonStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    is_teacher: bool = False  # Keep for backward compatibility
    role: UserRole = UserRole.STUDENT
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    notes: Optional[str] = None
    hourly_rate: Optional[float] = None
    specializations: Optional[str] = None


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
    role: Optional[UserRole] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    notes: Optional[str] = None
    hourly_rate: Optional[float] = None
    specializations: Optional[str] = None
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
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserSummary(BaseModel):
    id: int
    username: str
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    last_login: Optional[datetime] = None

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
    cost: Optional[float] = None
    location: Optional[str] = None
    room_number: Optional[str] = None
    materials_needed: Optional[str] = None


class LessonCreate(LessonBase):
    pass


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    instrument: Optional[str] = None
    lesson_type: Optional[str] = None
    status: Optional[LessonStatus] = None
    notes: Optional[str] = None
    instructor_notes: Optional[str] = None
    admin_notes: Optional[str] = None
    cost: Optional[float] = None
    location: Optional[str] = None
    room_number: Optional[str] = None
    materials_needed: Optional[str] = None
    homework_assigned: Optional[str] = None
    progress_notes: Optional[str] = None


class Lesson(LessonBase):
    id: int
    status: LessonStatus
    notes: Optional[str] = None
    instructor_notes: Optional[str] = None
    admin_notes: Optional[str] = None
    homework_assigned: Optional[str] = None
    progress_notes: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    teacher: UserSummary
    student: UserSummary

    class Config:
        from_attributes = True


class LessonSummary(BaseModel):
    id: int
    title: str
    scheduled_at: datetime
    duration_minutes: int
    status: LessonStatus
    teacher_name: str
    student_name: str
    instrument: Optional[str] = None

    class Config:
        from_attributes = True


# Admin Schemas
class SystemSettingsBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None


class SystemSettingsCreate(SystemSettingsBase):
    pass


class SystemSettingsUpdate(BaseModel):
    value: Optional[str] = None
    description: Optional[str] = None


class SystemSettings(SystemSettingsBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AuditLogBase(BaseModel):
    action: str
    resource_type: str
    resource_id: Optional[int] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class AuditLog(AuditLogBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    user: Optional[UserSummary] = None

    class Config:
        from_attributes = True


# Dashboard Schemas
class DashboardStats(BaseModel):
    total_users: int
    total_instructors: int
    total_students: int
    total_lessons: int
    lessons_today: int
    lessons_this_week: int
    lessons_this_month: int
    active_users: int
    recent_registrations: int


class InstructorDashboardStats(BaseModel):
    total_students: int
    lessons_today: int
    lessons_this_week: int
    lessons_this_month: int
    upcoming_lessons: List[LessonSummary]
    recent_lessons: List[LessonSummary]


# Bulk Operations
class BulkUserCreate(BaseModel):
    users: List[UserCreate]


class BulkLessonCreate(BaseModel):
    lessons: List[LessonCreate]


# Reports
class UserReport(BaseModel):
    user: UserSummary
    total_lessons: int
    completed_lessons: int
    cancelled_lessons: int
    upcoming_lessons: int
    last_lesson_date: Optional[datetime] = None


class LessonReport(BaseModel):
    date_range: str
    total_lessons: int
    completed_lessons: int
    cancelled_lessons: int
    revenue: float
    popular_instruments: Dict[str, int]
    instructor_stats: Dict[str, Dict[str, Any]]

