"""
Job offer models
"""
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy import Enum
import enum

class OfferStatus(str, enum.Enum):
    """Offer status enumeration"""
    DRAFT = "draft"
    OFFERED = "offered"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    WITHDRAWN = "withdrawn"
    EXPIRED = "expired"
    JOINED = "joined"

class Offer(Base):
    """Job offer model"""
    
    __tablename__ = "offers"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    mpr_id = Column(Integer, ForeignKey("mprs.id"), nullable=True)
    offer_code = Column(String, unique=True, index=True, nullable=False)
    ctc_fixed = Column(Float, nullable=False)  # Fixed component
    ctc_variable = Column(Float, default=0)  # Variable component
    ctc_total = Column(Float, nullable=False)  # Total CTC
    joining_bonus = Column(Float, default=0)
    relocation_bonus = Column(Float, default=0)
    other_benefits = Column(JSON, default=dict)
    date_of_joining = Column(DateTime(timezone=True), nullable=False)
    offer_validity_days = Column(Integer, default=15)
    status = Column(
        Enum(OfferStatus, values_callable=lambda x: [e.value for e in x]),
        default=OfferStatus.DRAFT.value
    )
    offered_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    offered_at = Column(DateTime(timezone=True), nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    joining_date = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    variance_percent = Column(Float, nullable=True)  # Variance from MPR budget
    requires_approval = Column(Boolean, default=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    candidate = relationship("Candidate")
    job = relationship("Job")
    mpr = relationship("MPR")
    offerer = relationship("User", foreign_keys=[offered_by])
    approver = relationship("User", foreign_keys=[approved_by])
