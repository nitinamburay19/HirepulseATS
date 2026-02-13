"""
Pydantic schemas for Agency models
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AgencyStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLACKLISTED = "blacklisted"
    PENDING = "pending"

class AgencyTier(str, Enum):
    TIER_1 = "tier_1"
    TIER_2 = "tier_2"
    TIER_3 = "tier_3"

class AgencyBase(BaseModel):
    name: str
    tier: AgencyTier = AgencyTier.TIER_3
    headquarters: Optional[str] = None
    agency_type: Optional[str] = None
    structure: Optional[str] = None
    spoc_name: str
    spoc_email: EmailStr
    spoc_phone: str
    sla_days: int = 30
    location: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None

class AgencyCreate(AgencyBase):
    pass

class AgencyUpdate(BaseModel):
    name: Optional[str] = None
    tier: Optional[AgencyTier] = None
    status: Optional[AgencyStatus] = None
    spoc_name: Optional[str] = None
    spoc_email: Optional[EmailStr] = None
    spoc_phone: Optional[str] = None
    sla_days: Optional[int] = None
    notes: Optional[str] = None

class AgencyResponse(AgencyBase):
    id: int
    status: AgencyStatus
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class AgencyStatusUpdate(BaseModel):
    status: AgencyStatus

class AgencySubmissionBase(BaseModel):
    agency_id: int
    mpr_id: Optional[int] = None
    job_id: Optional[int] = None
    candidate_name: str
    candidate_email: EmailStr
    candidate_phone: Optional[str] = None
    candidate_resume_url: str

class AgencySubmissionCreate(AgencySubmissionBase):
    pass

class AgencySubmissionResponse(AgencySubmissionBase):
    id: int
    submission_status: str
    submitted_at: datetime
    reviewed_at: Optional[datetime]
    review_notes: Optional[str]
    
    class Config:
        from_attributes = True