"""
Pydantic schemas for Job models
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class JobStatus(str, Enum):
    DRAFT = "draft"
    OPEN = "open"
    CLOSED = "closed"
    FILLED = "filled"
    CANCELLED = "cancelled"

class JobBase(BaseModel):
    title: str
    description: str
    department: str
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_required: int = 0
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    skills_required: List[str] = []
    responsibilities: Optional[str] = None
    requirements: Optional[str] = None

class JobCreate(JobBase):
    manager_id: Optional[int] = None
    visibility: str = "internal"

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    status: Optional[JobStatus] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    skills_required: Optional[List[str]] = None
    responsibilities: Optional[str] = None
    requirements: Optional[str] = None
    manager_id: Optional[int] = None
    posted_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

class JobResponse(JobBase):
    id: int
    manager_id: Optional[int]
    status: JobStatus
    visibility: str
    posted_at: Optional[datetime]
    closed_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class JobRequisitionBase(BaseModel):
    job_id: int
    mpr_id: Optional[int] = None
    recruiter_id: Optional[int] = None
    target_hiring_date: Optional[datetime] = None
    priority: str = "medium"
    status: str = "pending"

class JobRequisitionCreate(JobRequisitionBase):
    pass

class JobRequisitionResponse(JobRequisitionBase):
    id: int
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True
