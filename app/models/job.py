"""
Job and requisition models
"""
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class JobStatus(str, enum.Enum):
    """Job status enumeration"""
    DRAFT = "draft"
    OPEN = "open"
    CLOSED = "closed"
    FILLED = "filled"
    CANCELLED = "cancelled"

class Job(Base):
    """Job posting/requisition model"""
    
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    department = Column(String, nullable=False)
    location = Column(String, nullable=True)
    job_type = Column(String, nullable=True)  # full-time, part-time, contract
    experience_required = Column(Integer, default=0)
    budget_min = Column(Float, nullable=True)
    budget_max = Column(Float, nullable=True)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default=JobStatus.DRAFT)
    visibility = Column(String, default="internal")  # internal, public
    skills_required = Column(JSON, default=list)
    responsibilities = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    posted_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    applications = relationship("CandidateApplication", back_populates="job")
    manager = relationship("User", foreign_keys=[manager_id])

class JobRequisition(Base):
    """Job requisition tracking model"""
    
    __tablename__ = "job_requisitions"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    mpr_id = Column(Integer, ForeignKey("mprs.id"), nullable=True)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    target_hiring_date = Column(DateTime(timezone=True), nullable=True)
    priority = Column(String, default="medium")  # low, medium, high, critical
    status = Column(String, default="pending")  # pending, approved, rejected
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    job = relationship("Job")
    mpr = relationship("MPR")
    recruiter = relationship("User", foreign_keys=[recruiter_id])
