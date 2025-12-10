

from pydantic import BaseModel, EmailStr, validator
from datetime import datetime, date, time
from typing import Optional, List, Dict, Any
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    INSTRUCTOR = "instructor"
    STUDENT = "student"


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


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
    specializations: Optional[str] = None  # For instructors: JSON of instruments they teach
    instrument: Optional[str] = None  # For students: primary instrument they're learning
    default_break_minutes: int = 5  # Default break between lessons (0, 5, 10, 15)
    profile_image: Optional[str] = None  # Filename of profile picture
    bio: Optional[str] = None  # Instructor biography/description


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
    instrument: Optional[str] = None
    default_break_minutes: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    
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


class PasswordResetRequest(BaseModel):
    """Request to initiate password reset"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Confirm password reset with token"""
    token: str
    new_password: str

    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('New password must be at least 8 characters long')
        return v


class PasswordResetTokenResponse(BaseModel):
    """Response containing the reset token (for development/testing)"""
    message: str
    token: Optional[str] = None  # Only included in dev mode or when email is disabled
    expires_in_minutes: int = 60


# Lesson Schemas
class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    teacher_id: int
    student_id: int
    scheduled_at: datetime
    duration_minutes: int = 60
    break_after_minutes: int = 0  # Break time reserved after this lesson
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
    break_after_minutes: Optional[int] = None
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
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    actual_duration_minutes: Optional[int] = None
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
    break_after_minutes: int = 0
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


# Instructor Availability Schemas
class InstructorAvailabilityBase(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: time
    end_time: time
    is_active: bool = True


class InstructorAvailabilityCreate(InstructorAvailabilityBase):
    pass


class InstructorAvailabilityUpdate(BaseModel):
    day_of_week: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_active: Optional[bool] = None


class InstructorAvailability(InstructorAvailabilityBase):
    id: int
    instructor_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Availability Exception Schemas (Days Off)
class AvailabilityExceptionBase(BaseModel):
    exception_date: date
    is_full_day: bool = True
    start_time: Optional[time] = None  # If not full day
    end_time: Optional[time] = None  # If not full day
    reason: Optional[str] = None


class AvailabilityExceptionCreate(AvailabilityExceptionBase):
    pass


class AvailabilityExceptionUpdate(BaseModel):
    exception_date: Optional[date] = None
    is_full_day: Optional[bool] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    reason: Optional[str] = None


class AvailabilityException(AvailabilityExceptionBase):
    id: int
    instructor_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Scheduling Schemas
class TimeSlot(BaseModel):
    """A specific time slot that can be scheduled"""
    start_time: datetime
    end_time: datetime
    is_available: bool = True
    conflict_reason: Optional[str] = None


class InstructorScheduleDay(BaseModel):
    """Schedule for a specific day including availability and booked lessons"""
    date: date
    day_of_week: int
    availability_slots: List[InstructorAvailability] = []
    exceptions: List[AvailabilityException] = []
    lessons: List[LessonSummary] = []
    is_day_off: bool = False


class ScheduleConflict(BaseModel):
    """Details about a scheduling conflict"""
    conflict_type: str  # "lesson_overlap", "break_overlap", "outside_availability", "day_off"
    message: str
    conflicting_lesson_id: Optional[int] = None


class ScheduleValidationResult(BaseModel):
    """Result of validating a proposed lesson time"""
    is_valid: bool
    conflicts: List[ScheduleConflict] = []
    suggested_times: List[TimeSlot] = []  # Alternative available slots if invalid


# Email Settings Schemas
class EmailSettingsBase(BaseModel):
    smtp_host: str
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    imap_host: Optional[str] = None
    imap_port: Optional[int] = None
    imap_username: Optional[str] = None
    imap_password: Optional[str] = None
    from_email: str
    from_name: str = "Music U Scheduler"


class EmailSettingsUpdate(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: Optional[bool] = None
    smtp_use_ssl: Optional[bool] = None
    imap_host: Optional[str] = None
    imap_port: Optional[int] = None
    imap_username: Optional[str] = None
    imap_password: Optional[str] = None
    from_email: Optional[str] = None
    from_name: Optional[str] = None


class EmailSettingsResponse(BaseModel):
    smtp_host: str
    smtp_port: int
    smtp_username: str
    smtp_password: str  # Will be masked
    smtp_use_tls: bool
    smtp_use_ssl: bool
    imap_host: Optional[str] = None
    imap_port: Optional[int] = None
    imap_username: Optional[str] = None
    imap_password: Optional[str] = None  # Will be masked
    from_email: str
    from_name: str
    is_configured: bool = False


class SendEmailRequest(BaseModel):
    to_email: EmailStr
    subject: str
    body_text: str
    body_html: Optional[str] = None


class SendBulkEmailRequest(BaseModel):
    recipients: List[EmailStr]
    subject: str
    body_text: str
    body_html: Optional[str] = None


class EmailTestResult(BaseModel):
    success: bool
    message: str


# Student Self-Registration Schemas
# Student-Instructor Assignment Schemas
class StudentInstructorAssignmentCreate(BaseModel):
    student_id: int
    instructor_id: int
    instrument: Optional[str] = None
    is_primary: bool = True
    notes: Optional[str] = None


class StudentInstructorAssignmentUpdate(BaseModel):
    instrument: Optional[str] = None
    is_primary: Optional[bool] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class StudentInstructorAssignment(BaseModel):
    id: int
    student_id: int
    instructor_id: int
    instrument: Optional[str] = None
    is_primary: bool
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StudentWithInstructors(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    instrument: Optional[str] = None
    assigned_instructors: List["InstructorBasic"] = []

    class Config:
        from_attributes = True


class InstructorBasic(BaseModel):
    id: int
    full_name: str
    email: str
    specializations: Optional[str] = None
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True


class InstructorWithStudents(BaseModel):
    id: int
    full_name: str
    email: str
    specializations: Optional[str] = None
    assigned_students: List["StudentBasic"] = []

    class Config:
        from_attributes = True


class StudentBasic(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    instrument: Optional[str] = None

    class Config:
        from_attributes = True


class StudentRegistrationRequest(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    instrument: str  # What they want to learn
    experience_level: str  # beginner, intermediate, advanced
    notes: Optional[str] = None  # Additional info

    @validator('experience_level')
    def validate_experience_level(cls, v):
        valid_levels = ['beginner', 'intermediate', 'advanced']
        if v.lower() not in valid_levels:
            raise ValueError(f'Experience level must be one of: {", ".join(valid_levels)}')
        return v.lower()


class StudentRegistrationResponse(BaseModel):
    message: str
    registration_id: int
    approval_status: ApprovalStatus


class PendingRegistration(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    instrument: str
    experience_level: str
    notes: Optional[str] = None
    approval_status: ApprovalStatus
    created_at: datetime

    class Config:
        from_attributes = True


class RegistrationApprovalRequest(BaseModel):
    username: str  # Username to assign to approved student
    password: str  # Initial password

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class RegistrationApprovalResponse(BaseModel):
    message: str
    user_id: Optional[int] = None


# Lesson Template Schemas
class LessonTemplateBase(BaseModel):
    instructor_id: int
    student_id: int
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: time
    duration_minutes: int = 30
    instrument: Optional[str] = None
    lesson_type: str = "individual"
    location: Optional[str] = None
    room_number: Optional[str] = None
    is_active: bool = True


class LessonTemplateCreate(LessonTemplateBase):
    pass


class LessonTemplateUpdate(BaseModel):
    day_of_week: Optional[int] = None
    start_time: Optional[time] = None
    duration_minutes: Optional[int] = None
    instrument: Optional[str] = None
    lesson_type: Optional[str] = None
    location: Optional[str] = None
    room_number: Optional[str] = None
    is_active: Optional[bool] = None


class LessonTemplate(LessonTemplateBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    instructor: UserSummary
    student: UserSummary

    class Config:
        from_attributes = True


class GenerateLessonsRequest(BaseModel):
    start_date: date
    end_date: date
    template_ids: Optional[List[int]] = None  # If None, generate from all active templates


class GenerateLessonsResponse(BaseModel):
    lessons_created: int
    lessons_skipped: int
    date_range: str
    details: List[Dict[str, Any]] = []


# Yodeck Digital Signage Schemas
class YodeckSettingsUpdate(BaseModel):
    api_token: str


class YodeckSettingsResponse(BaseModel):
    api_token: str  # Will be masked in response
    is_configured: bool
    last_sync: Optional[datetime] = None
    instructor_count: int
    playlist_id: Optional[str] = None


class YodeckConnectionTestResult(BaseModel):
    success: bool
    message: str
    status: str  # not_configured, connected, unauthorized, timeout, error


class YodeckSyncRequest(BaseModel):
    instructor_ids: Optional[List[int]] = None  # If None, sync all instructors


class YodeckSyncResponse(BaseModel):
    success: bool
    message: str
    synced: int
    failed: int
    total: int


class YodeckInstructorSlide(BaseModel):
    instructor_id: int
    instructor_name: str
    instruments: List[str]
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    sync_status: str  # pending, synced, failed

