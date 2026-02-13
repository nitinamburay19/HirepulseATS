"""
User model for authentication and authorization
"""
from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    """User role enumeration"""
    ADMIN = "admin"
    RECRUITER = "recruiter"
    MANAGER = "manager"
    HOD = "hod"
    CANDIDATE = "candidate"

class UserStatus(str, enum.Enum):
    """User status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class User(Base):
    """User model for authentication and authorization"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(
        Enum(
            UserRole,
            values_callable=lambda x: [e.value for e in x]
        ),
        default=UserRole.CANDIDATE.value,
        nullable=False
    )
    status = Column(
        Enum(
            UserStatus,
            values_callable=lambda x: [e.value for e in x]
        ),
        default=UserStatus.ACTIVE.value,
        nullable=False
    )
    employee_code = Column(String, unique=True, nullable=True)
    manager_id = Column(Integer, nullable=True)  # Foreign key to manager user
    hod_id = Column(Integer, nullable=True)  # Foreign key to HOD user
    department = Column(String, nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
