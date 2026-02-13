"""
Pydantic schemas for MPR models
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class MPRStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ACTIVE = "active"
    FROZEN = "frozen"
    CLOSED = "closed"

class MPRBase(BaseModel):
    job_title: str
    job_description: str
    department: str
    hiring_manager_id: int
    hod_id: Optional[int] = None
    job_type: str
    positions_requested: int = 1
    budget_min: float
    budget_max: float
    experience_required: int = 0
    skills_required: List[str] = []
    justification: Optional[str] = None

class MPRCreate(MPRBase):
    requisition_code: str

class MPRUpdate(BaseModel):
    job_title: Optional[str] = None
    job_description: Optional[str] = None
    status: Optional[MPRStatus] = None
    positions_approved: Optional[int] = None
    pipeline_stats: Optional[Dict[str, Any]] = None

class MPRResponse(MPRBase):
    id: int
    requisition_code: str
    positions_approved: int
    status: MPRStatus
    pipeline_stats: Dict[str, Any]
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class MPRConfigBase(BaseModel):
    freeze: bool = False
    strict_vetting: bool = True
    ai_score_threshold: int = 70
    budget_tolerance_percent: int = 10

class MPRConfigUpdate(MPRConfigBase):
    pass

class MPRConfigResponse(MPRConfigBase):
    id: int
    updated_by: Optional[int]
    updated_at: datetime
    
    class Config:
        from_attributes = True