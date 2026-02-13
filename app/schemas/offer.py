"""
Pydantic schemas for Offer models
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class OfferStatus(str, Enum):
    DRAFT = "draft"
    OFFERED = "offered"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    WITHDRAWN = "withdrawn"
    EXPIRED = "expired"
    JOINED = "joined"

class OfferBase(BaseModel):
    candidate_id: int
    job_id: int
    mpr_id: Optional[int] = None
    ctc_fixed: float
    ctc_variable: float = 0
    joining_bonus: float = 0
    relocation_bonus: float = 0
    other_benefits: Dict[str, Any] = {}
    date_of_joining: datetime
    offer_validity_days: int = 15
    notes: Optional[str] = None

class OfferCreate(OfferBase):
    offer_code: str

class OfferUpdate(BaseModel):
    status: Optional[OfferStatus] = None
    ctc_fixed: Optional[float] = None
    ctc_variable: Optional[float] = None
    date_of_joining: Optional[datetime] = None
    notes: Optional[str] = None
    variance_percent: Optional[float] = None
    requires_approval: Optional[bool] = None

class OfferResponse(OfferBase):
    id: int
    offer_code: str
    ctc_total: float
    status: OfferStatus
    variance_percent: Optional[float]
    requires_approval: bool
    offered_by: int
    offered_at: Optional[datetime]
    accepted_at: Optional[datetime]
    joining_date: Optional[datetime]
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class OfferStatusUpdate(BaseModel):
    status: OfferStatus