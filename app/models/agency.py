"""
Recruitment agency models
"""
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy import Enum
import enum

class AgencyStatus(str, enum.Enum):
    """Agency status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLACKLISTED = "blacklisted"
    PENDING = "pending"

class AgencyTier(str, enum.Enum):
    """Agency tier enumeration"""
    TIER_1 = "tier_1"
    TIER_2 = "tier_2"
    TIER_3 = "tier_3"

class Agency(Base):
    """Recruitment agency model"""
    
    __tablename__ = "agencies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    tier = Column(
        Enum(AgencyTier, values_callable=lambda x: [e.value for e in x]),
        default=AgencyTier.TIER_3.value,
    )
    status = Column(
        Enum(AgencyStatus, values_callable=lambda x: [e.value for e in x]),
        default=AgencyStatus.PENDING.value,
    )
    headquarters = Column(String, nullable=True)
    agency_type = Column(String, nullable=True)  # specialized, general
    structure = Column(String, nullable=True)  # domestic, international
    spoc_name = Column(String, nullable=False)  # Single Point of Contact
    spoc_email = Column(String, nullable=False)
    spoc_phone = Column(String, nullable=False)
    sla_days = Column(Integer, default=30)  # Service Level Agreement in days
    location = Column(String, nullable=True)
    website = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    submissions = relationship("AgencySubmission", back_populates="agency")

class AgencySubmission(Base):
    """Candidate submissions by agencies"""
    
    __tablename__ = "agency_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    agency_id = Column(Integer, ForeignKey("agencies.id"), nullable=False)
    mpr_id = Column(Integer, ForeignKey("mprs.id"), nullable=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    candidate_name = Column(String, nullable=False)
    candidate_email = Column(String, nullable=False)
    candidate_phone = Column(String, nullable=True)
    candidate_resume_url = Column(String, nullable=False)
    submission_status = Column(String, default="submitted")  # submitted, screening, rejected, shortlisted
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_notes = Column(Text, nullable=True)
    
    # Relationships
    agency = relationship("Agency", back_populates="submissions")
    mpr = relationship("MPR")
    job = relationship("Job")
