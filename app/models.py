

from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Text, Enum, Float, Date, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    INSTRUCTOR = "instructor"
    STUDENT = "student"


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class LessonStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


class DayOfWeek(int, enum.Enum):
    MONDAY = 0
    TUESDAY = 1
    WEDNESDAY = 2
    THURSDAY = 3
    FRIDAY = 4
    SATURDAY = 5
    SUNDAY = 6


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_teacher = Column(Boolean, default=False)  # Keep for backward compatibility
    role = Column(Enum(UserRole), default=UserRole.STUDENT)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    hourly_rate = Column(Float, nullable=True)  # For instructors
    specializations = Column(Text, nullable=True)  # JSON string of instruments/skills for instructors
    instrument = Column(String, nullable=True)  # Primary instrument for students
    default_break_minutes = Column(Integer, default=5)  # Default break between lessons (0, 5, 10, 15)
    profile_image = Column(String, nullable=True)  # Filename of profile picture
    bio = Column(Text, nullable=True)  # Instructor biography/description
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    taught_lessons = relationship("Lesson", foreign_keys="[Lesson.teacher_id]", back_populates="teacher")
    student_lessons = relationship("Lesson", foreign_keys="[Lesson.student_id]", back_populates="student")
    created_lessons = relationship("Lesson", foreign_keys="[Lesson.created_by]", back_populates="creator")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin who created
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, default=60)
    break_after_minutes = Column(Integer, default=0)  # Break time reserved after this lesson
    instrument = Column(String, nullable=True)
    lesson_type = Column(String, default="individual")  # individual, group
    status = Column(Enum(LessonStatus), default=LessonStatus.SCHEDULED)
    notes = Column(Text, nullable=True)
    instructor_notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    cost = Column(Float, nullable=True)
    location = Column(String, nullable=True)
    room_number = Column(String, nullable=True)
    materials_needed = Column(Text, nullable=True)
    homework_assigned = Column(Text, nullable=True)
    progress_notes = Column(Text, nullable=True)
    actual_start_time = Column(DateTime(timezone=True), nullable=True)  # When instructor clicked "Start Lesson"
    actual_end_time = Column(DateTime(timezone=True), nullable=True)    # When instructor clicked "End Lesson"
    actual_duration_minutes = Column(Integer, nullable=True)            # Calculated actual duration
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    teacher = relationship("User", foreign_keys=[teacher_id], back_populates="taught_lessons")
    student = relationship("User", foreign_keys=[student_id], back_populates="student_lessons")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_lessons")


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)  # user, lesson, system
    resource_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)  # JSON string
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")


class InstructorAvailability(Base):
    """Weekly recurring availability time blocks for instructors"""
    __tablename__ = "instructor_availability"

    id = Column(Integer, primary_key=True, index=True)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)  # e.g., 09:00
    end_time = Column(Time, nullable=False)  # e.g., 17:00
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    instructor = relationship("User", backref="availability_slots")


class AvailabilityException(Base):
    """Exceptions to regular availability (days off, custom unavailable times)"""
    __tablename__ = "availability_exceptions"

    id = Column(Integer, primary_key=True, index=True)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exception_date = Column(Date, nullable=False)  # The date of the exception
    is_full_day = Column(Boolean, default=True)  # True = entire day off
    start_time = Column(Time, nullable=True)  # If not full day, unavailable from
    end_time = Column(Time, nullable=True)  # If not full day, unavailable until
    reason = Column(String, nullable=True)  # Optional note (e.g., "Vacation", "Doctor's appointment")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    instructor = relationship("User", backref="availability_exceptions")


class PasswordResetToken(Base):
    """Password reset tokens for forgot password functionality"""
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", backref="password_reset_tokens")


class LessonTemplate(Base):
    """Recurring lesson templates for automatic lesson generation"""
    __tablename__ = "lesson_templates"

    id = Column(Integer, primary_key=True, index=True)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, default=30)
    instrument = Column(String, nullable=True)
    lesson_type = Column(String, default="individual")
    location = Column(String, nullable=True)
    room_number = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    instructor = relationship("User", foreign_keys=[instructor_id], backref="template_lessons_taught")
    student = relationship("User", foreign_keys=[student_id], backref="template_lessons_taken")


class StudentInstructorAssignment(Base):
    """Direct student-instructor assignments (independent of lessons)"""
    __tablename__ = "student_instructor_assignments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    instrument = Column(String, nullable=True)  # What instrument for this assignment
    is_primary = Column(Boolean, default=True)  # Primary instructor for this student
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    student = relationship("User", foreign_keys=[student_id], backref="instructor_assignments")
    instructor = relationship("User", foreign_keys=[instructor_id], backref="student_assignments")


class StudentRegistration(Base):
    """Pending student registration requests"""
    __tablename__ = "student_registrations"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    instrument = Column(String, nullable=False)
    experience_level = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    approval_status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING)
    approved_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Set when approved
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    approved_user = relationship("User", backref="registration_requests")

