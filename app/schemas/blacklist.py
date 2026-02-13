"""
Pydantic schemas for Blacklist models
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class BlacklistBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    reason: str
    risk_level: RiskLevel = RiskLevel.MEDIUM
    notes: Optional[str] = None

class BlacklistCreate(BlacklistBase):
    blacklisted_by: int

class BlacklistUpdate(BaseModel):
    reason: Optional[str] = None
    risk_level: Optional[RiskLevel] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class BlacklistResponse(BlacklistBase):
    id: int
    blacklisted_by: int
    blacklisted_at: datetime
    removed_at: Optional[datetime]
    removed_by: Optional[int]
    is_active: bool
    
    class Config:
        from_attributes = True