

from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Text, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    INSTRUCTOR = "instructor"
    STUDENT = "student"


class LessonStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


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
    specializations = Column(Text, nullable=True)  # JSON string of instruments/skills
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

