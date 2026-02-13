"""
Blacklist model for tracking blacklisted identities
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy import Enum
import enum

class RiskLevel(str, enum.Enum):
    """Risk level enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Blacklist(Base):
    """Blacklist model for tracking blacklisted identities"""
    
    __tablename__ = "blacklist"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)
    reason = Column(Text, nullable=False)
    risk_level = Column(
        Enum(RiskLevel, values_callable=lambda x: [e.value for e in x]),
        default=RiskLevel.MEDIUM.value,
    )
    notes = Column(Text, nullable=True)
    blacklisted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    blacklisted_at = Column(DateTime(timezone=True), server_default=func.now())
    removed_at = Column(DateTime(timezone=True), nullable=True)
    removed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    blacklister = relationship("User", foreign_keys=[blacklisted_by])
    remover = relationship("User", foreign_keys=[removed_by])
