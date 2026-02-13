"""
Manpower Requisition (MPR) models
"""
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class MPRStatus(str, enum.Enum):
    """MPR status enumeration"""
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ACTIVE = "active"
    FROZEN = "frozen"
    CLOSED = "closed"

class MPR(Base):
    """Manpower Requisition model"""
    
    __tablename__ = "mprs"
    
    id = Column(Integer, primary_key=True, index=True)
    requisition_code = Column(String, unique=True, index=True, nullable=False)
    job_title = Column(String, nullable=False)
    job_description = Column(Text, nullable=False)
    department = Column(String, nullable=False)
    hiring_manager_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    hod_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    job_type = Column(String, nullable=False)  # permanent, contract, temporary
    positions_requested = Column(Integer, default=1)
    positions_approved = Column(Integer, default=0)
    budget_min = Column(Float, nullable=False)
    budget_max = Column(Float, nullable=False)
    experience_required = Column(Integer, default=0)
    skills_required = Column(JSON, default=list)
    justification = Column(Text, nullable=True)
    status = Column(String, default=MPRStatus.DRAFT)
    pipeline_stats = Column(JSON, default=dict)  # JSON with pipeline metrics
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    hiring_manager = relationship("User", foreign_keys=[hiring_manager_id])
    hod = relationship("User", foreign_keys=[hod_id])
    approver = relationship("User", foreign_keys=[approved_by])

class MPRConfig(Base):
    """MPR configuration settings"""
    
    __tablename__ = "mpr_config"
    
    id = Column(Integer, primary_key=True, index=True)
    freeze = Column(Boolean, default=False)  # Freeze all MPRs if True
    strict_vetting = Column(Boolean, default=True)
    ai_score_threshold = Column(Integer, default=70)  # Minimum AI score for screening
    budget_tolerance_percent = Column(Integer, default=10)  # Budget variance tolerance
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship
    updater = relationship("User")